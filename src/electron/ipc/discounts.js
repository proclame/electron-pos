const { ipcMain } = require('electron');
const { discountsRepo } = require('../../../models/discounts');

function registerDiscountHandlers() {
  ipcMain.handle('discounts:get-discounts', async () => {
    try {
      return discountsRepo.getAll();
    } catch (error) {
      console.error('Error getting discounts:', error);
      throw error;
    }
  });

  ipcMain.handle('discounts:get-active', async () => {
    try {
      return discountsRepo.getActive();
    } catch (error) {
      console.error('Error getting active discounts:', error);
      throw error;
    }
  });

  ipcMain.handle('discounts:create-discount', async (event, discount) => {
    try {
      const id = discountsRepo.create(discount);
      return { ok: true, id };
    } catch (error) {
      console.error('Error creating discount:', error);
      throw error;
    }
  });

  ipcMain.handle('discounts:update-discount', async (event, { id, discount }) => {
    try {
      discountsRepo.update(id, discount);
      return { ok: true };
    } catch (error) {
      console.error('Error updating discount:', error);
      throw error;
    }
  });

  ipcMain.handle('discounts:delete-discount', async (event, id) => {
    try {
      discountsRepo.delete(id);
      return { ok: true };
    } catch (error) {
      console.error('Error deleting discount:', error);
      throw error;
    }
  });

  ipcMain.handle('discounts:get-applicable', async (event, cartTotal) => {
    try {
      return discountsRepo.getApplicableDiscounts(cartTotal);
    } catch (error) {
      console.error('Error getting applicable discounts:', error);
      throw error;
    }
  });
}

module.exports = registerDiscountHandlers;
