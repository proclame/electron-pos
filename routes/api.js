const express = require('express');
const router = express.Router();

const productsRouter = require('./products');
const salesRouter = require('./sales');

router.use('/products', productsRouter);
router.use('/sales', salesRouter);

module.exports = router; 