const express = require('express');
const router = express.Router();
const csv = require('csv-parse');
const { db } = require('../models/database');
const PrinterService = require('../services/PrinterService');

const productsRouter = require('./products');
const salesRouter = require('./sales');

router.use('/products', productsRouter);
router.use('/sales', salesRouter);

// Add to your existing API routes
router.get('/printers', async (req, res) => {
    try {
        const printers = await PrinterService.getAvailablePrinters();
        res.json(printers);
    } catch (error) {
        console.error('Error getting printers:', error);
        res.status(500).json({ message: 'Error getting printers' });
    }
});

router.post('/print/receipt', async (req, res) => {
    try {
        const sale = req.body;
        await PrinterService.printReceipt(sale);
        res.json({ message: 'Receipt printed successfully' });
    } catch (error) {
        console.error('Error printing receipt:', error);
        res.status(500).json({ message: 'Error printing receipt' });
    }
});

router.get('/settings', (req, res) => {
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

router.put('/settings', (req, res) => {
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
router.get('/products/search', (req, res) => {
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

// Add these new endpoints
router.post('/active-sales', (req, res) => {
    try {
        const { cart_data, status = 'current', notes = '' } = req.body;
        
        const result = db.prepare(`
            INSERT INTO active_sales (cart_data, status, notes)
            VALUES (?, ?, ?)
        `).run(JSON.stringify(cart_data), status, notes);
        
        res.json({ id: result.lastInsertRowid });
    } catch (error) {
        console.error('Error saving active sale:', error);
        res.status(500).json({ message: 'Error saving sale' });
    }
});

router.get('/active-sales', (req, res) => {
    try {
        const sales = db.prepare(`
            SELECT * FROM active_sales
            ORDER BY created_at DESC
        `).all();
        
        res.json(sales.map(sale => ({
            ...sale,
            cart_data: JSON.parse(sale.cart_data)
        })));
    } catch (error) {
        console.error('Error fetching active sales:', error);
        res.status(500).json({ message: 'Error fetching sales' });
    }
});

router.put('/active-sales/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { cart_data, status, notes } = req.body;
        
        const result = db.prepare(`
            UPDATE active_sales 
            SET cart_data = ?, status = ?, notes = ?
            WHERE id = ?
        `).run(JSON.stringify(cart_data), status, notes, id);
        
        if (result.changes > 0) {
            res.json({ message: 'Sale updated successfully' });
        } else {
            res.status(404).json({ message: 'Sale not found' });
        }
    } catch (error) {
        console.error('Error updating active sale:', error);
        res.status(500).json({ message: 'Error updating sale' });
    }
});

router.delete('/active-sales/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM active_sales WHERE id = ?').run(id);
        
        if (result.changes > 0) {
            res.json({ message: 'Sale deleted successfully' });
        } else {
            res.status(404).json({ message: 'Sale not found' });
        }
    } catch (error) {
        console.error('Error deleting active sale:', error);
        res.status(500).json({ message: 'Error deleting sale' });
    }
});


module.exports = router; 