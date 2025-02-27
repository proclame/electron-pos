import React from 'react';

function TotalsPanel({ total, appliedDiscounts }) {
  return (
    <div style={styles.totalsBreakdown}>
      {appliedDiscounts.fixed && (
        <div>
          <div style={styles.totalRow}>
            <span>Subtotal:</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Discount ({appliedDiscounts.fixed.name}):</span>
            <span style={styles.discountAmount}>-€{appliedDiscounts.fixed.value.toFixed(2)}</span>
          </div>
        </div>
      )}
      <div style={styles.totalRowFinal}>
        <span>Total:</span>
        <span>€{(total - Math.min(total, appliedDiscounts.fixed?.value ?? 0)).toFixed(2)}</span>
      </div>
    </div>
  );
}

const styles = {
  totalsBreakdown: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '16px',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '2px solid #dee2e6',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  discountAmount: {
    color: '#dc3545',
  },
};

export default TotalsPanel;
