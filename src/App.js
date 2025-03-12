import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductManagement from './components/ProductManagement';
import Settings from './components/Settings';
import POSSystem from './components/POSSystem';
import SalesHistory from './components/SalesHistory';
import DiscountManagement from './components/DiscountManagement';
import { SalesProvider } from './contexts/SalesContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <SalesProvider>
        <Router>
          <style>
            {`
              .nav-link {
                text-decoration: none;
                color: #1D4671FF;
                padding: 8px 12px;
                border-radius: 4px;
                transition: background-color 0.2s;
              }
              .nav-link:hover {
                text-decoration: underline;
              }
            `}
          </style>
          <div style={styles.main}>
            <div style={styles.nav}>
              <Link to="/" className="nav-link">
                POS
              </Link>
              <Link to="/products" className="nav-link">
                Products
              </Link>
              <Link to="/sales" className="nav-link">
                Sales
              </Link>
              <Link to="/discounts" className="nav-link">
                Discounts
              </Link>
              <Link to="/settings" className="nav-link">
                Settings
              </Link>
            </div>

            <Routes>
              <Route path="/" element={<POSSystem />} />
              <Route path="/products" element={<ProductManagement />} />
              <Route path="/sales" element={<SalesHistory />} />
              <Route path="/discounts" element={<DiscountManagement />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </Router>
      </SalesProvider>
    </NotificationProvider>
  );
}

const styles = {
  main: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  nav: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    gap: '15px',
  },
};

export default App;
