import React, { useState, useRef, useEffect } from 'react';
import ProductSearch from './ProductSearch';
import HoldNoteModal from './HoldNoteModal';
import { useSales } from '../contexts/SalesContext';

function POSSystem() {
  const { currentSale, saveCurrentSale, putSaleOnHold, currentSaleId, isInitialLoad, setIsInitialLoad } = useSales();
  const [isReturn, setIsReturn] = useState(false);
  const [settings, setSettings] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [isSuspendedBarcodeInput, setIsSuspendedBarcodeInput] = useState(false);
  const suspendTimeoutRef = useRef(null);
  const [quantityInputValue, setQuantityInputValue] = useState('');
  const [notes, setNotes] = useState('');
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [email, setEmail] = useState('');
  const barcodeInputRef = useRef(null);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInputValue, setPriceInputValue] = useState('');
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState({
    percentage: null,
    fixed: null,
  });

  // Initialize cart from currentSale or empty
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (currentSale) {
      setCart(currentSale.cart || []);
      setTotal(currentSale.total || 0);
      setNotes(currentSale.notes || '');
      setNeedsInvoice(currentSale.needs_invoice || false);
      setAppliedDiscounts(
        currentSale.discounts || {
          percentage: null,
          fixed: null,
        },
      );
    }
  }, [currentSale]);

  // Update current sale whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      if (!isInitialLoad) {
        saveCurrentSale({
          cart,
          total,
          notes,
          needs_invoice: needsInvoice,
          discounts: appliedDiscounts,
        });
      } else {
        setIsInitialLoad(false);
      }
    }
  }, [cart, total, notes, needsInvoice, appliedDiscounts]);

  useEffect(() => {
    if (!isSuspendedBarcodeInput) {
      barcodeInputRef.current?.focus();
    }
  }, [isSuspendedBarcodeInput]);

  const handleBarcodeBlur = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }

    if (!isSuspendedBarcodeInput) {
      suspendTimeoutRef.current = setTimeout(() => {
        barcodeInputRef.current?.focus();
        suspendTimeoutRef.current = null;
      }, 100);
    }
  };

  const handleBarcodeChange = (e) => {
    const value = e.target.value;
    setBarcodeInput(value);
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      submitBarcode(barcodeInput);
    }
  };

  const addProductToCart = (product) => {
    const updatedCart = [...cart];
    const existingItem = updatedCart.find((item) => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += isReturn ? -1 : 1;
    } else {
      updatedCart.push({ product, quantity: isReturn ? -1 : 1 });
    }

    const newTotal = calculateTotal(updatedCart);

    setCart(updatedCart);
    setTotal(newTotal);
  };

  const submitBarcode = async (barcode) => {
    try {
      const product = await window.electronAPI.products.getProductByBarcode(barcode);
      addProductToCart(product);
    } catch (err) {
      console.error('Error finding product:', err);
      alert('Product not found!');
    }
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const calculateTotal = (cartItems) => {
    return cartItems.reduce((sum, item) => sum + item.product.unit_price * item.quantity, 0);
  };

  // Update removeFromCart
  const removeFromCart = (index) => {
    setCart((currentCart) => {
      const newCart = currentCart.filter((_, i) => i !== index);
      setTotal(calculateTotal(newCart));
      return newCart;
    });
  };

  // Update handleQuantityUpdate
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

  const handlePutOnHold = async (notes = '') => {
    if (cart.length > 0) {
      const success = await putSaleOnHold(
        {
          cart,
          total,
          notes: notes || '',
        },
        notes,
      );

      if (success) {
        clearCart(false);
      }
    }
  };

  const clearCart = (fullClear = true) => {
    setCart([]);
    setTotal(0);
    setNotes('');
    setNeedsInvoice(false);
    setIsReturn(false);
    if (fullClear) {
      saveCurrentSale(null);
    }
    barcodeInputRef.current?.focus();
  };

  const handleCheckout = async () => {
    try {
      const saleData = {
        items: cart,
        subtotal: total,
        total: total,
        payment_method: 'cash',
        needs_invoice: needsInvoice,
        notes: notes.trim(),
        email: email.trim(),
      };

      const response = await window.electronAPI.sales.createSale(saleData);

      if (response.ok) {
        const { id } = response;

        try {
          await window.electronAPI.print.printReceipt({ ...saleData, id });
          if (email) {
            await window.electronAPI.email.sendReceipt({ ...saleData, id }, email);
          }
        } catch (printError) {
          console.error('Error printing receipt:', printError);
          alert('Sale completed but failed to print receipt');
        }

        alert('Sale completed successfully!');
        clearCart();
        setNotes('');
        setNeedsInvoice(false);
        setEmail('');
      } else {
        alert('Error completing sale');
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      alert('Error completing sale');
    }
  };

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

  // Add handlers for notes focus
  const handleNotesFieldFocus = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);
  };

  const handleNotesFieldBlur = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(false);
  };

  useEffect(() => {
    return () => {
      if (suspendTimeoutRef.current) {
        clearTimeout(suspendTimeoutRef.current);
      }
    };
  }, []);

  // Add this function to handle price editing
  const handlePriceClick = (index) => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);

    if (editingQuantity !== null) return;

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

  // Update the state change for modal
  const openHoldModal = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);
    setIsHoldModalOpen(true);
  };

  const closeHoldModal = () => {
    setIsHoldModalOpen(false);
    setIsSuspendedBarcodeInput(false);
  };

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const settingsData = await window.electronAPI.settings.getSettings();
      setSettings(settingsData);
    };
    loadSettings();
  }, []);

  // Add a function to toggle return mode
  const toggleReturnMode = () => {
    setIsReturn(!isReturn);
  };

  // Load active discounts
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        const discounts = await window.electronAPI.discounts.getActive();
        setActiveDiscounts(discounts);
      } catch (error) {
        console.error('Error loading discounts:', error);
      }
    };
    loadDiscounts();
  }, []);

  const handleApplyDiscount = async (discount) => {
    const newDiscounts = { ...appliedDiscounts };

    if (discount.type === 'percentage') {
      newDiscounts.percentage = discount;
    } else {
      newDiscounts.fixed = discount;
    }

    setAppliedDiscounts(newDiscounts);
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        {settings?.allow_returns === 'true' && (
          <div style={styles.returnToggle}>
            <button
              onClick={toggleReturnMode}
              style={{
                ...styles.returnButton,
                ...(isReturn ? styles.returnButtonActive : {}),
              }}
            >
              {isReturn ? 'Switch to Sale Mode' : 'Switch to Return Mode'}
            </button>
          </div>
        )}
        <div style={styles.barcodeSection}>
          <form onSubmit={handleBarcodeSubmit}>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={handleBarcodeChange}
              onBlur={handleBarcodeBlur}
              placeholder="Scan barcode..."
              style={styles.barcodeInput}
              autoComplete="off"
            />
          </form>
        </div>
        <ProductSearch
          onProductSelect={(product) => {
            addProductToCart(product);
            setBarcodeInput('');
          }}
          onFocus={() => {
            if (suspendTimeoutRef.current) {
              clearTimeout(suspendTimeoutRef.current);
            }
            setIsSuspendedBarcodeInput(true);
          }}
          onBlur={() => {
            if (suspendTimeoutRef.current) {
              clearTimeout(suspendTimeoutRef.current);
            }
            setIsSuspendedBarcodeInput(false);
          }}
        />
      </div>
      <div style={styles.rightPanel}>
        {isReturn && <div style={styles.returnWarning}>Return Mode Active</div>}
        <div style={styles.cartContainer}>
          <div style={styles.cartSection}>
            <h2>Current Cart: {currentSaleId}</h2>
            <div style={styles.cartItems}>
              <table style={styles.cartTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product.name}</td>
                      <td>
                        {editingPrice === index ? (
                          <form onSubmit={handlePriceSubmit}>
                            <input
                              type="number"
                              value={priceInputValue}
                              onChange={(e) => setPriceInputValue(e.target.value)}
                              onBlur={handlePriceSubmit}
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
                      <td>
                        {editingQuantity === index ? (
                          <input
                            type="number"
                            value={quantityInputValue}
                            onChange={(e) => setQuantityInputValue(e.target.value)}
                            onBlur={() => finishEditingQuantity(index, parseInt(quantityInputValue) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                finishEditingQuantity(index, parseInt(quantityInputValue) || 0);
                              } else if (e.key === 'Escape') {
                                cancelEditingQuantity();
                              }
                            }}
                            autoFocus
                            style={styles.quantityInput}
                            step="1"
                          />
                        ) : (
                          <span style={styles.cartItemQuantity} onDoubleClick={() => startEditingQuantity(index)}>
                            x{item.quantity}
                          </span>
                        )}
                      </td>
                      <td>€{(item.quantity * item.product.unit_price).toFixed(2)}</td>
                      <td>
                        <button onClick={() => removeFromCart(index)} style={styles.removeButton}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.total}>
              {activeDiscounts.length > 0 && (
                <div style={styles.discountsSection}>
                  <h4 style={styles.discountsTitle}>Available Discounts</h4>
                  <div style={styles.discountsList}>
                    {activeDiscounts.map((discount) => (
                      <button
                        key={discount.id}
                        style={{
                          ...styles.discountButton,
                          // ...(((discount.type === 'percentage' && appliedDiscounts.percentage?.id === discount.id) ||
                          //   (discount.type === 'fixed' && appliedDiscounts.fixed?.id === discount.id)) &&
                          //   styles.discountButtonActive),
                        }}
                        onClick={() => handleApplyDiscount(discount)}
                      >
                        <span style={styles.discountName}>{discount.name}</span>
                        <span style={styles.discountValue}>
                          {discount.type === 'percentage' ? `${discount.value}%` : `€${discount.value}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <h3>Total: €{total.toFixed(2)}</h3>
              <div style={styles.checkoutFields}>
                <div style={styles.invoiceField}>
                  <label>
                    <input
                      type="checkbox"
                      checked={needsInvoice}
                      onChange={(e) => setNeedsInvoice(e.target.checked)}
                      style={styles.checkbox}
                    />
                    Invoice needed
                  </label>
                </div>
                {settings?.enable_email === 'true' && (
                  <div style={styles.emailField}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={handleNotesFieldFocus}
                      onBlur={handleNotesFieldBlur}
                      placeholder="Email for receipt (optional)"
                      style={styles.emailInput}
                    />
                  </div>
                )}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onFocus={handleNotesFieldFocus}
                  onBlur={handleNotesFieldBlur}
                  placeholder="Add notes..."
                  style={styles.notesField}
                />
              </div>
              <div style={styles.cartButtons}>
                <button onClick={openHoldModal} style={styles.holdButton} disabled={cart.length === 0}>
                  Put on Hold
                </button>
                <button onClick={clearCart} style={styles.clearButton} disabled={cart.length === 0}>
                  Clear Cart
                </button>
                <button onClick={handleCheckout} style={styles.checkoutButton} disabled={cart.length === 0}>
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HoldNoteModal
        isOpen={isHoldModalOpen}
        onClose={closeHoldModal}
        onConfirm={(notes) => {
          handlePutOnHold(notes);
          closeHoldModal();
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    gap: '20px',
  },
  leftPanel: {
    flex: '1',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderWidth: '1px',
  },
  barcodeSection: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
  },
  barcodeInput: {
    width: '100%',
    padding: '12px',
    fontSize: '18px',
    border: '2px solid #007bff',
    borderRadius: '4px',
    textAlign: 'center',
  },
  rightPanel: {
    flex: '1',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  cartContainer: {
    marginBottom: '20px',
  },
  cartSection: {
    marginBottom: '20px',
  },
  cartItems: {
    marginBottom: '20px',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee',
  },
  total: {
    textAlign: 'right',
    paddingTop: '20px',
    borderTop: '2px solid #eee',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  checkoutButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  barcode: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: '4px',
    borderRadius: '4px',
    margin: '5px 0',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '1.2em',
  },
  cartItemName: {
    flex: '2',
    textAlign: 'left',
  },
  cartItemQuantity: {
    flex: '1',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: '2px 8px',
    borderRadius: '4px',
    margin: '0 8px',
  },
  cartItemPrice: {
    flex: '1',
    textAlign: 'right',
    marginRight: '8px',
  },
  cartButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  clearButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  nav: {
    backgroundColor: '#f8f9fa',
    padding: '10px 20px',
    marginBottom: '20px',
  },
  navLink: {
    marginRight: '20px',
    textDecoration: 'none',
    color: '#007bff',
    fontWeight: 'bold',
  },
  quantityInput: {
    width: '80px',
    padding: '4px',
    fontSize: '16px',
  },
  checkoutFields: {
    marginTop: '10px',
    marginBottom: '15px',
    textAlign: 'left',
  },
  invoiceField: {
    marginBottom: '10px',
  },
  checkbox: {
    marginRight: '8px',
  },
  notesField: {
    width: '100%',
    minHeight: '60px',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    resize: 'vertical',
  },
  searchContainer: {
    flex: '1',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  holdButton: {
    padding: '12px 24px',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editableField: {
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  cartTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  returnToggle: {
    marginBottom: '20px',
  },
  returnButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    color: '#333',
    transition: 'all 0.3s ease',
  },
  returnButtonActive: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  returnWarning: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px',
    textAlign: 'center',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  emailField: {
    marginBottom: '10px',
  },
  emailInput: {
    width: '100%',
    padding: '8px',
    borderWidth: '1px',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderRadius: '4px',
  },
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
    '&:hover': {
      backgroundColor: '#e9ecef',
      borderColor: '#adb5bd',
    },
  },
  discountButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  discountName: {
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  discountValue: {
    color: '#28a745',
    fontSize: '14px',
  },
};

export default POSSystem;
