import React, { useState, useEffect } from 'react';

function DiscountManagement() {
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    type: 'percentage',
    value: '',
    auto_activate: false,
    min_cart_value: '0',
    active: true,
    barcode: '',
    show_on_pos: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const data = await window.electronAPI.discounts.getDiscounts();
      setDiscounts(data);
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await window.electronAPI.discounts.updateDiscount(editingId, newDiscount);
      } else {
        await window.electronAPI.discounts.createDiscount(newDiscount);
      }
      setNewDiscount({
        name: '',
        type: 'percentage',
        value: '',
        auto_activate: false,
        min_cart_value: '0',
        active: true,
        barcode: '',
        show_on_pos: true,
      });
      setEditingId(null);
      loadDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
    }
  };

  const handleEdit = (discount) => {
    setNewDiscount({
      name: discount.name,
      type: discount.type,
      value: discount.value.toString(),
      auto_activate: discount.auto_activate,
      min_cart_value: discount.min_cart_value.toString(),
      active: discount.active,
      barcode: discount.barcode || '',
      show_on_pos: discount.show_on_pos !== undefined ? discount.show_on_pos : true,
    });
    setEditingId(discount.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await window.electronAPI.discounts.deleteDiscount(id);
        loadDiscounts();
      } catch (error) {
        console.error('Error deleting discount:', error);
      }
    }
  };

  const generateRandomBarcode = () => {
    // Generate a random barcode with prefix "DISC-" followed by 8 digits
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    setNewDiscount({ ...newDiscount, barcode: `DISC-${randomNum}` });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <style>
        {`
          td {
            padding: 4px;
          }
        `}
      </style>

      <h2>Discount Management</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3 style={styles.formTitle}>{editingId ? 'Update Discount' : 'Add Discount'}</h3>
        <div style={styles.formGroup}>
          <label style={styles.label}>Name:</label>
          <input
            type="text"
            value={newDiscount.name}
            onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Type:</label>
          <select value={newDiscount.type} onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Value:</label>
          <input
            type="number"
            step="0.01"
            value={newDiscount.value}
            onChange={(e) => setNewDiscount({ ...newDiscount, value: e.target.value })}
            required
          />
        </div>

        {/* <div style={styles.formGroup}>
          <span style={styles.label}></span>
          <label>
            <input
              type="checkbox"
              checked={newDiscount.auto_activate}
              onChange={(e) => setNewDiscount({ ...newDiscount, auto_activate: e.target.checked })}
            />
            Auto Activate
          </label>
        </div> */}

        {/* <div style={styles.formGroup}>
          <label style={styles.label}>Minimum Cart Value:</label>
          <input
            type="number"
            step="0.01"
            value={newDiscount.min_cart_value}
            onChange={(e) => setNewDiscount({ ...newDiscount, min_cart_value: e.target.value })}
          />
        </div> */}

        <div style={styles.formGroup}>
          <span style={styles.label}></span>
          <label>
            <input
              type="checkbox"
              checked={newDiscount.active}
              onChange={(e) => setNewDiscount({ ...newDiscount, active: e.target.checked })}
            />
            Active
          </label>
        </div>

        <div style={styles.formGroup}>
          <span style={styles.label}></span>
          <label>
            <input
              type="checkbox"
              checked={newDiscount.show_on_pos}
              onChange={(e) => setNewDiscount({ ...newDiscount, show_on_pos: e.target.checked })}
            />
            Show Button in POS
          </label>
          <div style={styles.hint}>When enabled, this discount will appear as a button in the POS interface</div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Barcode (for quick toggle):</label>
          <div style={styles.barcodeInputGroup}>
            <input
              type="text"
              value={newDiscount.barcode}
              onChange={(e) => setNewDiscount({ ...newDiscount, barcode: e.target.value })}
              placeholder="Optional barcode to toggle discount"
            />
            <button type="button" onClick={generateRandomBarcode} style={styles.generateButton}>
              Generate
            </button>
          </div>
          <div style={styles.hint}>
            Scanning this barcode in the POS will toggle this discount on/off
            <br />
            should start with DISC-
          </div>
        </div>

        <button type="submit" style={styles.button}>
          {editingId ? 'Update Discount' : 'Add Discount'}
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Value</th>
            <th>Active</th>
            <th>Show in POS</th>
            <th>Barcode</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map((discount) => (
            <tr key={discount.id}>
              <td>{discount.name}</td>
              <td>{discount.type}</td>
              <td>{discount.type === 'percentage' ? `${discount.value}%` : `€${discount.value.toFixed(2)}`}</td>
              <td>{discount.active ? 'Yes' : 'No'}</td>
              <td>{discount.show_on_pos ? 'Yes' : 'No'}</td>
              <td>{discount.barcode || '-'}</td>
              <td>
                <button onClick={() => handleEdit(discount)} style={styles.actionButton}>
                  Edit
                </button>
                <button onClick={() => handleDelete(discount.id)} style={styles.deleteButton}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  form: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  formGroup: {
    display: 'flex',
    marginBottom: '10px',
  },
  label: {
    marginRight: '10px',
    width: '240px',
  },
  formTitle: {
    marginBottom: '10px',
    marginTop: '0',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  actionButton: {
    marginRight: '5px',
    padding: '4px 8px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  barcodeInputGroup: {
    display: 'flex',
    gap: '10px',
  },
  generateButton: {
    padding: '4px 8px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '5px',
    marginLeft: '20px',
  },
};

export default DiscountManagement;
