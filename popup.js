const SKIPPABLE_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:'];
const VALID_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
const DEFAULT_SETTINGS = { restoreTarget: 'newWindow' };

let selectedId = null;

function isRestorable(url) {
  if (!url) return false;
  return !SKIPPABLE_PREFIXES.some(prefix => url.startsWith(prefix));
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

async function getSnapshots() {
  const { snapshots = [] } = await chrome.storage.local.get('snapshots');
  return snapshots;
}

async function setSnapshots(snapshots) {
  await chrome.storage.local.set({ snapshots });
}

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

function showStatus(message, isError = false) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.hidden = false;
  if (!isError) {
    setTimeout(() => { el.hidden = true; }, 2400);
  }
}

function updateActionBar() {
  const enabled = selectedId !== null;
  document.getElementById('restore-btn').disabled = !enabled;
  document.getElementById('rename-btn').disabled = !enabled;
  document.getElementById('delete-btn').disabled = !enabled;
}

function selectSnapshot(id) {
  selectedId = id;
  document.querySelectorAll('.snapshot').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === id);
  });
  updateActionBar();
}

async function saveSnapshot() {
  const button = document.getElementById('save-btn');
  button.disabled = true;
  try {
    if (!chrome.tabGroups) {
      showStatus('chrome.tabGroups API not available in this browser.', true);
      return;
    }

    const currentWindow = await chrome.windows.getCurrent();
    const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });

    if (groups.length === 0) {
      showStatus('No tab groups in this window. Right-click a tab and choose "Add tab to new group" first.', true);
      return;
    }

    const savedGroups = [];
    let skipped = 0;

    for (const group of groups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      const usableTabs = tabs.filter(t => isRestorable(t.url));
      skipped += tabs.length - usableTabs.length;
      savedGroups.push({
        title: group.title || '',
        color: group.color,
        tabs: usableTabs.map(t => ({ url: t.url, title: t.title }))
      });
    }

    const tabCount = savedGroups.reduce((sum, g) => sum + g.tabs.length, 0);
    if (tabCount === 0) {
      showStatus('Nothing to save (only system pages found).', true);
      return;
    }

    const snapshot = {
      id: crypto.randomUUID(),
      name: formatDate(Date.now()),
      createdAt: Date.now(),
      tabCount,
      groups: savedGroups
    };

    const snapshots = await getSnapshots();
    snapshots.unshift(snapshot);
    await setSnapshots(snapshots);

    const note = skipped > 0 ? ` (${skipped} system tab${skipped === 1 ? '' : 's'} skipped)` : '';
    showStatus(`Saved ${groups.length} group${groups.length === 1 ? '' : 's'}, ${tabCount} tab${tabCount === 1 ? '' : 's'}${note}.`);
    await renderList();
  } catch (err) {
    console.error('Stowaway save error:', err);
    showStatus(`Error: ${err.message || err}`, true);
  } finally {
    button.disabled = false;
  }
}

async function restoreSelected() {
  if (!selectedId) return;
  try {
    const snapshots = await getSnapshots();
    const snapshot = snapshots.find(s => s.id === selectedId);
    if (!snapshot) return;

    const settings = await getSettings();
    let targetWindowId;
    let placeholderTabId = null;

    if (settings.restoreTarget === 'currentWindow') {
      const allWindows = await chrome.windows.getAll({ windowTypes: ['normal'] });
      const popupWindow = await chrome.windows.getCurrent();
      const target = allWindows.find(w => w.id !== popupWindow.id) || allWindows[0];
      if (!target) {
        showStatus('No browser window available to restore into.', true);
        return;
      }
      targetWindowId = target.id;
    } else {
      const newWindow = await chrome.windows.create({ focused: true });
      targetWindowId = newWindow.id;
      placeholderTabId = newWindow.tabs[0].id;
    }

    for (const group of snapshot.groups) {
      if (group.tabs.length === 0) continue;
      const createdTabIds = [];
      for (const tab of group.tabs) {
        const created = await chrome.tabs.create({
          windowId: targetWindowId,
          url: tab.url,
          active: false
        });
        createdTabIds.push(created.id);
      }
      const groupId = await chrome.tabs.group({
        tabIds: createdTabIds,
        createProperties: { windowId: targetWindowId }
      });
      await chrome.tabGroups.update(groupId, {
        title: group.title,
        color: group.color
      });
    }

    if (placeholderTabId !== null) {
      try { await chrome.tabs.remove(placeholderTabId); } catch (e) { /* already gone */ }
    }
  } catch (err) {
    console.error('Stowaway restore error:', err);
    showStatus(`Restore error: ${err.message || err}`, true);
  }
}

