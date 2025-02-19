const Database = require('better-sqlite3');
const path = require('path');
const createProductsTable = require('./001_create_products_table');
const createSalesTable = require('./002_create_sales_table');
const createSaleItemsTable = require('./003_create_sale_items_table');
const createSettingsTable = require('./004_create_settings_table');
const createActiveSalesTable = require('./005_create_active_sales_table');

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

    async migrate() {
        // Initial schema
        if (!this.hasExecuted('001_initial_schema')) {
            console.log('Executing migration: 001_initial_schema');
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    size TEXT,
                    color TEXT,
                    unit_price DECIMAL(10,2) NOT NULL,
                    barcode TEXT UNIQUE NOT NULL,
                    product_code TEXT UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
                CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
            `);
            this.recordMigration('001_initial_schema');
        }

        // Seed data
        if (!this.hasExecuted('002_seed_initial_products')) {
            console.log('Executing migration: 002_seed_initial_products');
            const insertProduct = this.db.prepare(`
                INSERT INTO products (
                    name, size, color, 
                    unit_price, barcode, product_code
                ) VALUES (?, ?, ?, ?, ?, ?)
            `);

            const sampleProducts = [
                {
                    name: 'Coffee',
                    size: '12oz',
                    color: 'Dark Brown',
                    unitPrice: 2.50,
                    barcode: '123456789',
                    productCode: 'COF001'
                },
                {
                    name: 'Sandwich',
                    size: 'Regular',
                    color: null,
                    unitPrice: 5.99,
                    barcode: '987654321',
                    productCode: 'SAN001'
                },
                {
                    name: 'Cookie',
                    size: 'Large',
                    color: 'Golden Brown',
                    unitPrice: 1.50,
                    barcode: '456789123',
                    productCode: 'COK001'
                }
            ];

            for (const product of sampleProducts) {
                insertProduct.run(
                    product.name,
                    product.size,
                    product.color,
                    product.unitPrice,
                    product.barcode,
                    product.productCode
                );
            }
            this.recordMigration('002_seed_initial_products');
        }

        // Sales tables
        if (!this.hasExecuted('003_create_sales_tables')) {
            console.log('Executing migration: 003_create_sales_tables');
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subtotal DECIMAL(10,2) NOT NULL,
                    discount_amount DECIMAL(10,2) DEFAULT 0,
                    total DECIMAL(10,2) NOT NULL,
                    payment_method TEXT DEFAULT 'cash',
                    needs_invoice BOOLEAN DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS sale_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sale_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    unit_price DECIMAL(10,2) NOT NULL,
                    discount_percentage DECIMAL(5,2) DEFAULT 0,
                    subtotal DECIMAL(10,2) NOT NULL,
                    total DECIMAL(10,2) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
                );

                CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
                CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
                CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
            `);
            this.recordMigration('003_create_sales_tables');
        }
    }
}

const migrations = [
    createProductsTable,
    createSalesTable,
    createSaleItemsTable,
    createSettingsTable,
    createActiveSalesTable
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