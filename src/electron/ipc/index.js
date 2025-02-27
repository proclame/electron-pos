const registerSettingsHandlers = require('./settings');
const registerPrintHandlers = require('./print');
const registerSalesHandlers = require('./sales');
const registerProductsHandlers = require('./products');
const registerActiveSalesHandlers = require('./active-sales');
const registerEmailHandlers = require('./email');

function registerIpcHandlers() {
  registerSettingsHandlers();
  registerPrintHandlers();
  registerSalesHandlers();
  registerProductsHandlers();
  registerActiveSalesHandlers();
  registerEmailHandlers();
}

module.exports = registerIpcHandlers;
