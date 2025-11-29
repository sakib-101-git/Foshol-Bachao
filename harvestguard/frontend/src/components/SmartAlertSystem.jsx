import { useState, useEffect } from 'react';
import { getBatches } from '../utils/localSync';
import { weather } from '../utils/api';

/**
 * B2: Smart Alert System - Decision Engine
 * Generates specific actionable advice in Bangla by combining:
 * - Crop Type
 * - Weather Data
 * - Risk Level
 */

// Crop-specific action templates in Bangla
const CROP_ACTIONS = {
  'Paddy': {
    highTemp: 'আপনার ধানের গুদামে তাপমাত্রা বেশি। এখনই বায়ু চলাচল বাড়ান এবং ছায়ায় রাখুন।',
    highHumidity: 'আর্দ্রতা বেশি - ধান নষ্ট হতে পারে। গুদামে ফ্যান চালু করুন এবং বস্তা উঁচু জায়গায় রাখুন।',
    rain: 'বৃষ্টি আসছে - ধান ভিজে যাওয়ার ঝুঁকি। গুদামের ছাদ পরীক্ষা করুন এবং পলিথিন দিয়ে ঢেকে রাখুন।',
    critical: 'জরুরি: আপনার ধান নষ্ট হওয়ার ঝুঁকি খুব বেশি। এখনই গুদামে বায়ু চলাচল বাড়ান, ফ্যান চালু করুন এবং আর্দ্রতা কম রাখুন।'
  },
  'Wheat': {
    highTemp: 'গমের গুদামে তাপমাত্রা বেশি। ঠান্ডা জায়গায় সরিয়ে রাখুন এবং বায়ু চলাচল নিশ্চিত করুন।',
    highHumidity: 'আর্দ্রতা বেশি হলে গমে ছত্রাক হতে পারে। গুদামে ফ্যান চালু করুন এবং বস্তা শুকনো জায়গায় রাখুন।',
    rain: 'বৃষ্টির আগে গমের গুদাম ঢেকে রাখুন। ভিজে গেলে নষ্ট হয়ে যাবে।',
    critical: 'জরুরি: আপনার গম নষ্ট হওয়ার ঝুঁকি। এখনই গুদামে ফ্যান চালু করুন এবং আর্দ্রতা কম রাখুন।'
  },
  'Potato': {
    highTemp: 'আলুর গুদামে তাপমাত্রা বেশি - অঙ্কুর হতে পারে। এখনই ঠান্ডা জায়গায় সরিয়ে রাখুন।',
    highHumidity: 'আগামীকাল বৃষ্টি হবে এবং আপনার আলুর গুদামে আর্দ্রতা বেশি। এখনই ফ্যান চালু করুন।',
    rain: 'বৃষ্টি আসছে - আলু ভিজে যাওয়ার ঝুঁকি। গুদামের ছাদ পরীক্ষা করুন এবং পলিথিন দিয়ে ঢেকে রাখুন।',
    critical: 'জরুরি: আপনার আলু নষ্ট হওয়ার ঝুঁকি খুব বেশি। এখনই গুদামে ফ্যান চালু করুন, বায়ু চলাচল বাড়ান এবং আর্দ্রতা কম রাখুন।'
  },
  'Onion': {
    highTemp: 'পেঁয়াজের গুদামে তাপমাত্রা বেশি - অঙ্কুর হতে পারে। ঠান্ডা, শুকনো জায়গায় সরিয়ে রাখুন।',
    highHumidity: 'আর্দ্রতা বেশি হলে পেঁয়াজে ছত্রাক হতে পারে। গুদামে ফ্যান চালু করুন এবং বায়ু চলাচল নিশ্চিত করুন।',
    rain: 'বৃষ্টি আসছে - পেঁয়াজ ভিজে যাওয়ার ঝুঁকি। গুদামের ছাদ পরীক্ষা করুন এবং পলিথিন দিয়ে ঢেকে রাখুন।',
    critical: 'জরুরি: আপনার পেঁয়াজ নষ্ট হওয়ার ঝুঁকি। এখনই গুদামে ফ্যান চালু করুন এবং আর্দ্রতা কম রাখুন।'
  },
  'Maize': {
    highTemp: 'ভুট্টার গুদামে তাপমাত্রা বেশি। এখনই বায়ু চলাচল বাড়ান এবং ছায়ায় রাখুন।',
    highHumidity: 'আর্দ্রতা বেশি - ভুট্টা নষ্ট হতে পারে। গুদামে ফ্যান চালু করুন এবং বস্তা উঁচু জায়গায় রাখুন।',
    rain: 'বৃষ্টি আসছে - ভুট্টা ভিজে যাওয়ার ঝুঁকি। গুদামের ছাদ পরীক্ষা করুন।',
    critical: 'জরুরি: আপনার ভুট্টা নষ্ট হওয়ার ঝুঁকি। এখনই গুদামে ফ্যান চালু করুন এবং আর্দ্রতা কম রাখুন।'
  },
  'Vegetables': {
    highTemp: 'শাকসবজির গুদামে তাপমাত্রা বেশি - দ্রুত নষ্ট হতে পারে। এখনই ঠান্ডা জায়গায় সরিয়ে রাখুন।',
    highHumidity: 'আর্দ্রতা বেশি হলে শাকসবজিতে ছত্রাক হতে পারে। গুদামে ফ্যান চালু করুন।',
    rain: 'বৃষ্টি আসছে - শাকসবজি ভিজে যাওয়ার ঝুঁকি। গুদামের ছাদ পরীক্ষা করুন।',
    critical: 'জরুরি: আপনার শাকসবজি নষ্ট হওয়ার ঝুঁকি। এখনই গুদামে ফ্যান চালু করুন এবং ঠান্ডা রাখুন।'
  }
};

