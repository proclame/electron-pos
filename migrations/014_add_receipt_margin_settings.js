const addReceiptMarginSettings = `
  INSERT OR IGNORE INTO settings (key, value) VALUES
    ('receipt_margin_top', '0'),
    ('receipt_margin_right', '0'),
    ('receipt_margin_bottom', '0'),
    ('receipt_margin_left', '0');
`;

module.exports = {
  up: addReceiptMarginSettings,
  down: `
    DELETE FROM settings WHERE key IN (
      'receipt_margin_top',
      'receipt_margin_right',
      'receipt_margin_bottom',
      'receipt_margin_left'
    );
  `,
};
