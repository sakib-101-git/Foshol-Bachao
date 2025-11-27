import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../utils/translations';

/**
 * Onboarding slides for new users
 */
function OnboardingSlides({ lang }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  
  const slides = [
    {
      icon: '📝',
      title: t('onboarding.slide1.title', lang),
      text: t('onboarding.slide1.text', lang)
    },
    {
      icon: '🌤️',
      title: t('onboarding.slide2.title', lang),
      text: t('onboarding.slide2.text', lang)
    },
    {
      icon: '📤',
      title: t('onboarding.slide3.title', lang),
      text: t('onboarding.slide3.text', lang)
    }
  ];
  
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/register');
    }
  };
  
  const handleSkip = () => {
    navigate('/register');
  };
  
  const slide = slides[currentSlide];
  
  return (
    <div className="onboarding">
      <div className="onboarding-slide fade-in" key={currentSlide}>
        <div className="onboarding-icon">{slide.icon}</div>
        <h2 className="onboarding-title">{slide.title}</h2>
        <p className="onboarding-text">{slide.text}</p>
      </div>
      
      {/* Dots */}
      <div className="onboarding-dots">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`onboarding-dot ${i === currentSlide ? 'active' : ''}`}
          />
        ))}
      </div>
      
      {/* Buttons */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn btn-outline" onClick={handleSkip}>
          {t('common.skip', lang)}
        </button>
        <button className="btn btn-primary btn-large" onClick={handleNext}>
          {currentSlide < slides.length - 1 
            ? t('common.next', lang) 
            : t('landing.register', lang)}
        </button>
      </div>
    </div>
  );
}

export default OnboardingSlides;

