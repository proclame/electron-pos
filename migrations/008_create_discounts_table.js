const createDiscountsTable = `
  CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('percentage', 'fixed')) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    auto_activate BOOLEAN DEFAULT 0,
    min_cart_value DECIMAL(10,2) DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Add trigger to update the updated_at timestamp
  CREATE TRIGGER IF NOT EXISTS discounts_updated_at 
  AFTER UPDATE ON discounts
  BEGIN
    UPDATE discounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`;

module.exports = {
  up: createDiscountsTable,
  down: 'DROP TABLE IF EXISTS discounts;',
};
