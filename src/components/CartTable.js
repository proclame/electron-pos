import React, { useState } from 'react';

function CartTable({
  cart,
  setCart,
  setTotal,
  calculateTotal,
  appliedDiscounts,
  onRemoveItem,
  suspendTimeoutRef,
  setIsSuspendedBarcodeInput,
}) {
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [quantityInputValue, setQuantityInputValue] = useState('');
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInputValue, setPriceInputValue] = useState('');

  const startEditingQuantity = (index) => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);
    setQuantityInputValue(cart[index].quantity.toString());
    setEditingQuantity(index);
  };

  const finishEditingQuantity = (index, newQuantity) => {
    // Only update if valid quantity
    handleQuantityUpdate(index, newQuantity);

    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setQuantityInputValue('');
    setIsSuspendedBarcodeInput(false);
  };

  const cancelEditingQuantity = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setQuantityInputValue('');
    setEditingQuantity(null);
    setIsSuspendedBarcodeInput(false);
  };

  const handleQuantityUpdate = (index, newQuantity) => {
    // Allow negative quantities only in return mode
    if (!newQuantity) return;

    setCart((currentCart) => {
      const newCart = currentCart.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item));
      setTotal(calculateTotal(newCart));
      return newCart;
    });
    setEditingQuantity(null);
  };

  const handlePriceClick = (index) => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);

    setEditingPrice(index);
    setPriceInputValue(cart[index].product.unit_price.toString());
  };

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    if (editingPrice === null) return;

    const newPrice = parseFloat(priceInputValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setPriceInputValue(cart[editingPrice].product.unit_price.toString());
      setEditingPrice(null);
      setIsSuspendedBarcodeInput(false);
      return;
    }

    // Update the existing cart item's price
    setCart((currentCart) => {
      const updatedCart = [...currentCart];
      updatedCart[editingPrice].product.unit_price = newPrice;
      setTotal(calculateTotal(updatedCart));
      return updatedCart;
    });

    setEditingPrice(null);
    setIsSuspendedBarcodeInput(false);
  };

  return (
    <div style={styles.cartItems}>
      <table style={styles.cartTable}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Product</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th style={{ textAlign: 'center' }}>Qty</th>
            <th style={{ textAlign: 'center' }}>Discount</th>
            <th style={{ textAlign: 'right' }}>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => {
            const itemTotal = item.quantity * item.product.unit_price;
            const discountAmount = appliedDiscounts.percentage
              ? (itemTotal * appliedDiscounts.percentage.value) / 100
              : 0;
            const finalItemTotal = itemTotal - discountAmount;

            return (
              <tr key={index}>
                <td>{item.product.name}</td>
                <td style={{ textAlign: 'right' }}>
                  {editingPrice === index ? (
                    <form onSubmit={handlePriceSubmit}>
                      <input
                        type="number"
                        value={priceInputValue}
                        onChange={(e) => setPriceInputValue(e.target.value)}
                        onBlur={handlePriceSubmit}
                        onFocus={(e) => e.target.select()}
                        step="0.01"
                        min="0"
                        style={styles.quantityInput}
                        autoFocus
                      />
                    </form>
                  ) : (
                    <span onDoubleClick={() => handlePriceClick(index)} style={styles.editableField}>
                      €{item.product.unit_price.toFixed(2)}
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {editingQuantity === index ? (
                    <input
                      type="number"
                      value={quantityInputValue}
                      onChange={(e) => setQuantityInputValue(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => finishEditingQuantity(index, parseInt(quantityInputValue) || 0)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          finishEditingQuantity(index, parseInt(quantityInputValue) || 0);
                        } else if (e.key === 'Escape') {
                          cancelEditingQuantity();
                        }
                      }}
                      style={styles.quantityInput}
                      step="1"
                      autoFocus
                    />
                  ) : (
                    <span style={styles.cartItemQuantity} onDoubleClick={() => startEditingQuantity(index)}>
                      x{item.quantity}
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {appliedDiscounts.percentage && (
                    <span style={styles.discountCell}>-{appliedDiscounts.percentage.value}%</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span style={appliedDiscounts.percentage ? styles.discountedPrice : undefined}>
                    €{finalItemTotal.toFixed(2)}
                  </span>
                </td>
                <td>
                  <button onClick={() => onRemoveItem(index)} style={styles.removeButton}>
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  cartItems: {
    marginBottom: '20px',
  },
  cartTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  cartItemQuantity: {
    backgroundColor: '#f8f9fa',
    padding: '2px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  quantityInput: {
    width: '80px',
    padding: '4px',
    fontSize: '16px',
  },
  editableField: {
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  discountCell: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.9em',
  },
  discountedPrice: {
    color: '#28a745',
    fontWeight: 'bold',
  },
};

export default CartTable;
