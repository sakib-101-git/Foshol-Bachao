// Crop Scanner - Kindwise Plant.id health assessment
const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../utils/jwt');

const PLANT_ID_API_URL = 'https://plant.id/api/v3/health_assessment';

// Bangla disease name mapping (keyword → Bangla)
const DISEASE_BN_MAP = {
  'late blight':          'লেট ব্লাইট',
  'early blight':         'আর্লি ব্লাইট',
  'bacterial spot':       'ব্যাকটেরিয়াল স্পট',
  'bacterial blight':     'ব্যাকটেরিয়াল ব্লাইট',
  'leaf mold':            'পাতায় ছাঁচ',
  'leaf spot':            'পাতার দাগ',
  'leaf blight':          'পাতার ব্লাইট',
  'septoria':             'সেপ্টোরিয়া পাতার দাগ',
  'spider mite':          'মাকড়সা মাইট',
  'target spot':          'টার্গেট স্পট',
  'yellow leaf curl':     'হলুদ পাতা কুঁকড়ানো ভাইরাস',
  'mosaic':               'মোজাইক ভাইরাস',
  'powdery mildew':       'গুঁড়া মিলডিউ',
  'downy mildew':         'ডাউনি মিলডিউ',
  'black rot':            'কালো পচন',
  'grey mold':            'ধূসর ছাঁচ',
  'gray mold':            'ধূসর ছাঁচ',
  'botrytis':             'বোট্রাইটিস',
  'anthracnose':          'এনথ্রাকনোজ',
  'rust':                 'মরিচা রোগ',
  'wilt':                 'ঢলে পড়া রোগ',
  'crown rot':            'গোড়া পচন',
  'root rot':             'শিকড় পচন',
  'stem rot':             'কাণ্ড পচন',
  'fruit rot':            'ফল পচন',
  'scab':                 'স্ক্যাব রোগ',
  'greening':             'গ্রিনিং রোগ',
  'fire blight':          'ফায়ার ব্লাইট',
  'canker':               'ক্যাংকার',
  'chlorosis':            'ক্লোরোসিস',
  'deficiency':           'পুষ্টির অভাব',
  'nutrient':             'পুষ্টির অভাব',
  'sunburn':              'রোদে পোড়া',
  'frost':                'শীতে ক্ষতি',
  'drought':              'খরা ক্ষতি',
  'overwatering':         'অতিরিক্ত সেচ ক্ষতি',
};

function getDiseaseBn(diseaseName) {
  if (!diseaseName) return 'অজানা রোগ';
  const lower = diseaseName.toLowerCase();
  for (const [key, val] of Object.entries(DISEASE_BN_MAP)) {
    if (lower.includes(key)) return val;
  }
  return diseaseName; // fallback to English name
}

function getSeverity(probability, diseaseName) {
  const name = (diseaseName || '').toLowerCase();
  const highRiskTerms = ['blight', 'mosaic', 'virus', 'wilt', 'rot', 'greening', 'fire', 'curl'];
  const isHighRisk = highRiskTerms.some(k => name.includes(k));

  if (probability >= 0.6 && isHighRisk) return { severity: 'High',   severityBn: 'উচ্চ' };
  if (probability >= 0.35 || isHighRisk) return { severity: 'Medium', severityBn: 'মাঝারি' };
  return                                         { severity: 'Low',    severityBn: 'কম' };
}

function getStatus(isHealthy, probability) {
  if (isHealthy) return 'healthy';
  if (probability >= 0.5) return 'diseased';
  return 'warning';
}

