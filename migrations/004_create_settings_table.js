const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Add trigger to update the updated_at timestamp
    CREATE TRIGGER IF NOT EXISTS settings_updated_at 
    AFTER UPDATE ON settings
    BEGIN
        UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- Insert default settings
    INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('vat_number', ''),
        ('vat_percentage', '21.0'),
        ('company_name', 'Your Company Name'),
        ('company_address', ''),
        ('currency_symbol', '€'),
        ('thank_you_text', 'Thank you for your business!');
`;

module.exports = {
    up: createSettingsTable,
    down: `DROP TABLE IF EXISTS settings;`
}; 