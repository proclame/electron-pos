import React, { useState, useEffect } from 'react';

function Settings() {
  const [settings, setSettings] = useState({
    vat_number: '',
    vat_percentage: 21.0,
    company_name: '',
    company_address: '',
    currency_symbol: '€',
    thank_you_text: 'Thank you for your business!',
    logo_base64: '',
    use_printer: true,
    allow_returns: true,
    selected_printer: '',
    enable_email: 'false',
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [printers, setPrinters] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleChange = (key, value) => {
    console.log('handleChange', key, value);
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    fetchSettings();
    fetchPrinters();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await window.electronAPI.settings.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Error loading settings');
    }
  };

  const fetchPrinters = async () => {
    try {
      const data = await window.electronAPI.settings.getPrinters();
      setPrinters(data);
    } catch (error) {
      console.error('Error fetching printers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      await window.electronAPI.settings.saveSettings(settings);
      setMessage('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({
          ...prev,
          logo_base64: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({
      ...prev,
      logo_base64: '',
    }));
  };

  const handleTestPrint = async () => {
    console.log('handleTestPrint', settings.selected_printer);
    try {
      setIsPrinting(true);
      const selectedPrinter = settings.selected_printer;
      if (!selectedPrinter) {
        throw new Error('No printer selected');
      }

      const testSale = {
        id: 'TEST',
        items: [
          {
            product: {
              name: 'Test Product 1',
              unit_price: 10.0,
            },
            quantity: 1,
            subtotal: 10.0,
            discount_percentage: 0,
            total: 10.0,
          },
          {
            product: {
              name: 'Test Product 2',
              unit_price: 15.0,
            },
            quantity: 2,
            subtotal: 30.0,
            discount_percentage: 10,
            total: 27.0,
          },
        ],
        subtotal: 37.0,
        discount_amount: 5.0,
        total: 32.0,
        payment_method: 'cash',
        notes: 'Test Receipt',
        created_at: new Date().toISOString(),
      };

      await window.electronAPI.print.printReceipt(testSale, selectedPrinter);
      alert('Test receipt printed successfully!');
    } catch (error) {
      console.error('Error printing test receipt:', error);
      alert(error.message || 'Failed to print test receipt');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Settings</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="company_name">Company Name</label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={settings.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="company_address">Company Address</label>
          <textarea
            id="company_address"
            name="company_address"
            value={settings.company_address}
            onChange={(e) => handleChange('company_address', e.target.value)}
            style={styles.textarea}
            rows="4"
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="vat_number">VAT Number</label>
          <input
            type="text"
            id="vat_number"
            name="vat_number"
            value={settings.vat_number}
            onChange={(e) => handleChange('vat_number', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="vat_percentage">VAT Percentage</label>
          <input
            type="number"
            id="vat_percentage"
            name="vat_percentage"
            value={settings.vat_percentage}
            onChange={(e) => handleChange('vat_percentage', e.target.value)}
            style={styles.input}
            step="0.1"
            min="0"
            max="100"
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="currency_symbol">Currency Symbol</label>
          <input
            type="text"
            id="currency_symbol"
            name="currency_symbol"
            value={settings.currency_symbol}
            onChange={(e) => handleChange('currency_symbol', e.target.value)}
            style={styles.input}
            maxLength="3"
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="thank_you_text">Thank You Message</label>
          <textarea
            id="thank_you_text"
            name="thank_you_text"
            value={settings.thank_you_text}
            onChange={(e) => handleChange('thank_you_text', e.target.value)}
            style={styles.textarea}
            rows="4"
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label>Logo</label>
          <div style={styles.logoContainer}>
            {settings.logo_base64 ? (
              <div style={styles.logoPreview}>
                <img
                  src={settings.logo_base64}
                  alt="Logo"
                  style={styles.logoImage}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <button type="button" onClick={handleRemoveLogo} style={styles.removeButton}>
                  Remove Logo
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleLogoChange} style={styles.fileInput} />
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h3>Printer Settings</h3>
          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={settings.use_printer === 'true'}
                onChange={(e) => handleChange('use_printer', e.target.checked.toString())}
                style={styles.checkbox}
              />
              Enable Receipt Printing
            </label>
          </div>
          {settings.use_printer === 'true' && (
            <div style={styles.formGroup}>
              <label>Select Printer:</label>
              <select
                value={settings.selected_printer}
                onChange={(e) => handleChange('selected_printer', e.target.value)}
                style={styles.select}
              >
                <option value="">Select a printer...</option>
                {printers.map((printer) => (
                  <option key={printer.name} value={printer.name}>
                    {printer.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleTestPrint}
                disabled={!settings.selected_printer || isPrinting}
                style={!settings.selected_printer || isPrinting ? styles.testButtonDisabled : styles.testButton}
              >
                {isPrinting ? 'Printing...' : 'Print Test Receipt'}
              </button>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3>Sales Settings</h3>
          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={settings.allow_returns === 'true'}
                onChange={(e) => handleChange('allow_returns', e.target.checked.toString())}
                style={styles.checkbox}
              />
              Enable Returns
            </label>
            <div style={styles.helpText}>Allow processing of returns in the POS system</div>
          </div>
        </div>

        <div style={styles.section}>
          <h3>Email Settings</h3>
          <div style={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={settings.enable_email === 'true'}
                onChange={(e) => handleChange('enable_email', e.target.checked.toString())}
                style={styles.checkbox}
              />
              Enable Email Receipts
            </label>
          </div>
          {settings.enable_email === 'true' && (
            <>
              <div style={styles.formGroup}>
                <label>SMTP Host:</label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => handleChange('smtp_host', e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label>SMTP Port:</label>
                <input
                  type="text"
                  value={settings.smtp_port}
                  onChange={(e) => handleChange('smtp_port', e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.smtp_secure === 'true'}
                    onChange={(e) => handleChange('smtp_secure', e.target.checked.toString())}
                    style={styles.checkbox}
                  />
                  Use Secure Connection (SSL/TLS)
                </label>
              </div>
              <div style={styles.formGroup}>
                <label>SMTP User:</label>
                <input
                  type="text"
                  value={settings.smtp_user}
                  onChange={(e) => handleChange('smtp_user', e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label>SMTP Password:</label>
                <input
                  type="password"
                  value={settings.smtp_pass}
                  onChange={(e) => handleChange('smtp_pass', e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label>From Email:</label>
                <input
                  type="email"
                  value={settings.smtp_from}
                  onChange={(e) => handleChange('smtp_from', e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.buttonContainer}>
          <button type="submit" style={styles.button} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  input: {
    padding: '8px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  textarea: {
    padding: '8px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    resize: 'vertical',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  message: {
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  logoContainer: {
    marginTop: '10px',
  },
  logoPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  logoImage: {
    maxWidth: '200px',
    maxHeight: '100px',
    objectFit: 'contain',
  },
  removeButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  fileInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  checkbox: {
    marginRight: '10px',
  },
  select: {
    padding: '8px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
  },
  section: {
    marginTop: '20px',
  },
  helpText: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
    marginLeft: '24px',
  },
  buttonContainer: {
    textAlign: 'center',
  },
  testButton: {
    marginLeft: '10px',
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  testButtonDisabled: {
    marginLeft: '10px',
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
  },
};

export default Settings;
