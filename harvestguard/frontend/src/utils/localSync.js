/**
 * Local Storage & Offline Sync Utilities
 */

const STORAGE_KEYS = {
  TOKEN: 'harvestguard_token',
  USER: 'harvestguard_user',
  LANGUAGE: 'harvestguard_lang',
  BATCHES: 'harvestguard_batches',
  UNSYNCED: 'harvestguard_unsynced',
  LAST_SYNC: 'harvestguard_lastSync'
};

// Token management
export function saveToken(token) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

// User management
export function saveUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getUser() {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// Language preference
export function saveLanguage(lang) {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
}

export function getLanguage() {
  return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'bn';
}

// Batch storage (offline-first)
export function saveBatches(batches) {
  localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
}

export function getBatches() {
  const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
  return data ? JSON.parse(data) : [];
}

// Unsynced batches for offline mode
export function addUnsyncedBatch(batch) {
  const unsynced = getUnsyncedBatches();
  unsynced.push({ ...batch, synced: false });
  localStorage.setItem(STORAGE_KEYS.UNSYNCED, JSON.stringify(unsynced));
  
  // Also add to local batches
  const batches = getBatches();
  batches.push({ ...batch, synced: false });
  saveBatches(batches);
}

export function getUnsyncedBatches() {
  const data = localStorage.getItem(STORAGE_KEYS.UNSYNCED);
  return data ? JSON.parse(data) : [];
}

export function clearUnsyncedBatches() {
  localStorage.setItem(STORAGE_KEYS.UNSYNCED, JSON.stringify([]));
}

export function markBatchesSynced(ids) {
  const batches = getBatches();
  batches.forEach(b => {
    if (ids.includes(b.id)) {
      b.synced = true;
    }
  });
  saveBatches(batches);
  
  // Clear from unsynced
  const unsynced = getUnsyncedBatches().filter(b => !ids.includes(b.id));
  localStorage.setItem(STORAGE_KEYS.UNSYNCED, JSON.stringify(unsynced));
}

// Last sync timestamp
export function saveLastSync() {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
}

export function getLastSync() {
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

// Clear all data (logout)
export function clearAll() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Generate unique ID for offline batches
export function generateId() {
  return 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

