const addBarcodeToDiscounts = `
    ALTER TABLE discounts
    ADD COLUMN barcode TEXT
`;

const down = `
    ALTER TABLE discounts
    DROP COLUMN barcode;
`;

module.exports = {
  up: addBarcodeToDiscounts,
  down,
};
