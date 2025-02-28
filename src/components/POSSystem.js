import React, { useState, useRef, useEffect } from 'react';
import ProductSearch from './ProductSearch';
import HoldNoteModal from './HoldNoteModal';
import CartTable from './CartTable';
import DiscountsPanel from './DiscountsPanel';
import TotalsPanel from './TotalsPanel';
import BarcodeScanner from './BarcodeScanner';
import SalesManager from './SalesManager';
import { useSales } from '../contexts/SalesContext';
import { useNotification } from '../contexts/NotificationContext';

function POSSystem() {
  const { currentSale, saveCurrentSale, putSaleOnHold, currentSaleId, isInitialLoad, setIsInitialLoad } = useSales();
  const [isReturn, setIsReturn] = useState(false);
  const [settings, setSettings] = useState(null);
  const [notes, setNotes] = useState('');
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [email, setEmail] = useState('');
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState({
    percentage: null,
    fixed: null,
  });
  const [isSuspendedBarcodeInput, setIsSuspendedBarcodeInput] = React.useState(false);
  const suspendTimeoutRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const { showNotification } = useNotification();

  useEffect(() => {
    setCart(currentSale?.cart || []);
    setTotal(currentSale?.total || 0);
    setNotes(currentSale?.notes || '');
    setNeedsInvoice(currentSale?.needs_invoice || false);
    setAppliedDiscounts(
      currentSale?.discounts || {
        percentage: null,
        fixed: null,
      },
    );
  }, [currentSale]);

  // Update current sale whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      if (!isInitialLoad) {
        saveCurrentSale({
          cart,
          total,
          notes,
          needs_invoice: needsInvoice,
          discounts: appliedDiscounts,
        });
      } else {
        setIsInitialLoad(false);
      }
    }
  }, [cart, total, notes, needsInvoice, appliedDiscounts]);

  const addProductToCart = (product) => {
    const updatedCart = [...cart];
    const existingItem = updatedCart.find((item) => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += isReturn ? -1 : 1;
    } else {
      updatedCart.push({
        product,
        quantity: isReturn ? -1 : 1,
        discount_percentage: null,
      });
    }

    const newTotal = calculateTotal(updatedCart);
    setCart(updatedCart);
    setTotal(newTotal);
  };

  const calculateTotal = (cartItems) => {
    return cartItems.reduce(
      (sum, item) =>
        sum +
        item.product.unit_price * item.quantity -
        (item.product.unit_price *
          item.quantity *
          (item.discount_percentage ?? appliedDiscounts.percentage?.value ?? 0)) /
          100,
      0,
    );
  };

  // Update removeFromCart
  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    if (newCart.length === 0) {
      clearCart();
      return;
    }
    setTotal(calculateTotal(newCart));
    setCart(newCart);
  };

  const handlePutOnHold = async (notes = '') => {
    if (cart.length > 0) {
      const success = await putSaleOnHold(
        {
          cart,
          total,
          notes: notes || '',
        },
        notes,
      );

      if (success) {
        clearCart(false);
      }
    }
  };

  const clearCart = (fullClear = true) => {
    setCart([]);
    setTotal(0);
    setNotes('');
    setNeedsInvoice(false);
    setEmail('');
    setIsReturn(false);
    setAppliedDiscounts({
      percentage: null,
      fixed: null,
    });

    if (fullClear) {
      saveCurrentSale(null);
    }
  };

  const handleCheckout = async () => {
    try {
      // Calculate item totals with percentage discounts
      const itemsWithDiscounts = cart.map((item) => {
        const subtotal = item.quantity * item.product.unit_price;
        const percentageDiscount = item.discount_percentage ?? appliedDiscounts.percentage?.value ?? 0;
        const discountedTotal = subtotal - (subtotal * percentageDiscount) / 100;

        return {
          ...item,
          subtotal,
          discount_percentage: percentageDiscount,
          total: discountedTotal,
        };
      });

      // Calculate sale totals
      const subtotal = itemsWithDiscounts.reduce((sum, item) => sum + item.total, 0);
      const fixedDiscountAmount = Math.max(0, Math.min(subtotal, appliedDiscounts.fixed?.value ?? 0));
      const finalTotal = subtotal - fixedDiscountAmount;

      const saleData = {
        items: itemsWithDiscounts,
        subtotal: subtotal,
        discount_amount: fixedDiscountAmount,
        total: finalTotal,
        payment_method: 'cash',
        needs_invoice: needsInvoice,
        notes: notes.trim(),
        email: email.trim(),
      };

      const response = await window.electronAPI.sales.createSale(saleData);

      if (response.ok) {
        const { id } = response;

        try {
          await window.electronAPI.print.printReceipt({ ...saleData, id });
          if (email) {
            await window.electronAPI.email.sendReceipt({ ...saleData, id }, email);
          }
        } catch (printError) {
          console.error('Error printing receipt:', printError);
          showNotification('Sale completed but failed to print receipt', 'error');
        }

        showNotification('Sale completed successfully!');
        clearCart();
      } else {
        showNotification('Error completing sale', 'error');
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      showNotification('Error completing sale', 'error');
    }
  };

  // Add handlers for notes focus
  const handleNotesFieldFocus = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);
  };

  const handleNotesFieldBlur = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(false);
  };

  useEffect(() => {
    return () => {
      if (suspendTimeoutRef.current) {
        clearTimeout(suspendTimeoutRef.current);
      }
    };
  }, []);

  // Update the state change for modal
  const openHoldModal = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }
    setIsSuspendedBarcodeInput(true);
    setIsHoldModalOpen(true);
  };

  const closeHoldModal = () => {
    setIsHoldModalOpen(false);
    setIsSuspendedBarcodeInput(false);
  };

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const settingsData = await window.electronAPI.settings.getSettings();
      setSettings(settingsData);
    };
    loadSettings();
  }, []);

  // Add a function to toggle return mode
  const toggleReturnMode = () => {
    setIsReturn(!isReturn);
  };

  // Load active discounts
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        const discounts = await window.electronAPI.discounts.getActive();
        setActiveDiscounts(discounts);
      } catch (error) {
        console.error('Error loading discounts:', error);
      }
    };
    loadDiscounts();
  }, []);

  const handleApplyDiscount = async (discount) => {
    const newDiscounts = { ...appliedDiscounts };

    if (discount.type === 'percentage') {
      if (newDiscounts.percentage === discount) {
        newDiscounts.percentage = null;
      } else {
        newDiscounts.percentage = discount;
      }
    } else {
      if (newDiscounts.fixed === discount) {
        newDiscounts.fixed = null;
      } else {
        newDiscounts.fixed = discount;
      }
    }

    setAppliedDiscounts(newDiscounts);
  };

  const handleSpecialBarcode = (type) => {
    switch (type) {
      case 'checkout':
        if (cart.length > 0) {
          handleCheckout();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        {settings?.allow_returns === 'true' && (
          <div style={styles.returnToggle}>
            <button
              onClick={toggleReturnMode}
              style={{
                ...styles.returnButton,
                ...(isReturn ? styles.returnButtonActive : {}),
              }}
            >
              {isReturn ? 'Switch to Sale Mode' : 'Switch to Return Mode'}
            </button>
          </div>
        )}
        <BarcodeScanner
          onProductScanned={addProductToCart}
          onSpecialBarcode={handleSpecialBarcode}
          isSuspendedBarcodeInput={isSuspendedBarcodeInput}
          suspendTimeoutRef={suspendTimeoutRef}
        />
        <ProductSearch
          onProductSelect={addProductToCart}
          onFocus={() => {
            if (suspendTimeoutRef.current) {
              clearTimeout(suspendTimeoutRef.current);
            }
            setIsSuspendedBarcodeInput(true);
          }}
          onBlur={() => {
            if (suspendTimeoutRef.current) {
              clearTimeout(suspendTimeoutRef.current);
            }
            setIsSuspendedBarcodeInput(false);
          }}
        />
      </div>
      <div style={styles.rightPanel}>
        {isReturn && <div style={styles.returnWarning}>Return Mode Active</div>}
        <div style={styles.cartContainer}>
          <div style={styles.cartSection}>
            <h2>Current Cart: {currentSaleId}</h2>
            <CartTable
              cart={cart}
              setCart={setCart}
              setTotal={setTotal}
              calculateTotal={calculateTotal}
              appliedDiscounts={appliedDiscounts}
              onRemoveItem={removeFromCart}
              suspendTimeoutRef={suspendTimeoutRef}
              setIsSuspendedBarcodeInput={setIsSuspendedBarcodeInput}
            />
            {activeDiscounts.length > 0 && (
              <DiscountsPanel
                activeDiscounts={activeDiscounts}
                appliedDiscounts={appliedDiscounts}
                onApplyDiscount={handleApplyDiscount}
              />
            )}
            <TotalsPanel total={total} appliedDiscounts={appliedDiscounts} />
            <div style={styles.checkoutFields}>
              <div style={styles.invoiceField}>
                <label>
                  <input
                    type="checkbox"
                    checked={needsInvoice}
                    onChange={(e) => setNeedsInvoice(e.target.checked)}
                    style={styles.checkbox}
                  />
                  Invoice needed
                </label>
              </div>
              {settings?.enable_email === 'true' && (
                <div style={styles.emailField}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleNotesFieldFocus}
                    onBlur={handleNotesFieldBlur}
                    placeholder="Email for receipt (optional)"
                    style={styles.emailInput}
                  />
                </div>
              )}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={handleNotesFieldFocus}
                onBlur={handleNotesFieldBlur}
                placeholder="Add notes..."
                style={styles.notesField}
              />
            </div>
            <div style={styles.cartButtons}>
              <button onClick={openHoldModal} style={styles.holdButton} disabled={cart.length === 0}>
                Put on Hold
              </button>
              <button onClick={clearCart} style={styles.clearButton} disabled={cart.length === 0}>
                Clear Cart
              </button>
              <button onClick={handleCheckout} style={styles.checkoutButton} disabled={cart.length === 0}>
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
      <HoldNoteModal
        isOpen={isHoldModalOpen}
        onClose={closeHoldModal}
        onConfirm={(notes) => {
          handlePutOnHold(notes);
          closeHoldModal();
        }}
      />
      <SalesManager />
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    gap: '20px',
  },
  leftPanel: {
    flex: '1',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderWidth: '1px',
  },
  barcodeSection: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
  },
  barcodeInput: {
    width: '100%',
    padding: '12px',
    fontSize: '18px',
    border: '2px solid #007bff',
    borderRadius: '4px',
    textAlign: 'center',
  },
  rightPanel: {
    flex: '1',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  cartContainer: {
    marginBottom: '20px',
  },
  cartSection: {
    marginBottom: '20px',
  },
  cartItems: {
    marginBottom: '20px',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee',
  },
  total: {
    textAlign: 'right',
    paddingTop: '20px',
    borderTop: '2px solid #eee',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  checkoutButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  barcode: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: '4px',
    borderRadius: '4px',
    margin: '5px 0',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '1.2em',
  },
  cartItemName: {
    flex: '2',
    textAlign: 'left',
  },
  cartItemQuantity: {
    flex: '1',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: '2px 8px',
    borderRadius: '4px',
    margin: '0 8px',
  },
  cartItemPrice: {
    flex: '1',
    textAlign: 'right',
    marginRight: '8px',
  },
  cartButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  clearButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  nav: {
    backgroundColor: '#f8f9fa',
    padding: '10px 20px',
    marginBottom: '20px',
  },
  navLink: {
    marginRight: '20px',
    textDecoration: 'none',
    color: '#007bff',
    fontWeight: 'bold',
  },
  quantityInput: {
    width: '80px',
    padding: '4px',
    fontSize: '16px',
  },
  checkoutFields: {
    marginTop: '10px',
    marginBottom: '15px',
    textAlign: 'left',
  },
  invoiceField: {
    marginBottom: '10px',
  },
  checkbox: {
    marginRight: '8px',
  },
  notesField: {
    width: '100%',
    minHeight: '60px',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    resize: 'vertical',
  },
  searchContainer: {
    flex: '1',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  holdButton: {
    padding: '12px 24px',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editableField: {
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  cartTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  returnToggle: {
    marginBottom: '20px',
  },
  returnButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    color: '#333',
    transition: 'all 0.3s ease',
  },
  returnButtonActive: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  returnWarning: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px',
    textAlign: 'center',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  emailField: {
    marginBottom: '10px',
  },
  emailInput: {
    width: '100%',
    padding: '8px',
    borderWidth: '1px',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderRadius: '4px',
  },
  discountsSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  discountsTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#495057',
  },
  discountsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  discountButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '120px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e9ecef',
      borderColor: '#adb5bd',
    },
  },
  discountButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  discountName: {
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  discountValue: {
    color: '#28a745',
    fontSize: '14px',
  },
  totalsBreakdown: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '16px',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '2px solid #dee2e6',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  discountAmount: {
    color: '#dc3545',
  },
  discountCell: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.9em',
  },
  discountedPrice: {
    color: '#28a745',
    fontWeight: 'bold',
  },
};

export default POSSystem;
