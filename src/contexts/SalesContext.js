import React, { createContext, useContext, useState, useEffect } from 'react';

const SalesContext = createContext();

export function useSales() {
    return useContext(SalesContext);
}

export function SalesProvider({ children }) {
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
                
                setCurrentSale(current ? current.cart_data : null);
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
            const response = await fetch('http://localhost:5001/api/active-sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart_data: sale,
                    status: 'on_hold',
                    notes
                })
            });

            if (response.ok) {
                const { id } = await response.json();
                setSalesOnHold(prev => [...prev, { id, ...sale, notes }]);
                setCurrentSale(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error putting sale on hold:', error);
            return false;
        }
    };

    const resumeSale = async (saleId) => {
        try {
            // First, save current sale if it exists
            if (currentSale) {
                await putSaleOnHold(currentSale);
            }

            // Get the sale to resume
            const saleToResume = salesOnHold.find(s => s.id === saleId);
            if (!saleToResume) return false;

            // Delete the held sale
            await fetch(`http://localhost:5001/api/active-sales/${saleId}`, {
                method: 'DELETE'
            });

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
        // Optionally save to database as current
        try {
            if (sale) {
                await fetch('http://localhost:5001/api/active-sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cart_data: sale,
                        status: 'current'
                    })
                });
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
            putSaleOnHold,
            resumeSale,
            loadSales
        }}>
            {children}
        </SalesContext.Provider>
    );
} 