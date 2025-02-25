const Database = require('better-sqlite3');
const runMigrations = require('../migrations/migrationManager');
const path = require('path');
const { app } = require('electron');
const SettingsRepository = require('./settings');
const ProductsRepository = require('./products');
const ActiveSalesRepository = require('./active-sales');

const dbPath = path.join(app.getPath('downloads'), 'database.sqlite');

const db = new Database(dbPath, {
    verbose: console.log // Remove in production
});

const settingsRepo = new SettingsRepository(db);
const productsRepo = new ProductsRepository(db);
const activeSalesRepo = new ActiveSalesRepository(db);

async function initDatabase() {
    try {
        await runMigrations(db);
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

module.exports = {
    db,
    initDatabase,
    settingsRepo,
    productsRepo,
    activeSalesRepo
}; 