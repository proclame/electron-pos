const Database = require('better-sqlite3');
const createProductsTable = require('./001_create_products_table');
const createSalesTable = require('./002_create_sales_table');
const createSaleItemsTable = require('./003_create_sale_items_table');
const createSettingsTable = require('./004_create_settings_table');
const createActiveSalesTable = require('./005_create_active_sales_table');
const seedInitialProducts = require('./006_seed_initial_products');

class MigrationManager {
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.initMigrationTable();
    }

    initMigrationTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    hasExecuted(migrationName) {
        const result = this.db.prepare('SELECT id FROM migrations WHERE name = ?').get(migrationName);
        return !!result;
    }

    recordMigration(migrationName) {
        this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
    }
}

const migrations = [
    createProductsTable,
    createSalesTable,
    createSaleItemsTable,
    createSettingsTable,
    createActiveSalesTable,
    seedInitialProducts
];

async function runMigrations(db) {
    // Create migrations table if it doesn't exist
    db.prepare(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Get completed migrations
    const completedMigrations = db.prepare('SELECT name FROM migrations').all();
    const completedMigrationNames = completedMigrations.map(m => m.name);

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