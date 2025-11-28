/**
 * Sidebar Navigation Component
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getToken, clearAll } from '../utils/localSync';

const getPages = (lang) => [
  {
    id: 'dashboard',
    label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
    path: '/dashboard',
    icon: '🏠'
  },
  {
    id: 'weather',
    label: lang === 'bn' ? 'আবহাওয়া' : 'Weather',
    path: '/weather',
    icon: '🌤️'
  },
  {
    id: 'risk',
    label: lang === 'bn' ? 'ঝুঁকি বিশ্লেষণ' : 'Risk Analysis',
    path: '/risk-prediction',
    icon: '⚠️'
  },
  {
    id: 'scanner',
    label: lang === 'bn' ? 'ফসল স্ক্যানার' : 'Crop Scanner',
    path: '/crop-scanner',
    icon: '📷'
  },
  {
    id: 'profile',
    label: lang === 'bn' ? 'প্রোফাইল' : 'Profile',
    path: '/profile',
    icon: '👤'
  }
];

/**
 * Collapsible Sidebar Navigation
 */
function Sidebar({ lang, onLangChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  const pages = getPages(lang);
  const currentPath = location.pathname;

  const handleLogout = () => {
    clearAll();
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Save preference
    localStorage.setItem('sidebarCollapsed', !isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // Update page margins when sidebar state changes
  useEffect(() => {
    const updatePageLayout = () => {
      const pages = document.querySelectorAll('[data-page-content]');
      const margin = isCollapsed ? '70px' : '260px';
      pages.forEach(page => {
        if (window.innerWidth > 768) {
          page.style.marginLeft = margin;
          page.style.width = `calc(100% - ${margin})`;
        } else {
          page.style.marginLeft = '0';
          page.style.width = '100%';
        }
      });
    };
    
    updatePageLayout();
    window.addEventListener('resize', updatePageLayout);
    return () => window.removeEventListener('resize', updatePageLayout);
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        style={styles.mobileToggle}
        onClick={toggleMobile}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside 
        style={{
          ...styles.sidebar,
          ...(isCollapsed ? styles.sidebarCollapsed : {}),
          ...(isMobileOpen ? { transform: 'translateX(0)' } : {})
        }}
        className={isMobileOpen ? 'sidebar-open' : ''}
      >
        {/* Header */}
        <div style={{
          ...styles.header,
          ...(isCollapsed ? styles.headerCollapsed : {})
        }}>
          <Link to="/dashboard" style={styles.logo}>
            <div style={{
              ...styles.logoContainer,
              ...(isCollapsed ? styles.logoContainerCollapsed : {})
            }}>
              <span style={styles.logoIcon}>🌾</span>
              {!isCollapsed && (
                <div style={styles.logoTextContainer}>
                  <span style={styles.logoText}>
                    {lang === 'bn' ? 'ফসল বাঁচাও' : 'Foshol Bachao'}
                  </span>
                  <span style={styles.logoTagline}>
                    {lang === 'bn' ? 'আপনার ফসল রক্ষা করুন' : 'Protect Your Harvest'}
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          {pages.map(page => {
            const isActive = currentPath === page.path;
            return (
              <Link
                key={page.id}
                to={page.path}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  ...(isCollapsed ? styles.navItemCollapsed : {})
                }}
                title={isCollapsed ? page.label : ''}
              >
                <span style={styles.navIcon}>{page.icon}</span>
                {!isCollapsed && (
                  <span style={styles.navLabel}>{page.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <span style={styles.activeIndicator}>●</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div style={styles.footer}>
            {/* Logout */}
            <button
              style={{
                ...styles.logoutBtn,
                ...(isLogoutHovered ? {
                  background: 'rgba(220, 38, 38, 0.25)',
                  borderColor: 'rgba(220, 38, 38, 0.6)',
                  color: '#f87171',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                } : {})
              }}
              onClick={handleLogout}
              onMouseEnter={() => setIsLogoutHovered(true)}
              onMouseLeave={() => setIsLogoutHovered(false)}
            >
              <span style={styles.logoutText}>
                {lang === 'bn' ? 'লগআউট' : 'Logout'}
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Toggle Button - Positioned between sidebar and content */}
      <button
        style={{
          ...styles.collapseBtn,
          ...(isCollapsed ? styles.collapseBtnCollapsed : {}),
          left: isCollapsed ? '70px' : '260px'
        }}
        onClick={toggleSidebar}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) translateX(-30%) scale(1.2)';
          e.currentTarget.style.color = '#d4a853';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) translateX(-50%) scale(1)';
          e.currentTarget.style.color = '#c9a227';
        }}
        title={isCollapsed ? (lang === 'bn' ? 'প্রসারিত করুন' : 'Expand') : (lang === 'bn' ? 'সংকুচিত করুন' : 'Collapse')}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          style={styles.overlay}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

const styles = {
  mobileToggle: {
    position: 'fixed',
    top: '16px',
    left: '16px',
    zIndex: 1001,
    padding: '10px 14px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    border: '2px solid #c9a227',
    borderRadius: '8px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    fontFamily: 'inherit',
    display: 'none'
  },
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '260px',
    background: 'linear-gradient(180deg, #1a3d1a 0%, #2d5a27 100%)',
    borderRight: '3px solid #c9a227',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    transition: 'width 0.3s ease, transform 0.3s ease',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)'
  },
  sidebarCollapsed: {
    width: '70px'
  },
  overlay: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    '@media (max-width: 768px)': {
      display: 'block'
    }
  },
  header: {
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '2px solid rgba(201, 162, 39, 0.3)',
    position: 'relative',
    minHeight: '120px'
  },
  headerCollapsed: {
    padding: '16px 8px',
    gap: '16px',
    minHeight: '100px'
  },
  logo: {
    textDecoration: 'none',
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '100%'
  },
  logoContainerCollapsed: {
    gap: '0',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logoIcon: {
    fontSize: '2.5rem',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
  },
  logoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '1px',
    textAlign: 'center',
    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
    lineHeight: '1.2'
  },
  logoTagline: {
    fontSize: '0.7rem',
    color: '#c9a227',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: '0.3px',
    opacity: '0.9'
  },
  collapseBtn: {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%) translateX(-50%)',
    padding: '12px 8px',
    background: 'transparent',
    border: 'none',
    borderRadius: '0',
    color: '#c9a227',
    fontSize: '1.5rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '60px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  collapseBtnCollapsed: {
    // left will be set dynamically
  },
  nav: {
    flex: 1,
    padding: '16px 0',
    overflowY: 'auto'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    margin: '4px 12px',
    color: '#bbf7d0',
    textDecoration: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  navItemCollapsed: {
    justifyContent: 'center',
    padding: '14px',
    margin: '4px 12px'
  },
  navItemActive: {
    background: 'rgba(201, 162, 39, 0.25)',
    color: '#fef8e8',
    borderLeft: '4px solid #c9a227'
  },
  navIcon: {
    fontSize: '1.3rem',
    minWidth: '24px',
    textAlign: 'center'
  },
  navLabel: {
    flex: 1
  },
  activeIndicator: {
    color: '#c9a227',
    fontSize: '0.8rem'
  },
  footer: {
    padding: '16px',
    borderTop: '2px solid rgba(201, 162, 39, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  footerItem: {
    display: 'block'
  },
  footerItemCollapsed: {
    display: 'flex',
    justifyContent: 'center'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(220, 38, 38, 0.15)',
    border: '1px solid rgba(220, 38, 38, 0.4)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    width: '100%'
  },
  logoutBtnCollapsed: {
    justifyContent: 'flex-start',
    padding: '10px 10px 10px 8px',
    minWidth: '48px',
    minHeight: '48px',
    background: 'rgba(220, 38, 38, 0.25)',
    border: 'none',
    borderRadius: '12px'
  },
  logoutIcon: {
    fontSize: '0.7rem',
    fontWeight: '600',
    letterSpacing: '0.3px',
    color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    textAlign: 'center',
    lineHeight: '1.2'
  },
  logoutText: {
    textAlign: 'center'
  }
};

// Add responsive styles via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 768px) {
    button[aria-label="Toggle menu"] {
      display: block !important;
    }
    /* Hide toggle button on mobile */
    button[title*="Expand"],
    button[title*="প্রসারিত"],
    button[title*="Collapse"],
    button[title*="সংকুচিত"] {
      display: none !important;
    }
    aside[style*="position: fixed"]:not(.sidebar-open) {
      transform: translateX(-100%) !important;
    }
    .sidebar-open {
      transform: translateX(0) !important;
    }
    [data-page-content] {
      margin-left: 0 !important;
      width: 100% !important;
    }
  }
  @media (min-width: 769px) {
    button[aria-label="Toggle menu"] {
      display: none !important;
    }
    .sidebar-open {
      transform: none !important;
    }
  }
`;
if (!document.getElementById('sidebar-styles')) {
  styleSheet.id = 'sidebar-styles';
  document.head.appendChild(styleSheet);
}

// Handle window resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const pages = document.querySelectorAll('[data-page-content]');
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const margin = collapsed ? '70px' : '260px';
    pages.forEach(page => {
      if (window.innerWidth > 768) {
        page.style.marginLeft = margin;
        page.style.width = `calc(100% - ${margin})`;
      }
    });
  });
}

export default Sidebar;

