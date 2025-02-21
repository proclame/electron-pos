const express = require('express');
const router = express.Router();
const PrinterService = require('../services/PrinterService');

// Print receipt
router.post('/receipt', async (req, res) => {
    try {
        const sale = req.body;
        await PrinterService.printReceipt(sale);
        res.json({ message: 'Receipt printed successfully' });
    } catch (error) {
        console.error('Error printing receipt:', error);
        res.status(500).json({ message: 'Error printing receipt' });
    }
});

module.exports = router; 