const createProductsTable = require('./001_create_products_table');
const createSalesTable = require('./002_create_sales_table');
const createSaleItemsTable = require('./003_create_sale_items_table');
const createSettingsTable = require('./004_create_settings_table');
const createActiveSalesTable = require('./005_create_active_sales_table');
const seedInitialProducts = require('./006_seed_initial_products');
const addEmailSettings = require('./007_add_email_settings');
const createDiscountsTable = require('./008_create_discounts_table');
const addArchivedAtToProducts = require('./009_add_archived_at_to_products');
const addBarcodeToDiscounts = require('./010_add_barcode_to_discounts');

const migrations = [
  createProductsTable,
  createSalesTable,
  createSaleItemsTable,
  createSettingsTable,
  createActiveSalesTable,
  seedInitialProducts,
  addEmailSettings,
  createDiscountsTable,
  addArchivedAtToProducts,
  addBarcodeToDiscounts,
];

async function runMigrations(db) {
  // Create migrations table if it doesn't exist
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
  ).run();

  // Get completed migrations
  const completedMigrations = db.prepare('SELECT name FROM migrations').all();
  const completedMigrationNames = completedMigrations.map((m) => m.name);

  // Run pending migrations in a transaction
  const migrationTransaction = db.transaction((migrations) => {
    migrations.forEach((migration, index) => {
      const migrationName = `migration_${index + 1}`;
      if (!completedMigrationNames.includes(migrationName)) {
        console.log(`Running migration: ${migrationName}`);
        db.exec(migration.up);
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
      }
    });
  });

  // Execute migrations
  migrationTransaction(migrations);
}

module.exports = runMigrations;
