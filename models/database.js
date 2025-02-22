const Database = require('better-sqlite3');
const runMigrations = require('../migrations/migrationManager');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('downloads'), 'database.sqlite');

const db = new Database(dbPath, {
    verbose: console.log // Remove in production
});


async function initDatabase() {
    try {
        // Run migrations
        await runMigrations(db);

        // Prepare statements
        const statements = {
            getProductsPaginated: db.prepare(`
                SELECT * FROM products 
                LIMIT ? OFFSET ?
            `),
            getProductByBarcode: db.prepare(`
                SELECT * FROM products 
                WHERE barcode = ?
            `),
            updateProduct: db.prepare(`
                UPDATE products 
                SET name = ?, 
                    size = ?, 
                    color = ?, 
                    unit_price = ?, 
                    barcode = ?, 
                    product_code = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `),
            createSale: db.prepare(`
                INSERT INTO sales (
                    subtotal, 
                    discount_amount, 
                    total, 
                    payment_method, 
                    needs_invoice,
                    notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            `),
            createSaleItem: db.prepare(`
                INSERT INTO sale_items (
                    sale_id,
                    product_id,
                    quantity,
                    unit_price,
                    discount_percentage,
                    subtotal,
                    total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
        };

        return statements;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

module.exports = {
    db,
    initDatabase
}; 