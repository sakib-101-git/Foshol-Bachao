import { t } from '../utils/translations';

/**
 * Banner showing sync status and unsynced count
 */
function SyncBanner({ unsyncedCount, isOnline, onSync, isSyncing, lang }) {
  if (unsyncedCount === 0) return null;
  
  return (
    <div className="sync-banner">
      <div>
        <strong>{unsyncedCount}</strong>{' '}
        {lang === 'bn' 
          ? 'টি ব্যাচ সিঙ্ক হয়নি' 
          : `batch${unsyncedCount > 1 ? 'es' : ''} unsynced`}
      </div>
      <button 
        className="btn btn-primary"
        onClick={onSync}
        disabled={!isOnline || isSyncing}
      >
        {isSyncing 
          ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') 
          : t('dashboard.sync', lang)}
      </button>
    </div>
  );
}

export default SyncBanner;

