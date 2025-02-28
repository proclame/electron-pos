const addArchivedAtToProducts = `
  ALTER TABLE products ADD COLUMN archived_at DATETIME DEFAULT NULL;
  CREATE INDEX IF NOT EXISTS idx_products_archived_at ON products(archived_at);
`;

module.exports = {
  up: addArchivedAtToProducts,
  down: `
    DROP INDEX IF EXISTS idx_products_archived_at;
    -- SQLite doesn't support dropping columns
  `,
};