function getBanglaTreatment(diseaseName) {
  const name = (diseaseName || '').toLowerCase();

  if (name.includes('virus') || name.includes('mosaic') || name.includes('curl') || name.includes('yellow leaf')) {
    return {
      immediateBn: ['আক্রান্ত গাছ উপড়ে ধ্বংস করুন', 'বাহক পোকা (এফিড/সাদামাছি) নিয়ন্ত্রণ করুন', 'হাত ও যন্ত্রপাতি জীবাণুমুক্ত করুন'],
      preventiveBn: ['ভাইরাস-প্রতিরোধী জাত ব্যবহার করুন', 'রোগমুক্ত বীজ ব্যবহার করুন', 'জাল দিয়ে চারা ঢেকে রাখুন']
    };
  }
  if (name.includes('bacterial') || name.includes('canker') || name.includes('fire blight')) {
    return {
      immediateBn: ['কপার-ভিত্তিক ব্যাকটেরিসাইড স্প্রে করুন', 'আক্রান্ত অংশ কেটে নষ্ট করুন', 'যন্ত্রপাতি ব্লিচ দিয়ে জীবাণুমুক্ত করুন'],
      preventiveBn: ['রোগমুক্ত বীজ ব্যবহার করুন', 'ফসল আবর্তন করুন', 'সঠিক দূরত্বে রোপণ করুন']
    };
  }
  if (name.includes('blight') || name.includes('rot') || name.includes('wilt')) {
    return {
      immediateBn: ['ম্যানকোজেব বা মেটালাক্সিল স্প্রে করুন', 'আক্রান্ত অংশ কেটে নষ্ট করুন', 'পানি নিষ্কাশন নিশ্চিত করুন'],
      preventiveBn: ['রোগ-প্রতিরোধী জাত ব্যবহার করুন', 'বীজ শোধন করুন', 'ফসল আবর্তন করুন']
    };
  }
  if (name.includes('mildew') || name.includes('mold') || name.includes('rust') || name.includes('spot') || name.includes('scab') || name.includes('anthracnose')) {
    return {
      immediateBn: ['ছত্রাকনাশক স্প্রে করুন', 'আক্রান্ত পাতা ও অংশ সরান', 'বায়ু চলাচল উন্নত করুন'],
      preventiveBn: ['উপর থেকে সেচ এড়িয়ে চলুন', 'অতিরিক্ত নাইট্রোজেন সার এড়িয়ে চলুন', 'ফসল আবর্তন করুন']
    };
  }
  if (name.includes('deficiency') || name.includes('nutrient') || name.includes('chlorosis')) {
    return {
      immediateBn: ['মাটি পরীক্ষা করুন', 'নির্দিষ্ট পুষ্টি সার প্রয়োগ করুন', 'পিএইচ মান সমন্বয় করুন'],
      preventiveBn: ['সুষম সার ব্যবহার করুন', 'নিয়মিত মাটি পরীক্ষা করুন', 'জৈব সার ব্যবহার করুন']
    };
  }
  // default
  return {
    immediateBn: ['স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন', 'আক্রান্ত অংশ সরিয়ে ফেলুন', 'উপযুক্ত কীটনাশক প্রয়োগ করুন'],
    preventiveBn: ['নিয়মিত ক্ষেত পর্যবেক্ষণ করুন', 'রোগ-প্রতিরোধী জাত ব্যবহার করুন', 'সুষম সার ও সেচ ব্যবস্থাপনা নিশ্চিত করুন']
  };
}

