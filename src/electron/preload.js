const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    printReceipt: (sale) => ipcRenderer.invoke('print-receipt', sale)
}); 