const registerSettingsHandlers = require('./settings');
const registerPrintHandlers = require('./print');
const registerSalesHandlers = require('./sales');
const registerProductsHandlers = require('./products');
const registerActiveSalesHandlers = require('./active-sales');

function registerIpcHandlers() {
  registerSettingsHandlers();
  registerPrintHandlers();
  registerSalesHandlers();
  registerProductsHandlers();
  registerActiveSalesHandlers();
}

module.exports = registerIpcHandlers;
