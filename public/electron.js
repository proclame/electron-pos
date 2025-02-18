const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('../models/database');

// Express setup
const expressApp = express();
let server;
const PORT = 5001;

// Initialize database and get prepared statements
let dbStatements;

// Middleware
expressApp.use(cors());
expressApp.use(express.json());

// API Routes
expressApp.get('/api/products', (req, res) => {
    try {
        const products = dbStatements.getAllProducts.all();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

expressApp.get('/api/products/barcode/:barcode', (req, res) => {
    try {
        const product = dbStatements.getProductByBarcode.get(req.params.barcode);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error finding product:', error);
        res.status(500).json({ message: 'Error finding product' });
    }
});

expressApp.put('/api/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, size, color, unit_price, barcode, product_code } = req.body;
        
        const updateProduct = dbStatements.updateProduct.run(
            name,
            size,
            color,
            unit_price,
            barcode,
            product_code,
            id
        );

        if (updateProduct.changes > 0) {
            res.json({ message: 'Product updated successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

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