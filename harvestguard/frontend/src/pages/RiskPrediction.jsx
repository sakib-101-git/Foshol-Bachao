import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getLanguage, saveLanguage, getBatches } from '../utils/localSync';
import { translations } from '../utils/translations';
import { weather } from '../utils/api';
import Sidebar from '../components/Sidebar';
import SmartAlertSystem from '../components/SmartAlertSystem';

/**
 * ETCL Risk Prediction Model
 */

const calculateRisk = (batch, weather) => {
  let riskScore = 0;
  let factors = [];
  
  const temp = weather?.temperature || 28;
  if (temp > 35) {
    riskScore += 30;
    factors.push({ type: 'high', textEn: 'High temperature increases spoilage risk', textBn: 'উচ্চ তাপমাত্রা নষ্ট হওয়ার ঝুঁকি বাড়ায়' });
  } else if (temp > 32) {
    riskScore += 15;
    factors.push({ type: 'medium', textEn: 'Elevated temperature', textBn: 'বাড়তি তাপমাত্রা' });
  }
  
  const humidity = weather?.humidity || 70;
  if (humidity > 85) {
    riskScore += 35;
    factors.push({ type: 'high', textEn: 'Very high humidity promotes mold growth', textBn: 'অতিরিক্ত আর্দ্রতা ছত্রাক বৃদ্ধি করে' });
  } else if (humidity > 75) {
    riskScore += 20;
    factors.push({ type: 'medium', textEn: 'High humidity levels', textBn: 'উচ্চ আর্দ্রতা' });
  }
  
  const rainChance = weather?.rainProbability || 20;
  if (rainChance > 70) {
    riskScore += 25;
    factors.push({ type: 'high', textEn: 'High rain probability - protect stored crops', textBn: 'বৃষ্টির সম্ভাবনা বেশি - ফসল রক্ষা করুন' });
  } else if (rainChance > 40) {
    riskScore += 10;
    factors.push({ type: 'medium', textEn: 'Moderate rain expected', textBn: 'মাঝারি বৃষ্টি প্রত্যাশিত' });
  }
  
  if (batch.storageType === 'Open Area') {
    riskScore += 25;
    factors.push({ type: 'high', textEn: 'Open storage increases exposure risk', textBn: 'খোলা সংরক্ষণে ঝুঁকি বেশি' });
  } else if (batch.storageType === 'Jute Bag Stack') {
    riskScore += 10;
    factors.push({ type: 'medium', textEn: 'Jute bags susceptible to moisture', textBn: 'পাটের বস্তা আর্দ্রতায় দুর্বল' });
  }
  
  const harvestDate = new Date(batch.harvestDate);
  const today = new Date();
  const daysSinceHarvest = Math.floor((today - harvestDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceHarvest > 30) {
    riskScore += 15;
    factors.push({ type: 'medium', textEn: `${daysSinceHarvest} days since harvest`, textBn: `ফসল কাটার ${daysSinceHarvest} দিন হয়েছে` });
  }
  
  let etclHours = riskScore >= 70 ? 24 : riskScore >= 50 ? 72 : riskScore >= 30 ? 168 : 336;
  
  return {
    score: Math.min(riskScore, 100),
    level: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
    factors,
    etclHours
  };
};

// Get location name from batch for weather lookup
const getLocationForBatch = (batch) => {
  if (batch.upazila && batch.upazila.trim()) {
    return batch.upazila;
  }
  if (batch.district && batch.district.trim()) {
    return batch.district;
  }
  if (batch.division && batch.division.trim()) {
    return batch.division;
  }
  return 'Sreepur'; // Default fallback
};

const getCropType = (type, lang) => {
  if (translations.crops && translations.crops[type]) {
    return translations.crops[type][lang] || type;
  }
  return type;
};

const getStorageType = (type, lang) => {
  if (translations.storage && translations.storage[type]) {
    return translations.storage[type][lang] || type;
  }
  return type;
};

function RiskPrediction() {
  const [lang, setLang] = useState(getLanguage());
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    setBatches(getBatches());
  }, []);
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  const analyzeBatch = async (batch) => {
    setSelectedBatch(batch);
    setLoadingWeather(true);
    setRiskAnalysis(null);
    
    try {
      // Fetch real weather for batch location
      const location = getLocationForBatch(batch);
      const weatherResponse = await weather.get(location, lang);
      const currentWeather = weatherResponse.current || weatherResponse.forecast?.[0];
      const tomorrowWeather = weatherResponse.forecast?.[1] || weatherResponse.forecast?.[0];
      
      // Format weather data for risk calculation
      const weatherForRisk = {
        temperature: currentWeather?.temp || 28,
        humidity: currentWeather?.humidity || 70,
        rainProbability: currentWeather?.rainProbability || 20,
        tomorrowRain: (tomorrowWeather?.rainProbability || 0) > 40
      };
      
      setWeatherData(weatherForRisk);
      setRiskAnalysis(calculateRisk(batch, weatherForRisk));
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      // Fallback to default weather if API fails
      const fallbackWeather = { temperature: 28, humidity: 70, rainProbability: 20, tomorrowRain: false };
      setWeatherData(fallbackWeather);
      setRiskAnalysis(calculateRisk(batch, fallbackWeather));
    } finally {
      setLoadingWeather(false);
    }
  };
  
  const getRiskColor = (level) => {
    const colors = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#166534' };
    return colors[level] || '#6b7280';
  };
  
  const getRiskLabel = (level) => {
    const labels = {
      critical: { en: 'CRITICAL', bn: 'সংকটাপন্ন' },
      high: { en: 'HIGH RISK', bn: 'উচ্চ ঝুঁকি' },
      medium: { en: 'MEDIUM', bn: 'মাঝারি' },
      low: { en: 'LOW', bn: 'কম ঝুঁকি' }
    };
    return labels[level]?.[lang] || level;
  };
  
  const formatETCL = (hours) => {
    if (hours <= 24) return lang === 'bn' ? '২৪ ঘণ্টার মধ্যে' : 'Within 24 hours';
    if (hours <= 72) return lang === 'bn' ? '৩ দিনের মধ্যে' : 'Within 3 days';
    if (hours <= 168) return lang === 'bn' ? '১ সপ্তাহের মধ্যে' : 'Within 1 week';
    return lang === 'bn' ? '২ সপ্তাহ+' : '2 weeks+';
  };

  return (
    <div style={styles.wrapper}>
      <Sidebar lang={lang} onLangChange={toggleLang} />
      <div style={styles.page} data-page-content>
        <div style={styles.content}>
        <h1 style={styles.title}>
          {lang === 'bn' ? 'ঝুঁকি বিশ্লেষণ' : 'Risk Analysis'}
        </h1>
        <p style={styles.subtitle}>
          {lang === 'bn' 
            ? 'আবহাওয়া অনুযায়ী ফসল নষ্ট হওয়ার ঝুঁকি বিশ্লেষণ'
            : 'Analyze crop spoilage risk based on weather conditions'}
        </p>
        
        {/* Weather - Show when batch is selected */}
        {selectedBatch && weatherData && (
          <div style={styles.weatherCard}>
            <h3 style={styles.weatherTitle}>
              {lang === 'bn' ? 'বর্তমান আবহাওয়া' : 'Current Weather'}
              <span style={styles.locationTag}>
                ({getLocationForBatch(selectedBatch)})
              </span>
            </h3>
            {loadingWeather ? (
              <div style={styles.loadingText}>
                {lang === 'bn' ? 'আবহাওয়া লোড হচ্ছে...' : 'Loading weather...'}
              </div>
            ) : (
              <div style={styles.weatherGrid}>
                <div style={styles.weatherItem}>
                  <span style={styles.weatherValue}>{weatherData.temperature}°C</span>
                  <span style={styles.weatherLabel}>{lang === 'bn' ? 'তাপমাত্রা' : 'Temp'}</span>
                </div>
                <div style={styles.weatherItem}>
                  <span style={styles.weatherValue}>{weatherData.humidity}%</span>
                  <span style={styles.weatherLabel}>{lang === 'bn' ? 'আর্দ্রতা' : 'Humidity'}</span>
                </div>
                <div style={styles.weatherItem}>
                  <span style={styles.weatherValue}>{weatherData.rainProbability}%</span>
                  <span style={styles.weatherLabel}>{lang === 'bn' ? 'বৃষ্টি' : 'Rain'}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Batch Selection */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            {lang === 'bn' ? 'ব্যাচ নির্বাচন করুন' : 'Select Batch'}
          </h3>
          
          {batches.length === 0 ? (
            <div style={styles.emptyState}>
              <p>{lang === 'bn' ? 'কোন ব্যাচ নেই' : 'No batches found'}</p>
            </div>
          ) : (
            <div style={styles.batchList}>
              {batches.map(batch => (
                <div
                  key={batch.id}
                  style={{
                    ...styles.batchCard,
                    ...(selectedBatch?.id === batch.id ? styles.batchCardSelected : {})
                  }}
                  onClick={() => analyzeBatch(batch)}
                >
                  <div style={styles.batchTop}>
                    <span style={styles.batchCrop}>{getCropType(batch.cropType, lang)}</span>
                    <span style={styles.batchWeight}>{batch.estimatedWeightKg} kg</span>
                  </div>
                  <div style={styles.batchBottom}>
                    <span>{getStorageType(batch.storageType, lang)}</span>
                    <span style={styles.batchLocation}>
                      📍 {batch.upazila || batch.district || batch.division || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Results */}
        {riskAnalysis && selectedBatch && (
          <div style={styles.resultCard}>
            <h3 style={styles.resultTitle}>
              {lang === 'bn' ? 'বিশ্লেষণ ফলাফল' : 'Analysis Result'}
            </h3>
            
            {/* Score */}
            <div style={styles.scoreSection}>
              <div style={styles.gaugeOuter}>
                <div style={{
                  ...styles.gaugeInner,
                  width: `${riskAnalysis.score}%`,
                  background: getRiskColor(riskAnalysis.level)
                }} />
              </div>
              <div style={styles.scoreDisplay}>
                <span style={{...styles.scoreNumber, color: getRiskColor(riskAnalysis.level)}}>
                  {riskAnalysis.score}
                </span>
                <span style={styles.scoreMax}>/100</span>
              </div>
              <div style={{...styles.riskBadge, background: getRiskColor(riskAnalysis.level)}}>
                {getRiskLabel(riskAnalysis.level)}
              </div>
            </div>
            
            {/* ETCL */}
            <div style={styles.etclCard}>
              <h4 style={styles.etclLabel}>ETCL</h4>
              <p style={styles.etclValue}>{formatETCL(riskAnalysis.etclHours)}</p>
              <p style={styles.etclDesc}>
                {lang === 'bn' ? 'আনুমানিক সংকট সময়' : 'Estimated Time to Critical Level'}
              </p>
            </div>
            
            {/* Factors */}
            <div style={styles.factorsSection}>
              <h4 style={styles.factorsTitle}>
                {lang === 'bn' ? 'ঝুঁকির কারণ' : 'Risk Factors'}
              </h4>
              {riskAnalysis.factors.map((factor, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.factorItem,
                    borderLeftColor: factor.type === 'high' ? '#dc2626' : '#c9a227'
                  }}
                >
                  {lang === 'bn' ? factor.textBn : factor.textEn}
                </div>
              ))}
            </div>
            
            {/* Recommendations */}
            <div style={styles.recommendCard}>
              <h4 style={styles.recommendTitle}>
                {lang === 'bn' ? 'পরামর্শ' : 'Recommendations'}
              </h4>
              <ul style={styles.recommendList}>
                {riskAnalysis.level === 'critical' || riskAnalysis.level === 'high' ? (
                  <>
                    <li>{lang === 'bn' ? 'অবিলম্বে ফসল ভালো সংরক্ষণে স্থানান্তর করুন' : 'Move crops to better storage immediately'}</li>
                    <li>{lang === 'bn' ? 'আর্দ্রতা কমাতে ব্যবস্থা নিন' : 'Reduce humidity levels'}</li>
                    <li>{lang === 'bn' ? 'বৃষ্টি থেকে রক্ষার জন্য তারপলিন ব্যবহার করুন' : 'Use tarpaulin for rain protection'}</li>
                  </>
                ) : (
                  <>
                    <li>{lang === 'bn' ? 'নিয়মিত ফসল পরীক্ষা করুন' : 'Inspect crops regularly'}</li>
                    <li>{lang === 'bn' ? 'আবহাওয়ার পূর্বাভাস অনুসরণ করুন' : 'Monitor weather forecasts'}</li>
                  </>
                )}
              </ul>
            </div>
            
            {/* B2: Smart Alert System */}
            <SmartAlertSystem 
              batch={selectedBatch}
              weatherData={weatherData}
              riskLevel={riskAnalysis.level}
              lang={lang}
            />
          </div>
        )}
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
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px 16px'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.95rem',
    marginBottom: '20px'
  },
  weatherCard: {
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    border: '3px solid #c9a227'
  },
  weatherTitle: {
    fontSize: '1rem',
    color: '#c9a227',
    marginBottom: '16px',
    fontWeight: '600'
  },
  weatherGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  weatherItem: {
    textAlign: 'center',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '12px 8px'
  },
  weatherValue: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#ffffff',
    display: 'block'
  },
  weatherLabel: {
    fontSize: '0.8rem',
    color: '#bbf7d0',
    marginTop: '4px',
    display: 'block'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid #c9a227'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    background: '#ffffff',
    borderRadius: '12px',
    color: '#6b7280',
    border: '2px dashed #d1d5db'
  },
  batchList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px'
  },
  batchCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  batchCardSelected: {
    borderColor: '#1a3d1a',
    boxShadow: '0 4px 15px rgba(26, 61, 26, 0.2)'
  },
  batchTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  batchCrop: {
    fontWeight: '600',
    color: '#1a3d1a'
  },
  batchWeight: {
    fontSize: '0.85rem',
    color: '#c9a227',
    fontWeight: '600'
  },
  batchBottom: {
    fontSize: '0.85rem',
    color: '#6b7280'
  },
  resultCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '2px solid #bbf7d0'
  },
  resultTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a3d1a',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #c9a227'
  },
  scoreSection: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  gaugeOuter: {
    width: '100%',
    height: '16px',
    background: '#e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  gaugeInner: {
    height: '100%',
    borderRadius: '8px',
    transition: 'width 0.5s ease'
  },
  scoreDisplay: {
    marginBottom: '12px'
  },
  scoreNumber: {
    fontSize: '2.5rem',
    fontWeight: '700'
  },
  scoreMax: {
    fontSize: '1.2rem',
    color: '#9ca3af'
  },
  riskBadge: {
    display: 'inline-block',
    padding: '8px 20px',
    borderRadius: '20px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  etclCard: {
    background: '#fffbeb',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    marginBottom: '20px',
    border: '2px solid #fcd34d'
  },
  etclLabel: {
    fontSize: '0.85rem',
    color: '#92400e',
    marginBottom: '4px'
  },
  etclValue: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#c9a227'
  },
  etclDesc: {
    fontSize: '0.85rem',
    color: '#92400e',
    marginTop: '4px'
  },
  factorsSection: {
    marginBottom: '20px'
  },
  factorsTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#374151'
  },
  factorItem: {
    padding: '12px 14px',
    background: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '8px',
    borderLeft: '4px solid',
    fontSize: '0.9rem',
    color: '#374151'
  },
  recommendCard: {
    background: '#f0fdf4',
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid #bbf7d0'
  },
  recommendTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#166534',
    marginBottom: '12px'
  },
  recommendList: {
    margin: 0,
    paddingLeft: '18px',
    color: '#166534',
    fontSize: '0.9rem',
    lineHeight: '1.8'
  },
  locationTag: {
    fontSize: '0.85rem',
    color: '#bbf7d0',
    fontWeight: '400',
    marginLeft: '8px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#bbf7d0',
    padding: '20px'
  },
  batchLocation: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '4px',
    display: 'block'
  }
};

export default RiskPrediction;
