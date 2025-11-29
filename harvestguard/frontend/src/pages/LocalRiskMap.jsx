import { useState, useEffect } from 'react';
import { getLanguage, saveLanguage, getBatches } from '../utils/localSync';
import Sidebar from '../components/Sidebar';
import RiskMap from '../components/RiskMap';
import LanguageToggle from '../components/LanguageToggle';

// All Bangladesh divisions
const ALL_DIVISIONS = [
  { name: 'Dhaka', nameBn: 'ঢাকা' },
  { name: 'Chittagong', nameBn: 'চট্টগ্রাম' },
  { name: 'Rajshahi', nameBn: 'রাজশাহী' },
  { name: 'Khulna', nameBn: 'খুলনা' },
  { name: 'Sylhet', nameBn: 'সিলেট' },
  { name: 'Barisal', nameBn: 'বরিশাল' },
  { name: 'Rangpur', nameBn: 'রংপুর' },
  { name: 'Mymensingh', nameBn: 'ময়মনসিংহ' }
];

/**
 * Local Risk Map Page - Community Risk Awareness
 * B1: Visualize the local risk landscape to foster community awareness
 */
function LocalRiskMap() {
  const [lang, setLang] = useState(getLanguage());
  const [selectedDivision, setSelectedDivision] = useState('Dhaka');
  const [batches, setBatches] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    // Load batches to get user's primary division
    const userBatches = getBatches();
    setBatches(userBatches);
    
    // Set default division based on user's batches
    if (userBatches.length > 0) {
      const primaryDivision = userBatches[0].division;
      if (primaryDivision && ALL_DIVISIONS.some(d => d.name === primaryDivision)) {
        setSelectedDivision(primaryDivision);
      }
    }
    
    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  return (
    <div style={styles.wrapper}>
      <Sidebar lang={lang} onLangChange={toggleLang} />
      <div style={styles.page} data-page-content>
        {/* Top Right Header */}
        <div style={styles.topHeader}>
          <div style={styles.statusIndicator}>
            <span style={{
              ...styles.statusDot,
              background: isOnline ? '#10b981' : '#f59e0b'
            }}></span>
            <span style={styles.statusText}>
              {isOnline 
                ? (lang === 'bn' ? 'অনলাইন' : 'Online')
                : (lang === 'bn' ? 'অফলাইন' : 'Offline')}
            </span>
          </div>
          <LanguageToggle lang={lang} onToggle={toggleLang} />
        </div>
        
        <div style={styles.content}>
          {/* Page Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>
              {lang === 'bn' ? '🗺️ স্থানীয় ঝুঁকি মানচিত্র' : '🗺️ Local Risk Map'}
            </h1>
            <p style={styles.subtitle}>
              {lang === 'bn' 
                ? 'আপনার এলাকার ফসলের ঝুঁকি দেখুন এবং সচেতন থাকুন'
                : 'View crop risks in your area and stay aware'}
            </p>
          </div>
          
          {/* Division Selector */}
          <div style={styles.selectorCard}>
            <label style={styles.label}>
              {lang === 'bn' ? '📍 বিভাগ নির্বাচন করুন' : '📍 Select Division'}
            </label>
            <select
              style={styles.select}
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              {ALL_DIVISIONS.map(div => (
                <option key={div.name} value={div.name}>
                  {lang === 'bn' ? div.nameBn : div.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Info Card */}
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>ℹ️</div>
            <div style={styles.infoContent}>
              <h4 style={styles.infoTitle}>
                {lang === 'bn' ? 'গোপনীয়তা সুরক্ষিত' : 'Privacy Protected'}
              </h4>
              <p style={styles.infoText}>
                {lang === 'bn' 
                  ? 'সমস্ত তথ্য বেনামী। কোন ব্যক্তিগত তথ্য প্রদর্শিত হয় না।'
                  : 'All data is anonymous. No personal information is displayed.'}
              </p>
            </div>
          </div>
          
          {/* Risk Map Component */}
          <RiskMap 
            division={selectedDivision} 
            lang={lang}
          />
          
          {/* Instructions */}
          <div style={styles.instructionsCard}>
            <h3 style={styles.instructionsTitle}>
              {lang === 'bn' ? '📱 ব্যবহার নির্দেশিকা' : '📱 How to Use'}
            </h3>
            <ul style={styles.instructionsList}>
              <li>
                {lang === 'bn' 
                  ? '🔵 নীল পিন আপনার অবস্থান নির্দেশ করে'
                  : '🔵 Blue pin shows your location'}
              </li>
              <li>
                {lang === 'bn' 
                  ? '🟢🟡🔴 রঙিন পিন প্রতিবেশী কৃষকদের ঝুঁকি দেখায়'
                  : '🟢🟡🔴 Colored pins show neighbor risk levels'}
              </li>
              <li>
                {lang === 'bn' 
                  ? '👆 পিনে ট্যাপ করে বিস্তারিত দেখুন'
                  : '👆 Tap on pins to see details'}
              </li>
              <li>
                {lang === 'bn' 
                  ? '✌️ দুই আঙুলে জুম করুন'
                  : '✌️ Pinch to zoom in/out'}
              </li>
            </ul>
          </div>
          
          {/* Community Alert */}
          <div style={styles.alertCard}>
            <div style={styles.alertHeader}>
              <span style={styles.alertIcon}>⚠️</span>
              <h4 style={styles.alertTitle}>
                {lang === 'bn' ? 'সম্প্রদায় সতর্কতা' : 'Community Alert'}
              </h4>
            </div>
            <p style={styles.alertText}>
              {lang === 'bn' 
                ? 'আপনার এলাকায় উচ্চ ঝুঁকিপূর্ণ ফসল থাকলে, নিজের ফসল রক্ষায় সতর্ক থাকুন। ছত্রাক ও পোকামাকড় দ্রুত ছড়াতে পারে।'
                : 'If there are high-risk crops in your area, be alert to protect your own crops. Fungus and pests can spread quickly.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f0fdf4 0%, #fefce8 100%)'
  },
  page: {
    flex: 1,
    marginLeft: '260px',
    transition: 'margin-left 0.3s ease, width 0.3s ease',
    width: 'calc(100% - 260px)',
    minHeight: '100vh'
  },
  topHeader: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 100
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  statusText: {
    color: '#1f2937'
  },
  content: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px 16px'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.95rem',
    margin: 0
  },
  selectorCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    border: '2px solid #bbf7d0'
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '10px'
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    border: '2px solid #d1d5db',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#1f2937',
    cursor: 'pointer',
    outline: 'none'
  },
  infoCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: '#eff6ff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    border: '2px solid #bfdbfe'
  },
  infoIcon: {
    fontSize: '1.5rem',
    flexShrink: 0
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 4px 0'
  },
  infoText: {
    fontSize: '0.85rem',
    color: '#3b82f6',
    margin: 0,
    lineHeight: '1.5'
  },
  instructionsCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '16px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    border: '2px solid #e5e7eb'
  },
  instructionsTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '0',
    listStyle: 'none',
    fontSize: '0.9rem',
    color: '#374151',
    lineHeight: '2'
  },
  alertCard: {
    background: '#fef2f2',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
    border: '2px solid #fecaca'
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  alertIcon: {
    fontSize: '1.2rem'
  },
  alertTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#dc2626',
    margin: 0
  },
  alertText: {
    fontSize: '0.85rem',
    color: '#7f1d1d',
    margin: 0,
    lineHeight: '1.6'
  }
};

// Responsive styles for mobile
const mobileStyles = `
  @media (max-width: 768px) {
    [data-page-content] {
      margin-left: 0 !important;
      width: 100% !important;
    }
  }
`;

// Inject mobile styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = mobileStyles;
  document.head.appendChild(styleSheet);
}

export default LocalRiskMap;

