const DEFAULT_SETTINGS = { restoreTarget: 'newWindow' };

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

function showStatus(message) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 1800);
}

async function init() {
  const settings = await getSettings();
  const radios = document.querySelectorAll('input[name="restoreTarget"]');
  for (const radio of radios) {
    radio.checked = (radio.value === settings.restoreTarget);
    radio.addEventListener('change', async e => {
      if (!e.target.checked) return;
      const updated = await getSettings();
      updated.restoreTarget = e.target.value;
      await saveSettings(updated);
      showStatus('Saved.');
    });
  }
}

init();
