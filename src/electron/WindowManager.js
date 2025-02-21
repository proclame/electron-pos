const { BrowserWindow } = require('electron');
const path = require('path');
const getConfig = require('../config');

class WindowManager {
    constructor() {
        this.mainWindow = null;
    }

    async createMainWindow(isDev) {
        const config = getConfig(isDev);
        this.mainWindow = new BrowserWindow({
            ...config.window,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        const startUrl = isDev 
            ? 'http://localhost:3000' 
            : `file://${path.join(__dirname, '../../build/index.html')}`;

        await this.mainWindow.loadURL(startUrl);

        if (config.window.devTools) {
            this.mainWindow.webContents.openDevTools();
        }

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    getMainWindow() {
        return this.mainWindow;
    }
}

module.exports = new WindowManager(); 