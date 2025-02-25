import React, { useState } from 'react';

function ProductSearch({ onProductSelect, onFocus, onBlur }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setResults([]);
    }
  };

  const handleBlur = (e) => {
    // Small delay to allow clicking on results
    setTimeout(() => {
      setResults([]);
    }, 200);
    onBlur && onBlur(e);
  };

  const handleSearch = async (value) => {
    setSearchTerm(value);

    // Clear results if input is too short
    if (!value.trim() || value.trim().length < 4) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const products = await window.electronAPI.products.searchProducts(value);
      setResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchBox}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={onFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search by name or product code..."
          style={styles.input}
        />
        {isLoading && <div style={styles.loader}>Loading...</div>}
      </div>

      {results.length > 0 && (
        <div style={styles.results}>
          {results.map((product) => (
            <div
              key={product.id}
              style={styles.resultItem}
              onClick={() => {
                onProductSelect(product);
                setSearchTerm('');
                setResults([]);
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div style={styles.productName}>
                {product.name}
                {(product.size || product.color) && (
                  <span style={styles.productVariant}>
                    {product.size && ` - ${product.size}`}
                    {product.color && ` - ${product.color}`}
                  </span>
                )}
              </div>
              <div style={styles.productDetails}>
                <span>Code: {product.product_code}</span>
                <span>Price: €{product.unit_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  loader: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666',
  },
  results: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  resultItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  productVariant: {
    fontWeight: 'normal',
    color: '#666',
    fontSize: '0.9em',
  },
  productDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#666',
  },
};

export default ProductSearch;
