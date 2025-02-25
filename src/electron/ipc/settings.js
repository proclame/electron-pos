const { ipcMain } = require('electron');
const { settingsRepo } = require('../../../models/database');
const PrinterService = require('../../../services/PrinterService');

function registerSettingsHandlers() {
  ipcMain.handle('settings:get-settings', async () => {
    try {
      const settings = await settingsRepo.getAll();
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:save-settings', async (event, settingsData) => {
    try {
      settingsRepo.update(settingsData);
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
