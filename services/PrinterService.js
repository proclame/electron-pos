const os = require('os');
const { BrowserWindow } = require('electron');
const { PosPrinter } = require('electron-pos-printer');

class PrinterService {
    constructor() {
        this.platform = os.platform();
        this.window = null;
        this.printerName = null;
    }

    async printReceipt(sale) {
        console.log('Platform:', this.platform);
        if (this.platform === 'win32') {
            console.log('I want to print on windows');
            return this.printReceiptWindows(sale);
        } else {
            console.log('I want to print on mac');
            return this.printReceiptMac(sale);
        }
    }

    async printReceiptWindows(sale) {
        try {
            const data = [
                {
                    type: 'text',
                    value: 'YOUR STORE NAME',
                    style: { fontWeight: '700', textAlign: 'center', fontSize: '14px' }
                },
                {
                    type: 'text',
                    value: '123 Your Street',
                    style: { textAlign: 'center' }
                },
                {
                    type: 'text',
                    value: `Receipt #: ${sale.id}`,
                    style: { textAlign: 'left', marginTop: '10px' }
                },
                {
                    type: 'table',
                    style: { width: '100%' },
                    tableHeader: ['Item', 'Qty', 'Price', 'Total'],
                    tableBody: sale.items.map(item => [
                        item.product.name,
                        item.quantity.toString(),
                        `€${item.product.unit_price.toFixed(2)}`,
                        `€${(item.quantity * item.product.unit_price).toFixed(2)}`
                    ])
                },
                {
                    type: 'text',
                    value: `Total: €${sale.total.toFixed(2)}`,
                    style: { fontWeight: '700', textAlign: 'right', marginTop: '10px' }
                },
                {
                    type: 'text',
                    value: sale.notes || '',
                    style: { textAlign: 'center', marginTop: '10px' }
                }
            ];

            const options = {
                preview: false,
                width: '280px',
                margin: '0 0 0 0',
                copies: 1,
                printerName: 'POS-58', // Update this to match your printer name
                timeOutPerLine: 400
            };

            await PosPrinter.print(data, options);
        } catch (error) {
            console.error('Error printing receipt (Windows):', error);
            throw error;
        }
    }

    async printReceiptMac(sale) {
        try {
            if (!this.printerName) {
                this.findStarPrinter();
            }

            if (!this.printerName) {
                throw new Error('Star printer not found');
            }

            let theWindow = new BrowserWindow({
                width: 300,
                height: 800,
                show: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    nativeWindowOpen: true
                }
            });

            const html = this.generateReceiptHTML(sale);
            await theWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

            const result = theWindow.webContents.print({
                silent: true,
                printBackground: true,
                deviceName: this.printerName,
                color: false,
                margins: { marginType: 'printableArea' },
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
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        width: 80mm; /* Standard thermal paper width */
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
                </style>
            </head>
            <body>
                <div class="center bold">YOUR STORE NAME</div>
                <div class="center">123 Your Street</div>
                <div class="divider"></div>
                <div>Receipt #: ${sale.id}</div>
                <div>Date: ${new Date().toLocaleString()}</div>
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
                            <td>€${item.product.unit_price.toFixed(2)}</td>
                            <td>€${(item.quantity * item.product.unit_price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
                <div class="divider"></div>
                <div class="right">Total: €${sale.total.toFixed(2)}</div>
                ${sale.notes ? `
                    <div class="center">Notes: ${sale.notes}</div>
                    <div class="divider"></div>
                ` : ''}
                <div class="center">Thank you!</div>
            </body>
            </html>
        `;
    }

    getAvailablePrinters() {
        const win = BrowserWindow.getAllWindows()[0];
        return win.webContents.getPrinters();
    }

    findStarPrinter() {
        const win = BrowserWindow.getAllWindows()[0];
        const printers = win.webContents.getPrinters();
        // console.log('All printers:', printers);
        
        const starPrinter = printers.find(p => p.name.includes('Star'));
        if (starPrinter) {
            console.log('Found Star printer:', starPrinter.name);
            this.printerName = starPrinter.name;
            return true;
        }
        console.log('Star printer not found');
        return false;
    }
}

module.exports = new PrinterService(); 