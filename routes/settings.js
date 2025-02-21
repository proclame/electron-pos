const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const PrinterService = require('../services/PrinterService');

// Get available printers
router.get('/printers', async (req, res) => {
    try {
        const printers = await PrinterService.getAvailablePrinters();
        res.json(printers);
    } catch (error) {
        console.error('Error getting printers:', error);
        res.status(500).json({ message: 'Error getting printers' });
    }
});

router.get('/', (req, res) => {
    try {
        const settings = db.prepare('SELECT key, value FROM settings').all();
        // Convert array of key-value pairs to object
        const settingsObject = settings.reduce((obj, item) => {
            obj[item.key] = item.value;
            return obj;
        }, {});
        res.json(settingsObject);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

router.put('/', (req, res) => {
    try {
        const settings = req.body;
        
        // Create the update statement once
        const updateSetting = db.prepare(`
            UPDATE settings 
            SET value = ?
            WHERE key = ?
        `);

        // Use a transaction to update all settings
        const updateMany = db.transaction((settings) => {
            Object.entries(settings).forEach(([key, value]) => {
                updateSetting.run(value.toString(), key);
            });
        });

        // Execute the transaction
        updateMany(settings);

        // Clear the cached settings in PrinterService
        PrinterService.clearSettingsCache();
        
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});


module.exports = router; 