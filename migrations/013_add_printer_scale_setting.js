const addPrinterScaleSetting = `
  INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('printer_scale_factor', '250');
`;

module.exports = {
  up: addPrinterScaleSetting,
  down: `
    DELETE FROM settings WHERE key IN (
      'printer_scale_factor'
    );
  `,
};
