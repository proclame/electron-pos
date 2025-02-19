import React, { useState, useEffect } from 'react';

function Settings() {
    const [settings, setSettings] = useState({
        vat_number: '',
        vat_percentage: 21.0,
        company_name: '',
        company_address: '',
        currency_symbol: '€'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            } else {
                setMessage('Error loading settings');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage('Error loading settings');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5001/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                setMessage('Settings saved successfully');
            } else {
                setMessage('Error saving settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                        style={styles.input}
                        maxLength="3"
                        required
                    />
                </div>

                {message && (
                    <div style={styles.message}>
                        {message}
                    </div>
                )}

                <button 
                    type="submit" 
                    style={styles.button}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </form>
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    input: {
        padding: '8px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ddd'
    },
    textarea: {
        padding: '8px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        resize: 'vertical'
    },
    button: {
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    message: {
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center'
    }
};

export default Settings; 