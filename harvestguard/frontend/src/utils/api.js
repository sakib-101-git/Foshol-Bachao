/**
 * API utility functions for HarvestGuard
 * Handles all communication with the backend
 */

const API_BASE = 'http://localhost:3001/api';

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
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.errorBn || 'Request failed');
    }
    
    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
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
    })
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

