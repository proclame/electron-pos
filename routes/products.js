const express = require('express');
const router = express.Router();
const csv = require('csv-parse');
const { db } = require('../models/database');

router.get('/', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const offset = (page - 1) * pageSize;

        const countStatement = db.prepare('SELECT COUNT(*) as total FROM products');
        const total = countStatement.get().total;

        const products = db.prepare('SELECT * FROM products LIMIT ? OFFSET ?').all(pageSize, offset);
        
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

router.get('/barcode/:barcode', (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(req.params.barcode);
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

router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, size, color, unit_price, barcode, product_code } = req.body;
        
        const result = db.prepare(`
            UPDATE products 
            SET name = ?, size = ?, color = ?, unit_price = ?, 
                barcode = ?, product_code = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, size, color, unit_price, barcode, product_code, id);

        if (result.changes > 0) {
            res.json({ message: 'Product updated successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

router.post('/import', (req, res) => {
    try {
        const { csvData } = req.body;
        
        csv.parse(csvData, {
            columns: true,
            skip_empty_lines: true
        }, (err, data) => {
            if (err) throw err;
            
            const importProducts = db.prepare(`
                INSERT OR REPLACE INTO products (
                    name, size, color, unit_price, barcode, product_code
                ) VALUES (?, ?, ?, ?, ?, ?)
            `);

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

            importMany(data);
            res.json({ message: `Imported ${data.length} products` });
        });
    } catch (error) {
        console.error('Error importing products:', error);
        res.status(500).json({ message: 'Error importing products' });
    }
});

module.exports = router; 