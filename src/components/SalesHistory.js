import React, { useState, useEffect } from 'react';
import SaleDetailModal from './SaleDetailModal';

function SalesHistory() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'products'
  const [sales, setSales] = useState([]);
  const [productSales, setProductSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSales();
    } else {
      loadProductSales();
    }
  }, [currentPage, dateFilter, activeTab]);

  const loadSales = async () => {
    try {
      const queryParams = {
        page: currentPage,
        pageSize: 20,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
      };

      const response = await window.electronAPI.sales.getSales(queryParams);
      if (response.ok) {
        setSales(response.sales);
        setTotalPages(Math.ceil(response.total / 20));
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductSales = async () => {
    try {
      const queryParams = {
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
      };

      const response = await window.electronAPI.sales.getSalesByProduct(queryParams);
      setProductSales(response);
    } catch (error) {
      console.error('Error loading product sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleViewSale = async (saleId) => {
    try {
      const response = await window.electronAPI.sales.getSale(saleId);

      setSelectedSale(response);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading sales...</div>;
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
      <h2>Sales History</h2>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'sales' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('sales')}
        >
          Sales List
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'products' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('products')}
        >
          Sales by Product
        </button>
      </div>

      <div style={styles.filters}>
        <input
          type="date"
          name="startDate"
          value={dateFilter.startDate}
          onChange={handleDateFilterChange}
          style={styles.dateInput}
        />
        <span>to</span>
        <input
          type="date"
          name="endDate"
          value={dateFilter.endDate}
          onChange={handleDateFilterChange}
          style={styles.dateInput}
        />
      </div>

      {activeTab === 'sales' ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Date</th>
              <th>Items</th>
              <th style={{ textAlign: 'right', paddingRight: '20px' }}>Total</th>
              <th>Payment Method</th>
              <th>Invoice</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td style={{ textAlign: 'center' }}>#{sale.id}</td>
                <td>{formatDate(sale.created_at)}</td>
                <td style={{ textAlign: 'center' }}>{sale.items.length}</td>
                <td style={{ textAlign: 'right', paddingRight: '20px' }}>€{sale.total.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>{sale.payment_method}</td>
                <td style={{ textAlign: 'center' }}>{sale.needs_invoice ? 'Yes' : 'No'}</td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => handleViewSale(sale.id)} style={styles.button}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th style={{ textAlign: 'center' }}>Quantity Sold</th>
              <th style={{ textAlign: 'right', paddingRight: '20px' }}>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {productSales.map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_code}</td>
                <td>{product.product_name}</td>
                <td style={{ textAlign: 'center' }}>{product.total_quantity}</td>
                <td style={{ textAlign: 'right', paddingRight: '20px' }}>€{product.total_revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === 'sales' && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={styles.button}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={styles.button}
          >
            Next
          </button>
        </div>
      )}

      <SaleDetailModal
        sale={selectedSale}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSale(null);
        }}
      />
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
  filters: {
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  dateInput: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
  pageInfo: {
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tabButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  activeTab: {
    backgroundColor: '#007bff',
    color: 'white',
  },
};

export default SalesHistory;
