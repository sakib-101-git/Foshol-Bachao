import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import { getToken } from '../utils/localSync';

/**
 * Navigation pages
 */
const getPages = (lang) => [
  {
    id: 'dashboard',
    label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
    path: '/dashboard'
  },
  {
    id: 'weather',
    label: lang === 'bn' ? 'আবহাওয়া' : 'Weather',
    path: '/weather'
  },
  {
    id: 'risk',
    label: lang === 'bn' ? 'ঝুঁকি বিশ্লেষণ' : 'Risk Analysis',
    path: '/risk-prediction'
  },
  {
    id: 'scanner',
    label: lang === 'bn' ? 'ফসল স্ক্যানার' : 'Crop Scanner',
    path: '/crop-scanner'
  },
  {
    id: 'profile',
    label: lang === 'bn' ? 'প্রোফাইল' : 'Profile',
    path: '/profile'
  }
];

/**
 * App header with navigation dropdown beside language toggle
 */
function Header({ lang, onLangChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isLoggedIn = !!getToken();

  const pages = getPages(lang);
  const currentPage = pages.find(p => p.path === location.pathname) || pages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location]);

  return (
    <header style={styles.header}>
      {/* Logo */}
      <Link to={isLoggedIn ? '/dashboard' : '/'} style={styles.logo}>
        <span style={styles.logoText}>
          {lang === 'bn' ? 'ফসল বাঁচাও' : 'Foshol Bachao'}
        </span>
      </Link>

      {/* Right Side: Navigation Dropdown + Language Toggle */}
      <div style={styles.rightSection}>
        {/* Navigation Dropdown */}
        {isLoggedIn && (
          <div style={styles.navContainer} ref={dropdownRef}>
            <button
              style={styles.navButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span style={styles.currentPage}>{currentPage.label}</span>
              <span style={{
                ...styles.arrow,
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
              }}>▼</span>
            </button>

            {isDropdownOpen && (
              <div style={styles.dropdown}>
                {pages.filter(p => p.path !== currentPage.path).map(page => (
                  <Link
                    key={page.id}
                    to={page.path}
                    style={styles.dropdownItem}
                    onMouseEnter={e => {
                      e.target.style.background = '#f0fdf4';
                      e.target.style.color = '#1a3d1a';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#374151';
                    }}
                  >
                    {page.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Language Toggle */}
        <LanguageToggle lang={lang} onToggle={onLangChange} />
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    height: '56px',
    borderBottom: '3px solid #c9a227'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none'
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.5px'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  navContainer: {
    position: 'relative'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: 'rgba(201, 162, 39, 0.2)',
    border: '2px solid #c9a227',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  },
  currentPage: {
    color: '#fef8e8'
  },
  arrow: {
    fontSize: '0.6rem',
    color: '#c9a227',
    transition: 'transform 0.2s ease'
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    minWidth: '160px',
    padding: '8px 0',
    border: '2px solid #c9a227',
    overflow: 'hidden',
    zIndex: 100
  },
  dropdownItem: {
    display: 'block',
    padding: '12px 16px',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    borderLeft: '3px solid transparent'
  }
};

export default Header;
