import { useState } from 'react';

/**
 * Language Selection Modal for PDF Export
 */
function LanguageSelectionModal({ isOpen, onClose, onSelect, currentLang }) {
  const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    onSelect(selectedLang);
    onClose();
  };
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>
          {currentLang === 'bn' ? 'পিডিএফ ভাষা নির্বাচন করুন' : 'Select PDF Language'}
        </h2>
        <p style={styles.subtitle}>
          {currentLang === 'bn' 
            ? 'আপনি কোন ভাষায় রিপোর্ট ডাউনলোড করতে চান?' 
            : 'In which language would you like to download the report?'}
        </p>
        
        <div style={styles.options}>
          <button
            style={{
              ...styles.optionBtn,
              ...(selectedLang === 'en' ? styles.optionBtnActive : {})
            }}
            onClick={() => setSelectedLang('en')}
          >
            <span style={styles.flag}>🇬🇧</span>
            <div>
              <div style={styles.optionTitle}>English</div>
              <div style={styles.optionDesc}>Download in English</div>
            </div>
            {selectedLang === 'en' && <span style={styles.checkmark}>✓</span>}
          </button>
          
          <button
            style={{
              ...styles.optionBtn,
              ...(selectedLang === 'bn' ? styles.optionBtnActive : {})
            }}
            onClick={() => setSelectedLang('bn')}
          >
            <span style={styles.flag}>🇧🇩</span>
            <div>
              <div style={styles.optionTitle}>বাংলা</div>
              <div style={styles.optionDesc}>বাংলায় ডাউনলোড</div>
            </div>
            {selectedLang === 'bn' && <span style={styles.checkmark}>✓</span>}
          </button>
        </div>
        
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>
            {currentLang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button style={styles.confirmBtn} onClick={handleConfirm}>
            {currentLang === 'bn' ? 'ডাউনলোড করুন' : 'Download'}
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
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modal: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '24px',
    textAlign: 'center'
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    fontFamily: 'inherit'
  },
  optionBtnActive: {
    borderColor: '#16a34a',
    background: '#f0fdf4',
    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)'
  },
  flag: {
    fontSize: '2rem'
  },
  optionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '4px'
  },
  optionDesc: {
    fontSize: '0.9rem',
    color: '#6b7280'
  },
  checkmark: {
    marginLeft: 'auto',
    fontSize: '1.5rem',
    color: '#16a34a',
    fontWeight: 'bold'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  },
  confirmBtn: {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)'
  }
};

export default LanguageSelectionModal;






