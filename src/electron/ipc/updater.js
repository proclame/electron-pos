const { ipcMain } = require('electron');
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

  ipcMain.handle('updater:check', async () => {
    await autoUpdater.checkForUpdates();
    return { ok: true };
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
}

module.exports = registerUpdaterHandlers;
