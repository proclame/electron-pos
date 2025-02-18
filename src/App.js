import React, { useState } from 'react';

function App() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [total, setTotal] = useState(0);

  // Sample products (we'll connect to backend later)
  const sampleProducts = [
    { id: 1, name: 'Coffee', price: 2.50, barcode: '123456789' },
    { id: 2, name: 'Sandwich', price: 5.99, barcode: '987654321' },
    { id: 3, name: 'Cookie', price: 1.50, barcode: '456789123' }
  ];

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    setBarcodeInput('');
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    setTotal(prev => prev + product.price);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setTotal(prev => prev - cart[index].price);
    setCart(newCart);
  };

  return (
    <div style={styles.container}>
      {/* Barcode Scanner Section */}
      <div style={styles.scannerSection}>
        <form onSubmit={handleBarcodeSubmit}>
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan barcode..."
            style={styles.barcodeInput}
            autoFocus
          />
        </form>
      </div>

      <div style={styles.mainContent}>
        {/* Products Section */}
        <div style={styles.productsSection}>
          <h2>Products</h2>
          <div style={styles.productsGrid}>
            {sampleProducts.map(product => (
              <div key={product.id} style={styles.productCard}>
                <h3>{product.name}</h3>
                <p>${product.price.toFixed(2)}</p>
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

        {/* Cart Section */}
        <div style={styles.cartSection}>
          <h2>Current Cart</h2>
          <div style={styles.cartItems}>
            {cart.map((item, index) => (
              <div key={index} style={styles.cartItem}>
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
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
            <h3>Total: ${total.toFixed(2)}</h3>
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
  }
};

export default App; 