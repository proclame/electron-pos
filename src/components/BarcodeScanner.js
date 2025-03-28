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
      }, 10);
    }
  };

  const handleBarcodeChange = (e) => {
    setBarcodeInput(e.target.value);
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      // Replace § with - in the barcode input
      const normalizedBarcode = barcodeInput.replace(/§/g, '-');

      if (normalizedBarcode === SPECIAL_BARCODES.CHECKOUT) {
        onSpecialBarcode('checkout');
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
        return;
      }

      // Check if it's a discount barcode
      if (normalizedBarcode.startsWith('DISC-')) {
        const discount = await window.electronAPI.discounts.getByBarcode(normalizedBarcode.trim());
        if (discount) {
          handleApplyDiscount(discount);
          setBarcodeInput('');
          return;
        } else {
          showNotification('Discount not found!', 'error');
          setBarcodeInput('');
          return;
        }
      }

      try {
        const product = await window.electronAPI.products.getProductByBarcode(normalizedBarcode);
        if (typeof product === 'undefined') {
          throw new Error('Product not found');
        }
        onProductScanned(product);
        playSuccessSound();
      } catch (err) {
        showNotification('Product not found!', 'error');
        playErrorSound();
      }
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    }
  };

  return (
    <div style={styles.barcodeSection}>
      <style>
        {`
          .barcode-input {
            width: 100%;
            padding: 10px;
            font-size: 16px;
            border-width: 1px;
            border-color: #ddd;
            border-style: solid;
            border-radius: 4px;
            transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          }
          .barcode-input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
          }
        `}
      </style>
      <form onSubmit={handleBarcodeSubmit}>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcodeInput}
          onChange={handleBarcodeChange}
          onBlur={handleBarcodeBlur}
          className="barcode-input"
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
};

export default BarcodeScanner;