module.exports = function(db) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      model: 'plant.id',
      hasApiKey: !!process.env.KINDWISE_API_KEY_PLANT,
      message: 'Scanner ready (Kindwise Plant.id)'
    });
  });

  router.get('/test', (req, res) => {
    res.json({ message: 'Scanner router is working' });
  });

  router.post('/analyze', authMiddleware, async (req, res) => {
    try {
      if (!req.body || !req.body.image) {
        return res.status(400).json({ error: 'Image data required' });
      }

      const apiKey = process.env.KINDWISE_API_KEY_PLANT;
      if (!apiKey) {
        return res.status(500).json({ error: 'KINDWISE_API_KEY_PLANT not configured' });
      }

      // Strip data URL prefix
      let imageData = req.body.image;
      if (imageData.includes(',')) imageData = imageData.split(',')[1];

      console.log('Sending image to Plant.id health assessment API, size:', imageData.length);

      const response = await axios.post(
        `${PLANT_ID_API_URL}?details=common_names,description,treatment&disease_model=full`,
        { images: [imageData] },
        {
          headers: {
            'Api-Key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const data = response.data;
      console.log('Plant.id response status:', data.status);

      if (data.status !== 'COMPLETED') {
        return res.status(500).json({ error: 'Plant.id analysis not completed', details: data.status });
      }

      const isHealthyBinary = data.result?.is_healthy?.binary === true;
      const isHealthyProb = data.result?.is_healthy?.probability || 0;
      const suggestions = data.result?.disease?.suggestions || [];

      console.log(`is_healthy: ${isHealthyBinary} (${(isHealthyProb * 100).toFixed(0)}%), diseases found: ${suggestions.length}`);

      // Plant is healthy
      if (isHealthyBinary || suggestions.length === 0 || (suggestions[0]?.probability || 0) < 0.1) {
        return res.json({
          roboflowResult: {
            status: 'healthy',
            diseaseName: 'No Disease Detected',
            diseaseNameBn: 'কোনো রোগ সনাক্ত হয়নি',
            severity: 'None',
            severityBn: 'নেই',
            confidence: Math.round(isHealthyProb * 100),
            descriptionEn: 'The plant appears healthy. No significant disease symptoms detected.',
            description: 'গাছটি সুস্থ দেখাচ্ছে। কোনো উল্লেখযোগ্য রোগের লক্ষণ পাওয়া যায়নি।',
            treatmentPlan: {
              immediateEn: ['Continue regular care and maintenance', 'Maintain proper irrigation schedule'],
              preventiveEn: ['Monitor plants regularly for early disease signs', 'Use balanced fertilizer'],
              immediateBn: ['নিয়মিত পরিচর্যা চালিয়ে যান', 'সঠিক সেচ দিন'],
              preventiveBn: ['নিয়মিত পর্যবেক্ষণ করুন', 'সুষম সার ব্যবহার করুন']
            },
            allPredictions: []
          }
        });
      }

      // Pick top disease
      const top = suggestions[0];
      const diseaseName = top.name || 'Unknown Disease';
      const probability = top.probability || 0;
      const confidence = Math.round(probability * 100);
      const commonNames = top.details?.common_names || [];
      const apiDescription = top.details?.description || '';
      const apiTreatment = top.details?.treatment || {};

      console.log(`Top disease: ${diseaseName} (${confidence}%)`);

      // English treatment from API (biological + chemical as immediate; prevention as preventive)
      const immediateEn = [
        ...(apiTreatment.biological || []),
        ...(apiTreatment.chemical || [])
      ].slice(0, 4);

      const preventiveEn = (apiTreatment.prevention || []).slice(0, 3);

      // Fallback English if API didn't return treatment details
      const finalImmediateEn = immediateEn.length > 0
        ? immediateEn
        : ['Remove and destroy infected plant parts', 'Apply appropriate fungicide or bactericide', 'Improve field drainage and air circulation'];

      const finalPreventiveEn = preventiveEn.length > 0
        ? preventiveEn
        : ['Use disease-resistant varieties', 'Practice crop rotation', 'Use disease-free seeds'];

      const diseaseNameBn = getDiseaseBn(diseaseName);
      const { severity, severityBn } = getSeverity(probability, diseaseName);
      const status = getStatus(false, probability);
      const banglaTreatment = getBanglaTreatment(diseaseName);

      const displayName = commonNames.length > 0 ? commonNames[0] : diseaseName;

      res.json({
        roboflowResult: {
          status,
          diseaseName: displayName,
          diseaseNameBn,
          severity,
          severityBn,
          confidence,
          descriptionEn: apiDescription
            ? apiDescription.slice(0, 300)
            : `${displayName} detected. ${severity === 'High' ? 'Immediate action required.' : 'Monitor carefully and apply treatment.'}`,
          description: `ছবিতে ${diseaseNameBn} সনাক্ত হয়েছে। ${severity === 'High' ? 'দ্রুত ব্যবস্থা নেওয়া প্রয়োজন।' : 'সতর্কতার সাথে পর্যবেক্ষণ করুন।'}`,
          treatmentPlan: {
            immediateEn: finalImmediateEn,
            preventiveEn: finalPreventiveEn,
            immediateBn: banglaTreatment.immediateBn,
            preventiveBn: banglaTreatment.preventiveBn
          },
          allPredictions: suggestions.slice(0, 5).map(s => ({
            class: s.name,
            confidence: Math.round((s.probability || 0) * 100)
          }))
        }
      });

    } catch (err) {
      console.error('Plant.id scanner error:', err.response?.data || err.message);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        return res.status(401).json({ error: 'Invalid Plant.id API key — get one free at plant.id' });
      }
      if (status === 429) {
        return res.status(429).json({ error: 'Plant.id daily limit reached. Try again tomorrow.' });
      }
      res.status(500).json({ error: 'Disease detection failed', details: err.response?.data?.message || err.message });
    }
  });

  return router;
};
