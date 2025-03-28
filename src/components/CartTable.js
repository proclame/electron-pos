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
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [discountInputValue, setDiscountInputValue] = useState('');

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
    if (!newQuantity) {
      cancelEditingQuantity();
      return;
    }

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

  const handleDiscountClick = (index) => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);
    setEditingDiscount(index);
    setDiscountInputValue((cart[index].discount_percentage ?? appliedDiscounts?.percentage?.value)?.toString() ?? '0');
  };

  const handleDiscountSubmit = (e) => {
    e.preventDefault();
    if (editingDiscount === null) return;

    const newDiscount = parseFloat(discountInputValue);
    if (isNaN(newDiscount) || newDiscount < 0 || newDiscount > 100) {
      setDiscountInputValue(cart[editingDiscount].discount_percentage?.toString() ?? '0');
      setEditingDiscount(null);
      setIsSuspendedBarcodeInput(false);
      return;
    }

    setCart((currentCart) => {
      const updatedCart = [...currentCart];
      updatedCart[editingDiscount].discount_percentage = newDiscount;
      setTotal(calculateTotal(updatedCart));
      return updatedCart;
    });

    setEditingDiscount(null);
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
            const discountPercentage = item.discount_percentage ?? appliedDiscounts.percentage?.value ?? null;
            const discountAmount = (itemTotal * discountPercentage) / 100;
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
                  {editingDiscount === index ? (
                    <form onSubmit={handleDiscountSubmit}>
                      <input
                        type="number"
                        value={discountInputValue}
                        onChange={(e) => setDiscountInputValue(e.target.value)}
                        onBlur={handleDiscountSubmit}
                        onFocus={(e) => e.target.select()}
                        step="1"
                        min="0"
                        max="100"
                        style={styles.discountInput}
                        autoFocus
                      />
                    </form>
                  ) : (
                    <div onDoubleClick={() => handleDiscountClick(index)} style={styles.clickableCell}>
                      {discountPercentage !== null && <span style={styles.discountCell}>-{discountPercentage}%</span>}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span style={discountPercentage > 0 ? styles.discountedPrice : undefined}>
                    €{finalItemTotal.toFixed(2)}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
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
    padding: '0 4px',
    backgroundColor: 'white',
    color: '#dc3545',
    border: '1px solid #dc3545',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.2em',
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
  discountInput: {
    width: '60px',
    padding: '4px',
    fontSize: '14px',
    textAlign: 'center',
  },
  clickableCell: {
    cursor: 'pointer',
    width: '100%',
    height: '100%',
    minHeight: '1.5em',
  },
};

export default CartTable;
