const addDiscountableToProducts = `
  ALTER TABLE products ADD COLUMN discountable INTEGER NOT NULL DEFAULT 1;
`;

module.exports = {
  up: addDiscountableToProducts,
  down: `
    -- SQLite doesn't support dropping columns
  `,
};
