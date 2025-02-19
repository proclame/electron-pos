const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        vat_number TEXT,
        vat_percentage REAL NOT NULL DEFAULT 21.0,
        company_name TEXT NOT NULL,
        company_address TEXT,
        currency_symbol TEXT NOT NULL DEFAULT '€',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure we always have one settings row
    INSERT OR IGNORE INTO settings (id, company_name) VALUES (1, 'Your Company Name');

    -- Add trigger to update the updated_at timestamp
    CREATE TRIGGER IF NOT EXISTS settings_updated_at 
    AFTER UPDATE ON settings
    BEGIN
        UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
`;

module.exports = {
    up: createSettingsTable,
    down: `DROP TABLE IF EXISTS settings;`
}; 