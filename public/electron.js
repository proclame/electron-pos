const { app } = require('electron');

const WindowManager = require('../src/electron/WindowManager');
const registerIpcHandlers = require('../src/electron/ipc');


async function init() {
    try {
        const isDev = await import('electron-is-dev').then(module => module.default);
        registerIpcHandlers()
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