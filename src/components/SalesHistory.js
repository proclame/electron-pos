import React, { useState, useEffect } from 'react';
import SaleDetailModal from './SaleDetailModal';

function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadSales();
    }, [currentPage, dateFilter]);

    const loadSales = async () => {
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                pageSize: 20,
                startDate: dateFilter.startDate,
                endDate: dateFilter.endDate
            });

            const response = await fetch(`http://localhost:5001/api/sales?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setSales(data.sales);
                setTotalPages(Math.ceil(data.total / 20));
            }
        } catch (error) {
            console.error('Error loading sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const handleDateFilterChange = (e) => {
        const { name, value } = e.target;
        setDateFilter(prev => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handleViewSale = async (saleId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/sales/${saleId}`);
            if (response.ok) {
                const saleDetails = await response.json();
                setSelectedSale(saleDetails);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching sale details:', error);
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading sales...</div>;
    }

    return (
        <div style={styles.container}>
            <h2>Sales History</h2>
            
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

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th>Sale ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment Method</th>
                        <th>Invoice</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        <tr key={sale.id}>
                            <td>{sale.id}</td>
                            <td>{formatDate(sale.created_at)}</td>
                            <td>{sale.items.length} items</td>
                            <td>€{sale.total.toFixed(2)}</td>
                            <td>{sale.payment_method}</td>
                            <td>{sale.needs_invoice ? 'Yes' : 'No'}</td>
                            <td>
                                <button 
                                    onClick={() => handleViewSale(sale.id)}
                                    style={styles.button}
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={styles.pagination}>
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={styles.button}
                >
                    Previous
                </button>
                <span style={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={styles.button}
                >
                    Next
                </button>
            </div>

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
        maxWidth: '1200px',
        margin: '0 auto'
    },
    filters: {
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
    },
    dateInput: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px'
    },
    button: {
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px'
    },
    pageInfo: {
        fontSize: '14px'
    },
    loading: {
        textAlign: 'center',
        padding: '20px'
    }
};

export default SalesHistory; 