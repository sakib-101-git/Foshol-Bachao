import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002/api';

function PestIdentifier({ cropType, location, lang: parentLang = 'bn' }) {
  const [localLang, setLocalLang] = useState(parentLang);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper: pick Bangla or English string
  const t = (bn, en) => localLang === 'bn' ? bn : en;

  const toggleLang = () => setLocalLang(l => l === 'bn' ? 'en' : 'bn');

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন', 'Please select an image file'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('ছবির আকার ৫ এমবি এর বেশি হতে পারবে না', 'Image size must be less than 5MB'));
      return;
    }
    setError(null);
    setSelectedImage(file);
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleIdentify = async () => {
    if (!imagePreview) {
      setError(t('অনুগ্রহ করে একটি ছবি নির্বাচন করুন', 'Please select an image'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/pest/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvestguard_token') || 'demo-token-auto-login'}`
        },
        body: JSON.stringify({
          imageBase64: imagePreview,
          cropType: cropType || 'Unknown',
          location: location || 'Bangladesh'
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || t('পোকা শনাক্ত করতে ব্যর্থ', 'Failed to identify pest'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  const getRiskColor = (risk) => ({ High: '#dc2626', Medium: '#f59e0b', Low: '#16a34a' }[risk] || '#6b7280');

  const getStatusStyle = (risk) => {
    const map = {
      High:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
      Medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
      Low:    { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    };
    return map[risk] || map.Low;
  };

  // Derived display values (switch with localLang)
  const pestDisplayName  = result ? t(result.pestNameBn, result.pestName) : '';
  const pestSecondary    = result ? t(result.pestName,   result.pestNameBn || '') : '';
  const riskDisplay      = result ? t(result.riskLevelBn, result.riskLevel) : '';
  const descDisplay      = result ? t(result.description, result.descriptionEn || result.description) : '';
  const immediateList    = result?.treatmentPlan
    ? (localLang === 'bn' ? result.treatmentPlan.immediateBn : (result.treatmentPlan.immediateEn || result.treatmentPlan.immediateBn))
    : [];
  const preventiveList   = result?.treatmentPlan
    ? (localLang === 'bn' ? result.treatmentPlan.preventiveBn : (result.treatmentPlan.preventiveEn || result.treatmentPlan.preventiveBn))
    : [];

  return (
    <div style={styles.container}>
      {/* Header row with title + language toggle */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          {t('🐛 পোকা শনাক্তকরণ', '🐛 Pest Identification')}
        </h3>
        <button onClick={toggleLang} style={styles.langBtn}>
          {localLang === 'bn' ? 'EN' : 'বাংলা'}
        </button>
      </div>

      {/* Upload zone */}
      {!imagePreview ? (
        <div
          style={{ ...styles.uploadZone, ...(dragActive ? styles.uploadZoneActive : {}) }}
          onDragEnter={handleDrag} onDragLeave={handleDrag}
          onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => document.getElementById('pest-file-input').click()}
        >
          <input
            id="pest-file-input"
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
          <div style={styles.uploadIcon}>📷</div>
          <p style={styles.uploadText}>{t('পোকা বা ক্ষতির ছবি আপলোড করুন', 'Upload a pest or damage image')}</p>
          <p style={styles.uploadHint}>{t('ক্লিক করুন বা টেনে আনুন — JPEG/PNG/WEBP, ৫ এমবি পর্যন্ত', 'Click or drag & drop — JPEG/PNG/WEBP, up to 5MB')}</p>
        </div>
      ) : (
        <div style={styles.previewCard}>
          <div style={styles.imageWrapper}>
            <img src={imagePreview} alt="Preview" style={styles.previewImage} />
            {loading && (
              <div style={styles.overlay}>
                <div style={styles.spinner} />
                <p style={styles.overlayText}>{t('শনাক্ত করা হচ্ছে...', 'Identifying...')}</p>
              </div>
            )}
          </div>

          {!result && !loading && (
            <div style={styles.actionRow}>
              <button style={styles.identifyBtn} onClick={handleIdentify}>
                🔍 {t('পোকা শনাক্ত করুন', 'Identify Pest')}
              </button>
              <button style={styles.cancelBtn} onClick={handleReset}>
                {t('বাতিল', 'Cancel')}
              </button>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>⚠️ {error}</p>
              <button style={styles.retryBtn} onClick={handleIdentify}>
                {t('আবার চেষ্টা করুন', 'Try Again')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={styles.resultCard}>

          {/* Risk status badge */}
          <div style={{ ...styles.statusBadge, background: getRiskColor(result.riskLevel) }}>
            {t(
              result.riskLevel === 'High' ? 'উচ্চ ঝুঁকি' : result.riskLevel === 'Medium' ? 'মাঝারি ঝুঁকি' : 'কম ঝুঁকি',
              `${result.riskLevel} Risk`
            )}
          </div>

          {/* Pest name */}
          <div style={styles.nameBox}>
            <div style={styles.namePrimary}>{pestDisplayName}</div>
            {pestSecondary && pestSecondary !== pestDisplayName && (
              <div style={styles.nameSecondary}>{pestSecondary}</div>
            )}
            {result.scientificName && (
              <div style={styles.nameScientific}><em>{result.scientificName}</em></div>
            )}
          </div>

          {/* Confidence + severity row */}
          <div style={styles.metaRow}>
            {result.confidence > 0 && (
              <div style={styles.confRow}>
                <span style={styles.confLabel}>{t('নির্ভুলতা', 'Confidence')}</span>
                <div style={styles.confBar}>
                  <div style={{ ...styles.confFill, width: `${result.confidence}%`, background: getRiskColor(result.riskLevel) }} />
                </div>
                <span style={styles.confValue}>{result.confidence}%</span>
              </div>
            )}
            <span style={{ ...styles.riskBadge, ...getStatusStyle(result.riskLevel) }}>
              {t('ঝুঁকি:', 'Risk:')} {riskDisplay}
            </span>
          </div>

          {/* Description */}
          {descDisplay && (
            <div style={styles.descBox}>
              <p style={styles.descText}>{descDisplay}</p>
            </div>
          )}

          {/* Treatment — Immediate */}
          {immediateList?.length > 0 && (
            <div style={{ ...styles.treatBox, borderColor: '#fecaca', background: '#fff5f5' }}>
              <h4 style={{ ...styles.treatTitle, color: '#dc2626' }}>
                ⚡ {t('তাৎক্ষণিক পদক্ষেপ', 'Immediate Actions')}
              </h4>
              <ul style={{ ...styles.treatList, color: '#7f1d1d' }}>
                {immediateList.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}

          {/* Treatment — Preventive */}
          {preventiveList?.length > 0 && (
            <div style={styles.treatBox}>
              <h4 style={styles.treatTitle}>
                🛡️ {t('প্রতিরোধমূলক ব্যবস্থা', 'Preventive Measures')}
              </h4>
              <ul style={styles.treatList}>
                {preventiveList.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}

          {/* Other suggestions */}
          {result.allSuggestions?.length > 1 && (
            <div style={styles.suggestionsBox}>
              <h4 style={styles.suggestionsTitle}>
                {t('অন্যান্য সম্ভাবনা', 'Other Possibilities')}
              </h4>
              {result.allSuggestions.map((s, i) => (
                <div key={i} style={styles.suggestionRow}>
                  <span style={styles.suggestionName}>
                    {t(s.nameBn || s.commonName, s.commonName)}
                  </span>
                  <span style={styles.suggestionProb}>{s.probability}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Source */}
          <div style={styles.sourceRow}>
            <span style={styles.sourceText}>
              {t('উৎস: Kindwise Insect.id', 'Source: Kindwise Insect.id')}
            </span>
          </div>

          {/* Scan again */}
          <button style={styles.scanAgainBtn} onClick={handleReset}>
            {t('🔄 নতুন ছবি স্ক্যান করুন', '🔄 Scan Another Image')}
          </button>
        </div>
      )}

      {/* Tips */}
      {!imagePreview && (
        <div style={styles.tipsBox}>
          <p style={styles.tipsTitle}>{t('ভালো ফলাফলের জন্য', 'For best results')}</p>
          <div style={styles.tipsGrid}>
            {[
              [t('পোকা দেখান', 'Show the insect'), '🐛'],
              [t('কাছ থেকে', 'Close-up'), '🔍'],
              [t('ভালো আলো', 'Good lighting'), '☀️'],
              [t('পরিষ্কার ছবি', 'Clear image'), '📷'],
            ].map(([label, icon]) => (
              <div key={label} style={styles.tipItem}>
                <span>{icon}</span>
                <p>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '2px solid #bbf7d0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1a3d1a',
    margin: 0
  },
  langBtn: {
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  uploadZone: {
    border: '3px dashed #c9a227',
    borderRadius: '12px',
    background: '#fefce8',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '16px'
  },
  uploadZoneActive: {
    borderColor: '#1a3d1a',
    background: '#f0fdf4'
  },
  uploadIcon: { fontSize: '2.5rem', marginBottom: '8px' },
  uploadText: { fontSize: '1rem', fontWeight: '600', color: '#1a3d1a', margin: '0 0 6px 0' },
  uploadHint: { fontSize: '0.8rem', color: '#6b7280', margin: 0 },
  previewCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px',
    border: '2px solid #e5e7eb'
  },
  imageWrapper: { position: 'relative' },
  previewImage: { width: '100%', display: 'block', maxHeight: '320px', objectFit: 'cover' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(26,61,26,0.85)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  },
  spinner: {
    width: '36px', height: '36px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTopColor: '#c9a227',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px'
  },
  overlayText: { color: '#fff', fontSize: '0.95rem', fontWeight: '500' },
  actionRow: { display: 'flex', gap: '10px', padding: '14px' },
  identifyBtn: {
    flex: 1, padding: '13px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
  },
  cancelBtn: {
    padding: '13px 18px', background: '#fff', color: '#6b7280',
    border: '2px solid #e5e7eb', borderRadius: '10px',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit'
  },
  errorBox: { padding: '14px', background: '#fef2f2', textAlign: 'center' },
  errorText: { color: '#dc2626', marginBottom: '8px' },
  retryBtn: {
    padding: '8px 18px', background: '#dc2626', color: '#fff',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600'
  },
  resultCard: {
    background: '#fff', borderRadius: '14px', padding: '18px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '16px'
  },
  statusBadge: {
    textAlign: 'center', padding: '12px', borderRadius: '10px',
    color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '14px'
  },
  nameBox: {
    textAlign: 'center', padding: '10px', background: '#f9fafb',
    borderRadius: '10px', marginBottom: '14px'
  },
  namePrimary: { fontSize: '1.3rem', fontWeight: '700', color: '#1a3d1a', marginBottom: '4px' },
  nameSecondary: { fontSize: '0.9rem', color: '#6b7280', marginBottom: '2px' },
  nameScientific: { fontSize: '0.8rem', color: '#9ca3af' },
  metaRow: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' },
  confRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  confLabel: { fontSize: '0.8rem', color: '#6b7280', minWidth: '70px' },
  confBar: { flex: 1, height: '9px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: '5px', transition: 'width 0.5s ease' },
  confValue: { fontSize: '0.95rem', fontWeight: '700', color: '#374151', minWidth: '40px', textAlign: 'right' },
  riskBadge: {
    display: 'inline-block', padding: '5px 14px', borderRadius: '20px',
    fontSize: '0.82rem', fontWeight: '600', border: '1px solid', alignSelf: 'flex-start'
  },
  descBox: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: '10px', padding: '10px 12px', marginBottom: '14px'
  },
  descText: { color: '#166534', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 },
  treatBox: {
    background: '#f0fdf4', borderRadius: '10px', padding: '12px',
    marginBottom: '12px', border: '2px solid #bbf7d0'
  },
  treatTitle: { fontSize: '0.9rem', fontWeight: '600', color: '#166534', marginBottom: '8px', margin: '0 0 8px 0' },
  treatList: { margin: 0, paddingLeft: '18px', color: '#166534', fontSize: '0.88rem', lineHeight: '1.7' },
  suggestionsBox: {
    background: '#f9fafb', borderRadius: '10px', padding: '12px', marginBottom: '12px'
  },
  suggestionsTitle: { fontSize: '0.88rem', fontWeight: '600', color: '#374151', marginBottom: '8px', margin: '0 0 8px 0' },
  suggestionRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '5px 0', borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem'
  },
  suggestionName: { color: '#374151' },
  suggestionProb: { color: '#6b7280', fontWeight: '600' },
  sourceRow: { marginBottom: '14px', textAlign: 'center' },
  sourceText: { fontSize: '0.75rem', color: '#9ca3af' },
  scanAgainBtn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
  },
  tipsBox: {
    background: '#f9fafb', borderRadius: '12px',
    padding: '14px', marginTop: '14px', border: '2px solid #e5e7eb'
  },
  tipsTitle: { fontSize: '0.88rem', fontWeight: '600', color: '#374151', marginBottom: '10px', textAlign: 'center', margin: '0 0 10px 0' },
  tipsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' },
  tipItem: { textAlign: 'center', padding: '8px 4px', background: '#fff', borderRadius: '8px', fontSize: '0.72rem', color: '#6b7280' }
};

// Spinner keyframe (injected once)
if (!document.getElementById('pest-spin-style')) {
  const s = document.createElement('style');
  s.id = 'pest-spin-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

export default PestIdentifier;
