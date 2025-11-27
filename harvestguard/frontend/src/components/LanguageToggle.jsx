/**
 * Language toggle button (English/Bangla)
 * Styled to match navigation dropdown
 */
function LanguageToggle({ lang, onToggle }) {
  return (
    <button 
      onClick={onToggle}
      aria-label="Toggle language"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 14px',
        background: '#1a3d1a',
        color: '#ffffff',
        border: '2px solid #16a34a',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '0.9rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        minWidth: '50px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {lang === 'bn' ? 'EN' : 'বাংলা'}
    </button>
  );
}

export default LanguageToggle;
