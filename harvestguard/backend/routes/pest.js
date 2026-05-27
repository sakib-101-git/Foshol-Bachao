/**
 * B3: Pest Identification Route - Kindwise Insect.id API
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const KINDWISE_API_URL = 'https://insect.kindwise.com/api/v1/identification';

// Pest knowledge base with Bangla names and treatment plans
const PEST_MAP = {
  // Lepidoptera (moths/butterflies)
  'spodoptera frugiperda': {
    nameBn: 'ফল আর্মিওয়ার্ম', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Hand-pick caterpillars from infected plants', 'Spray Emamectin benzoate 2.3% EC', 'Set up pheromone traps'],
    preventiveEn: ['Scout fields regularly', 'Use bio-pesticides during egg-laying period'],
    immediateBn: ['আক্রান্ত গাছ থেকে শুঁয়োপোকা হাতে তুলুন', 'Emamectin benzoate ২.৩% EC স্প্রে করুন', 'ফেরোমন ফাঁদ স্থাপন করুন'],
    preventiveBn: ['নিয়মিত ক্ষেত পর্যবেক্ষণ করুন', 'ডিম পাড়ার সময় জৈব কীটনাশক ব্যবহার করুন']
  },
  'spodoptera litura': {
    nameBn: 'তামাক আর্মিওয়ার্ম', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Collect and destroy caterpillars by hand', 'Spray Chlorpyrifos 20% EC', 'Deploy pheromone traps'],
    preventiveEn: ['Create bird perches in the field', 'Practice crop rotation'],
    immediateBn: ['শুঁয়োপোকা সংগ্রহ করে নষ্ট করুন', 'Chlorpyrifos ২০% EC স্প্রে করুন', 'ফেরোমন ফাঁদ স্থাপন করুন'],
    preventiveBn: ['পাখি বসার জায়গা তৈরি করুন', 'ফসল পরিবর্তন করুন']
  },
  'helicoverpa armigera': {
    nameBn: 'ফল ছিদ্রকারী পোকা', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Remove and destroy infected fruit', 'Spray Cypermethrin 10% EC', 'Use pheromone traps for monitoring'],
    preventiveEn: ['Harvest on time to reduce infestation window', 'Conserve parasitic insects'],
    immediateBn: ['আক্রান্ত ফল তুলে নষ্ট করুন', 'Cypermethrin ১০% EC স্প্রে করুন', 'ফেরোমন ফাঁদ ব্যবহার করুন'],
    preventiveBn: ['সময়মতো ফসল সংগ্রহ করুন', 'পরজীবী পোকা সংরক্ষণ করুন']
  },
  'chilo suppressalis': {
    nameBn: 'ধানের মাজরা পোকা', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Cut and destroy dead hearts and white ears', 'Apply Cartap hydrochloride spray', 'Use Carbofuran granules in field'],
    preventiveEn: ['Use light traps to attract adult moths', 'Plant at recommended time', 'Apply insecticide before larval hatching'],
    immediateBn: ['ডেড হার্ট ও হোয়াইট ইয়ার কেটে নষ্ট করুন', 'Cartap hydrochloride স্প্রে করুন', 'কার্বোফুরান দানা ব্যবহার করুন'],
    preventiveBn: ['আলো ফাঁদ ব্যবহার করুন', 'সঠিক সময়ে রোপণ করুন', 'ডিম থেকে পোকা বের হওয়ার আগে কীটনাশক ব্যবহার করুন']
  },
  'scirpophaga incertulas': {
    nameBn: 'হলুদ মাজরা পোকা', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Cut and submerge infested tillers in water', 'Spray Monocrotophos 36% SL'],
    preventiveEn: ['Set up light traps', 'Conserve parasitic wasps in the field'],
    immediateBn: ['আক্রান্ত কুশি কেটে পানিতে ডুবান', 'Monocrotophos ৩৬% SL স্প্রে করুন'],
    preventiveBn: ['আলো ফাঁদ স্থাপন করুন', 'পরজীবী ওয়াস্প সংরক্ষণ করুন']
  },
  'nilaparvata lugens': {
    nameBn: 'বাদামী ঘাস ফড়িং', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Spray Imidacloprid 20% SL', 'Drain field water to dry the soil', 'Cut and burn infested areas'],
    preventiveEn: ['Use BPH-resistant rice varieties', 'Apply balanced fertilizer', 'Reduce nitrogen fertilizer application'],
    immediateBn: ['Imidacloprid ২০% SL স্প্রে করুন', 'পানি নিষ্কাশন করে মাটি শুকান', 'আক্রান্ত অংশ কেটে পুড়িয়ে ফেলুন'],
    preventiveBn: ['বালাই-সহনশীল জাত ব্যবহার করুন', 'সুষম সার ব্যবহার করুন', 'নাইট্রোজেন সার কম দিন']
  },
  'sogatella furcifera': {
    nameBn: 'সাদা পিঠ ঘাস ফড়িং', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Spray Buprofezin insecticide', 'Drain excess field water'],
    preventiveEn: ['Plant pest-resistant varieties', 'Use light traps for early detection'],
    immediateBn: ['Buprofezin স্প্রে করুন', 'পানি নিষ্কাশন করুন'],
    preventiveBn: ['বালাই-সহনশীল জাত ব্যবহার করুন', 'আলো ফাঁদ ব্যবহার করুন']
  },

  // Hemiptera (bugs, aphids, whiteflies)
  'aphis gossypii': {
    nameBn: 'তুলার জাব পোকা', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Spray soapy water solution', 'Apply Thiamethoxam 25% WG', 'Conserve ladybird beetles'],
    preventiveEn: ['Conserve natural predator insects', 'Use yellow sticky traps for monitoring'],
    immediateBn: ['শাবান পানি স্প্রে করুন', 'Thiamethoxam ২৫% WG স্প্রে করুন', 'লেডিবার্ড বিটল সংরক্ষণ করুন'],
    preventiveBn: ['পোকার প্রাকৃতিক শত্রু সংরক্ষণ করুন', 'হলুদ আঠা ফাঁদ ব্যবহার করুন']
  },
  'bemisia tabaci': {
    nameBn: 'সাদামাছি', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Use yellow sticky traps', 'Spray Acetamiprid insecticide', 'Apply neem oil spray'],
    preventiveEn: ['Cover plants with insect-proof nets', 'Remove heavily infested plants'],
    immediateBn: ['হলুদ আঠা ফাঁদ ব্যবহার করুন', 'Acetamiprid স্প্রে করুন', 'নিম তেল স্প্রে করুন'],
    preventiveBn: ['জাল দিয়ে গাছ ঢেকে রাখুন', 'সংক্রমিত গাছ সরিয়ে ফেলুন']
  },
  'trialeurodes vaporariorum': {
    nameBn: 'গ্রিনহাউস সাদামাছি', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Place yellow sticky traps', 'Apply Spiromesifen spray'],
    preventiveEn: ['Maintain good ventilation', 'Remove infested plants promptly'],
    immediateBn: ['হলুদ আঠা ফাঁদ ব্যবহার করুন', 'Spiromesifen স্প্রে করুন'],
    preventiveBn: ['বায়ু চলাচল ভালো রাখুন', 'পোকামাক্ত গাছ সরিয়ে ফেলুন']
  },
  'myzus persicae': {
    nameBn: 'সবুজ পিচ জাব পোকা', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Spray 0.5% neem oil solution', 'Apply Dimethoate 30% EC'],
    preventiveEn: ['Conserve natural predators', 'Use yellow sticky traps'],
    immediateBn: ['নিম তেল ০.৫% স্প্রে করুন', 'Dimethoate ৩০% EC স্প্রে করুন'],
    preventiveBn: ['প্রাকৃতিক শত্রু সংরক্ষণ করুন', 'হলুদ আঠা ফাঁদ ব্যবহার করুন']
  },

  // Thrips
  'thrips tabaci': {
    nameBn: 'পেঁয়াজের থ্রিপস', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Apply Spinosad insecticide', 'Use blue sticky traps', 'Irrigate to wash off thrips'],
    preventiveEn: ['Practice intercropping', 'Maintain field hygiene'],
    immediateBn: ['Spinosad স্প্রে করুন', 'নীল আঠা ফাঁদ ব্যবহার করুন', 'সেচ দিয়ে পোকা ধুয়ে ফেলুন'],
    preventiveBn: ['আন্তঃফসল চাষ করুন', 'পরিষ্কার-পরিচ্ছন্নতা বজায় রাখুন']
  },
  'frankliniella occidentalis': {
    nameBn: 'পশ্চিমী ফুলের থ্রিপস', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Use blue sticky traps', 'Apply Abamectin insecticide'],
    preventiveEn: ['Maintain field cleanliness and hygiene'],
    immediateBn: ['নীল আঠা ফাঁদ ব্যবহার করুন', 'Abamectin স্প্রে করুন'],
    preventiveBn: ['ফসলের পরিচ্ছন্নতা বজায় রাখুন']
  },

  // Mites
  'tetranychus urticae': {
    nameBn: 'লাল মাকড়', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Wash leaves forcefully with clean water', 'Apply Abamectin 1.8% EC miticide', 'Spray neem oil solution'],
    preventiveEn: ['Regularly inspect undersides of leaves', 'Avoid excess nitrogen fertilizer'],
    immediateBn: ['পানি দিয়ে পাতা ধুয়ে দিন', 'Abamectin ১.৮% EC স্প্রে করুন', 'নিম তেল স্প্রে করুন'],
    preventiveBn: ['গাছের পাতার নিচে নজর রাখুন', 'অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন']
  },
  'panonychus ulmi': {
    nameBn: 'ইউরোপীয় লাল মাকড়', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Apply Hexythiazox miticide', 'Introduce predatory mites'],
    preventiveEn: ['Keep lower leaves clean and dry'],
    immediateBn: ['Hexythiazox স্প্রে করুন', 'শিকারী মাকড় সংরক্ষণ করুন'],
    preventiveBn: ['গাছের নিচের পাতা পরিষ্কার রাখুন']
  },

  // Beetles/Weevils
  'sitophilus oryzae': {
    nameBn: 'ধানের পাখি পোকা', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Clean and disinfect storage facility', 'Apply Deltamethrin dust on grain', 'Store grain at correct moisture level'],
    preventiveEn: ['Use clean storage containers', 'Dry grain thoroughly before storage', 'Store in airtight containers'],
    immediateBn: ['গুদামঘর পরিষ্কার করুন', 'Deltamethrin ধুলো ব্যবহার করুন', 'শস্য সঠিক আর্দ্রতায় রাখুন'],
    preventiveBn: ['পরিষ্কার গুদামঘর ব্যবহার করুন', 'শস্য ভালোভাবে শুকান', 'বায়ুরোধী পাত্রে রাখুন']
  },
  'callosobruchus maculatus': {
    nameBn: 'ডাল পোকা', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Mix neem leaves with stored pulses', 'Fumigate with Phosphine gas', 'Store in cold location'],
    preventiveEn: ['Use clean airtight storage containers', 'Dry pulses thoroughly before storage'],
    immediateBn: ['নিম পাতা মিশিয়ে রাখুন', 'Phosphine গ্যাস দিয়ে ফিউমিগেট করুন', 'ঠান্ডা জায়গায় রাখুন'],
    preventiveBn: ['পরিষ্কার বায়ুরোধী পাত্র ব্যবহার করুন', 'শস্য ভালোভাবে শুকান']
  },

  // Flies
  'bactrocera dorsalis': {
    nameBn: 'প্রাচ্যের ফলমাছি', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Collect and bury all infested fruit', 'Use Methyl eugenol traps', 'Apply Malathion protein bait spray'],
    preventiveEn: ['Use fruit bagging to protect individual fruit', 'Do not leave fallen fruit on the ground'],
    immediateBn: ['আক্রান্ত ফল সংগ্রহ করে পুঁতে ফেলুন', 'মিথাইল ইউজেনল ফাঁদ ব্যবহার করুন', 'Malathion প্রোটিন বেট স্প্রে করুন'],
    preventiveBn: ['ফল ব্যাগিং করুন', 'আক্রান্ত ফল মাটিতে না ফেলে নষ্ট করুন']
  },

  // Grasshoppers/Locusts
  'locusta migratoria': {
    nameBn: 'পঙ্গপাল', riskLevel: 'High', riskLevelBn: 'উচ্চ',
    immediateEn: ['Contact local agricultural department urgently', 'Spray Malathion or Fenitrothion', 'Spray in early morning or evening'],
    preventiveEn: ['Follow locust early warning alerts', 'Coordinate response with neighboring farmers'],
    immediateBn: ['জরুরিভাবে কৃষি বিভাগে যোগাযোগ করুন', 'Malathion বা Fenitrothion স্প্রে করুন', 'সকাল-সন্ধ্যায় স্প্রে করুন'],
    preventiveBn: ['পঙ্গপাল সতর্কতা বার্তা অনুসরণ করুন', 'প্রতিবেশী কৃষকদের সাথে সমন্বয় করুন']
  },

  // Generic/fallback
  'unknown': {
    nameBn: 'অজানা পোকা', riskLevel: 'Medium', riskLevelBn: 'মাঝারি',
    immediateEn: ['Contact local agricultural officer for identification', 'Remove and dispose of affected plant parts', 'Apply neem oil as a general deterrent'],
    preventiveEn: ['Scout fields regularly', 'Maintain field hygiene'],
    immediateBn: ['স্থানীয় কৃষি কর্মকর্তার সাথে যোগাযোগ করুন', 'আক্রান্ত অংশ সরিয়ে ফেলুন', 'নিম তেল স্প্রে করুন'],
    preventiveBn: ['নিয়মিত ক্ষেত পর্যবেক্ষণ করুন', 'পরিষ্কার-পরিচ্ছন্নতা বজায় রাখুন']
  }
};

function getPestInfo(scientificName, commonNames = []) {
  const nameLower = (scientificName || '').toLowerCase();

  // Exact match
  if (PEST_MAP[nameLower]) return PEST_MAP[nameLower];

  // Partial match on scientific name
  for (const key of Object.keys(PEST_MAP)) {
    if (key === 'unknown') continue;
    if (nameLower.includes(key) || key.includes(nameLower.split(' ')[0])) {
      return PEST_MAP[key];
    }
  }

  // Try common names
  for (const common of commonNames) {
    const cLower = common.toLowerCase();
    if (cLower.includes('armyworm') || cLower.includes('army worm')) return PEST_MAP['spodoptera frugiperda'];
    if (cLower.includes('stem borer') || cLower.includes('borer')) return PEST_MAP['chilo suppressalis'];
    if (cLower.includes('brown planthopper') || cLower.includes('planthopper')) return PEST_MAP['nilaparvata lugens'];
    if (cLower.includes('whitefly') || cLower.includes('white fly')) return PEST_MAP['bemisia tabaci'];
    if (cLower.includes('aphid')) return PEST_MAP['aphis gossypii'];
    if (cLower.includes('thrip')) return PEST_MAP['thrips tabaci'];
    if (cLower.includes('mite') || cLower.includes('spider mite')) return PEST_MAP['tetranychus urticae'];
    if (cLower.includes('weevil') || cLower.includes('grain')) return PEST_MAP['sitophilus oryzae'];
    if (cLower.includes('fruit fly')) return PEST_MAP['bactrocera dorsalis'];
    if (cLower.includes('locust')) return PEST_MAP['locusta migratoria'];
    if (cLower.includes('bollworm') || cLower.includes('fruitworm')) return PEST_MAP['helicoverpa armigera'];
    if (cLower.includes('leafhopper') || cLower.includes('leaf hopper')) return PEST_MAP['nilaparvata lugens'];
    if (cLower.includes('mealybug') || cLower.includes('mealy bug')) return PEST_MAP['aphis gossypii'];
  }

  return PEST_MAP['unknown'];
}

/**
 * Identify pest from uploaded image using Kindwise Insect.id API
 */
