import { useState } from 'react';
import { getLanguage } from '../utils/localSync';

/**
 * B3: Pest Identification Component with Gemini Visual RAG
 * Upload image, identify pest, get treatment plan in Bangla
 */

const API_BASE = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:3001/api';

function PestIdentifier({ cropType, location, lang = 'bn' }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন' : 'Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(lang === 'bn' ? 'ছবির আকার ৫ এমবি এর বেশি হতে পারবে না' : 'Image size must be less than 5MB');
      return;
    }
    
    setError(null);
    setSelectedImage(file);
    setResult(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleIdentify = async () => {
    if (!selectedImage || !imagePreview) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি নির্বাচন করুন' : 'Please select an image');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Convert image to base64
      const base64Image = imagePreview;
      
      const response = await fetch(`${API_BASE}/pest/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvestguard_token') || 'demo-token-auto-login'}`
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          cropType: cropType || 'Unknown',
          location: location || 'Bangladesh'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.errorBn || errorData.error || 'Failed to identify pest');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Pest identification error:', err);
      setError(err.message || (lang === 'bn' ? 'পোকা শনাক্ত করতে ব্যর্থ' : 'Failed to identify pest'));
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
  
  const getRiskColor = (riskLevel) => {
    const colors = {
      'High': '#dc2626',
      'Medium': '#f59e0b',
      'Low': '#16a34a'
    };
    return colors[riskLevel] || '#6b7280';
  };
  
  const getRiskLabelBn = (riskLevel) => {
    const labels = {
      'High': 'উচ্চ',
      'Medium': 'মাঝারি',
      'Low': 'কম'
    };
    return labels[riskLevel] || riskLevel;
  };
  
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        {lang === 'bn' ? '🐛 পোকা শনাক্তকরণ' : '🐛 Pest Identification'}
      </h3>
      
      {/* Image Upload */}
      <div style={styles.uploadSection}>
        {!imagePreview ? (
          <label style={styles.uploadButton}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <span style={styles.uploadIcon}>📷</span>
            <span style={styles.uploadText}>
              {lang === 'bn' ? 'পোকা বা ক্ষতির ছবি আপলোড করুন' : 'Upload Pest/Damage Image'}
            </span>
            <span style={styles.uploadHint}>
              {lang === 'bn' ? '(JPEG/PNG, সর্বোচ্চ ৫ এমবি)' : '(JPEG/PNG, Max 5MB)'}
            </span>
          </label>
        ) : (
          <div style={styles.previewContainer}>
            <img src={imagePreview} alt="Preview" style={styles.previewImage} />
            <button onClick={handleReset} style={styles.removeButton}>
              {lang === 'bn' ? '❌ সরান' : '❌ Remove'}
            </button>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={styles.errorCard}>
          <span style={styles.errorIcon}>⚠️</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
      
      {/* Identify Button */}
      {imagePreview && !result && (
        <button
          onClick={handleIdentify}
          disabled={loading}
          style={{
            ...styles.identifyButton,
            ...(loading ? styles.identifyButtonLoading : {})
          }}
        >
          {loading ? (
            <>
              <span className="spinner" style={styles.spinner}></span>
              {lang === 'bn' ? 'শনাক্ত করা হচ্ছে...' : 'Identifying...'}
            </>
          ) : (
            <>
              <span>🔍</span>
              {lang === 'bn' ? 'পোকা শনাক্ত করুন' : 'Identify Pest'}
            </>
          )}
        </button>
      )}
      
      {/* Results */}
      {result && (
        <div style={styles.resultCard}>
          {/* Pest Info */}
          <div style={styles.pestInfo}>
            <h4 style={styles.pestName}>
              {lang === 'bn' ? result.pestNameBn : result.pestName}
            </h4>
            <p style={styles.pestNameEn}>
              {lang === 'bn' ? result.pestName : result.pestNameBn}
            </p>
            
            {/* Risk Badge */}
            <div style={{
              ...styles.riskBadge,
              background: getRiskColor(result.riskLevel)
            }}>
              <span style={styles.riskLabel}>
                {lang === 'bn' ? 'ঝুঁকি:' : 'Risk:'}
              </span>
              <span style={styles.riskValue}>
                {lang === 'bn' ? getRiskLabelBn(result.riskLevel) : result.riskLevel}
              </span>
            </div>
            
            {/* Description */}
            {result.description && (
              <p style={styles.description}>
                {result.description}
              </p>
            )}
          </div>
          
          {/* Treatment Plan */}
          <div style={styles.treatmentSection}>
            <h4 style={styles.treatmentTitle}>
              {lang === 'bn' ? 'চিকিৎসা পরিকল্পনা' : 'Treatment Plan'}
            </h4>
            
            {/* Immediate Actions */}
            {result.treatmentPlan?.immediateBn && result.treatmentPlan.immediateBn.length > 0 && (
              <div style={styles.actionGroup}>
                <h5 style={styles.actionGroupTitle}>
                  {lang === 'bn' ? '⚡ তাৎক্ষণিক পদক্ষেপ' : '⚡ Immediate Actions'}
                </h5>
                <ul style={styles.actionList}>
                  {result.treatmentPlan.immediateBn.map((action, idx) => (
                    <li key={idx} style={styles.actionItem}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Preventive Measures */}
            {result.treatmentPlan?.preventiveBn && result.treatmentPlan.preventiveBn.length > 0 && (
              <div style={styles.actionGroup}>
                <h5 style={styles.actionGroupTitle}>
                  {lang === 'bn' ? '🛡️ প্রতিরোধমূলক ব্যবস্থা' : '🛡️ Preventive Measures'}
                </h5>
                <ul style={styles.actionList}>
                  {result.treatmentPlan.preventiveBn.map((action, idx) => (
                    <li key={idx} style={styles.actionItem}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Source Info */}
          {result.source && (
            <div style={styles.sourceInfo}>
              <span style={styles.sourceText}>
                {lang === 'bn' 
                  ? `তথ্যের উৎস: ${result.source === 'gemini' ? 'Gemini AI (Google Search)' : 'Mock Data'}`
                  : `Source: ${result.source === 'gemini' ? 'Gemini AI (Google Search)' : 'Mock Data'}`}
              </span>
            </div>
          )}
          
          {/* Reset Button */}
          <button onClick={handleReset} style={styles.resetButton}>
            {lang === 'bn' ? '🔄 নতুন ছবি আপলোড করুন' : '🔄 Upload New Image'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '2px solid #bbf7d0'
  },
  title: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '20px'
  },
  uploadSection: {
    marginBottom: '20px'
  },
  uploadButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    border: '3px dashed #c9a227',
    borderRadius: '12px',
    background: '#fefce8',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '200px'
  },
  uploadIcon: {
    fontSize: '3rem',
    marginBottom: '12px'
  },
  uploadText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '8px'
  },
  uploadHint: {
    fontSize: '0.85rem',
    color: '#6b7280'
  },
  previewContainer: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #bbf7d0'
  },
  previewImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    display: 'block'
  },
  removeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '8px 16px',
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  errorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #fecaca'
  },
  errorIcon: {
    fontSize: '1.2rem'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '0.9rem'
  },
  identifyButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(26, 61, 26, 0.3)'
  },
  identifyButtonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTop: '3px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  resultCard: {
    marginTop: '20px',
    padding: '20px',
    background: '#f0fdf4',
    borderRadius: '12px',
    border: '2px solid #bbf7d0'
  },
  pestInfo: {
    marginBottom: '24px'
  },
  pestName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '8px',
    margin: '0 0 8px 0'
  },
  pestNameEn: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },
  riskBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.9rem',
    marginBottom: '16px'
  },
  riskLabel: {
    fontSize: '0.85rem'
  },
  riskValue: {
    fontSize: '1rem'
  },
  description: {
    fontSize: '0.95rem',
    color: '#374151',
    lineHeight: '1.6',
    margin: '0'
  },
  treatmentSection: {
    marginTop: '24px'
  },
  treatmentTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '16px',
    margin: '0 0 16px 0'
  },
  actionGroup: {
    marginBottom: '20px'
  },
  actionGroupTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },
  actionList: {
    margin: 0,
    paddingLeft: '20px',
    listStyle: 'none'
  },
  actionItem: {
    fontSize: '0.95rem',
    color: '#1f2937',
    lineHeight: '1.8',
    marginBottom: '8px',
    paddingLeft: '24px',
    position: 'relative'
  },
  sourceInfo: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #d1d5db',
    textAlign: 'center'
  },
  sourceText: {
    fontSize: '0.8rem',
    color: '#6b7280'
  },
  resetButton: {
    width: '100%',
    padding: '12px',
    background: '#ffffff',
    color: '#1a3d1a',
    border: '2px solid #1a3d1a',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px'
  }
};

export default PestIdentifier;

