import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

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
    product_code: '',
  });
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalProducts, setTotalProducts] = useState(0);
  const { showNotification } = useNotification();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllProducts = async () => {
    if (window.confirm('Are you sure you want to delete ALL products? This action cannot be undone!')) {
      try {
        setIsClearing(true);
        await window.electronAPI.products.clearAllProducts();
        setProducts([]);
        setTotalProducts(0);
        showNotification('All products have been deleted successfully');
      } catch (error) {
        console.error('Error clearing products:', error);
        showNotification('Failed to clear products', 'error');
      } finally {
        setIsClearing(false);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const data = await window.electronAPI.products.getProducts({ page, pageSize });
      setProducts(data.products);
      setTotalProducts(data.total);
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
      product_code: product.product_code,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await window.electronAPI.products.updateProduct(editingProduct.id, formData);

      if (response.ok) {
        fetchProducts();
        setEditingProduct(null);
        showNotification('Product saved successfully!');
      } else {
        showNotification('Error updating product', 'error');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      showNotification('Error updating product', 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const response = await window.electronAPI.products.importProducts(e.target.result);
          if (response.ok) {
            showNotification('Products imported successfully');
            Object.entries(response.errors).forEach(([code, count]) => {
              showNotification(`${count} products with code ${code} not imported`, 'error');
            });
            fetchProducts();
          } else {
            showNotification('Error importing products', 'error');
          }
        } catch (err) {
          console.error('Error importing products:', err);
          showNotification('Error importing products', 'error');
        }
        fileInputRef.current.value = '';
      };
      reader.readAsText(file);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading products...</div>;
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          td {
            padding: 4px;
          }
      `}
      </style>
      <h1>Product Management</h1>
      <div style={styles.headerActions}>
        <button
          onClick={handleClearAllProducts}
          disabled={isClearing || products.length === 0}
          style={{
            ...styles.dangerButton,
            opacity: isClearing || products.length === 0 ? 0.6 : 1,
            cursor: isClearing || products.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {isClearing ? 'Clearing...' : 'Clear All Products'}
        </button>
      </div>

      <div style={styles.importSection}>
        <h2 style={styles.importTitle}>Import Products</h2>
        <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} style={styles.fileInput} />
        <p style={styles.importHelp}>CSV format: name,size,color,unit_price,barcode,product_code</p>
      </div>

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
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.size}</td>
                <td>{product.color}</td>
                <td>€{product.unit_price.toFixed(2)}</td>
                <td>{product.barcode}</td>
                <td>{product.product_code}</td>
                <td>
                  <button onClick={() => handleEdit(product)} style={styles.editButton}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div style={styles.editFormOverlay} onClick={() => setEditingProduct(null)}>
          <div style={styles.editForm} onClick={(e) => e.stopPropagation()}>
            <h2>Edit Product</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div style={styles.formGroup}>
                <label>Size:</label>
                <input type="text" name="size" value={formData.size} onChange={handleChange} />
              </div>
              <div style={styles.formGroup}>
                <label>Color:</label>
                <input type="text" name="color" value={formData.color} onChange={handleChange} />
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
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} required />
              </div>
              <div style={styles.formGroup}>
                <label>Product Code:</label>
                <input type="text" name="product_code" value={formData.product_code} onChange={handleChange} required />
              </div>
              <div style={styles.formButtons}>
                <button type="submit" style={styles.saveButton}>
                  Save
                </button>
                <button type="button" onClick={() => setEditingProduct(null)} style={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.pagination}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={styles.paginationButton}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.ceil(totalProducts / pageSize)}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(totalProducts / pageSize)}
          style={styles.paginationButton}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    width: '100%',
    maxWidth: '1800px',
    margin: '0 auto',
  },
  productList: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  editButton: {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editForm: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: '600px',
    marginTop: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  editFormOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  formGroup: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '1.2em',
  },
  importSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  importTitle: {
    marginBottom: '10px',
    marginTop: '0',
  },
  importHelp: {
    margin: '10px 0 0',
    color: '#6c757d',
    fontSize: '0.9em',
  },
  fileInput: {
    display: 'block',
    width: '100%',
    padding: '8px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  pagination: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
  },
  paginationButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
  },
  dangerButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s ease',
  },
};

export default ProductManagement;
