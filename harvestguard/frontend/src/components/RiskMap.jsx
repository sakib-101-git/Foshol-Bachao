import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Division center coordinates for Bangladesh
const DIVISION_COORDS = {
  'Dhaka': { lat: 23.8103, lon: 90.4125, zoom: 10 },
  'Chittagong': { lat: 22.3569, lon: 91.7832, zoom: 10 },
  'Rajshahi': { lat: 24.3745, lon: 88.6042, zoom: 10 },
  'Khulna': { lat: 22.8456, lon: 89.5403, zoom: 10 },
  'Sylhet': { lat: 24.8949, lon: 91.8687, zoom: 10 },
  'Barisal': { lat: 22.7010, lon: 90.3535, zoom: 10 },
  'Rangpur': { lat: 25.7439, lon: 89.2752, zoom: 10 },
  'Mymensingh': { lat: 24.7471, lon: 90.4203, zoom: 10 }
};

// Crop types in Bangla
const CROP_TYPES_BN = {
  'Paddy': 'ধান',
  'Wheat': 'গম',
  'Maize': 'ভুট্টা',
  'Potato': 'আলু',
  'Onion': 'পেঁয়াজ',
  'Vegetables': 'শাকসবজি',
  'Lentils': 'ডাল',
  'Mustard': 'সরিষা',
  'Jute': 'পাট',
  'Sugarcane': 'আখ'
};

// Risk levels in Bangla
const RISK_LEVELS_BN = {
  'Low': 'কম',
  'Medium': 'মাঝারি',
  'High': 'উচ্চ'
};

// Generate random coordinate within radius of center
const generateRandomCoord = (centerLat, centerLon, radiusKm = 15) => {
  const radiusInDeg = radiusKm / 111; // Approximate degrees per km
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radiusInDeg;
  
  return {
    lat: centerLat + randomRadius * Math.cos(randomAngle),
    lon: centerLon + randomRadius * Math.sin(randomAngle)
  };
};

// Generate mock neighbor data
const generateMockNeighbors = (division, count = 12) => {
  const center = DIVISION_COORDS[division] || DIVISION_COORDS['Dhaka'];
  const cropTypes = Object.keys(CROP_TYPES_BN);
  const riskLevels = ['Low', 'Medium', 'High'];
  
  const neighbors = [];
  
  for (let i = 0; i < count; i++) {
    const coord = generateRandomCoord(center.lat, center.lon);
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const cropType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
    
    // Random last update time (within last 7 days)
    const hoursAgo = Math.floor(Math.random() * 168);
    const lastUpdate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    neighbors.push({
      id: `neighbor-${i + 1}`,
      lat: coord.lat,
      lon: coord.lon,
      riskLevel,
      cropType,
      lastUpdate,
      hoursAgo
    });
  }
  
  return neighbors;
};

