import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import { getBatches } from '../utils/localSync';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DIVISION_COORDS = {
  'Dhaka':      { lat: 23.8103, lon: 90.4125, zoom: 10 },
  'Chittagong': { lat: 22.3569, lon: 91.7832, zoom: 10 },
  'Rajshahi':   { lat: 24.3745, lon: 88.6042, zoom: 10 },
  'Khulna':     { lat: 22.8456, lon: 89.5403, zoom: 10 },
  'Sylhet':     { lat: 24.8949, lon: 91.8687, zoom: 10 },
  'Barisal':    { lat: 22.7010, lon: 90.3535, zoom: 10 },
  'Rangpur':    { lat: 25.7439, lon: 89.2752, zoom: 10 },
  'Mymensingh': { lat: 24.7471, lon: 90.4203, zoom: 10 }
};

const CROP_TYPES_BN = {
  'Paddy': 'ধান', 'Wheat': 'গম', 'Maize': 'ভুট্টা', 'Potato': 'আলু',
  'Onion': 'পেঁয়াজ', 'Vegetables': 'শাকসবজি', 'Lentils': 'ডাল',
  'Mustard': 'সরিষা', 'Jute': 'পাট', 'Sugarcane': 'আখ'
};
const RISK_LEVELS_BN = { 'Low': 'কম', 'Medium': 'মাঝারি', 'High': 'উচ্চ' };

