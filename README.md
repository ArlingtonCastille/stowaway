# Stowaway

**Don't lose your tabs again.**

Snapshot every tab group in your current window — names, colors, and all URLs. Restore them later, exactly the way you left them. Local-first, no accounts, nothing sent anywhere.

For anyone who works in tab groups: researchers juggling multiple projects, developers with a workspace per repo, anyone who needs to suspend a session and pick it up later.

## What a saved snapshot looks like

<img width="418" height="379" alt="image" src="https://github.com/user-attachments/assets/1a5cae77-2dfa-423a-8453-ef76cc8bdfb6" />


Each snapshot shows the name and color dot of every group it contains, so you can see at a glance what you're about to bring back.

## Features

- **Snapshot a workspace** — capture every tab group in your current window in one click
- **Restore exactly as you left it** — group names, colors, and tab order all preserved
- **Visual snapshot list** — see the name and color dot of every group inside each saved snapshot
- **Choose where to restore** — into a new window or merged into your current one
- **Local-first** — all data lives in `chrome.storage.local` on your device. Nothing is sent anywhere.

## Install

### From source (development)

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Toggle "Developer mode" on (top right).
4. Click "Load unpacked" and select the `stowaway` folder.
5. Pin the Stowaway icon to your toolbar.

Chrome Web Store listing coming soon.

## Usage

1. Open the tab groups you want to save.
2. Click the Stowaway icon and press "Save current tab groups."
3. Later, open the popup, click a snapshot to select it, and press Restore.
4. Use the gear icon at the bottom of the popup to choose where restored groups open.

## Privacy

Stowaway runs entirely on your machine. No accounts, no analytics, no servers. Your tab data never leaves your browser.

## Roadmap

- Firefox build
- Export and import snapshots as JSON
- Snapshot search
- Keyboard shortcut to trigger save
- Optional auto-snapshot on schedule

## License

MIT. See [LICENSE](LICENSE).

## Support

If Stowaway earns its keep, here's how to keep it going:

- [Buy Me a Coffee](https://buymeacoffee.com/arlingtoncastille)
- [Patreon](https://patreon.com/arlingtoncastille)
