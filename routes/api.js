const express = require('express');
const router = express.Router();

const salesRouter = require('./sales');

router.use('/sales', salesRouter);

module.exports = router; 