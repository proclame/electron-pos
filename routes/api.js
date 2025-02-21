const express = require('express');
const router = express.Router();
const csv = require('csv-parse');
const { db } = require('../models/database');
const PrinterService = require('../services/PrinterService');

const productsRouter = require('./products');
const salesRouter = require('./sales');
const activeSalesRouter = require('./active-sales');
const printRouter = require('./print');
const settingsRouter = require('./settings');

router.use('/products', productsRouter);
router.use('/sales', salesRouter);
router.use('/active-sales', activeSalesRouter);
router.use('/print', printRouter);
router.use('/settings', settingsRouter);

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

router.put('/active-sales/hold', (req, res) => {
    try {
        const { id, notes } = req.body;
        
        const result = db.prepare("UPDATE active_sales SET status = 'on_hold', notes = ? WHERE id = ?").run(notes, id);

        if (result.changes > 0) {
            res.json({ message: 'Sale updated successfully to hold' });
        } else {
            res.status(404).json({ message: 'Sale not found' });
        }
    } catch (error) {
        console.error('Error updating active sale:', error);
        res.status(500).json({ message: 'Error updating sale' });
    }
    
});

router.put('/active-sales/resume', (req, res) => {
    try {
        const { id, notes } = req.body;
        
        const result = db.prepare("UPDATE active_sales SET status = 'current', notes = '' WHERE id = ?").run(id);

        if (result.changes > 0) {
            res.json({ message: 'Sale updated successfully to current' });
        } else {
            res.status(404).json({ message: 'Sale not found' });
        }
    } catch (error) {
        console.error('Error updating active sale:', error);
        res.status(500).json({ message: 'Error updating sale' });
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