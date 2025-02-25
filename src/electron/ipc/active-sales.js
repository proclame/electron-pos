const { ipcMain } = require('electron');
const { activeSalesRepo } = require('../../../models/database');

function registerActiveSalesHandlers() {
    ipcMain.handle('active-sales:get-active-sales', async () => {
        try {
            const sales = await activeSalesRepo.getAll();

            return sales.map(sale => ({
                ...sale,
                cart_data: JSON.parse(sale.cart_data)
            }));

        } catch (error) {
            console.error('Error getting active sales:', error);
            throw error;
        }
    });

    ipcMain.handle('active-sales:create-active-sale', async (event, sale) => {
        try {
            return activeSalesRepo.create(sale);
        } catch (error) {
            console.error('Error creating active sale:', error);
            throw error;
        }
    });

    ipcMain.handle('active-sales:get-active-sale', async (event, id) => {
        try {
            const sale = await activeSalesRepo.getActiveSale(id);
            return {
                ...sale,
                cart_data: JSON.parse(sale.cart_data)
            };
        } catch (error) {
            console.error('Error fetching active sale:', error);
            throw error;
        }
    });

    ipcMain.handle('active-sales:update-active-sale', async (event, saleId, sale) => {
        try {
            return activeSalesRepo.update(saleId, sale);
        } catch (error) {
            console.error('Error updating active sale:', error);
            throw error;
        }
    });

    ipcMain.handle('active-sales:delete-active-sale', async (event, saleId) => {
        try {
            return activeSalesRepo.delete(saleId);
        } catch (error) {
            console.error('Error deleting active sale:', error);
            throw error;
        }
    });

    ipcMain.handle('active-sales:put-on-hold', async (event, saleId, notes = '') => {
        try {
            return activeSalesRepo.putOnHold(saleId, notes);
        } catch (error) {
            console.error('Error putting sale on hold:', error);
            throw error;
        }
    });

    ipcMain.handle('active-sales:resume-sale', async (event, saleId) => {
        try {
            return activeSalesRepo.resume(saleId);
        } catch (error) {
            console.error('Error resuming sale:', error);
            throw error;
        }
    });
}

module.exports = registerActiveSalesHandlers;