const express = require('express');
const router = express.Router();

const productsRouter = require('./products');
const salesRouter = require('./sales');
const activeSalesRouter = require('./active-sales');
const printRouter = require('./print');

router.use('/products', productsRouter);
router.use('/sales', salesRouter);
router.use('/active-sales', activeSalesRouter);
router.use('/print', printRouter);

module.exports = router; 