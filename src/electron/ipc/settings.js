const { ipcMain } = require('electron');
const { db } = require('../../../models/database');

function registerSettingsHandlers() {
    ipcMain.handle('get-settings', async () => {
        try {
            const settings = db.prepare('SELECT * FROM settings').all()
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
}

module.exports = registerSettingsHandlers; 