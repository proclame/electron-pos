const { ipcMain } = require('electron');
const PrinterService = require('../../../services/PrinterService');
const PDFService = require('../../../services/PDFService');

function registerPrintHandlers() {
  // Print receipt
  ipcMain.handle('print:print-receipt', async (event, sale) => {
    try {
      await PrinterService.printReceipt(sale);
      return { ok: true };
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  });

  ipcMain.handle('print:generate-pdf', async (event, sale) => {
    try {
      const pdfBuffer = await PDFService.generateReceiptBuffer(sale);
      return { ok: true, pdf: pdfBuffer };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  });
}

module.exports = registerPrintHandlers;
