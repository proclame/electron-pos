const os = require('os');
const { BrowserWindow } = require('electron');
const { db } = require('../models/database');
const receiptTemplateService = require('./ReceiptTemplateService');

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
    if (!this.settings) {
      const settings = db.prepare('SELECT key, value FROM settings').all();
      this.settings = settings.reduce((obj, item) => {
        obj[item.key] = item.value;
        return obj;
      }, {});
    }
    return this.settings;
  }

  async printReceipt(sale) {
    // First check if printing is enabled
    await this.getSettings();
    if (this.settings.use_printer !== 'true') {
      return;
    }

    try {
      if (!this.settings.selected_printer) {
        throw new Error('No printer selected in settings');
      }

      this.printerName = this.settings.selected_printer;

      let theWindow = new BrowserWindow({
        width: 300,
        height: 800,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          nativeWindowOpen: true,
          webSecurity: false,
        },
      });

      const html = receiptTemplateService.generateReceiptHTML(sale, this.settings);
      await theWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      const result = theWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          // scaleFactor: 100,
          scaleFactor: 250,
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
      console.error('Error printing receipt (Mac):', error);
      throw error;
    }
  }

  getAvailablePrinters() {
    const win = BrowserWindow.getAllWindows()[0];
    return win.webContents.getPrintersAsync();
  }
}

module.exports = new PrinterService();
