import React from 'react';

function DiscountsPanel({ activeDiscounts, appliedDiscounts, onApplyDiscount }) {
  return (
    <div style={styles.discountsSection}>
      <h4 style={styles.discountsTitle}>Available Discounts</h4>
      <div style={styles.discountsList}>
        {activeDiscounts.map((discount) => (
          <button
            key={discount.id}
            style={{
              ...styles.discountButton,
              ...(((discount.type === 'percentage' && appliedDiscounts.percentage?.id === discount.id) ||
                (discount.type === 'fixed' && appliedDiscounts.fixed?.id === discount.id)) &&
                styles.discountButtonActive),
            }}
            onClick={() => onApplyDiscount(discount)}
          >
            <span style={styles.discountName}>{discount.name}</span>
            <span style={styles.discountValue}>
              {discount.type === 'percentage' ? `${discount.value}%` : `€${discount.value}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  discountsSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  discountsTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#495057',
  },
  discountsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  discountButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '120px',
    transition: 'all 0.2s ease',
  },
  discountButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
    color: 'white',
  },
  discountName: {
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  discountValue: {},
};

export default DiscountsPanel;