const getRiskColor = (level) =>
  ({ Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' }[level] || '#6b7280');

// Spread pins slightly so they don't overlap at the same division center
const spreadCoord = (baseLat, baseLon, index, total) => {
  if (total <= 1) return { lat: baseLat, lon: baseLon };
  const angle = (2 * Math.PI * index) / total;
  const r = 0.04 + 0.02 * Math.floor(index / 8); // ~4-6 km spread
  return { lat: baseLat + r * Math.cos(angle), lon: baseLon + r * Math.sin(angle) };
};

const createPinIcon = (color, size = 30) => L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
    <path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle fill="#fff" cx="12" cy="9" r="3"/>
  </svg>`,
  className: '',
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  popupAnchor: [0, -size]
});

const ownPinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
    <path fill="#3b82f6" stroke="#fff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <text x="12" y="12" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#fff">★</text>
  </svg>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

function formatTimeAgo(isoStr, lang) {
  if (!isoStr) return lang === 'bn' ? 'অজানা' : 'Unknown';
  const h = Math.floor((Date.now() - new Date(isoStr).getTime()) / 3600000);
  if (h < 1) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
  if (h < 24) return lang === 'bn' ? `${h} ঘণ্টা আগে` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === 'bn' ? `${d} দিন আগে` : `${d}d ago`;
}

function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lon], zoom);
  }, [center, zoom, map]);
  return null;
}

/**
 * B1 — Local Risk Map
 * Shows only real registered farmers from the backend.
 * No mock or randomly generated data.
 */
function RiskMap({ division = 'Dhaka', lang = 'bn' }) {
  const t = (bn, en) => lang === 'bn' ? bn : en;
  const mapCenter = DIVISION_COORDS[division] || DIVISION_COORDS['Dhaka'];

  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Own location from locally stored batches
  const myBatches = getBatches();
  const myDivision = myBatches.length > 0 ? (myBatches[0].division || division) : division;
  const myCenter = DIVISION_COORDS[myDivision] || mapCenter;
  const ownLocation = { lat: myCenter.lat + 0.008, lon: myCenter.lon + 0.008 };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/users/active`)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        const users = (data?.users || []).filter(u => u.division || u.district);

        // Assign spread coordinates within each division
        const divGroups = {};
        users.forEach(u => {
          const key = u.division || u.district || 'Dhaka';
          if (!divGroups[key]) divGroups[key] = [];
          divGroups[key].push(u);
        });

        const placed = [];
        Object.entries(divGroups).forEach(([div, group]) => {
          const base = DIVISION_COORDS[div] || mapCenter;
          group.forEach((u, idx) => {
            const coord = spreadCoord(base.lat, base.lon, idx, group.length);
            placed.push({ ...u, lat: coord.lat, lon: coord.lon });
          });
        });

        setFarmers(placed);
      })
      .catch(() => setFarmers([]))
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [division]);

  const highCount   = farmers.filter(f => f.riskLevel === 'High').length;
  const mediumCount = farmers.filter(f => f.riskLevel === 'Medium').length;
  const lowCount    = farmers.filter(f => f.riskLevel === 'Low').length;
  const totalCount  = farmers.length + 1; // +1 for own location

  return (
    <div style={styles.container}>
      {/* Legend */}
      <div style={styles.legend}>
        <h4 style={styles.legendTitle}>{t('ঝুঁকির মাত্রা', 'Risk Level')}</h4>
        <div style={styles.legendItems}>
          {[
            { color: '#3b82f6', label: t('আপনার অবস্থান', 'Your Location') },
            { color: '#22c55e', label: t('কম ঝুঁকি', 'Low Risk') },
            { color: '#f59e0b', label: t('মাঝারি ঝুঁকি', 'Medium Risk') },
            { color: '#ef4444', label: t('উচ্চ ঝুঁকি', 'High Risk') },
          ].map(({ color, label }) => (
            <div key={label} style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={styles.mapWrapper}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lon]}
          zoom={mapCenter.zoom}
          style={styles.map}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterController center={mapCenter} zoom={mapCenter.zoom} />

          {/* Own location — blue star pin */}
          <Marker position={[ownLocation.lat, ownLocation.lon]} icon={ownPinIcon}>
            <Popup>
              <div style={styles.popup}>
                <div style={{ ...styles.riskBadge, background: '#3b82f6' }}>
                  {t('👤 আপনার অবস্থান', '👤 Your Location')}
                </div>
                <p style={styles.popupHint}>
                  {t(`নিবন্ধিত বিভাগ: ${myDivision}`, `Registered division: ${myDivision}`)}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Real farmers from backend */}
          {farmers.map((f) => (
            <Marker
              key={f.anonId}
              position={[f.lat, f.lon]}
              icon={createPinIcon(getRiskColor(f.riskLevel || 'Low'))}
            >
              <Popup>
                <div style={styles.popup}>
                  <div style={{ ...styles.riskBadge, background: getRiskColor(f.riskLevel || 'Low') }}>
                    ঝুঁকি: {RISK_LEVELS_BN[f.riskLevel] || 'কম'}
                  </div>
                  {f.cropTypes && f.cropTypes.length > 0 && (
                    <div style={styles.popupRow}>
                      <span style={styles.popupLabel}>ফসল:</span>
                      <span style={styles.popupValue}>
                        {f.cropTypes.slice(0, 2).map(c => CROP_TYPES_BN[c] || c).join(', ')}
                      </span>
                    </div>
                  )}
                  <div style={styles.popupRow}>
                    <span style={styles.popupLabel}>এলাকা:</span>
                    <span style={styles.popupValue}>{f.division || f.district}</span>
                  </div>
                  <div style={styles.popupRow}>
                    <span style={styles.popupLabel}>আপডেট:</span>
                    <span style={styles.popupValue}>{formatTimeAgo(f.lastSeen, lang)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Empty state overlay */}
        {!loading && farmers.length === 0 && (
          <div style={styles.emptyOverlay}>
            <div style={styles.emptyBox}>
              <div style={styles.emptyIcon}>👥</div>
              <p style={styles.emptyTitle}>
                {t('এই এলাকায় এখনো কোনো কৃষক নিবন্ধিত হয়নি', 'No other farmers registered in this area yet')}
              </p>
              <p style={styles.emptyHint}>
                {t('অন্য কৃষকরা নিবন্ধন করলে তাদের অবস্থান এখানে দেখাবে', 'When other farmers register, their locations will appear here')}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div style={styles.emptyOverlay}>
            <div style={styles.emptyBox}>
              <div style={styles.loadingSpinner} />
              <p style={styles.emptyHint}>{t('লোড হচ্ছে...', 'Loading...')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{totalCount}</span>
          <span style={{ ...styles.statLabel, color: '#3b82f6' }}>
            {t('সক্রিয় কৃষক', 'Active Farmers')}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{highCount}</span>
          <span style={{ ...styles.statLabel, color: '#ef4444' }}>
            {t('উচ্চ ঝুঁকি', 'High Risk')}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{mediumCount}</span>
          <span style={{ ...styles.statLabel, color: '#f59e0b' }}>
            {t('মাঝারি', 'Medium')}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{lowCount}</span>
          <span style={{ ...styles.statLabel, color: '#22c55e' }}>
            {t('কম ঝুঁকি', 'Low Risk')}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '2px solid #bbf7d0'
  },
  legend: {
    padding: '16px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    borderBottom: '3px solid #c9a227'
  },
  legendTitle: {
    color: '#c9a227',
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 10px 0'
  },
  legendItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ffffff',
    fontSize: '0.85rem'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    flexShrink: 0
  },
  mapWrapper: {
    height: '420px',
    width: '100%',
    position: 'relative'
  },
  map: {
    height: '100%',
    width: '100%'
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    pointerEvents: 'none'
  },
  emptyBox: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '12px',
    padding: '16px 20px',
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    maxWidth: '280px'
  },
  emptyIcon: {
    fontSize: '2rem',
    marginBottom: '6px'
  },
  emptyTitle: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#1a3d1a',
    margin: '0 0 4px 0'
  },
  emptyHint: {
    fontSize: '0.78rem',
    color: '#6b7280',
    margin: 0
  },
  loadingSpinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#1a3d1a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 8px'
  },
  popup: {
    minWidth: '150px',
    padding: '4px'
  },
  riskBadge: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '20px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.88rem',
    marginBottom: '8px'
  },
  popupHint: {
    fontSize: '0.8rem',
    color: '#6b7280',
    margin: 0
  },
  popupRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid #e5e7eb',
    gap: '12px'
  },
  popupLabel: {
    fontSize: '0.82rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  popupValue: {
    fontSize: '0.82rem',
    color: '#1f2937',
    fontWeight: '600'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px',
    background: '#f0fdf4',
    borderTop: '2px solid #bbf7d0'
  },
  statItem: {
    textAlign: 'center'
  },
  statValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a3d1a'
  },
  statLabel: {
    fontSize: '0.78rem',
    fontWeight: '600'
  }
};

if (typeof document !== 'undefined' && !document.getElementById('riskmap-spin')) {
  const s = document.createElement('style');
  s.id = 'riskmap-spin';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

export default RiskMap;
