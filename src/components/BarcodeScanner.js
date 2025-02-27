import React, { useRef, useEffect } from 'react';

function BarcodeScanner({ onProductScanned, isSuspendedBarcodeInput, suspendTimeoutRef }) {
  const [barcodeInput, setBarcodeInput] = React.useState('');
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    if (!isSuspendedBarcodeInput) {
      barcodeInputRef.current?.focus();
    }
  }, [isSuspendedBarcodeInput]);

  const handleBarcodeBlur = () => {
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current);
    }

    if (!isSuspendedBarcodeInput) {
      suspendTimeoutRef.current = setTimeout(() => {
        barcodeInputRef.current?.focus();
        suspendTimeoutRef.current = null;
      }, 100);
    }
  };

  const handleBarcodeChange = (e) => {
    setBarcodeInput(e.target.value);
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      try {
        const product = await window.electronAPI.products.getProductByBarcode(barcodeInput);
        onProductScanned(product);
      } catch (err) {
        console.error('Error finding product:', err);
        alert('Product not found!');
      }
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    }
  };

  return (
    <div style={styles.barcodeSection}>
      <form onSubmit={handleBarcodeSubmit}>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcodeInput}
          onChange={handleBarcodeChange}
          onBlur={handleBarcodeBlur}
          style={styles.barcodeInput}
          placeholder="Scan barcode..."
        />
      </form>
    </div>
  );
}

const styles = {
  barcodeSection: {
    marginBottom: '20px',
  },
  barcodeInput: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderWidth: '1px',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderRadius: '4px',
    '&:focus': {
      outline: 'none',
      borderColor: '#007bff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  },
};

export default BarcodeScanner;
