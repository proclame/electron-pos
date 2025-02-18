const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');

// Express setup
const expressApp = express();
let server;
const PORT = 5001;

// Sample products data
const products = [
    { id: 1, name: 'Coffee', price: 2.50, barcode: '123456789' },
    { id: 2, name: 'Sandwich', price: 5.99, barcode: '987654321' },
    { id: 3, name: 'Cookie', price: 1.50, barcode: '456789123' }
];

// Middleware
expressApp.use(cors());
expressApp.use(express.json());

// API Routes
expressApp.get('/api/products', (req, res) => {
    res.json(products);
});

expressApp.get('/api/products/barcode/:barcode', (req, res) => {
    const product = products.find(p => p.barcode === req.params.barcode);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
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