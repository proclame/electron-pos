import React, { useState } from 'react';

function SaleDetailModal({ sale, isOpen, onClose }) {
    const [isPrinting, setIsPrinting] = useState(false);

    if (!isOpen || !sale) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const handleReprint = async () => {
        try {
            setIsPrinting(true);
            const response = await fetch('http://localhost:5001/api/print/receipt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: sale.id,
                    items: sale.items.map(item => ({
                        product: {
                            id: item.product_id,
                            name: item.product_name,
                            unit_price: item.unit_price
                        },
                        quantity: item.quantity
                    })),
                    subtotal: sale.subtotal,
                    discount_amount: sale.discount_amount,
                    total: sale.total,
                    payment_method: sale.payment_method,
                    needs_invoice: sale.needs_invoice,
                    notes: sale.notes
                })
            });

            if (!response.ok) {
                throw new Error('Failed to print receipt');
            }
        } catch (error) {
            console.error('Error printing receipt:', error);
            alert('Failed to print receipt');
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h2>Sale Details #{sale.id}</h2>
                    <button onClick={onClose} style={styles.closeButton}>×</button>
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
                        <div style={styles.infoRow}>
                            <span style={styles.label}>Invoice Required:</span>
                            <span>{sale.needs_invoice ? 'Yes' : 'No'}</span>
                        </div>
                        {sale.notes && (
                            <div style={styles.infoRow}>
                                <span style={styles.label}>Notes:</span>
                                <span>{sale.notes}</span>
                            </div>
                        )}
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
                        <button 
                            onClick={handleReprint}
                            style={styles.button}
                            disabled={isPrinting}
                        >
                            {isPrinting ? 'Printing...' : 'Reprint Receipt'}
                        </button>
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
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
    },
    modalHeader: {
        padding: '20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer'
    },
    modalBody: {
        padding: '20px'
    },
    infoSection: {
        marginBottom: '20px'
    },
    infoRow: {
        marginBottom: '10px'
    },
    label: {
        fontWeight: 'bold',
        marginRight: '10px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px'
    },
    totals: {
        borderTop: '2px solid #eee',
        paddingTop: '20px',
        textAlign: 'right'
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '20px',
        marginBottom: '10px'
    },
    totalLabel: {
        fontWeight: 'bold'
    },
    totalAmount: {
        fontWeight: 'bold',
        fontSize: '1.2em'
    },
    actions: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'flex-end'
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
            cursor: 'not-allowed'
        }
    }
};

export default SaleDetailModal; 