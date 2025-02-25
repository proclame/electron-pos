const { app } = require('electron');
const server = require('../src/server');
const WindowManager = require('../src/electron/WindowManager');
const registerSettingsHandlers = require('../src/electron/ipc/settings');

async function init() {
    try {
        const isDev = await import('electron-is-dev').then(module => module.default);
        registerSettingsHandlers();
        await server.start(isDev);
        await WindowManager.createMainWindow(isDev);
    } catch (error) {
        console.error('Error during startup:', error);
        app.quit();
    }
}

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