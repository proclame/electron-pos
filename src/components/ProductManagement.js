import React, { useState, useEffect } from 'react';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    color: '',
    unit_price: '',
    barcode: '',
    product_code: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/products');
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      size: product.size || '',
      color: product.color || '',
      unit_price: product.unit_price,
      barcode: product.barcode,
      product_code: product.product_code
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5001/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchProducts();
        setEditingProduct(null);
      } else {
        alert('Error updating product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error updating product');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading products...</div>;
  }

  return (
    <div style={styles.container}>
      <h1>Product Management</h1>
      
      <div style={styles.productList}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Color</th>
              <th>Price</th>
              <th>Barcode</th>
              <th>Product Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.size}</td>
                <td>{product.color}</td>
                <td>€{product.unit_price.toFixed(2)}</td>
                <td>{product.barcode}</td>
                <td>{product.product_code}</td>
                <td>
                  <button 
                    onClick={() => handleEdit(product)}
                    style={styles.editButton}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div style={styles.editForm}>
          <h2>Edit Product</h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label>Size:</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Color:</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Price:</label>
              <input
                type="number"
                step="0.01"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label>Barcode:</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label>Product Code:</label>
              <input
                type="text"
                name="product_code"
                value={formData.product_code}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.formButtons}>
              <button type="submit" style={styles.saveButton}>Save</button>
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  productList: {
    marginTop: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },
  editButton: {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  editForm: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },
  formGroup: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '1.2em'
  }
};

export default ProductManagement; 