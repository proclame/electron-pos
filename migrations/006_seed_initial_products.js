const seedInitialProducts = `
    INSERT OR IGNORE INTO products (
        name, 
        size, 
        color, 
        unit_price, 
        barcode, 
        product_code
    ) VALUES 
    ('Coffee', '12oz', 'Dark Brown', 2.50, '123456789', 'COF001'),
    ('Sandwich', 'Regular', null, 5.99, '987654321', 'SAN001'),
    ('Cookie', 'Large', 'Golden Brown', 1.50, '456789123', 'COK001');
`;

module.exports = {
    up: seedInitialProducts,
    down: `DELETE FROM products WHERE product_code IN ('COF001', 'SAN001', 'COK001');`
};