router.post('/identify', async (req, res) => {
  try {
    const { imageBase64, cropType, location } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: 'Image is required',
        errorBn: 'ছবি প্রয়োজন'
      });
    }

    const apiKey = process.env.KINDWISE_API_KEY_INSECT;
    if (!apiKey) {
      return res.status(500).json({
        error: 'KINDWISE_API_KEY not configured',
        errorBn: 'Kindwise API কী সেটআপ করা নেই'
      });
    }

    // Strip data URL prefix if present
    let imageData = imageBase64;
    if (imageData.startsWith('data:')) {
      imageData = imageData.split(',')[1];
    }

    console.log('Sending image to Kindwise Insect.id API, size:', imageData.length);

    const response = await axios.post(
      KINDWISE_API_URL,
      {
        images: [imageData],
        similar_images: true
      },
      {
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const data = response.data;
    console.log('Kindwise response status:', data.status);

    if (data.status !== 'COMPLETED') {
      return res.status(500).json({
        error: 'Kindwise analysis not completed',
        errorBn: 'পোকা বিশ্লেষণ সম্পন্ন হয়নি',
        details: data.status
      });
    }

    const suggestions = data.result?.classification?.suggestions || [];

    if (suggestions.length === 0) {
      return res.json({
        pestName: 'No Insect Detected',
        pestNameBn: 'কোনো পোকা সনাক্ত হয়নি',
        riskLevel: 'Low',
        riskLevelBn: 'কম',
        descriptionEn: 'No insect detected in the image. The crop appears pest-free.',
        description: 'ছবিতে কোনো পোকা সনাক্ত করা যায়নি। গাছটি পোকামুক্ত দেখাচ্ছে।',
        confidence: 0,
        treatmentPlan: {
          immediateEn: ['Continue regular field scouting'],
          preventiveEn: ['Maintain field hygiene', 'Use balanced fertilizer'],
          immediateBn: ['নিয়মিত ক্ষেত পর্যবেক্ষণ চালিয়ে যান'],
          preventiveBn: ['পরিষ্কার-পরিচ্ছন্নতা বজায় রাখুন', 'সুষম সার ব্যবহার করুন']
        },
        source: 'kindwise',
        allSuggestions: []
      });
    }

    const top = suggestions[0];
    const scientificName = top.name || 'Unknown';
    const confidence = Math.round((top.probability || 0) * 100);
    const commonNames = top.details?.common_names || [];

    console.log(`Top suggestion: ${scientificName} (${confidence}%)`);

    const pestInfo = getPestInfo(scientificName, commonNames);

    const commonNameEn = commonNames.length > 0 ? commonNames[0] : scientificName;

    res.json({
      pestName: commonNameEn,
      pestNameBn: pestInfo.nameBn,
      scientificName,
      riskLevel: pestInfo.riskLevel,
      riskLevelBn: pestInfo.riskLevelBn,
      confidence,
      descriptionEn: `${commonNameEn} (${scientificName}) detected. Crop damage risk is ${pestInfo.riskLevel.toLowerCase()}.`,
      description: `${pestInfo.nameBn} (${scientificName}) সনাক্ত হয়েছে। ফসলের ক্ষতির সম্ভাবনা ${pestInfo.riskLevelBn}।`,
      treatmentPlan: {
        immediateEn: pestInfo.immediateEn,
        preventiveEn: pestInfo.preventiveEn,
        immediateBn: pestInfo.immediateBn,
        preventiveBn: pestInfo.preventiveBn
      },
      source: 'kindwise',
      allSuggestions: suggestions.slice(0, 3).map(s => {
        const info = getPestInfo(s.name, s.details?.common_names || []);
        return {
          name: s.name,
          commonName: s.details?.common_names?.[0] || s.name,
          nameBn: info.nameBn,
          probability: Math.round((s.probability || 0) * 100)
        };
      })
    });

  } catch (error) {
    console.error('Pest identification error:', error);

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid Kindwise API key',
        errorBn: 'Kindwise API কী সঠিক নয়'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Kindwise rate limit reached',
        errorBn: 'আজকের সীমা শেষ হয়েছে। আবার চেষ্টা করুন।'
      });
    }

    res.status(500).json({
      error: 'Failed to identify pest',
      errorBn: 'পোকা শনাক্ত করতে ব্যর্থ',
      details: error.message
    });
  }
});

/**
 * Test endpoint
 */
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    apiConfigured: !!process.env.KINDWISE_API_KEY_INSECT,
    provider: 'Kindwise Insect.id',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
