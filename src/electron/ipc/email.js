const { ipcMain } = require('electron');
const EmailService = require('../../../services/EmailService');

function registerEmailHandlers() {
  ipcMain.handle('email:send-receipt', async (event, sale, email) => {
    try {
      await EmailService.sendReceipt(sale, email);
      return { ok: true };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  });
}

module.exports = registerEmailHandlers;
