# Stowaway

Save and restore your Chrome tab groups. Snapshot, organize, and bring them back with one click.

Stowaway captures the names, colors, and URLs of every tab group in your current window, stores them locally on your machine, and restores them later with everything where you left it.

## Features

- One-click snapshot of all tab groups in the current window
- Each saved snapshot displays the name and color dot of every group it contains
- Single-click selection with one shared action bar (Restore, Rename, Delete)
- Choose whether restored groups open in a new window or in your current window
- All data lives in `chrome.storage.local` on your device. Nothing is sent anywhere.

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

- Snapshot search
- Export and import snapshots as JSON
- Keyboard shortcut to trigger save
- Optional auto-snapshot on schedule
- Firefox build

## License

MIT. See [LICENSE](LICENSE).

## Support

Stowaway is free and donationware. If it saves you time, you can support development:

- [Buy Me a Coffee](https://buymeacoffee.com/arlingtoncastille)
- [Patreon](https://patreon.com/arlingtoncastille)
