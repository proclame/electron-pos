const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  settings: {
    getSettings: () => ipcRenderer.invoke('settings:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('settings:save-settings', settings),
    getPrinters: () => ipcRenderer.invoke('settings:get-printers'),
  },
  print: {
    printReceipt: (sale, printerName = null) => ipcRenderer.invoke('print:print-receipt', sale, printerName),
    generatePDF: (sale) => ipcRenderer.invoke('print:generate-pdf', sale),
  },
  products: {
    getProductByBarcode: (barcode) => ipcRenderer.invoke('products:get-product-by-barcode', barcode),
    searchProducts: (query) => ipcRenderer.invoke('products:search-products', query),
    getProducts: (params) => ipcRenderer.invoke('products:get-products', params),
    createProduct: (product) => ipcRenderer.invoke('products:create-product', product),
    updateProduct: (id, product) => ipcRenderer.invoke('products:update-product', { id, product }),
    deleteProduct: (id) => ipcRenderer.invoke('products:delete-product', id),
    importProducts: (csvData) => ipcRenderer.invoke('products:import-products', csvData),
    clearAllProducts: () => ipcRenderer.invoke('products:clear-all'),
  },
  activeSales: {
    getActiveSales: () => ipcRenderer.invoke('active-sales:get-active-sales'),
    createActiveSale: (sale) => ipcRenderer.invoke('active-sales:create-active-sale', sale),
    updateActiveSale: (saleId, sale) => ipcRenderer.invoke('active-sales:update-active-sale', saleId, sale),
    deleteActiveSale: (saleId) => ipcRenderer.invoke('active-sales:delete-active-sale', saleId),
    resumeSale: (saleId) => ipcRenderer.invoke('active-sales:resume-sale', saleId),
    putOnHold: (saleId, notes = '') => ipcRenderer.invoke('active-sales:put-on-hold', saleId, notes),
  },
  sales: {
    createSale: (saleData) => ipcRenderer.invoke('sales:create-sale', saleData),
    getSale: (id) => ipcRenderer.invoke('sales:get-sale', id),
    updateSale: (id, updates) => ipcRenderer.invoke('sales:update-sale', { id, updates }),
    getSales: (params) => ipcRenderer.invoke('sales:get-sales', params),
    getSalesByProduct: (params) => ipcRenderer.invoke('sales:get-sales-by-product', params),
  },
  email: {
    sendReceipt: (sale, email) => ipcRenderer.invoke('email:send-receipt', sale, email),
  },
  discounts: {
    getDiscounts: () => ipcRenderer.invoke('discounts:get-discounts'),
    getActive: () => ipcRenderer.invoke('discounts:get-active'),
    createDiscount: (discount) => ipcRenderer.invoke('discounts:create-discount', discount),
    updateDiscount: (id, discount) => ipcRenderer.invoke('discounts:update-discount', { id, discount }),
    deleteDiscount: (id) => ipcRenderer.invoke('discounts:delete-discount', id),
    getApplicable: (cartTotal) => ipcRenderer.invoke('discounts:get-applicable', cartTotal),
    getByBarcode: (barcode) => ipcRenderer.invoke('discounts:get-by-barcode', barcode),
  },
});
