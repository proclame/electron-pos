const { ipcMain } = require('electron');
const { db } = require('../../../models/database');

function registerSalesHandlers() {
    ipcMain.handle('get-sales', async () => {
        const sales = await db.prepare('SELECT * FROM sales').all();
        return sales;
    });
}

module.exports = registerSalesHandlers;
