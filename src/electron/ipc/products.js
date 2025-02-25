const { ipcMain } = require('electron');
const { db } = require('../../../models/database');

function registerProductsHandlers() {
    ipcMain.handle('get-products', async () => {
        const products = await db.prepare('SELECT * FROM products').all();
        return products;
    });
}

module.exports = registerProductsHandlers;