const Database = require('better-sqlite3');
const path = require('path');

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
                )
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
    }
}

module.exports = MigrationManager; 