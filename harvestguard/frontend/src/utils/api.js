/**
 * API Utilities - Backend communication functions
 */

// Production API URL (Render) or localhost for development
const getApiBase = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  // Use localhost for local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  // Production - use Render backend
  return 'https://foshol-bachao-api.onrender.com/api';
};

const API_BASE = getApiBase();
console.log('API Base URL:', API_BASE); // Debug log

export { API_BASE };

/**
 * Get auth token from localStorage
 */
function getToken() {
  return localStorage.getItem('harvestguard_token');
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}, retries = 2) {
  // Auto-set token for all requests (no authentication required)
  let token = getToken();
  if (!token) {
    token = 'demo-token-auto-login';
    localStorage.setItem('harvestguard_token', token);
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    console.log(`API Request: ${API_BASE}${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || errorData.errorBn || `HTTP ${response.status}: Request failed`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('API Error:', err);
    
    // Retry on network errors (Render cold start can take time)
    if (retries > 0 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return apiRequest(endpoint, options, retries - 1);
    }
    
    // Re-throw with more context
    if (err.message) {
      throw err;
    }
    throw new Error('Network error: Could not connect to server');
  }
}

// Auth APIs
export const auth = {
  login: (email, password) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    
  register: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    
  getMe: () => apiRequest('/auth/me')
};

// Batch APIs
export const batches = {
  getAll: () => apiRequest('/batches'),
  
  getOne: (id) => apiRequest(`/batches/${id}`),
  
  create: (batchData) =>
    apiRequest('/batches', {
      method: 'POST',
      body: JSON.stringify(batchData)
    }),
    
  update: (id, updates) =>
    apiRequest(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
    
  delete: (id) =>
    apiRequest(`/batches/${id}`, {
      method: 'DELETE'
    }),
    
  sync: (unsyncedBatches) =>
    apiRequest('/sync', {
      method: 'POST',
      body: JSON.stringify({ unsyncedBatches })
    }),
  
  recordLoss: (id, lossData) =>
    apiRequest(`/batches/${id}/record-loss`, {
      method: 'POST',
      body: JSON.stringify(lossData)
    }),
  
  getLossEvents: (id) =>
    apiRequest(`/batches/${id}/loss-events`),
  
  getLossStats: () =>
    apiRequest('/batches/stats/loss')
};

// Weather API
export const weather = {
  get: (upazila, lang = 'bn') =>
    apiRequest(`/weather?upazila=${encodeURIComponent(upazila)}&lang=${lang}`),
    
  getLocations: () => apiRequest('/weather/locations')
};

// Export APIs
export const exportApi = {
  getJSON: () => apiRequest('/export/json'),
  getBadges: () => apiRequest('/export/badges')
};

// Check if online
export function isOnline() {
  return navigator.onLine;
}

