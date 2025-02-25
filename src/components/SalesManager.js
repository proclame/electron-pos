import React, { useState } from 'react';
import { useSales } from '../contexts/SalesContext';

function SalesManager() {
  const { salesOnHold, resumeSale } = useSales();
  const [isExpanded, setIsExpanded] = useState(false);

  if (salesOnHold.length === 0) return null;

  return (
    <div style={styles.container}>
      <button onClick={() => setIsExpanded(!isExpanded)} style={styles.toggleButton}>
        Sales On Hold ({salesOnHold.length}) {isExpanded ? '▼' : '▲'}
      </button>

      {isExpanded && (
        <div style={styles.salesList}>
          {salesOnHold.map((sale) => (
            <div key={sale.id} style={styles.saleCard}>
              <div style={styles.saleInfo}>
                <div>Items: {sale.cart.length}</div>
                <div>Total: €{sale.total.toFixed(2)}</div>
                {sale.notes && <div style={styles.notes}>Notes: {sale.notes}</div>}
              </div>
              <button onClick={() => resumeSale(sale.id)} style={styles.resumeButton}>
                Resume Sale
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    right: 20,
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '8px 8px 0 0',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  toggleButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
  },
  salesList: {
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '10px',
  },
  saleCard: {
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleInfo: {
    flex: 1,
  },
  notes: {
    fontSize: '0.9em',
    color: '#666',
    marginTop: '5px',
  },
  resumeButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default SalesManager;
