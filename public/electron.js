const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('../models/database');
const csv = require('csv-parse');
const os = require('os');
const PrinterService = require('../services/PrinterService');

// Express setup
const expressApp = express();
let server;
const PORT = 5001;

// Initialize database and get prepared statements
let dbStatements;

// Middleware
expressApp.use(cors());
expressApp.use(express.json({ limit: '10mb' }));

// API Routes
expressApp.get('/api/products', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const offset = (page - 1) * pageSize;

        const countStatement = db.prepare('SELECT COUNT(*) as total FROM products');
        const total = countStatement.get().total;

        const products = dbStatements.getProductsPaginated.all(pageSize, offset);
        
        res.json({
            products,
            total,
            page,
            pageSize
        });
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

expressApp.post('/api/products/import', (req, res) => {
    try {
        const { csvData } = req.body;
        
        csv.parse(csvData, {
            columns: true,
            skip_empty_lines: true
        }, (err, data) => {
            if (err) throw err;
            
            // Use a prepared statement for better performance
            const importProducts = db.prepare(`
                INSERT OR REPLACE INTO products (
                    name, size, color, unit_price, barcode, product_code
                ) VALUES (?, ?, ?, ?, ?, ?)
            `);

            // Use a single transaction for all inserts
            const importMany = db.transaction((products) => {
                for (const record of products) {
                    importProducts.run(
                        record.name,
                        record.size || null,
                        record.color || null,
                        parseFloat(record.unit_price),
                        record.barcode,
                        record.product_code
                    );
                }
            });

            // Execute all inserts in one transaction
            importMany(data);

            res.json({ message: `Imported ${data.length} products` });
        });
    } catch (error) {
        console.error('Error importing products:', error);
        res.status(500).json({ message: 'Error importing products' });
    }
});

// Add new endpoint for creating sales
expressApp.post('/api/sales', (req, res) => {
    try {
        const { items, subtotal, discount_amount = 0, total, payment_method = 'cash', needs_invoice = false, notes = '' } = req.body;

        const result = db.transaction(() => {
            // Create the sale
            const saleResult = dbStatements.createSale.run(
                subtotal,
                discount_amount,
                total,
                payment_method,
                needs_invoice ? 1 : 0,
                notes  // Add notes to the insert
            );
            
            const saleId = saleResult.lastInsertRowid;

            // Create sale items
            for (const item of items) {
                dbStatements.createSaleItem.run(
                    saleId,
                    item.product.id,
                    item.quantity,
                    item.product.unit_price,
                    item.discount_percentage || 0,
                    item.product.unit_price * item.quantity,
                    (item.product.unit_price * item.quantity) * (1 - (item.discount_percentage || 0) / 100)
                );
            }

            return saleId;
        })();

        res.json({ id: result, message: 'Sale created successfully' });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: 'Error creating sale' });
    }
});

// Add to your existing API routes
expressApp.get('/api/printers', (req, res) => {
    try {
        const printers = PrinterService.getAvailablePrinters();
        res.json(printers);
    } catch (error) {
        console.error('Error getting printers:', error);
        res.status(500).json({ message: 'Error getting printers' });
    }
});

expressApp.post('/api/print/receipt', async (req, res) => {
    try {
        const sale = req.body;
        await PrinterService.printReceipt(sale);
        res.json({ message: 'Receipt printed successfully' });
    } catch (error) {
        console.error('Error printing receipt:', error);
        res.status(500).json({ message: 'Error printing receipt' });
    }
});

expressApp.get('/api/settings', (req, res) => {
    try {
        const settings = db.prepare('SELECT key, value FROM settings').all();
        // Convert array of key-value pairs to object
        const settingsObject = settings.reduce((obj, item) => {
            obj[item.key] = item.value;
            return obj;
        }, {});
        res.json(settingsObject);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

expressApp.put('/api/settings', (req, res) => {
    try {
        const settings = req.body;
        
        // Create the update statement once
        const updateSetting = db.prepare(`
            UPDATE settings 
            SET value = ?
            WHERE key = ?
        `);

        // Use a transaction to update all settings
        const updateMany = db.transaction((settings) => {
            Object.entries(settings).forEach(([key, value]) => {
                updateSetting.run(value.toString(), key);
            });
        });

        // Execute the transaction
        updateMany(settings);

        // Clear the cached settings in PrinterService
        PrinterService.clearSettingsCache();
        
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// Add new search endpoint
expressApp.get('/api/products/search', (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json({ products: [] });
        }

        const searchTerm = `%${query}%`;
        const products = db.prepare(`
            SELECT * FROM products 
            WHERE name LIKE ? 
            OR product_code LIKE ?
            LIMIT 20
        `).all(searchTerm, searchTerm);

        res.json({ products });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ message: 'Error searching products' });
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