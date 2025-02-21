const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('../models/database');
const apiRouter = require('../routes/api');

// Express setup
const expressApp = express();
let server;
const PORT = 5001;

// Initialize database and get prepared statements
let dbStatements;

// Middleware
expressApp.use(cors());
expressApp.use(express.json({ limit: '10mb' }));

// Routes
expressApp.use('/api', apiRouter);


// Initialize database before starting the server
async function startServer() {
    try {
        dbStatements = await initDatabase();
        server = expressApp.listen(PORT, () => {
            console.log(`Express server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        throw error;
    }
}

let mainWindow;

async function createWindow() {
    try {
        // Start Express server
        await startServer();
        console.log('Server started successfully');

        // Create Electron window
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 900,
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

        console.log('isDev:', isDev);
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