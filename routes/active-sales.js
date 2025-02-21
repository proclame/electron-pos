const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

// Get all active sales
router.get('/', (req, res) => {
    try {
        const activeSales = db.prepare(`
            SELECT * FROM active_sales 
            ORDER BY created_at DESC
        `).all();

        res.json(activeSales.map(sale => ({
            ...sale,
            cart_data: JSON.parse(sale.cart_data)
        })));
    } catch (error) {
        console.error('Error fetching active sales:', error);
        res.status(500).json({ message: 'Error fetching active sales' });
    }
});

// Create new active sale
router.post('/', (req, res) => {
    try {
        const { cart_data, status = 'current', notes = '' } = req.body;

        const result = db.prepare(`
            INSERT INTO active_sales (cart_data, status, notes)
            VALUES (?, ?, ?)
        `).run(JSON.stringify(cart_data), status, notes);

        res.json({ 
            id: result.lastInsertRowid,
            message: 'Active sale created successfully' 
        });
    } catch (error) {
        console.error('Error creating active sale:', error);
        res.status(500).json({ message: 'Error creating active sale' });
    }
});

// Get single active sale
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const sale = db.prepare('SELECT * FROM active_sales WHERE id = ?').get(id);

        if (!sale) {
            return res.status(404).json({ message: 'Active sale not found' });
        }

        res.json({
            ...sale,
            cart_data: JSON.parse(sale.cart_data)
        });
    } catch (error) {
        console.error('Error fetching active sale:', error);
        res.status(500).json({ message: 'Error fetching active sale' });
    }
});


router.put('/:id', (req, res) => {
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


// Update active sale status (put on hold)
router.put('/:id/hold', (req, res) => {
    try {
        const { id } = req.params;
        const { notes = '' } = req.body;
        
        const result = db.prepare(`
            UPDATE active_sales 
            SET status = 'on_hold', notes = ?
            WHERE id = ?
        `).run(notes, id);
        
        if (result.changes > 0) {
            res.json({ message: 'Sale put on hold successfully' });
        } else {
            res.status(404).json({ message: 'Sale not found' });
        }
    } catch (error) {
        console.error('Error updating active sale:', error);
        res.status(500).json({ message: 'Error updating sale' });
    }
});

// Resume sale from hold
router.put('/:id/resume', (req, res) => {
    try {
        const { id } = req.params;
        
        const result = db.prepare(`
            UPDATE active_sales 
            SET status = 'current', notes = ''
            WHERE id = ?
        `).run(id);
        
        if (result.changes > 0) {
            res.json({ message: 'Sale resumed successfully' });
        } else {
            res.status(404).json({ message: 'Sale not found' });
        }
    } catch (error) {
        console.error('Error resuming sale:', error);
        res.status(500).json({ message: 'Error resuming sale' });
    }
});

// Delete active sale
router.delete('/:id', (req, res) => {
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