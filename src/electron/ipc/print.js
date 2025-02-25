const { ipcMain } = require('electron');
const PrinterService = require('../../../services/PrinterService');

function registerPrintHandlers() {
    // Print receipt
    ipcMain.handle('print:print-receipt', async (event, sale) => {
        try {
            await PrinterService.printReceipt(sale);
            return { success: true };
        } catch (error) {
            console.error('Error printing receipt:', error);
            throw error;
        }
    });
}

module.exports = registerPrintHandlers; 