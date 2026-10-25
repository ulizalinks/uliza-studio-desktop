# Uliza Studio for Windows

A Windows app that opens the Uliza design studio (`https://ulizatickets.com/admin/design-studio`) in its own full-size window: design posters, flyers, labels, cards, tickets and wristbands at real print sizes, and download PNG, JPG or PDF straight to your PC.

- Sign in once with your Uliza admin account; the app remembers you.
- Downloads open a normal Save As dialog.
- Updates itself from the latest GitHub release.

## Releasing

The GitHub Actions workflow `.github/workflows/release.yml` builds `Uliza-Studio-Setup.exe` on Windows and attaches it to a GitHub release.

1. Bump `version` in `package.json`.
2. Push a tag `studio-v<version>` (for example `studio-v1.0.0`), or run the workflow manually from the Actions tab.

Download link: https://github.com/ulizalinks/uliza-studio-desktop/releases/latest/download/Uliza-Studio-Setup.exe

The installer is not code-signed, so Windows SmartScreen shows "Windows protected your PC" the first time: click **More info → Run anyway**.
