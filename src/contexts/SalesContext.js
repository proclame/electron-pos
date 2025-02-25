import React, { createContext, useContext, useState, useEffect } from 'react';

const SalesContext = createContext();

export function useSales() {
  return useContext(SalesContext);
}

export function SalesProvider({ children }) {
  const [currentSaleId, setCurrentSaleId] = useState(null);
  const [currentSale, setCurrentSale] = useState(null);
  const [salesOnHold, setSalesOnHold] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load sales from database on startup
  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const sales = await window.electronAPI.activeSales.getActiveSales();
      const current = sales.find((s) => s.status === 'current');
      const onHold = sales.filter((s) => s.status === 'on_hold');
      if (current) {
        setCurrentSaleId(current.id);
        setCurrentSale(current.cart_data);
      } else {
        setCurrentSaleId(null);
        setCurrentSale(null);
      }
      setSalesOnHold(
        onHold.map((s) => ({
          id: s.id,
          ...s.cart_data,
          notes: s.notes,
        })),
      );
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const putSaleOnHold = async (sale, notes = '') => {
    try {
      const response = await window.electronAPI.activeSales.putOnHold(currentSaleId, notes);

      if (response.ok) {
        setSalesOnHold((prev) => [...prev, { id: currentSaleId, ...sale, notes }]);
        setCurrentSaleId(null);
        setCurrentSale(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error putting sale on hold:', error);
      return false;
    }
  };

  const deleteSale = async (saleId) => {
    const response = await window.electronAPI.activeSales.deleteActiveSale(saleId);
  };

  const resumeSale = async (saleId) => {
    try {
      if (currentSale && currentSaleId) {
        console.log('put currentsale on hold');
        await putSaleOnHold(currentSale);
      }
      // Get the sale to resume
      const saleToResume = salesOnHold.find((s) => s.id === saleId);
      if (!saleToResume) return false;
      console.log('saleToResume', saleToResume);
      const response = await window.electronAPI.activeSales.resumeSale(saleId);

      setCurrentSaleId(saleId);

      // Update state
      setSalesOnHold((prev) => prev.filter((s) => s.id !== saleId));
      setCurrentSale(saleToResume);
      return true;
    } catch (error) {
      console.error('Error resuming sale:', error);
      return false;
    }
  };

  const updateCurrentSale = async (sale) => {
    setCurrentSale(sale);

    if (!sale) {
      deleteSale(currentSaleId);
      setCurrentSaleId(null);
      return;
    }

    try {
      let response = null;

      if (currentSaleId) {
        response = await window.electronAPI.activeSales.updateActiveSale(currentSaleId, sale);
      } else {
        response = await window.electronAPI.activeSales.createActiveSale(sale);
      }

      if (response.ok && !currentSaleId) {
        // If this was a new sale, store the new ID
        const { id } = await response.json();
        setCurrentSaleId(id);
      }
    } catch (error) {
      console.error('Error saving current sale:', error);
    }
  };

  return (
    <SalesContext.Provider
      value={{
        currentSale,
        salesOnHold,
        isLoading,
        setCurrentSale: updateCurrentSale,
        setCurrentSaleId,
        currentSaleId,
        putSaleOnHold,
        resumeSale,
        loadSales,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}
