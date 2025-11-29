import { useState, useEffect, useMemo } from 'react';
import { getLanguage, saveLanguage, getBatches } from '../utils/localSync';
import Sidebar from '../components/Sidebar';
import WeatherWidget from '../components/WeatherWidget';
import LanguageToggle from '../components/LanguageToggle';

// All Bangladesh divisions with Bangla names
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

// Helper to get all divisions with batch counts
const getDivisionsWithBatchCounts = (batches) => {
  // Count batches per division
  const batchCounts = {};
  batches.forEach(batch => {
    if (batch.status === 'active' && batch.division) {
      batchCounts[batch.division] = (batchCounts[batch.division] || 0) + 1;
    }
  });
  
  // Return all divisions with their batch counts
  return ALL_DIVISIONS.map(div => ({
    ...div,
    batchCount: batchCounts[div.name] || 0
  }));
};

/**
 * Weather page with notifications
 */
function Weather() {
  const [lang, setLang] = useState(getLanguage());
  const [batches, setBatches] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('Dhaka'); // Default to Dhaka
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Get all divisions with batch counts
  const allDivisions = useMemo(() => getDivisionsWithBatchCounts(batches), [batches]);
  
  useEffect(() => {
    // Load batches
    setBatches(getBatches());
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      const saved = localStorage.getItem('weatherNotifications');
      if (saved === 'true' && Notification.permission === 'granted') {
        setNotificationsEnabled(true);
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
  
  const handleNotificationToggle = async () => {
    if (!('Notification' in window)) {
      alert(lang === 'bn' ? 'এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই' : 'Notifications not supported');
      return;
    }
    
    if (!notificationsEnabled) {
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('weatherNotifications', 'true');
        
        // Show test notification
        new Notification(lang === 'bn' ? 'ফসল বাঁচাও' : 'Foshol Bachao', {
          body: lang === 'bn' 
            ? 'আবহাওয়া সতর্কতা চালু হয়েছে'
            : 'Weather alerts enabled',
          icon: '/vite.svg'
        });
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('weatherNotifications', 'false');
    }
  };
  
  return (
    <div style={styles.wrapper}>
      <Sidebar lang={lang} onLangChange={toggleLang} />
      <div style={styles.page} data-page-content>
        {/* Top Right Header - Language Toggle & Status */}
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
        <h1 style={styles.title}>
          {lang === 'bn' ? 'আবহাওয়ার পূর্বাভাস' : 'Weather Forecast'}
        </h1>
        
        {/* Location Selector - All Divisions */}
        <div style={styles.card}>
          <label style={styles.label}>
            {lang === 'bn' ? '📍 বিভাগ নির্বাচন করুন' : '📍 Select Division'}
          </label>
          {batches.filter(b => b.status === 'active').length > 0 && (
            <p style={styles.hint}>
              {lang === 'bn' 
                ? `আপনার ${batches.filter(b => b.status === 'active').length}টি সক্রিয় ব্যাচ আছে`
                : `You have ${batches.filter(b => b.status === 'active').length} active batch(es)`}
            </p>
          )}
          <select
            style={styles.select}
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {allDivisions.map(div => (
              <option key={div.name} value={div.name}>
                {lang === 'bn' ? div.nameBn : div.name}
                {div.batchCount > 0 && (lang === 'bn' ? ` (${div.batchCount} ব্যাচ)` : ` (${div.batchCount} batches)`)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Notification Settings */}
        <div style={styles.notificationCard}>
          <div style={styles.notificationHeader}>
            <div>
              <h3 style={styles.notificationTitle}>
                {lang === 'bn' ? 'সতর্কতা নোটিফিকেশন' : 'Alert Notifications'}
              </h3>
              <p style={styles.notificationDesc}>
                {lang === 'bn' 
                  ? 'বৃষ্টি বা খারাপ আবহাওয়ার সময় নোটিফিকেশন পান'
                  : 'Get notified during rain or bad weather'}
              </p>
            </div>
            <button
              style={{
                ...styles.toggleBtn,
                background: notificationsEnabled 
                  ? 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)'
                  : '#e5e7eb'
              }}
              onClick={handleNotificationToggle}
            >
              <span style={{
                ...styles.toggleDot,
                transform: notificationsEnabled ? 'translateX(24px)' : 'translateX(0)'
              }} />
            </button>
          </div>
          {notificationPermission === 'denied' && (
            <p style={styles.permissionWarning}>
              {lang === 'bn' 
                ? 'নোটিফিকেশন ব্লক করা আছে। ব্রাউজার সেটিংস থেকে অনুমতি দিন।'
                : 'Notifications blocked. Enable in browser settings.'}
            </p>
          )}
        </div>
        
        {/* Weather Widget - Always render with selected location */}
        <WeatherWidget upazila={selectedLocation} lang={lang} />
        </div>
      </div>
    </div>
  );
}

const styles = {
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
  content: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px 16px'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '20px'
  },
  card: {
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
  notificationCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    border: '2px solid #fcd34d'
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px'
  },
  notificationTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '4px'
  },
  notificationDesc: {
    fontSize: '0.85rem',
    color: '#6b7280'
  },
  toggleBtn: {
    width: '52px',
    height: '28px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.3s ease',
    flexShrink: 0
  },
  toggleDot: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.3s ease'
  },
  permissionWarning: {
    marginTop: '12px',
    padding: '10px',
    background: '#fef2f2',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: '#dc2626'
  },
  hint: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginBottom: '12px',
    fontStyle: 'italic'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '2px dashed #d1d5db',
    marginBottom: '20px'
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '12px'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '1rem',
    lineHeight: '1.6'
  }
};

export default Weather;
