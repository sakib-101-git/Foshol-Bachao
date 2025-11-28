/**
 * Dashboard - Main crop batch management page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { batches as batchesApi } from '../utils/api';
import { 
  getUser, 
  getToken, 
  getLanguage, 
  saveLanguage,
  getBatches,
  saveBatches,
  getUnsyncedBatches,
  markBatchesSynced,
  saveLastSync,
  addUnsyncedBatch,
  generateId
} from '../utils/localSync';
import { exportComprehensivePDF } from '../utils/csvExport';
import { weather } from '../utils/api';
import LanguageSelectionModal from '../components/LanguageSelectionModal';
import { t } from '../utils/translations';
import Sidebar from '../components/Sidebar';
import BatchCard from '../components/BatchCard';
import BatchForm from '../components/BatchForm';
import SyncBanner from '../components/SyncBanner';
import LanguageToggle from '../components/LanguageToggle';

// Calculate risk score based on weather and storage conditions
const calculateRisk = (batch, weather) => {
  let riskScore = 0;
  
  const temp = weather?.temperature || 28;
  if (temp > 35) riskScore += 30;
  else if (temp > 32) riskScore += 15;
  
  const humidity = weather?.humidity || 70;
  if (humidity > 85) riskScore += 35;
  else if (humidity > 75) riskScore += 20;
  
  const rainChance = weather?.rainProbability || 20;
  if (rainChance > 70) riskScore += 25;
  else if (rainChance > 40) riskScore += 10;
  
  if (batch.storageType === 'Open Area') riskScore += 25;
  else if (batch.storageType === 'Jute Bag Stack') riskScore += 10;
  
  const harvestDate = new Date(batch.harvestDate);
  const today = new Date();
  const daysSinceHarvest = Math.floor((today - harvestDate) / (1000 * 60 * 60 * 24));
  if (daysSinceHarvest > 30) riskScore += 15;
  
  let etclHours = riskScore >= 70 ? 24 : riskScore >= 50 ? 72 : riskScore >= 30 ? 168 : 336;
  
  return {
    score: Math.min(riskScore, 100),
    level: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
    etclHours
  };
};

// Get location from batch
const getLocationForBatch = (batch) => {
  return batch.upazila || batch.district || batch.division || 'Sreepur';
};

function Dashboard() {
  const [lang, setLang] = useState(getLanguage());
  const [user, setUser] = useState(getUser());
  const [batches, setBatches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLangModal, setShowLangModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const navigate = useNavigate();
  
  // Auto-set demo user - no authentication required
  useEffect(() => {
    const demoUser = {
      id: 'demo-farmer-001',
      email: 'demo@harvestguard.com',
      name: 'Demo Farmer',
      preferredLanguage: lang
    };
    if (!user) {
      setUser(demoUser);
      localStorage.setItem('harvestguard_user', JSON.stringify(demoUser));
    }
  }, [lang, user]);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    async function loadBatches() {
      const localBatches = getBatches();
      setBatches(localBatches);
      
      if (isOnline) {
        try {
          const data = await batchesApi.getAll();
          setBatches(data.batches);
          saveBatches(data.batches);
        } catch (err) {
          console.error('Failed to fetch batches:', err);
        }
      }
      setLoading(false);
    }
    
    loadBatches();
  }, [isOnline]);
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  const handleAddBatch = async (batchData) => {
    const newBatch = {
      ...batchData,
      id: generateId(),
      userId: user?.id,
      status: 'active',
      createdAt: new Date().toISOString(),
      synced: false
    };
    
    if (isOnline) {
      try {
        const data = await batchesApi.create(batchData);
        newBatch.id = data.batch.id;
        newBatch.synced = true;
      } catch (err) {
        console.error('Failed to save batch online:', err);
        addUnsyncedBatch(newBatch);
      }
    } else {
      addUnsyncedBatch(newBatch);
    }
    
    setBatches(prev => [newBatch, ...prev]);
    saveBatches([newBatch, ...batches]);
    setShowForm(false);
  };
  
  const handleSync = async () => {
    const unsynced = getUnsyncedBatches();
    if (unsynced.length === 0) return;
    
    setSyncing(true);
    try {
      const data = await batchesApi.sync(unsynced);
      markBatchesSynced(data.syncedIds);
      saveLastSync();
      
      const freshData = await batchesApi.getAll();
      setBatches(freshData.batches);
      saveBatches(freshData.batches);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete this batch?')) return;
    
    try {
      if (isOnline) {
        await batchesApi.delete(id);
      }
      const updated = batches.filter(b => b.id !== id);
      setBatches(updated);
      saveBatches(updated);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };
  
  const totalWeight = batches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
  const unsyncedCount = batches.filter(b => !b.synced).length;
  
  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner}></div>
      </div>
    );
  }
  
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
        {/* Welcome */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>
            {lang === 'bn' ? 'স্বাগতম' : 'Welcome'}, {user?.name || 'Farmer'}
          </h1>
          <p style={styles.welcomeSubtitle}>
            {lang === 'bn' ? 'আপনার ফসল পরিচালনা করুন' : 'Manage your harvest'}
          </p>
        </div>
        
        {/* Sync Banner */}
        <SyncBanner 
          unsyncedCount={unsyncedCount}
          isOnline={isOnline}
          onSync={handleSync}
          isSyncing={syncing}
          lang={lang}
        />
        
        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{batches.length}</div>
            <div style={styles.statLabel}>
              {lang === 'bn' ? 'মোট ব্যাচ' : 'Total Batches'}
            </div>
          </div>
          <div style={{...styles.statCard, ...styles.statCardGold}}>
            <div style={{...styles.statValue, color: '#92400e'}}>{totalWeight.toLocaleString()}</div>
            <div style={styles.statLabel}>
              {lang === 'bn' ? 'মোট কেজি' : 'Total kg'}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div style={styles.actionsRow}>
          <button 
            style={styles.primaryBtn}
            onClick={() => setShowForm(true)}
          >
            {lang === 'bn' ? 'নতুন ব্যাচ যোগ করুন' : 'Add New Batch'}
          </button>
          <button 
            style={styles.outlineBtn}
            onClick={() => setShowLangModal(true)}
            disabled={generatingPDF || batches.length === 0}
          >
            {generatingPDF 
              ? (lang === 'bn' ? 'প্রস্তুত হচ্ছে...' : 'Generating...')
              : (lang === 'bn' ? 'রিপোর্ট ডাউনলোড' : 'Download Report')
            }
          </button>
          
          {/* Language Selection Modal */}
          <LanguageSelectionModal
            isOpen={showLangModal}
            onClose={() => setShowLangModal(false)}
            onSelect={async (selectedLang) => {
              setGeneratingPDF(true);
              try {
                // Helper to get weather for a batch
                const getWeatherForBatch = async (batch) => {
                  try {
                    const location = getLocationForBatch(batch);
                    const weatherData = await weather.get(location, selectedLang);
                    return {
                      temperature: weatherData.current?.temp || 28,
                      humidity: weatherData.current?.humidity || 70,
                      rainProbability: weatherData.forecast?.[0]?.rainProbability || 20
                    };
                  } catch (err) {
                    console.error('Weather fetch error:', err);
                    return null;
                  }
                };
                
                await exportComprehensivePDF(
                  batches,
                  selectedLang,
                  user?.name || 'Farmer',
                  calculateRisk,
                  getWeatherForBatch
                );
              } catch (err) {
                console.error('PDF generation error:', err);
                alert(lang === 'bn' ? 'PDF তৈরি করতে ত্রুটি হয়েছে' : 'Error generating PDF');
              } finally {
                setGeneratingPDF(false);
              }
            }}
            currentLang={lang}
          />
        </div>
        
        {/* Add Form */}
        {showForm && (
          <div style={styles.formContainer}>
            <BatchForm 
              lang={lang} 
              onSubmit={handleAddBatch}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
        
        {/* Batch List */}
        <div style={styles.batchSection}>
          <h2 style={styles.sectionTitle}>
            {lang === 'bn' ? 'আপনার ব্যাচসমূহ' : 'Your Batches'}
          </h2>
          
          {batches.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>🌱</p>
              <p style={styles.emptyText}>
                {lang === 'bn' 
                  ? 'এখনও কোন ব্যাচ নেই। প্রথম ব্যাচ যোগ করুন!'
                  : 'No batches yet. Add your first batch!'}
              </p>
            </div>
          ) : (
            batches.map(batch => (
              <BatchCard 
                key={batch.id} 
                batch={batch} 
                lang={lang}
                onDelete={handleDelete}
              />
            ))
          )}
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
    transition: 'margin-left 0.3s ease',
    width: 'calc(100% - 260px)',
    minHeight: '100vh'
  },
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0fdf4'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
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
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px 16px'
  },
  welcomeSection: {
    marginBottom: '20px'
  },
  welcomeTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '4px'
  },
  welcomeSubtitle: {
    color: '#6b7280',
    fontSize: '1rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  chartsSection: {
    marginBottom: '24px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  chartCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    border: '2px solid #bbf7d0'
  },
  lossPreventionCard: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    border: '2px solid #bbf7d0'
  },
  lossPreventionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '2px solid #c9a227'
  },
  lossPreventionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px'
  },
  lossPreventionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '10px'
  },
  lossPreventionIcon: {
    fontSize: '1.8rem',
    width: '50px',
    textAlign: 'center'
  },
  lossPreventionValue: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: '1.2'
  },
  lossPreventionLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '4px'
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    border: '2px solid #bbf7d0'
  },
  statCardGold: {
    borderColor: '#fcd34d',
    background: '#fffbeb'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#166534',
    marginBottom: '4px'
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '0.9rem'
  },
  actionsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    flex: 1,
    minWidth: '140px',
    padding: '14px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 15px rgba(26, 61, 26, 0.25)'
  },
  outlineBtn: {
    flex: 1,
    minWidth: '140px',
    padding: '14px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    background: '#ffffff',
    color: '#1a3d1a',
    border: '2px solid #c9a227',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  formContainer: {
    marginBottom: '24px'
  },
  batchSection: {
    marginTop: '24px'
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #c9a227'
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 20px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '2px dashed #d1d5db'
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '12px'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '1rem'
  },
  exportDropdown: {
    position: 'relative'
  },
  exportMenu: {
    display: 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    background: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
    border: '2px solid #bbf7d0',
    zIndex: 1000,
    minWidth: '200px',
    overflow: 'hidden'
  },
  exportMenuItem: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '0.95rem',
    fontWeight: '600',
    background: '#ffffff',
    color: '#1a3d1a',
    border: 'none',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'background 0.2s ease'
  }
};

// Add hover effect for export menu items
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const style = document.createElement('style');
    style.textContent = `
      .export-menu-item:hover {
        background: #f0fdf4 !important;
      }
    `;
    document.head.appendChild(style);
  });
}

export default Dashboard;
