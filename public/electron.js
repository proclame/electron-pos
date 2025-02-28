const { app } = require('electron');

const WindowManager = require('../src/electron/WindowManager');
const registerIpcHandlers = require('../src/electron/ipc');
const { initDatabase } = require('../models/database');

let handlersRegistered = false;

async function init() {
  try {
    await initDatabase();
    const isDev = !app.isPackaged;
    if (!handlersRegistered) {
      registerIpcHandlers();
      handlersRegistered = true;
    }
    await WindowManager.createMainWindow(isDev);
  } catch (error) {
    console.error('Error during startup:', error);
    app.quit();
  }
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (!WindowManager.getMainWindow()) {
    await init();
  }
});
