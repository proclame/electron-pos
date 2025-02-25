const { ipcMain } = require('electron');
const { salesRepo } = require('../../../models/database');

function registerSalesHandlers() {
    // Create new sale
    ipcMain.handle('sales:create-sale', async (event, saleData) => {
        try {
            return salesRepo.create(saleData);
        } catch (error) {
            console.error('Error creating sale:', error);
            throw error;
        }
    });

    // Get sale by ID
    ipcMain.handle('sales:get-sale', async (event, id) => {
        try {
            return salesRepo.getSale(id);
        } catch (error) {
            console.error('Error fetching sale:', error);
            throw error;
        }
    });

    // Update sale
    ipcMain.handle('sales:update-sale', async (event, { id, updates }) => {
        try {
            return salesRepo.update(id, updates);
        } catch (error) {
            console.error('Error updating sale:', error);
            throw error;
        }
    });

    // Get all sales (paginated)
    ipcMain.handle('sales:get-sales', async (event, params) => {
        try {
            return salesRepo.getSales(params);
        } catch (error) {
            console.error('Error fetching sales:', error);
            throw error;
        }
    });

    // Get sales by product
    ipcMain.handle('sales:get-sales-by-product', async (event, params) => {
        try {
            return salesRepo.getSalesByProduct(params);
        } catch (error) {
            console.error('Error fetching product sales:', error);
            throw error;
        }
    });
}

module.exports = registerSalesHandlers;
