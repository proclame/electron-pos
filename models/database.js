const Database = require('better-sqlite3');
const runMigrations = require('../migrations/migrationManager');
const path = require('path');
const { app } = require('electron');
const SettingsRepository = require('./settings');
const ProductsRepository = require('./products');
const ActiveSalesRepository = require('./active-sales');
const SalesRepository = require('./sales');
const DatabaseError = require('./DatabaseError');

const dbPath = path.join(app.getPath('downloads'), 'database.sqlite');

const db = new Database(dbPath, {
  // verbose: (message) => {
  //   if (process.env.NODE_ENV !== 'production') {
  //     console.log(`[SQL] ${message.trim()}`);
  //   }
  // },
});

// Add transaction helper
db.transact = function (operation, fn) {
  try {
    return this.transaction(fn)();
  } catch (error) {
    throw new DatabaseError(error.message, error.code, operation);
  }
};

const settingsRepo = new SettingsRepository(db);
const productsRepo = new ProductsRepository(db);
const activeSalesRepo = new ActiveSalesRepository(db);
const salesRepo = new SalesRepository(db);

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
  activeSalesRepo,
  salesRepo,
};
