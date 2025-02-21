const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

router.post('/', (req, res) => {
    try {
        const { items, subtotal, discount_amount = 0, total, payment_method = 'cash', needs_invoice = false, notes = '' } = req.body;

        const result = db.transaction(() => {
            const saleResult = db.prepare(`
                INSERT INTO sales (
                    subtotal, discount_amount, total, 
                    payment_method, needs_invoice, notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(subtotal, discount_amount, total, payment_method, needs_invoice ? 1 : 0, notes);

            const saleId = saleResult.lastInsertRowid;

            const insertItem = db.prepare(`
                INSERT INTO sale_items (
                    sale_id, product_id, quantity,
                    unit_price, discount_percentage,
                    subtotal, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            for (const item of items) {
                const itemSubtotal = item.quantity * item.product.unit_price;
                insertItem.run(
                    saleId,
                    item.product.id,
                    item.quantity,
                    item.product.unit_price,
                    0, // discount_percentage
                    itemSubtotal,
                    itemSubtotal // total same as subtotal if no discount
                );
            }

            return saleId;
        })();

        res.json({ id: result });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: 'Error creating sale' });
    }
});

module.exports = router; 