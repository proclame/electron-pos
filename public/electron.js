const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');

// Express setup
const expressApp = express();
let server;
const PORT = 5001;

// Middleware
expressApp.use(cors());
expressApp.use(express.json());

// Basic test endpoint
expressApp.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

function startServer() {
    return new Promise((resolve, reject) => {
        try {
            server = expressApp.listen(PORT, () => {
                console.log(`Express server running on port ${PORT}`);
                resolve();
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            reject(error);
        }
    });
}

let mainWindow;

async function createWindow() {
    try {
        // Start Express server
        await startServer();
        console.log('Server started successfully');

        // Create Electron window
        mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // Load React app
        const startUrl = isDev 
            ? 'http://localhost:3000' 
            : `file://${path.join(__dirname, '../build/index.html')}`;

        console.log('Loading URL:', startUrl);
        await mainWindow.loadURL(startUrl);

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    } catch (error) {
        console.error('Error during startup:', error);
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (server) {
        server.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
}); 