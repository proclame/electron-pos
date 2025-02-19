import React, { useState } from 'react';

function HoldNoteModal({ isOpen, onClose, onConfirm }) {
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>Put Sale on Hold</h3>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for this held sale (optional)"
                    style={styles.textarea}
                    autoFocus
                />
                <div style={styles.buttons}>
                    <button 
                        onClick={() => onClose()}
                        style={styles.cancelButton}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm(notes)}
                        style={styles.confirmButton}
                    >
                        Put on Hold
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
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
    modal: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%'
    },
    textarea: {
        width: '100%',
        minHeight: '100px',
        padding: '8px',
        marginBottom: '20px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        resize: 'vertical'
    },
    buttons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    cancelButton: {
        padding: '8px 16px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    confirmButton: {
        padding: '8px 16px',
        backgroundColor: '#ffc107',
        color: '#000',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    }
};

export default HoldNoteModal; 