// Storage type specific actions
const STORAGE_ACTIONS = {
  'Open Area': {
    rain: 'খোলা জায়গায় রাখা ফসল বৃষ্টিতে ভিজে যাবে। এখনই পলিথিন দিয়ে ঢেকে রাখুন।',
    highHumidity: 'খোলা জায়গায় আর্দ্রতা বেশি - ফসল নষ্ট হতে পারে। ছায়ায় সরিয়ে রাখুন।'
  },
  'Jute Bag Stack': {
    highHumidity: 'পাটের বস্তা আর্দ্রতায় দুর্বল। বস্তা উঁচু জায়গায় রাখুন এবং ফ্যান চালু করুন।',
    rain: 'পাটের বস্তা ভিজে যাওয়ার ঝুঁকি। গুদামের ছাদ পরীক্ষা করুন।'
  },
  'Concrete Storage': {
    highHumidity: 'কংক্রিট গুদামে আর্দ্রতা বেশি। ফ্যান চালু করুন এবং বায়ু চলাচল নিশ্চিত করুন।'
  }
};

/**
 * Generate specific actionable alert in Bangla
 */
function generateSmartAlert(batch, weatherData, riskLevel) {
  const cropType = batch.cropType || 'Paddy';
  const storageType = batch.storageType || 'Open Area';
  const temp = weatherData?.temperature || 28;
  const humidity = weatherData?.humidity || 70;
  const rainProb = weatherData?.rainProbability || 0;
  const tomorrowRain = weatherData?.tomorrowRain || false;
  
  const cropActions = CROP_ACTIONS[cropType] || CROP_ACTIONS['Paddy'];
  const alerts = [];
  
  // Critical risk - highest priority
  if (riskLevel === 'critical') {
    alerts.push({
      priority: 'critical',
      message: cropActions.critical,
      icon: '🚨',
      timestamp: new Date()
    });
    return alerts;
  }
  
  // High temperature alert
  if (temp > 35) {
    alerts.push({
      priority: 'high',
      message: cropActions.highTemp,
      icon: '🌡️',
      timestamp: new Date()
    });
  }
  
  // High humidity alert
  if (humidity > 85) {
    if (tomorrowRain) {
      alerts.push({
        priority: 'high',
        message: cropActions.highHumidity,
        icon: '💧',
        timestamp: new Date()
      });
    } else {
      alerts.push({
        priority: 'high',
        message: cropActions.highHumidity,
        icon: '💧',
        timestamp: new Date()
      });
    }
  } else if (humidity > 75) {
    const storageAction = STORAGE_ACTIONS[storageType]?.highHumidity;
    if (storageAction) {
      alerts.push({
        priority: 'medium',
        message: storageAction,
        icon: '💧',
        timestamp: new Date()
      });
    }
  }
  
  // Rain alert
  if (rainProb > 70 || tomorrowRain) {
    alerts.push({
      priority: 'high',
      message: cropActions.rain,
      icon: '🌧️',
      timestamp: new Date()
    });
  } else if (rainProb > 40) {
    const storageAction = STORAGE_ACTIONS[storageType]?.rain;
    if (storageAction) {
      alerts.push({
        priority: 'medium',
        message: storageAction,
        icon: '🌧️',
        timestamp: new Date()
      });
    }
  }
  
  // If no specific alerts, provide general advice
  if (alerts.length === 0) {
    alerts.push({
      priority: 'low',
      message: 'আপনার ফসলের অবস্থা ভালো। নিয়মিত পরীক্ষা করুন।',
      icon: '✅',
      timestamp: new Date()
    });
  }
  
  return alerts;
}

