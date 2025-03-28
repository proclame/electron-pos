const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        size TEXT,
        color TEXT,
        unit_price DECIMAL(10,2) NOT NULL,
        barcode TEXT UNIQUE,
        product_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
`;

module.exports = {
  up: createProductsTable,
  down: `DROP TABLE IF EXISTS products;`,
};
