const { BrowserWindow } = require('electron');
const { settingsRepo } = require('../models/database');
const receiptTemplate = require('./ReceiptTemplateService');

class PDFService {
  constructor() {
    this.settings = null;
  }

  async init() {
    this.settings = await settingsRepo.getAll();
  }

  async generateReceiptBuffer(sale) {
    if (!this.settings) {
      await this.init();
    }

    // Create an invisible window
    const win = new BrowserWindow({
      width: 300,
      height: 800,
      show: false,
    });

    // Generate HTML content
    const html = receiptTemplate.generateReceiptHTML(sale, this.settings);
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

    // Print to PDF
    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
    });

    // Clean up
    win.close();

    return pdfBuffer;
  }
}

module.exports = new PDFService();
