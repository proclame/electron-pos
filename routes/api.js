const express = require('express');
const router = express.Router();

const productsRouter = require('./products');
const salesRouter = require('./sales');
const activeSalesRouter = require('./active-sales');

router.use('/products', productsRouter);
router.use('/sales', salesRouter);
router.use('/active-sales', activeSalesRouter);

module.exports = router; 