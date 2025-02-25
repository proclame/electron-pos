import React, { useState, useEffect, useRef } from 'react';

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
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const data = await window.electronAPI.getProducts({ page, pageSize });
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
      const response = await window.electronAPI.updateProduct(editingProduct.id, formData);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const response = await window.electronAPI.importProducts(e.target.result);
          console.log('response', response);
          if (response.ok) {
            alert('Products imported successfully');
            fetchProducts();
          } else {
            alert('Error importing products');
          }
        } catch (err) {
          console.error('Error importing products:', err);
          alert('Error importing products');
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
      <h1>Product Management</h1>
      
      <div style={styles.importSection}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={styles.fileInput}
        />
        <p style={styles.importHelp}>
          CSV format: name,size,color,unit_price,barcode,product_code
        </p>
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

      <div style={styles.pagination}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={styles.paginationButton}
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil(totalProducts / pageSize)}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
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
  },
  importSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #ddd'
  },
  importHelp: {
    margin: '10px 0 0',
    color: '#6c757d',
    fontSize: '0.9em'
  },
  fileInput: {
    display: 'block',
    width: '100%',
    padding: '8px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  pagination: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px'
  },
  paginationButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default ProductManagement; 