// Custom marker icons
const createCustomIcon = (color, isUser = false) => {
  const size = isUser ? 40 : 30;
  const svg = isUser 
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle fill="#fff" cx="12" cy="9" r="3"/>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <path fill="${color}" stroke="#fff" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle fill="#fff" cx="12" cy="9" r="2.5"/>
       </svg>`;
  
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Risk color mapping
const getRiskColor = (riskLevel) => {
  const colors = {
    'Low': '#22c55e',    // Green
    'Medium': '#f59e0b', // Yellow/Amber
    'High': '#ef4444'    // Red
  };
  return colors[riskLevel] || '#6b7280';
};

// Format time ago in Bangla
const formatTimeAgoBn = (hoursAgo) => {
  if (hoursAgo < 1) return 'এইমাত্র';
  if (hoursAgo < 24) return `${Math.floor(hoursAgo)} ঘণ্টা আগে`;
  const days = Math.floor(hoursAgo / 24);
  return `${days} দিন আগে`;
};

// Component to auto-center map when division changes
function MapCenterController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lon], zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

/**
 * RiskMap Component - Local Risk Landscape Visualization
 */
function RiskMap({ division = 'Dhaka', lang = 'bn', userLocation = null }) {
  const [selectedNeighbor, setSelectedNeighbor] = useState(null);
  
  // Get center coordinates for the division
  const mapCenter = DIVISION_COORDS[division] || DIVISION_COORDS['Dhaka'];
  
  // Generate mock neighbors for the division (memoized)
  const neighbors = useMemo(() => {
    return generateMockNeighbors(division, 12);
  }, [division]);
  
  // User's location (center of division or custom)
  const farmerLocation = userLocation || {
    lat: mapCenter.lat + 0.01,
    lon: mapCenter.lon + 0.01
  };
  
  // Icons
  const userIcon = createCustomIcon('#3b82f6', true); // Blue for user
  
  return (
    <div style={styles.container}>
      {/* Legend */}
      <div style={styles.legend}>
        <h4 style={styles.legendTitle}>
          {lang === 'bn' ? 'ঝুঁকির মাত্রা' : 'Risk Level'}
        </h4>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#22c55e' }}></span>
            <span>{lang === 'bn' ? 'কম ঝুঁকি' : 'Low Risk'}</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#f59e0b' }}></span>
            <span>{lang === 'bn' ? 'মাঝারি ঝুঁকি' : 'Medium Risk'}</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#ef4444' }}></span>
            <span>{lang === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk'}</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#3b82f6' }}></span>
            <span>{lang === 'bn' ? 'আপনার অবস্থান' : 'Your Location'}</span>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
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
          
          {/* Map center controller */}
          <MapCenterController center={mapCenter} zoom={mapCenter.zoom} />
          
          {/* Farmer's own location - Blue pin */}
          <Marker 
            position={[farmerLocation.lat, farmerLocation.lon]}
            icon={userIcon}
          >
            <Popup>
              <div style={styles.popup}>
                <h4 style={styles.popupTitle}>
                  {lang === 'bn' ? '📍 আপনার অবস্থান' : '📍 Your Location'}
                </h4>
                <p style={styles.popupText}>
                  {lang === 'bn' ? division : division}
                </p>
              </div>
            </Popup>
          </Marker>
          
          {/* Neighbor markers - Color coded by risk */}
          {neighbors.map((neighbor) => (
            <Marker
              key={neighbor.id}
              position={[neighbor.lat, neighbor.lon]}
              icon={createCustomIcon(getRiskColor(neighbor.riskLevel))}
              eventHandlers={{
                click: () => setSelectedNeighbor(neighbor)
              }}
            >
              <Popup>
                <div style={styles.popup}>
                  {/* All content in Bangla */}
                  <div style={{
                    ...styles.riskBadge,
                    background: getRiskColor(neighbor.riskLevel)
                  }}>
                    ঝুঁকি: {RISK_LEVELS_BN[neighbor.riskLevel]}
                  </div>
                  
                  <div style={styles.popupRow}>
                    <span style={styles.popupLabel}>ফসল:</span>
                    <span style={styles.popupValue}>{CROP_TYPES_BN[neighbor.cropType]}</span>
                  </div>
                  
                  <div style={styles.popupRow}>
                    <span style={styles.popupLabel}>আপডেট:</span>
                    <span style={styles.popupValue}>{formatTimeAgoBn(neighbor.hoursAgo)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Stats Summary */}
      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>
            {neighbors.filter(n => n.riskLevel === 'High').length}
          </span>
          <span style={{ ...styles.statLabel, color: '#ef4444' }}>
            {lang === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk'}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>
            {neighbors.filter(n => n.riskLevel === 'Medium').length}
          </span>
          <span style={{ ...styles.statLabel, color: '#f59e0b' }}>
            {lang === 'bn' ? 'মাঝারি' : 'Medium'}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statValue}>
            {neighbors.filter(n => n.riskLevel === 'Low').length}
          </span>
          <span style={{ ...styles.statLabel, color: '#22c55e' }}>
            {lang === 'bn' ? 'কম ঝুঁকি' : 'Low Risk'}
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
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
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
    marginBottom: '12px',
    margin: 0
  },
  legendItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '10px'
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
    border: '2px solid white'
  },
  mapWrapper: {
    height: '400px',
    width: '100%'
  },
  map: {
    height: '100%',
    width: '100%'
  },
  popup: {
    minWidth: '150px',
    padding: '4px'
  },
  popupTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '8px',
    margin: '0 0 8px 0'
  },
  popupText: {
    fontSize: '0.85rem',
    color: '#374151',
    margin: 0
  },
  riskBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.9rem',
    marginBottom: '10px'
  },
  popupRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid #e5e7eb'
  },
  popupLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  popupValue: {
    fontSize: '0.85rem',
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
    fontSize: '0.8rem',
    fontWeight: '600'
  }
};

export default RiskMap;

