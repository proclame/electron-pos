function formatReceiptNumber(id, prefix = '', length = 0) {
  const len = Number(length);
  const padded = Number.isFinite(len) && len > 0 ? String(id).padStart(len, '0') : String(id);
  return `${prefix || ''}${padded}`;
}

module.exports = { formatReceiptNumber };
