import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductManagement from './components/ProductManagement';

function App() {
  return (
    <Router>
      <div style={styles.nav}>
        <Link to="/" style={styles.navLink}>POS</Link>
        <Link to="/products" style={styles.navLink}>Products</Link>
      </div>
      
      <Routes>
        <Route path="/" element={<POSSystem />} />
        <Route path="/products" element={<ProductManagement />} />
      </Routes>
    </Router>
  );
}

function POSSystem() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [total, setTotal] = useState(0);
  const barcodeInputRef = useRef(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [isSuspendedBarcodeInput, setIsSuspendedBarcodeInput] = useState(false);
  const suspendTimeoutRef = useRef(null);
  const [quantityInputValue, setQuantityInputValue] = useState('');

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
    if (barcodeInput.trim()) {  // Only submit if there's a barcode
        submitBarcode(barcodeInput);
    }
  };

  const submitBarcode = async (barcode) => {
    try {
        const response = await fetch(`http://localhost:5001/api/products/barcode/${barcode}`);
        if (response.ok) {
            const product = await response.json();
            addToCart(product);
        } else {
            alert('Product not found!');
        }
    } catch (err) {
        console.error('Error finding product:', err);
        alert('Error searching for product');
    }
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Add helper function to calculate total
  const calculateTotal = (cartItems) => {
    return cartItems.reduce((sum, item) => 
      sum + (item.product.unit_price * item.quantity), 0
    );
  };

  // Update addToCart
  const addToCart = (product) => {
    setCart(currentCart => {
      const newCart = [...currentCart];
      const existingItem = newCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        newCart.push({ product, quantity: 1 });
      }

      setTotal(calculateTotal(newCart));
      return newCart;
    });
  };

  // Update removeFromCart
  const removeFromCart = (index) => {
    setCart(currentCart => {
      const newCart = currentCart.filter((_, i) => i !== index);
      setTotal(calculateTotal(newCart));
      return newCart;
    });
  };

  // Update handleQuantityUpdate
  const handleQuantityUpdate = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(currentCart => {
      const newCart = currentCart.map((item, i) => 
        i === index
          ? { ...item, quantity: newQuantity }
          : item
      );
      setTotal(calculateTotal(newCart));
      return newCart;
    });
    setEditingQuantity(null);
  };

  // Update clearCart
  const clearCart = () => {
    setCart([]);
    setTotal(0);
    barcodeInputRef.current?.focus();
  };

  const handleCheckout = async () => {
    try {
      const saleData = {
        items: cart,
        subtotal: total,
        total: total, // For now, no sale-level discount
        payment_method: 'cash',
        needs_invoice: false
      };

      const response = await fetch('http://localhost:5001/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        alert('Sale completed successfully!');
        clearCart();
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
    if (newQuantity >= 1) {  // Only update if valid quantity
      handleQuantityUpdate(index, newQuantity);
    }
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

  useEffect(() => {
    return () => {
      if (suspendTimeoutRef.current) {
        clearTimeout(suspendTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.scannerSection}>
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

      <div style={styles.mainContent}>
        <div style={styles.cartSection}>
          <h2>Current Cart</h2>
          <div style={styles.cartItems}>
            {cart.map((item, index) => (
              <div key={index} style={styles.cartItem}>
                <span style={styles.cartItemName}>{item.product.name}</span>
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
                    min="1"
                  />
                ) : (
                  <span 
                    style={styles.cartItemQuantity}
                    onDoubleClick={() => startEditingQuantity(index)}
                  >
                    x{item.quantity}
                  </span>
                )}
                <span style={styles.cartItemPrice}>
                  €{(item.product.unit_price * item.quantity).toFixed(2)}
                </span>
                <button 
                  onClick={() => removeFromCart(index)}
                  style={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div style={styles.total}>
            <h3>Total: €{total.toFixed(2)}</h3>
            <div style={styles.cartButtons}>
              <button 
                onClick={clearCart}
                style={styles.clearButton}
                disabled={cart.length === 0}
              >
                Clear Cart
              </button>
              <button 
                onClick={handleCheckout}
                style={styles.checkoutButton}
                disabled={cart.length === 0}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  scannerSection: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px'
  },
  barcodeInput: {
    width: '100%',
    padding: '12px',
    fontSize: '18px',
    border: '2px solid #007bff',
    borderRadius: '4px',
    textAlign: 'center'
  },
  mainContent: {
    display: 'flex',
    gap: '20px'
  },
  cartSection: {
    flex: '1',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd'
  },
  cartItems: {
    marginBottom: '20px'
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee'
  },
  total: {
    textAlign: 'right',
    paddingTop: '20px',
    borderTop: '2px solid #eee'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  checkoutButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  barcode: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: '4px',
    borderRadius: '4px',
    margin: '5px 0'
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '1.2em'
  },
  cartItemName: {
    flex: '2',
    textAlign: 'left'
  },
  cartItemQuantity: {
    flex: '1',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: '2px 8px',
    borderRadius: '4px',
    margin: '0 8px'
  },
  cartItemPrice: {
    flex: '1',
    textAlign: 'right',
    marginRight: '8px'
  },
  cartButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  clearButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  nav: {
    backgroundColor: '#f8f9fa',
    padding: '10px 20px',
    marginBottom: '20px'
  },
  navLink: {
    marginRight: '20px',
    textDecoration: 'none',
    color: '#007bff',
    fontWeight: 'bold'
  },
  quantityInput: {
    width: '60px',
    padding: '4px',
    textAlign: 'center',
    border: '1px solid #007bff',
    borderRadius: '4px',
    margin: '0 8px'
  }
};

export default App; 