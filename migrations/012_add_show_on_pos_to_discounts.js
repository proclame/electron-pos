const addShowOnPosToDiscounts = `
  -- Add show_on_pos column to discounts table
  ALTER TABLE discounts ADD COLUMN show_on_pos BOOLEAN DEFAULT 1;
`;

module.exports = {
  up: addShowOnPosToDiscounts,
  down: ``,
};
