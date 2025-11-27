import { getBatches } from '../utils/localSync';

/**
 * Badge definitions for client-side calculation
 */
const BADGE_DEFINITIONS = {
  'first-harvest': {
    name: 'First Harvest Logged',
    nameBn: 'প্রথম ফসল নিবন্ধিত',
    description: 'Logged your first crop batch',
    descriptionBn: 'আপনার প্রথম ফসল ব্যাচ নিবন্ধন করেছেন',
    icon: '🥇',
    check: (batches) => batches.length >= 1
  },
  '1000kg-club': {
    name: '1000KG Club',
    nameBn: '১০০০ কেজি ক্লাব',
    description: 'Logged over 1000kg of harvest',
    descriptionBn: '১০০০ কেজির বেশি ফসল নিবন্ধন করেছেন',
    icon: '🏆',
    check: (batches) => batches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0) >= 1000
  },
  'batch-veteran': {
    name: 'Batch Veteran',
    nameBn: 'ব্যাচ ভেটেরান',
    description: 'Logged 5 or more crop batches',
    descriptionBn: '৫টি বা তার বেশি ফসল ব্যাচ নিবন্ধন করেছেন',
    icon: '🌾',
    check: (batches) => batches.length >= 5
  },
  'sync-master': {
    name: 'Sync Master',
    nameBn: 'সিঙ্ক মাস্টার',
    description: 'First successful sync from offline mode',
    descriptionBn: 'অফলাইন থেকে প্রথম সফল সিঙ্ক',
    icon: '🔄',
    check: (batches) => batches.some(b => b.synced)
  }
};

/**
 * Calculate badges based on local data (offline-compatible)
 */
function calculateLocalBadges() {
  const batches = getBatches();
  const earned = [];
  
  Object.entries(BADGE_DEFINITIONS).forEach(([key, badge]) => {
    if (badge.check(batches)) {
      earned.push({
        id: key,
        key,
        ...badge
      });
    }
  });
  
  return earned;
}

/**
 * Display list of earned badges
 */
function BadgeList({ badges, lang }) {
  // Merge server badges with locally calculated ones
  const localBadges = calculateLocalBadges();
  const allBadges = badges && badges.length > 0 ? badges : localBadges;
  
  // Get all possible badges for progress display
  const totalPossible = Object.keys(BADGE_DEFINITIONS).length;
  const earnedCount = allBadges.length;
  
  if (allBadges.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</p>
        <p style={{ color: '#6b7280' }}>
          {lang === 'bn' 
            ? 'ব্যাচ যোগ করে ব্যাজ অর্জন করুন!' 
            : 'Add batches to earn badges!'}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Progress indicator */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        background: '#fef3c7', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <span style={{ fontWeight: '600' }}>
          {lang === 'bn' 
            ? `🏅 ${earnedCount}/${totalPossible} ব্যাজ অর্জিত` 
            : `🏅 ${earnedCount}/${totalPossible} badges earned`}
        </span>
      </div>
      
      {/* Badge grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '12px' 
      }}>
        {allBadges.map(badge => (
          <div 
            key={badge.id || badge.key} 
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              textAlign: 'center',
              border: '2px solid #86efac',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
              {badge.icon}
            </div>
            <h4 style={{ 
              fontSize: '0.85rem', 
              fontWeight: '700', 
              color: '#166534',
              marginBottom: '4px'
            }}>
              {lang === 'bn' ? badge.nameBn : badge.name}
            </h4>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#4ade80',
              lineHeight: '1.3'
            }}>
              {lang === 'bn' ? badge.descriptionBn : badge.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BadgeList;

