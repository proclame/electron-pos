const createActiveSalesTable = `
    CREATE TABLE IF NOT EXISTS active_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT CHECK(status IN ('current', 'on_hold')) NOT NULL,
        cart_data TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Add trigger to update the updated_at timestamp
    CREATE TRIGGER IF NOT EXISTS active_sales_updated_at 
    AFTER UPDATE ON active_sales
    BEGIN
        UPDATE active_sales SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
`;

module.exports = {
    up: createActiveSalesTable,
    down: `DROP TABLE IF EXISTS active_sales;`
}; 