import { useState, useEffect } from 'react';
import { weather } from '../utils/api';

const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

function getDayLabel(dateStr, lang) {
  if (!dateStr || dateStr === 'Today' || dateStr === 'Tomorrow') {
    return lang === 'bn' ? 'আজ' : dateStr || 'Today';
  }
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return lang === 'bn' ? 'আজ' : 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return lang === 'bn' ? 'কাল' : 'Tomorrow';
  return lang === 'bn' ? DAY_BN[d.getDay()] : DAY_EN[d.getDay()];
}

function getWeatherEmoji(desc, rainProb, temp) {
  const d = (desc || '').toLowerCase();
  if (rainProb > 70 || d.includes('rain') || d.includes('thunder')) return '🌧️';
  if (rainProb > 40 || d.includes('drizzle') || d.includes('shower')) return '🌦️';
  if (d.includes('cloud') || d.includes('overcast')) return '☁️';
  if (d.includes('haze') || d.includes('mist') || d.includes('fog')) return '🌫️';
  if (temp >= 30) return '☀️';
  return '🌤️';
}

function WeatherWidget({ upazila, lang }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!upazila) { setLoading(false); return; }

    let cancelled = false;
    async function fetchWeather() {
      try {
        setLoading(true);
        setError(null);
        const data = await weather.get(upazila, lang);
        if (!cancelled) setWeatherData(data);
      } catch (err) {
        if (cancelled) return;
        if (retryCount < 2) {
          setRetryCount(c => c + 1);
          setTimeout(fetchWeather, 3000);
          return;
        }
        setError(lang === 'bn' ? 'আবহাওয়া লোড করা যায়নি।' : 'Failed to load weather.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setRetryCount(0);
    fetchWeather();
    return () => { cancelled = true; };
  }, [upazila, lang]);

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.loadingRow}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>
            {lang === 'bn' ? 'আবহাওয়া লোড হচ্ছে...' : 'Loading weather...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.card}>
        <p style={{ color: '#dc2626', marginBottom: '12px' }}>⚠️ {error}</p>
        <button
          onClick={() => { setRetryCount(0); setLoading(true); setError(null);
            weather.get(upazila, lang)
              .then(d => setWeatherData(d))
              .catch(() => setError(lang === 'bn' ? 'পুনরায় ব্যর্থ' : 'Retry failed'))
              .finally(() => setLoading(false));
          }}
          style={styles.retryBtn}
        >
          {lang === 'bn' ? '🔄 পুনরায় চেষ্টা করুন' : '🔄 Retry'}
        </button>
      </div>
    );
  }

  if (!weatherData) return null;

  const { current, forecast, advisories, source } = weatherData;
  const isLive = source === 'openweathermap';

  return (
    <div>
      {/* Current Weather */}
      <div style={styles.currentCard}>
        <div style={styles.currentHeader}>
          <span style={styles.locationLabel}>📍 {upazila}</span>
          <span style={{ ...styles.sourceBadge, background: isLive ? '#16a34a' : '#6b7280' }}>
            {isLive ? '🔴 LIVE' : (lang === 'bn' ? 'ক্যাশ' : 'CACHED')}
          </span>
        </div>

        <div style={styles.currentMain}>
          <span style={styles.weatherEmoji}>
            {getWeatherEmoji(current.description, forecast?.[0]?.rainProbability, current.temp)}
          </span>
          <div>
            <div style={styles.tempBig}>{current.temp}°C</div>
            {current.description && (
              <div style={styles.descText}>{current.description}</div>
            )}
          </div>
        </div>

        <div style={styles.detailsRow}>
          <div style={styles.detailItem}>
            <span style={styles.detailVal}>{current.humidity}%</span>
            <span style={styles.detailLbl}>{lang === 'bn' ? 'আর্দ্রতা' : 'Humidity'}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailVal}>
              {current.rainProbability ?? forecast?.[0]?.rainProbability ?? 0}%
            </span>
            <span style={styles.detailLbl}>{lang === 'bn' ? 'বৃষ্টি' : 'Rain'}</span>
          </div>
          {current.feelsLike != null && (
            <div style={styles.detailItem}>
              <span style={styles.detailVal}>{current.feelsLike}°C</span>
              <span style={styles.detailLbl}>{lang === 'bn' ? 'অনুভূত' : 'Feels Like'}</span>
            </div>
          )}
          {current.windSpeed != null && (
            <div style={styles.detailItem}>
              <span style={styles.detailVal}>{current.windSpeed} m/s</span>
              <span style={styles.detailLbl}>{lang === 'bn' ? 'বায়ু' : 'Wind'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5-Day Forecast */}
      {forecast && forecast.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            {lang === 'bn' ? '৫-দিনের পূর্বাভাস' : '5-Day Forecast'}
          </h3>
          <div style={styles.forecastRow}>
            {forecast.map((day, i) => (
              <div key={i} style={styles.forecastDay}>
                <div style={styles.forecastDayName}>{getDayLabel(day.date, lang)}</div>
                <div style={styles.forecastEmoji}>
                  {getWeatherEmoji(day.description, day.rainProbability, day.temp)}
                </div>
                <div style={styles.forecastTemp}>{day.temp}°</div>
                {day.tempMin != null && (
                  <div style={styles.forecastTempMin}>{day.tempMin}°</div>
                )}
                <div style={styles.forecastRain}>{day.rainProbability}% 🌧️</div>
                {day.description && (
                  <div style={styles.forecastDesc}>{day.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisories */}
      {advisories && advisories.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            {lang === 'bn' ? '🌾 কৃষি পরামর্শ' : '🌾 Farming Advisory'}
          </h3>
          {advisories.map((adv, i) => (
            <div key={i} style={{
              ...styles.advisory,
              background: adv.priority === 'high' ? '#fef2f2' : '#f0fdf4',
              borderColor: adv.priority === 'high' ? '#fecaca' : '#bbf7d0'
            }}>
              <span style={styles.advIcon}>{adv.icon}</span>
              <span style={{ ...styles.advText, color: adv.priority === 'high' ? '#7f1d1d' : '#166534' }}>
                {adv.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    border: '2px solid #e5e7eb'
  },
  currentCard: {
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 20px rgba(26,61,26,0.25)'
  },
  currentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  locationLabel: {
    color: '#bbf7d0',
    fontSize: '1rem',
    fontWeight: '600'
  },
  sourceBadge: {
    fontSize: '0.72rem',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: '700'
  },
  currentMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  },
  weatherEmoji: {
    fontSize: '3.5rem'
  },
  tempBig: {
    fontSize: '2.8rem',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 1
  },
  descText: {
    color: '#bbf7d0',
    fontSize: '0.9rem',
    textTransform: 'capitalize',
    marginTop: '4px'
  },
  detailsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  detailItem: {
    flex: '1',
    minWidth: '60px',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 8px',
    textAlign: 'center'
  },
  detailVal: {
    display: 'block',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#ffffff'
  },
  detailLbl: {
    display: 'block',
    fontSize: '0.72rem',
    color: '#bbf7d0',
    marginTop: '2px'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1a3d1a',
    margin: '0 0 14px 0'
  },
  forecastRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto'
  },
  forecastDay: {
    flex: '1',
    minWidth: '62px',
    textAlign: 'center',
    padding: '10px 6px',
    background: '#f0fdf4',
    borderRadius: '10px',
    border: '1px solid #bbf7d0'
  },
  forecastDayName: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '4px'
  },
  forecastEmoji: {
    fontSize: '1.6rem',
    margin: '4px 0'
  },
  forecastTemp: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#1a3d1a'
  },
  forecastTempMin: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginBottom: '2px'
  },
  forecastRain: {
    fontSize: '0.72rem',
    color: '#3b82f6',
    marginTop: '2px'
  },
  forecastDesc: {
    fontSize: '0.62rem',
    color: '#9ca3af',
    marginTop: '3px',
    textTransform: 'capitalize',
    lineHeight: '1.3'
  },
  advisory: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    borderRadius: '10px',
    border: '2px solid',
    marginBottom: '10px'
  },
  advIcon: {
    fontSize: '1.2rem',
    flexShrink: 0
  },
  advText: {
    fontSize: '0.9rem',
    lineHeight: '1.5'
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    justifyContent: 'center'
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '0.95rem'
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#16a34a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontFamily: 'inherit'
  }
};

// Spinner keyframe
if (typeof document !== 'undefined' && !document.getElementById('ww-spin')) {
  const s = document.createElement('style');
  s.id = 'ww-spin';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

export default WeatherWidget;
