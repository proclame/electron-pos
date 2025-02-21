const express = require('express');
const router = express.Router();
const csv = require('csv-parse');
const { db } = require('../models/database');

const productsRouter = require('./products');
const salesRouter = require('./sales');
const activeSalesRouter = require('./active-sales');
const printRouter = require('./print');
const settingsRouter = require('./settings');

router.use('/products', productsRouter);
router.use('/sales', salesRouter);
router.use('/active-sales', activeSalesRouter);
router.use('/print', printRouter);
router.use('/settings', settingsRouter);


module.exports = router; 