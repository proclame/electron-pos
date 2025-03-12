const { BrowserWindow } = require('electron');
const path = require('path');
const getConfig = require('../config');
const { app } = require('electron');

class WindowManager {
  static mainWindow = null;

  static async createMainWindow(isDev) {
    const config = getConfig(isDev);
    WindowManager.mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    if (app.isPackaged) {
      // Load the index.html from the dist folder
      await WindowManager.mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
    } else {
      // Dev - Load from React dev server
      await WindowManager.mainWindow.loadURL('http://localhost:3000');
    }

    if (config.window.devTools) {
      WindowManager.mainWindow.webContents.openDevTools();
    }

    WindowManager.mainWindow.on('closed', () => {
      WindowManager.mainWindow = null;
    });
  }

  static getMainWindow() {
    return WindowManager.mainWindow;
  }
}

module.exports = WindowManager;
