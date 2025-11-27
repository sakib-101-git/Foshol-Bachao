import { Link } from 'react-router-dom';
import { t } from '../utils/translations';

/**
 * Hero section with problem statement and workflow
 */
function LandingHero({ lang }) {
  const workflowSteps = [
    { icon: '📊', label: t('workflow.step1', lang) },
    { icon: '⚠️', label: t('workflow.step2', lang) },
    { icon: '✋', label: t('workflow.step3', lang) },
    { icon: '✅', label: t('workflow.step4', lang) }
  ];
  
  return (
    <div className="hero">
      {/* 3D Model Placeholder - using emoji as fallback */}
      <div className="model-viewer-container">
        <div style={{ 
          fontSize: '6rem', 
          animation: 'pulse 2s infinite'
        }}>
          🌾
        </div>
      </div>
      
      <h1 className="hero-title">{t('landing.title', lang)}</h1>
      <p className="hero-subtitle">{t('landing.tagline', lang)}</p>
      
      <p className="hero-text">{t('landing.problem', lang)}</p>
      
      {/* Workflow Steps */}
      <div className="workflow">
        {workflowSteps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="workflow-step">
              <div className="workflow-icon">{step.icon}</div>
              <span className="workflow-label">{step.label}</span>
            </div>
            {i < workflowSteps.length - 1 && (
              <span className="workflow-arrow" style={{ margin: '0 8px', color: 'white' }}>
                →
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* CTA Buttons */}
      <div className="hero-buttons">
        <Link to="/register" className="btn btn-primary btn-large">
          {t('landing.getStarted', lang)}
        </Link>
        <Link to="/login" className="btn btn-outline btn-large">
          {t('landing.login', lang)}
        </Link>
      </div>
      
      {/* Demo Login Hint */}
      <p style={{ marginTop: '24px', opacity: 0.8, fontSize: '0.9rem' }}>
        {lang === 'bn' 
          ? '🔑 ডেমো: demo@harvestguard.com / demo123'
          : '🔑 Demo: demo@harvestguard.com / demo123'}
      </p>
    </div>
  );
}

export default LandingHero;

