const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    printReceipt: (sale) => ipcRenderer.invoke('print-receipt', sale),
    getProductByBarcode: (barcode) => ipcRenderer.invoke('get-product-by-barcode', barcode),
    searchProducts: (query) => ipcRenderer.invoke('search-products', query),
    getProducts: (params) => ipcRenderer.invoke('get-products', params),
    createProduct: (product) => ipcRenderer.invoke('create-product', product),
    updateProduct: (id, product) => ipcRenderer.invoke('update-product', { id, product }),
    deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
    importProducts: (csvData) => ipcRenderer.invoke('import-products', csvData),
    getActiveSales: () => ipcRenderer.invoke('get-active-sales'),
    createActiveSale: (sale) => ipcRenderer.invoke('create-active-sale', sale),
    updateActiveSale: (saleId, sale) => ipcRenderer.invoke('update-active-sale', saleId, sale),
    deleteActiveSale: (saleId) => ipcRenderer.invoke('delete-active-sale', saleId),
    resumeSale: (saleId) => ipcRenderer.invoke('resume-sale', saleId),
    putOnHold: (saleId, notes = '') => ipcRenderer.invoke('put-on-hold', saleId, notes)
}); 