import React, { useState, useEffect, useRef } from 'react';
import { SPECIAL_BARCODES } from '../constants/barcodes';
import { useNotification } from '../contexts/NotificationContext';

function BarcodeScanner({
  onProductScanned,
  onSpecialBarcode,
  isSuspendedBarcodeInput,
  suspendTimeoutRef,
  handleApplyDiscount,
}) {
  const { showNotification } = useNotification();
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef(null);
  const audioCtx = new AudioContext();
  const [settings, setSettings] = useState({ barcode_sound_enabled: 'true' });

  useEffect(() => {
    // Fetch settings on component mount
    const fetchSettings = async () => {
      try {
        const appSettings = await window.electronAPI.settings.getSettings();
        setSettings(appSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const playSound = (herz = 440, gain = 1, length = 0.35) => {
    // Only play sound if it's enabled in settings
    if (settings.barcode_sound_enabled !== 'true') return;

    const oscillator = audioCtx.createOscillator();
    const volume = audioCtx.createGain();
    volume.gain.value = gain;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(herz, audioCtx.currentTime); // value in hertz
    oscillator.connect(volume);
    volume.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + length);
  };

  const playSuccessSound = () => {
    playSound(880, 0.5, 0.35);
  };

  const playErrorSound = () => {
    playSound(110, 0.5, 0.35);
  };

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
      if (barcodeInput === SPECIAL_BARCODES.CHECKOUT) {
        onSpecialBarcode('checkout');
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
        return;
      }

      // Check if it's a discount barcode
      if (barcodeInput.startsWith('DISC-')) {
        const discount = await window.electronAPI.discounts.getByBarcode(barcodeInput);
        if (discount) {
          handleApplyDiscount(discount);
          setBarcodeInput('');
          return;
        }
      }

      try {
        const product = await window.electronAPI.products.getProductByBarcode(barcodeInput);
        onProductScanned(product);
        playSuccessSound();
      } catch (err) {
        console.error('Error finding product:', err);
        showNotification('Product not found!', 'error');
        playErrorSound();
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
