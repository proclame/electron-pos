const os = require('os');
const { BrowserWindow } = require('electron');
const receiptTemplateService = require('./ReceiptTemplateService');
const { settingsRepo } = require('../models/database');

class PrinterService {
  constructor() {
    this.platform = os.platform();
    this.window = null;
    this.printerName = null;
    this.settings = null;
  }

  clearSettingsCache() {
    this.settings = null;
    this.printerName = null;
  }

  async getSettings() {
    this.settings = settingsRepo.getAll();
  }

  async printReceipt(sale, printerName = null) {
    // First check if printing is enabled
    await this.getSettings();
    if (printerName === null && this.settings.use_printer !== 'true') {
      return;
    }

    try {
      // Use provided printer name or fall back to settings
      const selectedPrinter = printerName || this.settings.selected_printer;
      if (!selectedPrinter) {
        throw new Error('No printer selected in settings');
      }

      this.printerName = selectedPrinter;

      let theWindow = new BrowserWindow({
        width: 300,
        height: 800,
        show: false,
      });

      const html = receiptTemplateService.generateReceiptHTML(sale, this.settings);
      await theWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      console.log('scaleFactor', this.settings.printer_scale_factor);
      const result = theWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          // scaleFactor: 100,
          scaleFactor: Number(this.settings.printer_scale_factor),
          deviceName: this.printerName,
          color: false,
          margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 },
          // pageSize: { width: 80_000, height: 200_000 },
          pageSize: 'A4',
        },
        function (success, failureReason) {
          if (!success) {
            console.error('Print failed:', failureReason);
          }
          theWindow.close();
          theWindow = null;
        },
      );

      return result;
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }

  getAvailablePrinters() {
    const win = BrowserWindow.getAllWindows()[0];
    return win.webContents.getPrintersAsync();
  }
}

module.exports = new PrinterService();
