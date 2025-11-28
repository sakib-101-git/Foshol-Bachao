import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportApi, batches as batchesApi } from '../utils/api';
import { 
  getUser, 
  getToken, 
  getLanguage, 
  saveLanguage,
  getBatches,
  clearAll 
} from '../utils/localSync';
import Sidebar from '../components/Sidebar';
import BadgeList from '../components/BadgeList';

/**
 * User profile page
 */
function Profile() {
  const [lang, setLang] = useState(getLanguage());
  const [user, setUser] = useState(getUser());
  const [badges, setBadges] = useState([]);
  const [lossStats, setLossStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // No authentication required - auto-set demo user
  useEffect(() => {
    if (!user) {
      const demoUser = {
        id: 'demo-farmer-001',
        email: 'demo@harvestguard.com',
        name: 'Demo Farmer',
        preferredLanguage: getLanguage()
      };
      setUser(demoUser);
    }
  }, [user]);
  
  useEffect(() => {
    async function loadData() {
      try {
        const [badgesData, statsData] = await Promise.all([
          exportApi.getBadges().catch(() => ({ badges: [] })),
          batchesApi.getLossStats().catch(() => null)
        ]);
        setBadges(badgesData.badges || []);
        setLossStats(statsData);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  const handleLogout = () => {
    clearAll();
    navigate('/');
  };
  
  const batches = getBatches();
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === 'active').length;
  const totalWeight = batches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
  const syncedBatches = batches.filter(b => b.synced).length;
  
  // Calculate loss stats from local data if API stats unavailable
  const localLossStats = batches.reduce((acc, b) => {
    acc.totalHarvested += b.estimatedWeightKg || 0;
    acc.totalLost += b.totalLossKg || 0;
    acc.batchesWithLoss += (b.totalLossKg && b.totalLossKg > 0) ? 1 : 0;
    return acc;
  }, { totalHarvested: 0, totalLost: 0, batchesWithLoss: 0 });
  
  const stats = lossStats || {
    totalHarvested: localLossStats.totalHarvested,
    totalLost: localLossStats.totalLost,
    totalSaved: localLossStats.totalHarvested - localLossStats.totalLost,
    successRate: localLossStats.totalHarvested > 0 
      ? ((localLossStats.totalHarvested - localLossStats.totalLost) / localLossStats.totalHarvested * 100).toFixed(1)
      : 100,
    lossEventsCount: localLossStats.batchesWithLoss
  };
  
  const successRate = parseFloat(stats.successRate || 100);
  
  return (
    <div style={styles.wrapper}>
      <Sidebar lang={lang} onLangChange={toggleLang} />
      <div style={styles.page} data-page-content>
        <div style={styles.content}>
        <h1 style={styles.title}>
          {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
        </h1>
        
        {/* User Card */}
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            {user?.name?.[0]?.toUpperCase() || 'F'}
          </div>
          <div style={styles.userInfo}>
            <h2 style={styles.userName}>{user?.name || 'Farmer'}</h2>
            <p style={styles.userEmail}>{user?.email}</p>
            {user?.phone && <p style={styles.userPhone}>{user.phone}</p>}
          </div>
        </div>
        
        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalBatches}</div>
            <div style={styles.statLabel}>
              {lang === 'bn' ? 'মোট ব্যাচ' : 'Total Batches'}
            </div>
          </div>
          <div style={{...styles.statCard, ...styles.statGold}}>
            <div style={{...styles.statValue, color: '#92400e'}}>{totalWeight.toLocaleString()}</div>
            <div style={styles.statLabel}>
              {lang === 'bn' ? 'মোট কেজি' : 'Total kg'}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{activeBatches}</div>
            <div style={styles.statLabel}>
              {lang === 'bn' ? 'সক্রিয়' : 'Active'}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{syncedBatches}/{totalBatches}</div>
            <div style={styles.statLabel}>
              {lang === 'bn' ? 'সিঙ্ক' : 'Synced'}
            </div>
          </div>
        </div>
        
        {/* Loss Tracking & Success Rate */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            {lang === 'bn' ? 'ক্ষতি ট্র্যাকিং এবং সাফল্যের হার' : 'Loss Tracking & Success Rate'}
          </h3>
          
          {/* Success Rate */}
          <div style={styles.successRateCard}>
            <div style={styles.successRateHeader}>
              <span style={styles.successRateIcon}>
                {successRate >= 90 ? '🎉' : successRate >= 75 ? '✅' : successRate >= 50 ? '⚠️' : '❌'}
              </span>
              <div>
                <div style={styles.successRateValue}>{successRate}%</div>
                <div style={styles.successRateLabel}>
                  {lang === 'bn' ? 'সফলতার হার' : 'Success Rate'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${successRate}%`,
                background: successRate >= 90 ? '#10b981' : successRate >= 75 ? '#3b82f6' : successRate >= 50 ? '#f59e0b' : '#ef4444'
              }} />
            </div>
          </div>
          
          {/* Loss Stats */}
          <div style={styles.lossStatsGrid}>
            <div style={styles.lossStatItem}>
              <div style={styles.lossStatIcon}>📦</div>
              <div style={styles.lossStatContent}>
                <div style={styles.lossStatValue}>{stats.totalHarvested?.toLocaleString() || 0}</div>
                <div style={styles.lossStatLabel}>
                  {lang === 'bn' ? 'মোট সংগ্রহ' : 'Total Harvested'}
                </div>
              </div>
            </div>
            
            <div style={styles.lossStatItem}>
              <div style={{...styles.lossStatIcon, color: '#ef4444'}}>📉</div>
              <div style={styles.lossStatContent}>
                <div style={{...styles.lossStatValue, color: '#ef4444'}}>
                  {stats.totalLost?.toLocaleString() || 0}
                </div>
                <div style={styles.lossStatLabel}>
                  {lang === 'bn' ? 'মোট ক্ষতি' : 'Total Lost'}
                </div>
              </div>
            </div>
            
            <div style={styles.lossStatItem}>
              <div style={{...styles.lossStatIcon, color: '#10b981'}}>💚</div>
              <div style={styles.lossStatContent}>
                <div style={{...styles.lossStatValue, color: '#10b981'}}>
                  {stats.totalSaved?.toLocaleString() || stats.totalHarvested || 0}
                </div>
                <div style={styles.lossStatLabel}>
                  {lang === 'bn' ? 'সংরক্ষিত' : 'Saved'}
                </div>
              </div>
            </div>
            
            <div style={styles.lossStatItem}>
              <div style={styles.lossStatIcon}>📊</div>
              <div style={styles.lossStatContent}>
                <div style={styles.lossStatValue}>{stats.lossEventsCount || 0}</div>
                <div style={styles.lossStatLabel}>
                  {lang === 'bn' ? 'ক্ষতি ঘটনা' : 'Loss Events'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Info Message */}
          <div style={styles.infoMessage}>
            {successRate >= 90 ? (
              <p>
                {lang === 'bn' 
                  ? '🎉 অসাধারণ! আপনার ফসল রক্ষার হার খুব ভালো।'
                  : '🎉 Excellent! Your crop preservation rate is very good.'}
              </p>
            ) : successRate >= 75 ? (
              <p>
                {lang === 'bn' 
                  ? '✅ ভালো! আরও সতর্কতা দিয়ে ফসল রক্ষা করুন।'
                  : '✅ Good! Continue protecting crops with more care.'}
              </p>
            ) : (
              <p>
                {lang === 'bn' 
                  ? '⚠️ আবহাওয়ার পূর্বাভাস এবং ঝুঁকি বিশ্লেষণ বেশি ব্যবহার করুন।'
                  : '⚠️ Use weather forecasts and risk analysis more often.'}
              </p>
            )}
          </div>
        </div>
        
        {/* Language */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            {lang === 'bn' ? 'ভাষা' : 'Language'}
          </h3>
          <div style={styles.langButtons}>
            <button 
              style={{
                ...styles.langBtn,
                ...(lang === 'bn' ? styles.langBtnActive : {})
              }}
              onClick={() => { setLang('bn'); saveLanguage('bn'); }}
            >
              বাংলা
            </button>
            <button 
              style={{
                ...styles.langBtn,
                ...(lang === 'en' ? styles.langBtnActive : {})
              }}
              onClick={() => { setLang('en'); saveLanguage('en'); }}
            >
              English
            </button>
          </div>
        </div>
        
        {/* Badges */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            {lang === 'bn' ? 'ব্যাজ' : 'Badges'}
          </h3>
          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
            </div>
          ) : (
            <BadgeList badges={badges} lang={lang} />
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
  userCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
    border: '2px solid #bbf7d0'
  },
  userAvatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(26, 61, 26, 0.3)'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '4px'
  },
  userEmail: {
    fontSize: '0.95rem',
    color: '#6b7280'
  },
  userPhone: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginTop: '2px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '20px'
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    border: '2px solid #bbf7d0'
  },
  statGold: {
    borderColor: '#fcd34d',
    background: '#fffbeb'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#166534',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#6b7280'
  },
  sectionCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '2px solid #e5e7eb'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '2px solid #c9a227'
  },
  langButtons: {
    display: 'flex',
    gap: '12px'
  },
  langBtn: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: '600',
    background: '#ffffff',
    color: '#1a3d1a',
    border: '2px solid #d1d5db',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  },
  langBtnActive: {
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    borderColor: '#1a3d1a'
  },
  loadingBox: {
    padding: '30px',
    display: 'flex',
    justifyContent: 'center'
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  logoutBtn: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    background: '#ffffff',
    color: '#dc2626',
    border: '2px solid #fecaca',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '8px'
  },
  successRateCard: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid #bbf7d0'
  },
  successRateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  },
  successRateIcon: {
    fontSize: '2.5rem'
  },
  successRateValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#166534',
    lineHeight: '1.2'
  },
  successRateLabel: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginTop: '4px'
  },
  progressBar: {
    width: '100%',
    height: '12px',
    background: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.5s ease'
  },
  lossStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  lossStatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e5e7eb'
  },
  lossStatIcon: {
    fontSize: '1.5rem',
    width: '40px',
    textAlign: 'center'
  },
  lossStatContent: {
    flex: 1
  },
  lossStatValue: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: '1.2'
  },
  lossStatLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '2px'
  },
  infoMessage: {
    padding: '12px',
    background: '#fffbeb',
    borderRadius: '8px',
    border: '1px solid #fcd34d',
    fontSize: '0.9rem',
    color: '#92400e',
    textAlign: 'center'
  }
};

export default Profile;
