const { app } = require('electron');
const server = require('../src/server');
const WindowManager = require('../src/electron/WindowManager');
const { ipcMain } = require('electron');
const { db } = require('../models/database');

async function init() {
    try {
        const isDev = await import('electron-is-dev').then(module => module.default);
        await server.start(isDev);
        await WindowManager.createMainWindow(isDev);
    } catch (error) {
        console.error('Error during startup:', error);
        app.quit();
    }
}

// Add IPC handler for settings
ipcMain.handle('get-settings', async () => {
    try {
        const settings = db.prepare('SELECT * FROM settings').all()
            .reduce((acc, row) => ({
                ...acc,
                [row.key]: row.value
            }), {});
        return settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        throw error;
    }
});

app.whenReady().then(init);

app.on('window-all-closed', () => {
    server.stop();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    if (!WindowManager.getMainWindow()) {
        await init();
    }
}); 