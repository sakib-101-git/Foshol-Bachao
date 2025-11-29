import { useState, useEffect } from 'react';
import { weather } from '../utils/api';
import { t } from '../utils/translations';

/**
 * Weather widget showing 5-day forecast and advisories
 */
function WeatherWidget({ upazila, lang }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    async function fetchWeather() {
      if (!upazila) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching weather for:', upazila);
        const data = await weather.get(upazila, lang);
        console.log('Weather data received:', data);
        setWeatherData(data);
      } catch (err) {
        console.error('Weather fetch error:', err);
        // If backend is waking up (Render cold start), retry
        if (retryCount < 2) {
          console.log('Retrying weather fetch...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchWeather(), 3000);
          return;
        }
        setError(lang === 'bn' ? 'আবহাওয়া লোড করা যায়নি। পুনরায় চেষ্টা করুন।' : 'Failed to load weather. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    setRetryCount(0);
    fetchWeather();
  }, [upazila, lang]);
  
  if (loading) {
    return (
      <div className="card loading-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="card">
        <p style={{ color: '#dc2626', marginBottom: '12px' }}>⚠️ {error}</p>
        <button 
          onClick={() => {
            setRetryCount(0);
            setLoading(true);
            setError(null);
            weather.get(upazila, lang)
              .then(data => setWeatherData(data))
              .catch(err => setError(lang === 'bn' ? 'পুনরায় চেষ্টা ব্যর্থ' : 'Retry failed'))
              .finally(() => setLoading(false));
          }}
          style={{
            padding: '10px 20px',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {lang === 'bn' ? '🔄 পুনরায় চেষ্টা করুন' : '🔄 Retry'}
        </button>
      </div>
    );
  }
  
  if (!weatherData) {
    return (
      <div className="card">
        <p>{lang === 'bn' ? 'উপজেলা নির্বাচন করুন' : 'Select an upazila to see weather'}</p>
      </div>
    );
  }
  
  const { current, forecast, advisories, labels, source } = weatherData;
  
  return (
    <div className="fade-in">
      {/* Current Weather */}
      <div className="weather-card">
        <h3 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{lang === 'bn' ? '📍 ' + upazila : '📍 ' + upazila}</span>
          {source === 'openweathermap' && (
            <span style={{ fontSize: '0.7rem', background: '#16a34a', color: 'white', padding: '4px 8px', borderRadius: '12px' }}>
              🔴 LIVE
            </span>
          )}
        </h3>
        
        <div className="weather-main">
          <span style={{ fontSize: '3rem' }}>
            {current.temp >= 30 ? '☀️' : current.temp >= 20 ? '🌤️' : '🌥️'}
          </span>
          <span className="weather-temp">{current.temp}°C</span>
        </div>
        
        {/* Weather description if available */}
        {current.description && (
          <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '-8px', marginBottom: '12px', textTransform: 'capitalize' }}>
            {current.description}
          </p>
        )}
        
        <div className="weather-details">
          <div className="weather-item">
            <div className="weather-item-value">{current.humidity}%</div>
            <div className="weather-item-label">{labels?.humidity || (lang === 'bn' ? 'আর্দ্রতা' : 'Humidity')}</div>
          </div>
          <div className="weather-item">
            <div className="weather-item-value">
              {current.rainProbability || forecast?.[0]?.rainProbability || 0}%
            </div>
            <div className="weather-item-label">{labels?.rain || (lang === 'bn' ? 'বৃষ্টি' : 'Rain')}</div>
          </div>
          {current.feelsLike && (
            <div className="weather-item">
              <div className="weather-item-value">{current.feelsLike}°C</div>
              <div className="weather-item-label">{lang === 'bn' ? 'অনুভূত' : 'Feels Like'}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* 5-Day Forecast */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '16px' }}>
          {lang === 'bn' ? '৫-দিনের পূর্বাভাস' : '5-Day Forecast'}
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {forecast.map((day, i) => (
            <div 
              key={i}
              style={{
                flex: '1',
                minWidth: '60px',
                textAlign: 'center',
                padding: '12px 8px',
                background: '#f0fdf4',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontWeight: '600' }}>
                {lang === 'bn' ? `দিন ${day.day}` : `Day ${day.day}`}
              </div>
              <div style={{ fontSize: '1.5rem', margin: '8px 0' }}>
                {day.rainProbability > 60 ? '🌧️' : day.temp >= 30 ? '☀️' : '🌤️'}
              </div>
              <div style={{ fontWeight: '700' }}>{day.temp}°</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {day.rainProbability}% 🌧️
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Advisories */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>
          {lang === 'bn' ? '🌾 কৃষি পরামর্শ' : '🌾 Farming Advisory'}
        </h3>
        
        {advisories && advisories.length > 0 ? (
          advisories.map((adv, i) => (
            <div key={i} className={`advisory ${adv.priority}`}>
              <span className="advisory-icon">{adv.icon}</span>
              <span className="advisory-text">{adv.message}</span>
            </div>
          ))
        ) : (
          <p>{lang === 'bn' ? 'কোন বিশেষ পরামর্শ নেই' : 'No special advisories'}</p>
        )}
      </div>
    </div>
  );
}

export default WeatherWidget;

