import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

function SaleDetailModal({ sale, isOpen, onClose }) {
  const { showNotification } = useNotification();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedNeedsInvoice, setEditedNeedsInvoice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (sale) {
      setEditedNotes(sale.notes || '');
      setEditedNeedsInvoice(!!sale.needs_invoice);
      setIsEditing(false);
    }
  }, [sale]);

  const handleClose = () => {
    setIsEditing(false);
    setIsPrinting(false);
    setIsSaving(false);
    onClose();
  };

  // Handle clicking outside modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !sale) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleReprint = async () => {
    try {
      setIsPrinting(true);
      const response = await window.electronAPI.print.printReceipt({
        id: sale.id,
        items: sale.items.map((item) => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            unit_price: item.unit_price,
          },
          subtotal: item.subtotal,
          discount_percentage: item.discount_percentage,
          total: item.total,
          quantity: item.quantity,
        })),
        subtotal: sale.subtotal,
        discount_amount: sale.discount_amount,
        total: sale.total,
        payment_method: sale.payment_method,
        needs_invoice: sale.needs_invoice,
        notes: sale.notes,
      });

      if (!response.ok) {
        throw new Error('Failed to print receipt');
      }
      showNotification('Receipt printed successfully!');
    } catch (error) {
      console.error('Error printing receipt:', error);
      showNotification('Failed to print receipt', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await window.electronAPI.sales.updateSale(sale.id, {
        notes: editedNotes,
        needs_invoice: editedNeedsInvoice,
      });

      if (response.ok) {
        sale.notes = editedNotes;
        sale.needs_invoice = editedNeedsInvoice;
        setIsEditing(false);
      } else {
        throw new Error('Failed to update sale');
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      showNotification('Failed to update sale', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleOverlayClick}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2>Sale Details #{sale.id}</h2>
          <button onClick={handleClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.infoSection}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Date:</span>
              <span>{formatDate(sale.created_at)}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Payment Method:</span>
              <span>{sale.payment_method}</span>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Code</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td>{item.product_code}</td>
                  <td>{item.quantity}</td>
                  <td>€{item.unit_price.toFixed(2)}</td>
                  <td>€{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.totals}>
            <div style={styles.totalRow}>
              <span>Subtotal:</span>
              <span>€{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div style={styles.totalRow}>
                <span>Discount:</span>
                <span>€{sale.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total:</span>
              <span style={styles.totalAmount}>€{sale.total.toFixed(2)}</span>
            </div>
          </div>

          <div style={styles.actions}>
            <button onClick={handleReprint} style={styles.button} disabled={isPrinting}>
              {isPrinting ? 'Printing...' : 'Reprint Receipt'}
            </button>
          </div>

          <div style={styles.editSection}>
            <div style={styles.editHeader}>
              <h3>Additional Information</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={styles.editButton}>
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <>
                <div style={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={editedNeedsInvoice}
                      onChange={(e) => setEditedNeedsInvoice(e.target.checked)}
                    />
                    Needs Invoice
                  </label>
                </div>
                <div style={styles.formGroup}>
                  <label>Notes:</label>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    style={styles.textarea}
                    rows="4"
                  />
                </div>
                <div style={styles.editButtons}>
                  <button onClick={() => setIsEditing(false)} style={styles.cancelButton} disabled={isSaving}>
                    Cancel
                  </button>
                  <button onClick={handleSave} style={styles.saveButton} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.viewInfo}>
                <div>Invoice Required: {sale.needs_invoice ? 'Yes' : 'No'}</div>
                {sale.notes && (
                  <div>
                    <strong>Notes:</strong>
                    <p>{sale.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '20px',
  },
  infoSection: {
    marginBottom: '20px',
  },
  infoRow: {
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold',
    marginRight: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
  },
  totals: {
    borderTop: '2px solid #eee',
    paddingTop: '20px',
    textAlign: 'right',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '20px',
    marginBottom: '10px',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: '1.2em',
  },
  actions: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
  editSection: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  editHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  editButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  editButton: {
    padding: '4px 8px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  viewInfo: {
    lineHeight: '1.5',
  },
};

export default SaleDetailModal;
