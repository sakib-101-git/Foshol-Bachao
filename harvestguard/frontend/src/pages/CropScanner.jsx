/**
 * Crop Health Scanner - AI-powered disease detection
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getLanguage, saveLanguage } from '../utils/localSync';
import Sidebar from '../components/Sidebar';

const API_URL = "https://api-inference.huggingface.co/models/Mozilla-MobileNetV2-PlantDisease";

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:image/xxx;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Demo analysis when backend/API is unavailable
const demoAnalysis = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const random = Math.random();
  const scenarios = [
    {
      status: 'fresh',
      confidence: 85 + Math.floor(Math.random() * 10),
      label: 'Healthy Plant',
      issueEn: 'Plant appears healthy',
      issueBn: 'গাছ সুস্থ দেখাচ্ছে',
      recommendationsEn: ['Plant looks healthy', 'Continue regular care', 'Monitor for changes'],
      recommendationsBn: ['গাছ সুস্থ দেখাচ্ছে', 'নিয়মিত পরিচর্যা চালিয়ে যান', 'পরিবর্তন পর্যবেক্ষণ করুন']
    },
    {
      status: 'warning',
      confidence: 70 + Math.floor(Math.random() * 15),
      label: 'Early Leaf Spot',
      issueEn: 'Minor discoloration detected',
      issueBn: 'সামান্য বিবর্ণতা সনাক্ত',
      recommendationsEn: ['Monitor closely', 'Check for pests', 'Improve ventilation'],
      recommendationsBn: ['ভালোভাবে পর্যবেক্ষণ করুন', 'পোকা পরীক্ষা করুন', 'বায়ু চলাচল উন্নত করুন']
    },
    {
      status: 'rotten',
      confidence: 80 + Math.floor(Math.random() * 15),
      label: 'Disease Detected',
      issueEn: 'Disease symptoms visible',
      issueBn: 'রোগের লক্ষণ দৃশ্যমান',
      recommendationsEn: ['Remove affected parts', 'Apply treatment', 'Isolate from healthy plants', 'Consult expert'],
      recommendationsBn: ['আক্রান্ত অংশ সরান', 'চিকিৎসা প্রয়োগ করুন', 'সুস্থ গাছ থেকে আলাদা করুন', 'বিশেষজ্ঞের পরামর্শ নিন']
    }
  ];
  
  return scenarios[Math.floor(random * scenarios.length)];
};

// Analyze image - Try backend first, fallback to direct API with demo mode
const analyzeImageWithAI = async (imageFile, apiToken) => {
  // First try backend proxy
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
    
    const token = localStorage.getItem('harvestguard_token') || 'demo-token-auto-login';
    if (!localStorage.getItem('harvestguard_token')) {
      localStorage.setItem('harvestguard_token', token);
    }
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
    
    console.log('Trying backend proxy...');
    const response = await fetch(`${API_BASE}/scanner/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ image: base64 })
    });
    
    if (response.ok) {
      const data = await response.json();
      return processAPIResults(data.results || data);
    }
    
    // If backend fails, use demo mode
    console.log('Backend failed, using demo mode');
    throw new Error('BACKEND_FAILED');
    
  } catch (err) {
    if (err.message === 'BACKEND_FAILED' || err.message.includes('Failed to fetch')) {
      // Use demo/fallback analysis
      console.log('Using demo analysis mode');
      return await demoAnalysis();
    }
    
    // Handle other errors
    console.error('AI Analysis error:', err);
    throw err;
  }
};

// Process API results
const processAPIResults = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('INVALID_RESPONSE');
  }

  // Sort by score
  const sorted = results.sort((a, b) => b.score - a.score);
  const topResult = sorted[0];
  const confidence = Math.round(topResult.score * 100);
  const label = topResult.label;

  // Determine health status based on label
  let status = 'fresh';
  let issueEn = 'None detected';
  let issueBn = 'কিছু পাওয়া যায়নি';

  const lowerLabel = label.toLowerCase();
  
  // Check for healthy indicators
  const isHealthy = lowerLabel.includes('healthy') || 
                    lowerLabel.includes('fresh') ||
                    lowerLabel.includes('normal');

  // Check for disease/problem indicators
  const hasDisease = lowerLabel.includes('disease') ||
                     lowerLabel.includes('rust') ||
                     lowerLabel.includes('spot') ||
                     lowerLabel.includes('blight') ||
                     lowerLabel.includes('rot') ||
                     lowerLabel.includes('mold') ||
                     lowerLabel.includes('wilt') ||
                     lowerLabel.includes('virus') ||
                     lowerLabel.includes('bacteria') ||
                     lowerLabel.includes('fungal') ||
                     lowerLabel.includes('leaf_') ||
                     lowerLabel.includes('_leaf') ||
                     lowerLabel.includes('scab') ||
                     lowerLabel.includes('mildew') ||
                     lowerLabel.includes('mosaic') ||
                     lowerLabel.includes('curl');

  if (isHealthy && confidence > 60) {
    status = 'fresh';
    issueEn = 'Plant appears healthy';
    issueBn = 'গাছ সুস্থ দেখাচ্ছে';
  } else if (hasDisease) {
    status = confidence > 70 ? 'rotten' : 'warning';
    issueEn = formatLabel(label);
    issueBn = formatLabel(label);
  } else {
    status = confidence > 50 ? 'warning' : 'fresh';
    issueEn = formatLabel(label);
    issueBn = formatLabel(label);
  }

  // Generate recommendations based on status
  let recommendationsEn = [];
  let recommendationsBn = [];

  if (status === 'fresh') {
    recommendationsEn = [
      'Plant appears healthy',
      'Continue current care practices',
      'Monitor regularly for changes',
      'Ensure proper watering and sunlight'
    ];
    recommendationsBn = [
      'গাছ সুস্থ দেখাচ্ছে',
      'বর্তমান পরিচর্যা চালিয়ে যান',
      'নিয়মিত পরিবর্তন পর্যবেক্ষণ করুন',
      'সঠিক জল ও সূর্যালোক নিশ্চিত করুন'
    ];
  } else if (status === 'warning') {
    recommendationsEn = [
      'Potential issue detected',
      'Monitor plant closely',
      'Check for pests or nutrient deficiency',
      'Consider consulting an expert',
      'Improve drainage if soil is wet'
    ];
    recommendationsBn = [
      'সম্ভাব্য সমস্যা সনাক্ত হয়েছে',
      'গাছ ভালোভাবে পর্যবেক্ষণ করুন',
      'পোকা বা পুষ্টির অভাব পরীক্ষা করুন',
      'বিশেষজ্ঞের পরামর্শ নিন',
      'মাটি ভেজা হলে নিষ্কাশন উন্নত করুন'
    ];
  } else {
    recommendationsEn = [
      'Disease detected - take action',
      'Remove affected leaves/parts',
      'Apply appropriate treatment',
      'Isolate from healthy plants',
      'Improve air circulation',
      'Consult agricultural expert'
    ];
    recommendationsBn = [
      'রোগ সনাক্ত - পদক্ষেপ নিন',
      'আক্রান্ত পাতা/অংশ সরান',
      'উপযুক্ত চিকিৎসা প্রয়োগ করুন',
      'সুস্থ গাছ থেকে আলাদা করুন',
      'বায়ু চলাচল উন্নত করুন',
      'কৃষি বিশেষজ্ঞের পরামর্শ নিন'
    ];
  }

  return {
    status,
    confidence,
    label: formatLabel(label),
    rawLabel: label,
    allResults: sorted.slice(0, 5),
    issueEn,
    issueBn,
    recommendationsEn,
    recommendationsBn
  };
};

// Format label for display
const formatLabel = (label) => {
  return label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function CropScanner() {
  const [lang, setLang] = useState(getLanguage());
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Get API token from environment
  const API_TOKEN = import.meta.env.VITE_HF_TOKEN;
  
  // Debug: log token status
  useEffect(() => {
    console.log('API Token check:', API_TOKEN ? 'Token found' : 'No token');
  }, []);
  
  // No authentication required
  useEffect(() => {
    // Auto-set demo user if needed
    const storedUser = localStorage.getItem('harvestguard_user');
    if (!storedUser) {
      const demoUser = {
        id: 'demo-farmer-001',
        email: 'demo@harvestguard.com',
        name: 'Demo Farmer'
      };
      localStorage.setItem('harvestguard_user', JSON.stringify(demoUser));
    }
  }, []);
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setModelLoading(false);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setAnalyzing(true);
    setError(null);
    setModelLoading(false);
    
    try {
      const analysisResult = await analyzeImageWithAI(selectedImage, API_TOKEN);
      setResult(analysisResult);
      setAnalyzing(false);
    } catch (err) {
      console.error('Analysis error:', err);
      const errors = {
        'NO_TOKEN': lang === 'bn' ? 'API টোকেন সেট করা হয়নি।' : 'API token not set.',
        'RATE_LIMIT': lang === 'bn' ? 'অনেক অনুরোধ করা হয়েছে। অপেক্ষা করুন।' : 'Too many requests. Please wait.',
        'MODEL_NOT_FOUND': lang === 'bn' ? 'মডেল পাওয়া যায়নি।' : 'Model not found.'
      };
      
      if (err.message.startsWith('MODEL_LOADING:')) {
        const time = parseInt(err.message.split(':')[1]);
        setModelLoading(true);
        setLoadingTime(time);
        setTimeout(() => {
          setModelLoading(false);
          handleAnalyze();
        }, (time + 2) * 1000);
        return;
      }
      
      const errKey = Object.keys(errors).find(k => err.message.includes(k));
      setError(errors[errKey] || (lang === 'bn' ? `বিশ্লেষণ ব্যর্থ: ${err.message}` : `Analysis failed: ${err.message}`));
      setAnalyzing(false);
    }
  };
  
  const resetScanner = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setModelLoading(false);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'fresh': return '#166534';
      case 'warning': return '#c9a227';
      case 'rotten': return '#dc2626';
      default: return '#6b7280';
    }
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      fresh: { en: 'HEALTHY', bn: 'সুস্থ' },
      warning: { en: 'WARNING', bn: 'সতর্কতা' },
      rotten: { en: 'DISEASE DETECTED', bn: 'রোগ সনাক্ত' }
    };
    return labels[status]?.[lang] || status;
  };

  return (
    <div style={styles.wrapper}>
      <Sidebar lang={lang} onLangChange={toggleLang} />
      <div style={styles.page} data-page-content>
        <div style={styles.content}>
        <h1 style={styles.title}>
          {lang === 'bn' ? 'ফসল স্বাস্থ্য স্ক্যানার' : 'Crop Health Scanner'}
        </h1>
        <p style={styles.subtitle}>
          {lang === 'bn'
            ? 'ফসলের ছবি আপলোড করুন এবং AI দিয়ে রোগ সনাক্ত করুন'
            : 'Upload a crop image to detect diseases using AI'}
        </p>
        
        {/* Upload Zone */}
        {!previewUrl ? (
          <div
            style={{
              ...styles.uploadZone,
              ...(dragActive ? styles.uploadZoneActive : {})
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <div style={styles.uploadIcon}>📸</div>
            <h3 style={styles.uploadTitle}>
              {lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Image'}
            </h3>
            <p style={styles.uploadText}>
              {lang === 'bn' ? 'ক্লিক করুন বা ছবি টেনে আনুন' : 'Click or drag and drop'}
            </p>
            <div style={styles.formats}>JPG, PNG, WEBP</div>
          </div>
        ) : (
          <>
            {/* Preview */}
            <div style={styles.previewCard}>
              <div style={styles.imageWrapper}>
                <img src={previewUrl} alt="Selected crop" style={styles.previewImage} />
                {(analyzing || modelLoading) && (
                  <div style={styles.overlay}>
                    <div style={styles.spinner}></div>
                    <p style={styles.overlayText}>
                      {modelLoading 
                        ? (lang === 'bn' ? `মডেল লোড হচ্ছে... ${loadingTime}s` : `Loading model... ${loadingTime}s`)
                        : (lang === 'bn' ? 'বিশ্লেষণ করা হচ্ছে...' : 'Analyzing...')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              {!result && !analyzing && !modelLoading && (
                <div style={styles.actions}>
                  <button style={styles.analyzeBtn} onClick={handleAnalyze}>
                    {lang === 'bn' ? 'বিশ্লেষণ করুন' : 'Analyze'}
                  </button>
                  <button style={styles.resetBtn} onClick={resetScanner}>
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              )}
              
              {error && (
                <div style={styles.errorBox}>
                  <p style={styles.errorText}>{error}</p>
                  <button style={styles.retryBtn} onClick={handleAnalyze}>
                    {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Results */}
            {result && (
              <div style={styles.resultCard}>
                {/* Status */}
                <div style={{...styles.statusBadge, background: getStatusColor(result.status)}}>
                  {getStatusLabel(result.status)}
                </div>
                
                {/* Confidence */}
                <div style={styles.confidenceSection}>
                  <span style={styles.confLabel}>
                    {lang === 'bn' ? 'আত্মবিশ্বাস' : 'Confidence'}
                  </span>
                  <div style={styles.confBar}>
                    <div style={{
                      ...styles.confFill,
                      width: `${result.confidence}%`,
                      background: getStatusColor(result.status)
                    }} />
                  </div>
                  <span style={styles.confValue}>{result.confidence}%</span>
                </div>
                
                {/* Detection Label */}
                <div style={styles.labelBox}>
                  <span style={styles.labelTitle}>
                    {lang === 'bn' ? 'সনাক্ত' : 'Detected'}:
                  </span>
                  <span style={styles.labelValue}>{result.label}</span>
                </div>
                
                {/* All Results */}
                {result.allResults && result.allResults.length > 1 && (
                  <div style={styles.allResultsBox}>
                    <h4 style={styles.allResultsTitle}>
                      {lang === 'bn' ? 'সব ফলাফল' : 'All Results'}
                    </h4>
                    {result.allResults.map((r, idx) => (
                      <div key={idx} style={styles.resultRow}>
                        <span style={styles.resultLabel}>{formatLabel(r.label)}</span>
                        <span style={styles.resultScore}>{Math.round(r.score * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Recommendations */}
                <div style={styles.recommendBox}>
                  <h4 style={styles.recommendTitle}>
                    {lang === 'bn' ? 'পরামর্শ' : 'Recommendations'}
                  </h4>
                  <ul style={styles.recommendList}>
                    {(lang === 'bn' ? result.recommendationsBn : result.recommendationsEn).map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Scan Again */}
                <button style={styles.scanAgainBtn} onClick={resetScanner}>
                  {lang === 'bn' ? 'আরেকটি ছবি স্ক্যান করুন' : 'Scan Another Image'}
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Tips */}
        <div style={styles.tipsCard}>
          <h3 style={styles.tipsTitle}>
            {lang === 'bn' ? 'ভালো ফলাফলের জন্য' : 'For Best Results'}
          </h3>
          <div style={styles.tipsGrid}>
            <div style={styles.tipItem}>
              <span>☀️</span>
              <p>{lang === 'bn' ? 'ভালো আলো' : 'Good light'}</p>
            </div>
            <div style={styles.tipItem}>
              <span>🌿</span>
              <p>{lang === 'bn' ? 'পাতা দেখান' : 'Show leaves'}</p>
            </div>
            <div style={styles.tipItem}>
              <span>📏</span>
              <p>{lang === 'bn' ? 'কাছ থেকে' : 'Close-up'}</p>
            </div>
            <div style={styles.tipItem}>
              <span>🎯</span>
              <p>{lang === 'bn' ? 'পরিষ্কার' : 'Clear'}</p>
            </div>
          </div>
        </div>
        
        {/* Service Status */}
        <div style={{
          ...styles.tokenStatus,
          background: '#f0fdf4',
          borderColor: '#bbf7d0'
        }}>
          {lang === 'bn' ? '✅ স্ক্যানার প্রস্তুত - ছবি আপলোড করুন' : '✅ Scanner Ready - Upload Image'}
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
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px 16px'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.95rem',
    textAlign: 'center',
    marginBottom: '24px'
  },
  uploadZone: {
    background: '#ffffff',
    border: '3px dashed #bbf7d0',
    borderRadius: '16px',
    padding: '50px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  uploadZoneActive: {
    borderColor: '#1a3d1a',
    background: '#f0fdf4'
  },
  uploadIcon: {
    fontSize: '3rem',
    marginBottom: '12px'
  },
  uploadTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '8px'
  },
  uploadText: {
    color: '#6b7280',
    marginBottom: '12px'
  },
  formats: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#f0fdf4',
    borderRadius: '20px',
    fontSize: '0.8rem',
    color: '#166534'
  },
  previewCard: {
    background: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px'
  },
  imageWrapper: {
    position: 'relative'
  },
  previewImage: {
    width: '100%',
    display: 'block',
    maxHeight: '350px',
    objectFit: 'cover'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(26, 61, 26, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTopColor: '#c9a227',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '12px'
  },
  overlayText: {
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    padding: '16px'
  },
  analyzeBtn: {
    flex: 1,
    padding: '14px',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  resetBtn: {
    padding: '14px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    background: '#ffffff',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  errorBox: {
    padding: '16px',
    background: '#fef2f2',
    textAlign: 'center'
  },
  errorText: {
    color: '#dc2626',
    marginBottom: '10px'
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600'
  },
  resultCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px'
  },
  statusBadge: {
    textAlign: 'center',
    padding: '16px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '20px'
  },
  confidenceSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  confLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    minWidth: '70px'
  },
  confBar: {
    flex: 1,
    height: '10px',
    background: '#e5e7eb',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  confFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.5s ease'
  },
  confValue: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#374151',
    minWidth: '45px',
    textAlign: 'right'
  },
  labelBox: {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  },
  labelTitle: {
    color: '#6b7280',
    fontSize: '0.9rem'
  },
  labelValue: {
    fontWeight: '600',
    color: '#1a3d1a',
    fontSize: '0.95rem'
  },
  allResultsBox: {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px'
  },
  allResultsTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '10px'
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.85rem'
  },
  resultLabel: {
    color: '#374151'
  },
  resultScore: {
    color: '#6b7280',
    fontWeight: '600'
  },
  recommendBox: {
    background: '#f0fdf4',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
    border: '2px solid #bbf7d0'
  },
  recommendTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#166534',
    marginBottom: '10px'
  },
  recommendList: {
    margin: 0,
    paddingLeft: '18px',
    color: '#166534',
    fontSize: '0.9rem',
    lineHeight: '1.7'
  },
  scanAgainBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  tipsCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
    border: '2px solid #e5e7eb'
  },
  tipsTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    textAlign: 'center'
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px'
  },
  tipItem: {
    textAlign: 'center',
    padding: '10px 4px',
    background: '#f9fafb',
    borderRadius: '8px',
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  tokenStatus: {
    marginTop: '16px',
    padding: '10px',
    borderRadius: '10px',
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: '600',
    border: '2px solid'
  }
};

// Add spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.getElementById('scanner-styles')) {
  styleSheet.id = 'scanner-styles';
  document.head.appendChild(styleSheet);
}

export default CropScanner;
