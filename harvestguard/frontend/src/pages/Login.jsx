import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../utils/api';
import { saveToken, saveUser, saveLanguage, getLanguage } from '../utils/localSync';
import { t } from '../utils/translations';
import LanguageToggle from '../components/LanguageToggle';
import './Auth.css';

/**
 * Login page with 3D background
 */
function Login() {
  const [lang, setLang] = useState(getLanguage());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await auth.login(email, password);
      saveToken(data.token);
      saveUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(lang === 'bn' ? 'ভুল ইমেইল বা পাসওয়ার্ড' : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDemoLogin = async () => {
    setEmail('demo@harvestguard.com');
    setPassword('demo123');
    setLoading(true);
    
    try {
      const data = await auth.login('demo@harvestguard.com', 'demo123');
      saveToken(data.token);
      saveUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(lang === 'bn' ? 'ডেমো লগইন ব্যর্থ' : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      {/* Language Toggle */}
      <div className="auth-lang-toggle">
        <LanguageToggle lang={lang} onToggle={toggleLang} />
      </div>
      
      {/* Back to Home */}
      <Link to="/" className="auth-back-link">
        ← {lang === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}
      </Link>
      
      {/* Login Card */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">🌾</div>
            <h1 className="auth-title">
              {lang === 'bn' ? 'ফসল বাঁচাও' : 'Foshol Bachao'}
            </h1>
            <p className="auth-subtitle">
              {lang === 'bn' ? 'আপনার একাউন্টে লগইন করুন' : 'Login to your account'}
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}
          
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                {lang === 'bn' ? '📧 ইমেইল' : '📧 Email'}
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                {lang === 'bn' ? '🔒 পাসওয়ার্ড' : '🔒 Password'}
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-auth-primary"
              disabled={loading}
            >
              {loading 
                ? (lang === 'bn' ? '⏳ অপেক্ষা করুন...' : '⏳ Please wait...') 
                : (lang === 'bn' ? '🚀 লগইন করুন' : '🚀 Login')}
            </button>
          </form>
          
          {/* Divider */}
          <div className="auth-divider">
            <span>{lang === 'bn' ? 'অথবা' : 'or'}</span>
          </div>
          
          {/* Demo Login */}
          <button 
            type="button"
            className="btn-auth-demo"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            🔑 {lang === 'bn' ? 'ডেমো লগইন' : 'Demo Login'}
          </button>
          
          {/* Register Link */}
          <p className="auth-switch">
            {lang === 'bn' ? 'একাউন্ট নেই?' : "Don't have an account?"}{' '}
            <Link to="/register" className="auth-switch-link">
              {lang === 'bn' ? 'নিবন্ধন করুন' : 'Register'}
            </Link>
          </p>
        </div>
        
        {/* Info Card */}
        <div className="auth-info-card">
          <h3>
            {lang === 'bn' ? '🌾 ফসল বাঁচাও কি?' : '🌾 What is Foshol Bachao?'}
          </h3>
          <ul className="auth-info-list">
            <li>
              <span>📊</span>
              {lang === 'bn' 
                ? 'আপনার ফসল ব্যাচ লগ করুন' 
                : 'Log your harvest batches'}
            </li>
            <li>
              <span>🌤️</span>
              {lang === 'bn' 
                ? 'স্থানীয় আবহাওয়া পূর্বাভাস পান' 
                : 'Get local weather forecasts'}
            </li>
            <li>
              <span>⚠️</span>
              {lang === 'bn' 
                ? 'বাংলায় সতর্কতা পান' 
                : 'Receive alerts in Bangla'}
            </li>
            <li>
              <span>📴</span>
              {lang === 'bn' 
                ? 'অফলাইনে কাজ করে' 
                : 'Works offline'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
