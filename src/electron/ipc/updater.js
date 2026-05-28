const { ipcMain, app, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const WindowManager = require('../WindowManager');

function send(type, data) {
  const win = WindowManager.getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send('updater:event', { type, data });
  }
}

function registerUpdaterHandlers() {
  // Each step is triggered explicitly by the user; never download or install on its own.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-available', (info) => send('update-available', { version: info.version }));
  autoUpdater.on('update-not-available', (info) => send('update-not-available', { version: info.version }));
  autoUpdater.on('download-progress', (progress) => send('download-progress', { percent: progress.percent }));
  autoUpdater.on('update-downloaded', (info) => send('update-downloaded', { version: info.version }));
  autoUpdater.on('error', (err) =>
    send('error', { message: err == null ? 'unknown error' : err.message || String(err) }),
  );

  ipcMain.handle('updater:get-current-version', () => app.getVersion());

  ipcMain.handle('updater:check', async () => {
    // When the app is not packaged, electron-updater skips the check and resolves
    // to null without emitting any event. Report that so the UI doesn't hang.
    const result = await autoUpdater.checkForUpdates();
    return { ok: true, skipped: result === null };
  });

  ipcMain.handle('updater:download', async () => {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  });

  ipcMain.handle('updater:install', () => {
    // Silent install, relaunch the app afterwards.
    autoUpdater.quitAndInstall(true, true);
    return { ok: true };
  });

  // Open the GitHub release page so the user can download the installer manually
  // when auto-update fails. URL is built here so the renderer can't open arbitrary links.
  ipcMain.handle('updater:open-release', (event, version) => {
    const base = 'https://github.com/proclame/electron-pos/releases';
    const url = version ? `${base}/tag/${encodeURIComponent(version)}` : `${base}/latest`;
    shell.openExternal(url);
    return { ok: true };
  });
}

module.exports = registerUpdaterHandlers;
