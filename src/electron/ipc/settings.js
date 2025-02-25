const { ipcMain } = require('electron');
const { db } = require('../../../models/database');
const PrinterService = require('../../../services/PrinterService');

function registerSettingsHandlers() {
    ipcMain.handle('settings:get-settings', async () => {
        try {
            const settings = db.prepare('SELECT key, value FROM settings').all()
                .reduce((acc, row) => ({
                    ...acc,
                    [row.key]: row.value
                }), {});
            return settings;
        } catch (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
    });

    ipcMain.handle('settings:save-settings', async (event, settings) => {
        try {
            const stmt = db.prepare(`
                UPDATE settings 
                SET value = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE key = ?
            `);

            Object.entries(settings).forEach(([key, value]) => {
                stmt.run(value.toString(), key);
            });

            return { success: true };
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    });

    ipcMain.handle('settings:get-printers', async () => {
        try {
            const printers = await PrinterService.getAvailablePrinters();
            return printers;
        } catch (error) {
            console.error('Error getting printers:', error);
            throw error;
        }
    });
}

module.exports = registerSettingsHandlers; 