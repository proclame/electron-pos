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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load sales from database on startup
  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    if (currentSaleId) {
      return;
    }

    try {
      const sales = await window.electronAPI.activeSales.getActiveSales();
      const current = sales.find((s) => s.status === 'current');
      const onHold = sales.filter((s) => s.status === 'on_hold');
      if (current) {
        loadCurrentSale(current.id, current.cart_data);
      } else {
        setCurrentSaleId(null);
        setCurrentSale(null);
        setIsInitialLoad(false);
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

  const loadCurrentSale = (id, sale) => {
    setCurrentSaleId(id);
    setCurrentSale(sale);
  };

  const saveCurrentSale = async (sale) => {
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
        if (response.ok) {
          const id = response.id;
          setCurrentSaleId(id);
        }
      }
    } catch (error) {
      console.error('Error saving current sale:', error);
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
    await window.electronAPI.activeSales.deleteActiveSale(saleId);
  };

  const resumeSale = async (saleId) => {
    try {
      setIsInitialLoad(true);

      // Get the sale to resume
      const saleToResume = salesOnHold.find((s) => s.id === saleId);
      if (!saleToResume) return false;
      await window.electronAPI.activeSales.resumeSale(saleId);

      if (currentSaleId) {
        setSalesOnHold((prev) => {
          return [
            ...prev.filter((s) => s.id !== saleId),
            {
              id: currentSaleId,
              ...currentSale,
            },
          ];
        });
      }

      setCurrentSaleId(saleId);
      setCurrentSale(saleToResume);

      return true;
    } catch (error) {
      console.error('Error resuming sale:', error);
      return false;
    }
  };

  return (
    <SalesContext.Provider
      value={{
        currentSale,
        salesOnHold,
        isLoading,
        saveCurrentSale,
        setCurrentSaleId,
        currentSaleId,
        putSaleOnHold,
        resumeSale,
        loadCurrentSale,
        isInitialLoad,
        setIsInitialLoad,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}
