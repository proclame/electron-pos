const addReceiptNumber = `
  ALTER TABLE sales ADD COLUMN receipt_number TEXT;

  INSERT OR IGNORE INTO settings (key, value) VALUES
    ('receipt_prefix', ''),
    ('receipt_number_length', '5');

  UPDATE sales
  SET receipt_number = substr('00000' || id, -max(5, length(id)))
  WHERE receipt_number IS NULL;
`;

module.exports = {
  up: addReceiptNumber,
  down: `
    DELETE FROM settings WHERE key IN ('receipt_prefix', 'receipt_number_length');
    ALTER TABLE sales DROP COLUMN receipt_number;
  `,
};
