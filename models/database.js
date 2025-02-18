const Database = require('better-sqlite3');
const path = require('path');
const MigrationManager = require('../migrations/migrationManager');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath, {
    verbose: console.log // Remove in production
});

const initDatabase = async () => {
    // Run migrations
    const migrationManager = new MigrationManager(dbPath);
    await migrationManager.migrate();

    // Prepare statements
    const statements = {
        getAllProducts: db.prepare('SELECT * FROM products'),
        getProductByBarcode: db.prepare('SELECT * FROM products WHERE barcode = ?'),
        insertProduct: db.prepare(`
            INSERT INTO products (
                name, size, color, 
                unit_price, barcode, product_code
            ) VALUES (?, ?, ?, ?, ?, ?)
        `),
        updateProduct: db.prepare(`
            UPDATE products 
            SET name = ?, size = ?, color = ?, 
                unit_price = ?, barcode = ?, product_code = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `),
        getProductsPaginated: db.prepare(`
            SELECT * FROM products 
            ORDER BY name 
            LIMIT ? OFFSET ?
        `),
    };

    return statements;
};

module.exports = { db, initDatabase }; 