/**
 * Simulate SMS notification in console
 */
function simulateSMS(alert, batch) {
  const timestamp = new Date().toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  console.log('%c📱 SMS NOTIFICATION', 'background: #1a3d1a; color: #c9a227; font-size: 16px; font-weight: bold; padding: 8px;');
  console.log(`%cFrom: Foshol Bachao Alert System`, 'color: #6b7280; font-size: 12px;');
  console.log(`%cTo: +8801XXXXXXXXX`, 'color: #6b7280; font-size: 12px;');
  console.log(`%cTime: ${timestamp}`, 'color: #6b7280; font-size: 12px;');
  console.log(`%c\n${alert.message}`, 'color: #1f2937; font-size: 14px; line-height: 1.6;');
  console.log(`%c\nBatch: ${batch.cropType} (${batch.estimatedWeightKg}kg)`, 'color: #6b7280; font-size: 12px;');
  console.log('%c─────────────────────────────────────', 'color: #d1d5db;');
}

/**
 * Smart Alert System Component
 */
function SmartAlertSystem({ batch, weatherData, riskLevel, lang = 'bn' }) {
  const [alerts, setAlerts] = useState([]);
  const [lastCriticalAlert, setLastCriticalAlert] = useState(null);
  
  useEffect(() => {
    if (batch && weatherData && riskLevel) {
      const generatedAlerts = generateSmartAlert(batch, weatherData, riskLevel);
      setAlerts(generatedAlerts);
      
      // Simulate SMS for critical alerts
      const criticalAlert = generatedAlerts.find(a => a.priority === 'critical');
      if (criticalAlert && criticalAlert !== lastCriticalAlert) {
        simulateSMS(criticalAlert, batch);
        setLastCriticalAlert(criticalAlert);
      }
    }
  }, [batch, weatherData, riskLevel]);
  
  if (!batch || !weatherData || alerts.length === 0) {
    return null;
  }
  
  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#16a34a'
    };
    return colors[priority] || '#6b7280';
  };
  
  const getPriorityLabel = (priority) => {
    const labels = {
      critical: 'জরুরি',
      high: 'উচ্চ',
      medium: 'মাঝারি',
      low: 'কম'
    };
    return labels[priority] || priority;
  };
  
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        {lang === 'bn' ? '🔔 স্মার্ট সতর্কতা' : '🔔 Smart Alerts'}
      </h3>
      
      {alerts.map((alert, index) => (
        <div
          key={index}
          style={{
            ...styles.alertCard,
            borderLeft: `4px solid ${getPriorityColor(alert.priority)}`,
            background: alert.priority === 'critical' 
              ? '#fef2f2' 
              : alert.priority === 'high'
              ? '#fff7ed'
              : '#f0fdf4'
          }}
        >
          <div style={styles.alertHeader}>
            <span style={styles.alertIcon}>{alert.icon}</span>
            <span style={{
              ...styles.priorityBadge,
              background: getPriorityColor(alert.priority)
            }}>
              {getPriorityLabel(alert.priority)}
            </span>
          </div>
          <p style={styles.alertMessage}>{alert.message}</p>
          <div style={styles.alertFooter}>
            <span style={styles.timestamp}>
              {alert.timestamp.toLocaleTimeString('bn-BD', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {alert.priority === 'critical' && (
              <span style={styles.smsIndicator}>
                📱 SMS পাঠানো হয়েছে
              </span>
            )}
          </div>
        </div>
      ))}
      
      {alerts.some(a => a.priority === 'critical') && (
        <div style={styles.consoleNote}>
          <p style={styles.consoleNoteText}>
            💡 <strong>নোট:</strong> জরুরি সতর্কতার জন্য SMS নোটিফিকেশন ব্রাউজার কনসোলে দেখুন (F12 চাপুন)
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: '20px'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1a3d1a',
    marginBottom: '16px'
  },
  alertCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  alertIcon: {
    fontSize: '1.5rem'
  },
  priorityBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  alertMessage: {
    fontSize: '0.95rem',
    color: '#1f2937',
    lineHeight: '1.6',
    margin: '0 0 10px 0'
  },
  alertFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #e5e7eb'
  },
  timestamp: {
    fontSize: '0.8rem',
    color: '#6b7280'
  },
  smsIndicator: {
    fontSize: '0.8rem',
    color: '#16a34a',
    fontWeight: '600'
  },
  consoleNote: {
    background: '#eff6ff',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '12px',
    border: '1px solid #bfdbfe'
  },
  consoleNoteText: {
    fontSize: '0.85rem',
    color: '#1e40af',
    margin: 0,
    lineHeight: '1.5'
  }
};

export default SmartAlertSystem;
export { generateSmartAlert, simulateSMS };

