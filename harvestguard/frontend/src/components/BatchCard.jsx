import { t, translations } from '../utils/translations';

/**
 * Get translated storage type
 */
const getStorageType = (type, lang) => {
  if (translations.storage && translations.storage[type]) {
    return translations.storage[type][lang] || type;
  }
  return type;
};

/**
 * Get translated crop type
 */
const getCropType = (type, lang) => {
  if (translations.crops && translations.crops[type]) {
    return translations.crops[type][lang] || type;
  }
  return type;
};

/**
 * Get translated division
 */
const getDivision = (division, lang) => {
  if (translations.divisions && translations.divisions[division]) {
    return translations.divisions[division][lang] || division;
  }
  return division;
};

/**
 * Card displaying a single crop batch
 */
function BatchCard({ batch, lang, onDelete }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (lang === 'bn') {
      // Format as DD/MM/YYYY in Bangla numerals
      const day = date.getDate().toString();
      const month = (date.getMonth() + 1).toString();
      const year = date.getFullYear().toString();
      // Convert to Bangla numerals
      const bnNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const toBanglaNum = (num) => num.split('').map(d => bnNumerals[parseInt(d)] || d).join('');
      return `${toBanglaNum(day.padStart(2, '0'))}/${toBanglaNum(month.padStart(2, '0'))}/${toBanglaNum(year)}`;
    }
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };
  
  // Get weight in appropriate format
  const formatWeight = (weight) => {
    if (lang === 'bn') {
      const bnNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const toBanglaNum = (num) => num.toString().split('').map(d => bnNumerals[parseInt(d)] || d).join('');
      return toBanglaNum(weight);
    }
    return weight;
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <span style={styles.cropIcon}>🌾</span>
          <span style={styles.cropName}>
            {getCropType(batch.cropType, lang)} - {formatWeight(batch.estimatedWeightKg)} {lang === 'bn' ? 'কেজি' : 'kg'}
          </span>
        </div>
        <span style={{
          ...styles.statusBadge,
          background: batch.status === 'active' ? '#dcfce7' : '#e5e7eb',
          color: batch.status === 'active' ? '#166534' : '#374151'
        }}>
          {batch.status === 'active' 
            ? (lang === 'bn' ? 'সক্রিয়' : 'Active')
            : (lang === 'bn' ? 'সম্পন্ন' : 'Completed')}
        </span>
      </div>
      
      {/* Info Grid */}
      <div style={styles.infoGrid}>
        <div style={styles.infoItem}>
          <span style={styles.infoIcon}>📅</span>
          <span style={styles.infoText}>{formatDate(batch.harvestDate)}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoIcon}>📍</span>
          <span style={styles.infoText}>
            {batch.district || batch.upazila || ''}{batch.district ? ', ' : ''}{getDivision(batch.division, lang)}
          </span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoIcon}>📦</span>
          <span style={styles.infoText}>{getStorageType(batch.storageType, lang)}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoIcon}>{batch.synced ? '✅' : '⏳'}</span>
          <span style={{
            ...styles.infoText,
            color: batch.synced ? '#166534' : '#d97706'
          }}>
            {batch.synced 
              ? (lang === 'bn' ? 'সিঙ্ক হয়েছে' : 'Synced')
              : (lang === 'bn' ? 'সিঙ্ক হয়নি' : 'Not synced')}
          </span>
        </div>
      </div>
      
      {/* Notes */}
      {batch.notes && (
        <div style={styles.notesSection}>
          <span style={styles.notesIcon}>📝</span>
          <span style={styles.notesText}>{batch.notes}</span>
        </div>
      )}
      
      {/* Delete Button */}
      {onDelete && (
        <button 
          onClick={() => onDelete(batch.id)}
          style={styles.deleteBtn}
        >
          🗑️ {lang === 'bn' ? 'মুছুন' : 'Delete'}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    borderLeft: '5px solid #16a34a'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  cropIcon: {
    fontSize: '1.5rem'
  },
  cropName: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#166534'
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '12px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  infoIcon: {
    fontSize: '1rem',
    width: '24px',
    textAlign: 'center'
  },
  infoText: {
    fontSize: '0.95rem',
    color: '#374151',
    fontWeight: '500'
  },
  notesSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '10px',
    marginTop: '12px'
  },
  notesIcon: {
    fontSize: '1rem'
  },
  notesText: {
    fontSize: '0.9rem',
    color: '#4b5563',
    lineHeight: '1.5',
    flex: 1
  },
  deleteBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  }
};

export default BatchCard;
