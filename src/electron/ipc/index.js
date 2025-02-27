const registerSettingsHandlers = require('./settings');
const registerPrintHandlers = require('./print');
const registerSalesHandlers = require('./sales');
const registerProductsHandlers = require('./products');
const registerActiveSalesHandlers = require('./active-sales');
const registerEmailHandlers = require('./email');
const registerDiscountHandlers = require('./discounts');

function registerIpcHandlers() {
  registerSettingsHandlers();
  registerPrintHandlers();
  registerSalesHandlers();
  registerProductsHandlers();
  registerActiveSalesHandlers();
  registerEmailHandlers();
  registerDiscountHandlers();
}

module.exports = registerIpcHandlers;
