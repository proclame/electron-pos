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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <h2>Discount Management</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Name:</label>
          <input
            type="text"
            value={newDiscount.name}
            onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label>Type:</label>
          <select value={newDiscount.type} onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label>Value:</label>
          <input
            type="number"
            step="0.01"
            value={newDiscount.value}
            onChange={(e) => setNewDiscount({ ...newDiscount, value: e.target.value })}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={newDiscount.auto_activate}
              onChange={(e) => setNewDiscount({ ...newDiscount, auto_activate: e.target.checked })}
            />
            Auto Activate
          </label>
        </div>

        <div style={styles.formGroup}>
          <label>Minimum Cart Value:</label>
          <input
            type="number"
            step="0.01"
            value={newDiscount.min_cart_value}
            onChange={(e) => setNewDiscount({ ...newDiscount, min_cart_value: e.target.value })}
          />
        </div>

        <div style={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={newDiscount.active}
              onChange={(e) => setNewDiscount({ ...newDiscount, active: e.target.checked })}
            />
            Active
          </label>
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
            <th>Auto Activate</th>
            <th>Min Cart Value</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map((discount) => (
            <tr key={discount.id}>
              <td>{discount.name}</td>
              <td>{discount.type}</td>
              <td>{discount.type === 'percentage' ? `${discount.value}%` : `€${discount.value.toFixed(2)}`}</td>
              <td>{discount.auto_activate ? 'Yes' : 'No'}</td>
              <td>€{discount.min_cart_value.toFixed(2)}</td>
              <td>{discount.active ? 'Yes' : 'No'}</td>
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
  },
  form: {
    marginBottom: '20px',
    maxWidth: '500px',
  },
  formGroup: {
    marginBottom: '10px',
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
};

export default DiscountManagement;
