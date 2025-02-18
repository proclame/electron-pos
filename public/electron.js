const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('../models/database');
const csv = require('csv-parse');

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
        const { items, subtotal, discount_amount = 0, total, payment_method = 'cash', needs_invoice = false } = req.body;

        const result = db.transaction(() => {
            // Create the sale - convert boolean to integer
            const saleResult = dbStatements.createSale.run(
                subtotal,
                discount_amount,
                total,
                payment_method,
                needs_invoice ? 1 : 0  // Convert boolean to 0/1
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