// Uliza Studio for Windows: a window around the Uliza design studio at ulizatickets.com.
// Nothing is stored here except window size; sign-in stays in the app's own browser profile.
const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const APP_URL = process.env.ULIZA_STUDIO_URL || 'https://ulizatickets.com/admin/design-studio';
const ORIGIN = new URL(APP_URL).origin;
const ICON = path.join(__dirname, 'build', 'icon.png');

let win = null;

if (!app.requestSingleInstanceLock()) app.quit();
else app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.setAppUserModelId('com.ulizaevents.studio');

const stateFile = () => path.join(app.getPath('userData'), 'window.json');
function loadBounds() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return { width: 1440, height: 900, maximized: true }; }
}
function saveBounds() {
  if (!win || win.isMinimized()) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() })); } catch { /* not critical */ }
}

const sameApp = (url) => { try { return new URL(url).origin === ORIGIN; } catch { return false; } };
const openOutside = (url) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); };

function createWindow() {
  const b = loadBounds();
  win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width || 1440, height: b.height || 900, minWidth: 900, minHeight: 600,
    title: 'Uliza Studio', icon: ICON, backgroundColor: '#ffffff', autoHideMenuBar: true, show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true },
  });
  if (b.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());

  // Lets the page hide its own "Download for Windows" button.
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} UlizaStudioDesktop/${app.getVersion()}`);

  // Downloads (PNG, JPG, PDF) open a normal Save As dialog.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (sameApp(url) || url.startsWith('blob:')) return { action: 'allow' };
    openOutside(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!sameApp(url)) { e.preventDefault(); openOutside(url); }
  });
  win.on('page-title-updated', (e, title) => { e.preventDefault(); win.setTitle(title ? `${title.replace(/\s*[-|·].*$/, '')} · Uliza Studio` : 'Uliza Studio'); });

  win.on('close', saveBounds);
  win.on('closed', () => { win = null; });

  win.webContents.on('did-fail-load', (_e, code, desc, _url, isMain) => {
    if (!isMain || code === -3) return; // -3 = navigation replaced
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><meta charset="utf-8"><body style="font-family:Segoe UI,sans-serif;background:#fff;color:#1f2937;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h2 style="font-weight:500">Can't reach Uliza Studio</h2><p>Check your internet connection.</p><p style="color:#6b7280;font-size:13px">${desc}</p><button onclick="location.href='${APP_URL}'" style="margin-top:12px;padding:9px 22px;border:0;border-radius:8px;background:#10352a;color:#fff;font-size:14px;cursor:pointer">Try again</button></div>`)}`);
  });

  win.loadURL(APP_URL);
}

app.whenReady().then(() => {
  // Small menu so keyboard shortcuts (copy, paste, undo, zoom) work inside the editor.
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [{ label: 'Home', accelerator: 'Alt+Home', click: () => win && win.loadURL(APP_URL) }, { type: 'separator' }, { role: 'quit' }] },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
  ]));
  const allowed = new Set(['clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'notifications']);
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => cb(allowed.has(permission) && sameApp(details.requestingUrl || wc.getURL())));
  session.defaultSession.setPermissionCheckHandler((_wc, permission, origin) => allowed.has(permission) && sameApp(origin));

  createWindow();

  if (app.isPackaged) {
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    } catch { /* updates are optional */ }
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
