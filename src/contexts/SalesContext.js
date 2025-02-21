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
            const response = await fetch('http://localhost:5001/api/active-sales');
            if (response.ok) {
                const sales = await response.json();
                const current = sales.find(s => s.status === 'current');
                const onHold = sales.filter(s => s.status === 'on_hold');
                
                if (current) {
                    setCurrentSaleId(current.id);
                    setCurrentSale(current.cart_data);
                } else {
                    setCurrentSaleId(null);
                    setCurrentSale(null);
                }
                setSalesOnHold(onHold.map(s => ({
                    id: s.id,
                    ...s.cart_data,
                    notes: s.notes
                })));
            }
        } catch (error) {
            console.error('Error loading sales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const putSaleOnHold = async (sale, notes = '') => {
        try {
            const response = await fetch('http://localhost:5001/api/active-sales/hold', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentSaleId,
                    notes: notes
                })
            });

            if (response.ok) {
                setSalesOnHold(prev => [...prev, { id: currentSaleId, ...sale, notes }]);
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
        await fetch(`http://localhost:5001/api/active-sales/${saleId}`, {
            method: 'DELETE'
        });
    }

    const resumeSale = async (saleId) => {
        try {
            if (currentSale && currentSaleId) {
                await putSaleOnHold(currentSale);
            }
            // Get the sale to resume
            const saleToResume = salesOnHold.find(s => s.id === saleId);
            if (!saleToResume) return false;

            const response = await fetch('http://localhost:5001/api/active-sales/resume', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: saleId,
                })
            });
            setCurrentSaleId(saleId);

            // Update state
            setSalesOnHold(prev => prev.filter(s => s.id !== saleId));
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
            const method = currentSaleId ? 'PUT' : 'POST';
            const url = currentSaleId 
                ? `http://localhost:5001/api/active-sales/${currentSaleId}`
                : 'http://localhost:5001/api/active-sales';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart_data: sale,
                    status: 'current'
                })
            });

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
        <SalesContext.Provider value={{
            currentSale,
            salesOnHold,
            isLoading,
            setCurrentSale: updateCurrentSale,
            setCurrentSaleId,
            currentSaleId,
            putSaleOnHold,
            resumeSale,
            loadSales
        }}>
            {children}
        </SalesContext.Provider>
    );
} 