/**
 * Bilingual translations for Foshol Bachao
 * English (en) and Bangla (bn)
 */

export const translations = {
  // App name
  app: {
    name: { en: 'Foshol Bachao', bn: 'ফসল বাঁচাও' },
    tagline: { en: 'Protect Your Harvest', bn: 'আপনার ফসল রক্ষা করুন' }
  },
  
  // Landing page
  landing: {
    title: {
      en: 'Foshol Bachao',
      bn: 'ফসল বাঁচাও'
    },
    tagline: {
      en: 'Protect Your Harvest',
      bn: 'আপনার ফসল রক্ষা করুন'
    },
    problem: {
      en: 'Bangladesh loses up to 12-32% of harvested rice after harvest due to poor storage. Foshol Bachao helps you log, track and protect your harvest.',
      bn: 'বাংলাদেশে ধানের ক্ষতি কাটা-পরবর্তী পর্যায়ে ১২-৩২% পর্যন্ত হয়। ফসল বাঁচাও আপনাকে ধান লগ করতে, পর্যবেক্ষণ করতে ও সুরক্ষিত রাখতে সাহায্য করে।'
    },
    getStarted: {
      en: 'Get Started',
      bn: 'শুরু করুন'
    },
    login: {
      en: 'Login',
      bn: 'লগইন'
    },
    register: {
      en: 'Register',
      bn: 'নিবন্ধন'
    }
  },

  // Onboarding slides
  onboarding: {
    slide1: {
      title: { en: 'Log Your Harvest', bn: 'আপনার ফসল লগ করুন' },
      text: { en: 'Record your paddy batches with weight, date, and storage location.', bn: 'ওজন, তারিখ এবং সংরক্ষণ স্থান সহ আপনার ধান ব্যাচ রেকর্ড করুন।' }
    },
    slide2: {
      title: { en: 'Check Weather', bn: 'আবহাওয়া দেখুন' },
      text: { en: 'Get local weather forecasts and Bangla advisories for your area.', bn: 'আপনার এলাকার জন্য স্থানীয় আবহাওয়ার পূর্বাভাস এবং বাংলা পরামর্শ পান।' }
    },
    slide3: {
      title: { en: 'Protect & Export', bn: 'সুরক্ষা ও রপ্তানি' },
      text: { en: 'Receive alerts and export your data anytime, even offline.', bn: 'সতর্কতা পান এবং যেকোনো সময় আপনার ডেটা রপ্তানি করুন, অফলাইনেও।' }
    }
  },

  // Workflow steps
  workflow: {
    step1: { en: 'Data', bn: 'তথ্য' },
    step2: { en: 'Warning', bn: 'সতর্কতা' },
    step3: { en: 'Action', bn: 'পদক্ষেপ' },
    step4: { en: 'Saved', bn: 'সংরক্ষিত' }
  },

  // Auth
  auth: {
    email: { en: 'Email', bn: 'ইমেইল' },
    phone: { en: 'Phone', bn: 'ফোন' },
    password: { en: 'Password', bn: 'পাসওয়ার্ড' },
    name: { en: 'Full Name', bn: 'পুরো নাম' },
    loginBtn: { en: 'Login', bn: 'লগইন করুন' },
    registerBtn: { en: 'Register', bn: 'নিবন্ধন করুন' },
    noAccount: { en: "Don't have an account?", bn: 'অ্যাকাউন্ট নেই?' },
    hasAccount: { en: 'Already have an account?', bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?' },
    demoLogin: { en: 'Demo Login', bn: 'ডেমো লগইন' }
  },

  // Dashboard
  dashboard: {
    title: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
    welcome: { en: 'Welcome', bn: 'স্বাগতম' },
    totalBatches: { en: 'Total Batches', bn: 'মোট ব্যাচ' },
    totalWeight: { en: 'Total Weight (kg)', bn: 'মোট ওজন (কেজি)' },
    addBatch: { en: 'Add Batch', bn: 'ব্যাচ যোগ করুন' },
    viewWeather: { en: 'Weather', bn: 'আবহাওয়া' },
    export: { en: 'Export', bn: 'রপ্তানি' },
    sync: { en: 'Sync', bn: 'সিঙ্ক' },
    synced: { en: 'Synced', bn: 'সিঙ্ক হয়েছে' },
    unsynced: { en: 'Unsynced', bn: 'সিঙ্ক হয়নি' },
    offline: { en: 'Offline', bn: 'অফলাইন' },
    online: { en: 'Online', bn: 'অনলাইন' }
  },

  // Batch form
  batch: {
    title: { en: 'Add New Batch', bn: 'নতুন ব্যাচ যোগ করুন' },
    cropType: { en: 'Crop Type', bn: 'ফসলের ধরন' },
    paddy: { en: 'Paddy/Rice', bn: 'ধান/চাল' },
    weight: { en: 'Weight (kg)', bn: 'ওজন (কেজি)' },
    harvestDate: { en: 'Harvest Date', bn: 'ফসল কাটার তারিখ' },
    division: { en: 'Division', bn: 'বিভাগ' },
    district: { en: 'District', bn: 'জেলা' },
    upazila: { en: 'Upazila', bn: 'উপজেলা' },
    storageType: { en: 'Storage Type', bn: 'সংরক্ষণ পদ্ধতি' },
    notes: { en: 'Notes (optional)', bn: 'নোট (ঐচ্ছিক)' },
    submit: { en: 'Save Batch', bn: 'ব্যাচ সংরক্ষণ করুন' },
    active: { en: 'Active', bn: 'সক্রিয়' },
    completed: { en: 'Completed', bn: 'সম্পন্ন' }
  },

  // Weather
  weather: {
    title: { en: 'Weather Forecast', bn: 'আবহাওয়ার পূর্বাভাস' },
    temp: { en: 'Temperature', bn: 'তাপমাত্রা' },
    humidity: { en: 'Humidity', bn: 'আর্দ্রতা' },
    rain: { en: 'Rain Probability', bn: 'বৃষ্টির সম্ভাবনা' },
    advisory: { en: 'Advisory', bn: 'পরামর্শ' },
    selectUpazila: { en: 'Select Upazila', bn: 'উপজেলা নির্বাচন করুন' },
    day: { en: 'Day', bn: 'দিন' }
  },

  // Profile
  profile: {
    title: { en: 'Profile', bn: 'প্রোফাইল' },
    badges: { en: 'Badges', bn: 'ব্যাজ' },
    language: { en: 'Language', bn: 'ভাষা' },
    logout: { en: 'Logout', bn: 'লগআউট' }
  },

  // Common
  common: {
    loading: { en: 'Loading...', bn: 'লোড হচ্ছে...' },
    error: { en: 'Error', bn: 'ত্রুটি' },
    success: { en: 'Success', bn: 'সফল' },
    save: { en: 'Save', bn: 'সংরক্ষণ' },
    cancel: { en: 'Cancel', bn: 'বাতিল' },
    delete: { en: 'Delete', bn: 'মুছুন' },
    back: { en: 'Back', bn: 'পিছনে' },
    next: { en: 'Next', bn: 'পরবর্তী' },
    skip: { en: 'Skip', bn: 'এড়িয়ে যান' }
  },
  
  // Storage Types
  storage: {
    'Jute Bag Stack': { en: 'Jute Bag Stack', bn: 'পাটের বস্তার স্তূপ' },
    'Silo': { en: 'Silo', bn: 'সাইলো' },
    'Open Area': { en: 'Open Area', bn: 'খোলা জায়গা' },
    'Warehouse': { en: 'Warehouse', bn: 'গুদাম' },
    'Cold Storage': { en: 'Cold Storage', bn: 'হিমাগার' },
    'Earthen Pot': { en: 'Earthen Pot', bn: 'মাটির পাত্র' }
  },
  
  // Crop Types
  crops: {
    'Paddy': { en: 'Paddy/Rice', bn: 'ধান/চাল' },
    'Wheat': { en: 'Wheat', bn: 'গম' },
    'Maize': { en: 'Maize/Corn', bn: 'ভুট্টা' },
    'Potato': { en: 'Potato', bn: 'আলু' },
    'Onion': { en: 'Onion', bn: 'পেঁয়াজ' },
    'Tomato': { en: 'Tomato', bn: 'টমেটো' },
    'Vegetables': { en: 'Vegetables', bn: 'শাকসবজি' },
    'Mango': { en: 'Mango', bn: 'আম' },
    'Banana': { en: 'Banana', bn: 'কলা' },
    'Jute': { en: 'Jute', bn: 'পাট' },
    'Sugarcane': { en: 'Sugarcane', bn: 'আখ' },
    'Lentils': { en: 'Lentils/Dal', bn: 'ডাল' },
    'Mustard': { en: 'Mustard', bn: 'সরিষা' },
    'Chili': { en: 'Chili', bn: 'মরিচ' },
    'Other': { en: 'Other', bn: 'অন্যান্য' }
  },
  
  // Divisions (for location display)
  divisions: {
    'Dhaka': { en: 'Dhaka', bn: 'ঢাকা' },
    'Rajshahi': { en: 'Rajshahi', bn: 'রাজশাহী' },
    'Khulna': { en: 'Khulna', bn: 'খুলনা' },
    'Chittagong': { en: 'Chittagong', bn: 'চট্টগ্রাম' },
    'Rangpur': { en: 'Rangpur', bn: 'রংপুর' },
    'Sylhet': { en: 'Sylhet', bn: 'সিলেট' },
    'Barisal': { en: 'Barisal', bn: 'বরিশাল' },
    'Mymensingh': { en: 'Mymensingh', bn: 'ময়মনসিংহ' }
  }
};

/**
 * Get translation by key path
 * @param {string} path - Dot notation path (e.g., 'landing.title')
 * @param {string} lang - Language code ('en' or 'bn')
 */
export function t(path, lang = 'bn') {
  const keys = path.split('.');
  let value = translations;
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return path; // Return path if not found
    }
  }
  
  if (value && typeof value === 'object' && value[lang]) {
    return value[lang];
  }
  
  return path;
}
