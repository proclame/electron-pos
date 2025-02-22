const { BrowserWindow } = require('electron');
const path = require('path');
const getConfig = require('../config');
const { app } = require('electron');

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

        if (app.isPackaged) {
            // Load the index.html from the dist folder
            await this.mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
        } else {
            // Dev - Load from React dev server
            await this.mainWindow.loadURL('http://localhost:3000');
        }
    
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