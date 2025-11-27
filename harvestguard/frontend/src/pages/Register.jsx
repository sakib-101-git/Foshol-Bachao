import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../utils/api';
import { saveToken, saveUser, saveLanguage, getLanguage } from '../utils/localSync';
import LanguageToggle from '../components/LanguageToggle';
import './Auth.css';

/**
 * Registration page with 3D background
 */
function Register() {
  const [lang, setLang] = useState(getLanguage());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    preferredLanguage: lang
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
    setFormData(prev => ({ ...prev, preferredLanguage: newLang }));
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password.length < 4) {
      setError(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষর হতে হবে' : 'Password must be at least 4 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await auth.register(formData);
      saveToken(data.token);
      saveUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || (lang === 'bn' ? 'নিবন্ধন ব্যর্থ হয়েছে' : 'Registration failed'));
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
      
      {/* Register Container */}
      <div className="auth-container">
        {/* Info Card - First on Mobile */}
        <div className="auth-info-card">
          <h3>
            {lang === 'bn' ? '🌾 আজই শুরু করুন!' : '🌾 Start Today!'}
          </h3>
          <ul className="auth-info-list">
            <li>
              <span>✅</span>
              {lang === 'bn' 
                ? 'সম্পূর্ণ বিনামূল্যে' 
                : 'Completely free to use'}
            </li>
            <li>
              <span>📱</span>
              {lang === 'bn' 
                ? 'মোবাইলে সহজে ব্যবহার করুন' 
                : 'Easy to use on mobile'}
            </li>
            <li>
              <span>🔒</span>
              {lang === 'bn' 
                ? 'আপনার তথ্য নিরাপদ' 
                : 'Your data is secure'}
            </li>
            <li>
              <span>🌍</span>
              {lang === 'bn' 
                ? 'বাংলায় সম্পূর্ণ সমর্থন' 
                : 'Full Bangla support'}
            </li>
          </ul>
          
          <div style={{ 
            marginTop: '30px', 
            padding: '16px', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '12px',
            fontSize: '0.9rem'
          }}>
            <strong>💡 {lang === 'bn' ? 'টিপস:' : 'Tip:'}</strong>
            <p style={{ marginTop: '8px', opacity: '0.95' }}>
              {lang === 'bn' 
                ? 'আপনার ফোন নম্বর দিলে আমরা গুরুত্বপূর্ণ সতর্কতা পাঠাতে পারব।'
                : 'Add your phone number to receive important alerts.'}
            </p>
          </div>
        </div>
        
        {/* Register Card */}
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">🌾</div>
            <h1 className="auth-title">
              {lang === 'bn' ? 'ফসল বাঁচাও' : 'Foshol Bachao'}
            </h1>
            <p className="auth-subtitle">
              {lang === 'bn' ? 'নতুন একাউন্ট তৈরি করুন' : 'Create your account'}
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}
          
          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                {lang === 'bn' ? '👤 পুরো নাম' : '👤 Full Name'} *
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder={lang === 'bn' ? 'আপনার নাম' : 'Your name'}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                {lang === 'bn' ? '📧 ইমেইল' : '📧 Email'} *
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="farmer@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                {lang === 'bn' ? '📱 ফোন নম্বর' : '📱 Phone Number'}
              </label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+8801XXXXXXXXX"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                {lang === 'bn' ? '🔒 পাসওয়ার্ড' : '🔒 Password'} *
              </label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
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
                : (lang === 'bn' ? '🚀 নিবন্ধন করুন' : '🚀 Register')}
            </button>
          </form>
          
          {/* Login Link */}
          <p className="auth-switch">
            {lang === 'bn' ? 'ইতিমধ্যে একাউন্ট আছে?' : 'Already have an account?'}{' '}
            <Link to="/login" className="auth-switch-link">
              {lang === 'bn' ? 'লগইন করুন' : 'Login'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
