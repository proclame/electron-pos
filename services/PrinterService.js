const os = require('os');
const { BrowserWindow } = require('electron');
const { db } = require('../models/database');

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

        if (this.platform === 'darwin') {
            return this.printReceiptMac(sale);
        } else {
            console.log('Printing is only supported on macOS for now');
            return;
        }
    }

    async printReceiptMac(sale) {
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
                    webSecurity: false
                }
            });

            const html = this.generateReceiptHTML(sale);
            await theWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

            const result = theWindow.webContents.print({
                silent: true,
                printBackground: true,
                deviceName: this.printerName,
                color: false,
                margins: { marginType: 'custom', top: 0, bottom: 10, left: 0, right: 10 },
                mediaSize: {
                    name: 'CUSTOM',
                    width_microns: 80000,
                    height_microns: 200000,
                    custom_display_name: 'Receipt'
                },
                dpi: { horizontal: 203, vertical: 203 },
            }, function(success, failureReason) {
                if (!success) {
                    console.error('Print failed:', failureReason);
                }
                theWindow.close();
                theWindow = null;
            });

            return result;
        } catch (error) {
            console.error('Error printing receipt (Mac):', error);
            throw error;
        }
    }

    generateReceiptHTML(sale) {
        const settings = this.settings || {
            company_name: 'Your Company Name',
            company_address: '',
            vat_number: '',
            currency_symbol: '€',
            thank_you_text: 'Thank you!',
            logo_base64: ''
        };

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" 
                      content="default-src 'self' 'unsafe-inline' data: http://localhost:5001">
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        width: 80mm;
                        margin: 0;
                        padding: 5mm;
                        font-size: 12px;
                    }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 5mm 0;
                    }
                    th, td {
                        text-align: left;
                        padding: 1mm;
                        font-size: 12px;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 3mm 0;
                    }
                    .logo {
                        max-width: 200px;
                        max-height: 100px;
                        margin: 0 auto;
                        display: block;
                        margin-bottom: 5mm;
                    }
                </style>
            </head>
            <body>
                ${settings.logo_base64 ? `
                    <img src="${settings.logo_base64}" class="logo" alt="Logo"/>
                ` : ''}
                <div class="center bold">${settings.company_name}</div>
                ${settings.company_address ? `
                    <div class="center">${settings.company_address.split('\n').join('<br/>')}</div>
                ` : ''}
                ${settings.vat_number ? `
                    <div class="center">VAT: ${settings.vat_number}</div>
                ` : ''}
                <div class="divider"></div>
                <div>Receipt #: ${sale.id}</div>
                <div>Date: ${new Date().toLocaleString("nl-NL")}</div>
                <div class="divider"></div>
                <table>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                    ${sale.items.map(item => `
                        <tr>
                            <td>${item.product.name}</td>
                            <td>${item.quantity}</td>
                            <td>${settings.currency_symbol}${item.product.unit_price.toFixed(2)}</td>
                            <td>${settings.currency_symbol}${(item.quantity * item.product.unit_price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
                <div class="divider"></div>
                <div class="right">Subtotal: ${settings.currency_symbol}${sale.subtotal.toFixed(2)}</div>
                ${sale.discount_amount > 0 ? `
                    <div class="right">Discount: ${settings.currency_symbol}${sale.discount_amount.toFixed(2)}</div>
                ` : ''}
                <div class="right bold">TOTAL: ${settings.currency_symbol}${sale.total.toFixed(2)}</div>
                ${settings.vat_percentage ? `
                    <div class="right">Incl. VAT (${settings.vat_percentage}%): 
                        ${settings.currency_symbol}${(sale.total * (parseFloat(settings.vat_percentage) / (100 + parseFloat(settings.vat_percentage)))).toFixed(2)}
                    </div>
                ` : ''}
                <div class="divider"></div>
                ${sale.notes ? `
                    <div class="center">Notes: ${sale.notes}</div>
                    <div class="divider"></div>
                ` : ''}              
                <div class="center">${settings.thank_you_text.split('\n').join('<br/>')}<br>&nbsp;.</div>
            </body>
            </html>
        `;
    }

    getAvailablePrinters() {
        const win = BrowserWindow.getAllWindows()[0];
        return win.webContents.getPrinters();
    }
}

module.exports = new PrinterService(); 