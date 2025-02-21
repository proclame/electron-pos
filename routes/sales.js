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

// Get sales history with pagination and filters
router.get('/', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * pageSize;
        const { startDate, endDate } = req.query;

        let whereClause = '';
        let params = [];

        if (startDate && endDate) {
            whereClause = 'WHERE created_at BETWEEN ? AND ?';
            params = [startDate, endDate + ' 23:59:59'];
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM sales 
            ${whereClause}
        `;
        const { total } = db.prepare(countQuery).get(...params);

        // Get paginated sales with their items
        const salesQuery = `
            SELECT 
                s.*,
                GROUP_CONCAT(
                    json_object(
                        'id', si.id,
                        'product_id', si.product_id,
                        'quantity', si.quantity,
                        'unit_price', si.unit_price,
                        'total', si.total,
                        'product_name', p.name
                    )
                ) as items
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            ${whereClause}
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const sales = db.prepare(salesQuery)
            .all(...params, pageSize, offset)
            .map(sale => ({
                ...sale,
                items: sale.items ? JSON.parse(`[${sale.items}]`) : []
            }));

        res.json({
            sales,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Error fetching sales' });
    }
});

// Get single sale details
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const sale = db.prepare(`
            SELECT * FROM sales WHERE id = ?
        `).get(id);

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const items = db.prepare(`
            SELECT 
                si.*,
                p.name as product_name,
                p.barcode,
                p.product_code
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `).all(id);

        res.json({
            ...sale,
            items
        });
    } catch (error) {
        console.error('Error fetching sale details:', error);
        res.status(500).json({ message: 'Error fetching sale details' });
    }
});

module.exports = router; 