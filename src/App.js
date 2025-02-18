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
    setCart([...cart, product]);
    setTotal(prev => prev + product.price);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setTotal(prev => prev - cart[index].price);
    setCart(newCart);
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
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '1.2em'
  }
};

export default App; 