async function deleteSelected() {
  if (!selectedId) return;
  if (!confirm('Delete this snapshot? This cannot be undone.')) return;
  try {
    const snapshots = await getSnapshots();
    const filtered = snapshots.filter(s => s.id !== selectedId);
    await setSnapshots(filtered);
    selectedId = null;
    await renderList();
  } catch (err) {
    console.error('Stowaway delete error:', err);
    showStatus(`Delete error: ${err.message || err}`, true);
  }
}

function renameSelected() {
  if (!selectedId) return;
  const row = document.querySelector(`.snapshot[data-id="${selectedId}"]`);
  if (!row) return;
  const nameSpan = row.querySelector('.snapshot-name');
  if (!nameSpan || nameSpan.querySelector('input')) return;

  const currentName = nameSpan.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  const commit = async () => {
    const newName = input.value.trim();
    try {
      const snapshots = await getSnapshots();
      const snapshot = snapshots.find(s => s.id === selectedId);
      if (snapshot) {
        snapshot.name = newName || formatDate(snapshot.createdAt);
        await setSnapshots(snapshots);
      }
      await renderList();
    } catch (err) {
      console.error('Stowaway rename error:', err);
      showStatus(`Rename error: ${err.message || err}`, true);
    }
  };

  input.addEventListener('blur', commit, { once: true });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = currentName; input.blur(); }
  });
}

function makeSnapshotElement(snapshot) {
  const li = document.createElement('li');
  li.className = 'snapshot';
  if (snapshot.id === selectedId) li.classList.add('selected');
  li.dataset.id = snapshot.id;
  li.addEventListener('click', () => selectSnapshot(snapshot.id));

  const header = document.createElement('div');
  header.className = 'snapshot-header';

  const name = document.createElement('span');
  name.className = 'snapshot-name';
  name.textContent = snapshot.name;

  const meta = document.createElement('span');
  meta.className = 'snapshot-meta';
  meta.textContent = `${snapshot.groups.length} group${snapshot.groups.length === 1 ? '' : 's'}, ${snapshot.tabCount} tab${snapshot.tabCount === 1 ? '' : 's'}`;

  header.append(name, meta);
  li.append(header);

  const groupList = document.createElement('div');
  groupList.className = 'group-list';
  for (const group of snapshot.groups) {
    const chip = document.createElement('span');
    chip.className = 'group-chip';

    const dot = document.createElement('span');
    const colorClass = VALID_COLORS.includes(group.color) ? group.color : 'grey';
    dot.className = `color-dot ${colorClass}`;
    chip.appendChild(dot);

    const label = document.createElement('span');
    if (group.title) {
      label.textContent = group.title;
    } else {
      label.textContent = 'Untitled';
      label.classList.add('group-name-untitled');
    }
    chip.appendChild(label);

    groupList.appendChild(chip);
  }
  li.append(groupList);

  return li;
}

async function renderList() {
  try {
    const snapshots = await getSnapshots();
    const list = document.getElementById('snapshot-list');
    const empty = document.getElementById('empty-state');
    list.innerHTML = '';

    if (snapshots.length === 0) {
      empty.hidden = false;
      selectedId = null;
      updateActionBar();
      return;
    }
    empty.hidden = true;

    if (selectedId && !snapshots.some(s => s.id === selectedId)) {
      selectedId = null;
    }

    for (const snapshot of snapshots) {
      list.appendChild(makeSnapshotElement(snapshot));
    }
    updateActionBar();
  } catch (err) {
    console.error('Stowaway render error:', err);
    showStatus(`Render error: ${err.message || err}`, true);
  }
}

document.getElementById('save-btn').addEventListener('click', saveSnapshot);
document.getElementById('restore-btn').addEventListener('click', restoreSelected);
document.getElementById('rename-btn').addEventListener('click', renameSelected);
document.getElementById('delete-btn').addEventListener('click', deleteSelected);
document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

renderList();
