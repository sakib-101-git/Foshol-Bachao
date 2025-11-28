/**
 * API Utilities - Backend communication functions
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

/**
 * Get auth token from localStorage
 */
function getToken() {
  return localStorage.getItem('harvestguard_token');
}

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
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
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || errorData.errorBn || `HTTP ${response.status}: Request failed`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('API Error:', err);
    // Re-throw with more context
    if (err.message) {
      throw err;
    }
    throw new Error('Network error: Could not connect to server. Make sure backend is running on http://localhost:3001');
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

