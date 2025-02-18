import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const barcodeInputRef = useRef(null);

  // Fetch products when component mounts
  useEffect(() => {
    fetch('http://localhost:5001/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  // Keep focus on barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeBlur = () => {
    // Small timeout to allow button clicks to work
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
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

  // New function to handle barcode submission with direct value
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

  const addToCart = (product) => {
    setCart(currentCart => {
      // Check if product is already in cart
      const existingItem = currentCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // If product exists, increment quantity
        return currentCart.map(item => 
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // If product is new, add it with quantity 1
        return [...currentCart, { product, quantity: 1 }];
      }
    });
    setTotal(prev => prev + product.unit_price);
  };

  const removeFromCart = (index) => {
    setCart(currentCart => {
      const item = currentCart[index];
      if (item.quantity > 1) {
        // If quantity > 1, just decrease quantity
        return currentCart.map((cartItem, i) => 
          i === index
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        // If quantity is 1, remove the item
        return currentCart.filter((_, i) => i !== index);
      }
    });
    setTotal(prev => prev - cart[index].product.unit_price);
  };

  const clearCart = () => {
    setCart([]);
    setTotal(0);
    barcodeInputRef.current?.focus();
  };

  if (loading) {
    return <div style={styles.loading}>Loading products...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Barcode Scanner Section */}
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
        {/* Products Section */}
        <div style={styles.productsSection}>
          <h2>Products</h2>
          <div style={styles.productsGrid}>
            {products.map(product => (
              <div key={product.id} style={styles.productCard}>
                <h3>{product.name}</h3>
                <p>€{product.unit_price.toFixed(2)}</p>
                <p style={styles.barcode}>Barcode: {product.barcode}</p>
                <button 
                  onClick={() => addToCart(product)}
                  style={styles.button}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Updated Cart Section */}
        <div style={styles.cartSection}>
          <h2>Current Cart</h2>
          <div style={styles.cartItems}>
            {cart.map((item, index) => (
              <div key={index} style={styles.cartItem}>
                <span style={styles.cartItemName}>{item.product.name}</span>
                <span style={styles.cartItemQuantity}>x{item.quantity}</span>
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
  productsSection: {
    flex: '2',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    padding: '20px 0'
  },
  productCard: {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '5px',
    textAlign: 'center'
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
  }
};

export default App; 