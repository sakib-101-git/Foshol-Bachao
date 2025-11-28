import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { getLanguage, saveLanguage } from '../utils/localSync';
import './Landing.css';

/**
 * Storytelling Landing Page
 * Highlights Bangladesh's food loss problem and presents FosholBachao as the solution
 */
function Landing() {
  const [lang, setLang] = useState(getLanguage());
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [sdgExpanded, setSdgExpanded] = useState(false);
  const sectionsRef = useRef([]);
  const navigate = useNavigate();
  
  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers = sectionsRef.current.map((section, index) => {
      if (!section) return null;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [index]: true }));
            setCurrentSection(index);
          }
        },
        { threshold: 0.3 }
      );
      
      observer.observe(section);
      return observer;
    });
    
    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, []);
  
  // Content translations with Bangla numbers
  const content = {
    hero: {
      title: { en: 'FOSHOL BACHAO', bn: 'ফসল বাঁচাও' },
      subtitle: { en: 'Protect Your Harvest', bn: 'আপনার ফসল রক্ষা করুন' },
      tagline: {
        en: 'Empowering Bangladeshi farmers to reduce post-harvest losses',
        bn: 'বাংলাদেশী কৃষকদের ফসল কাটার পরের ক্ষতি কমাতে ক্ষমতায়ন'
      }
    },
    problem: {
      title: { en: 'The Crisis We Face', bn: 'আমরা যে সংকটের সম্মুখীন' },
      stats: [
        {
          value: { en: '4.5M', bn: '৪.৫ মিলিয়ন' },
          unit: { en: 'Metric Tonnes', bn: 'মেট্রিক টন' },
          desc: { en: 'Food grains lost annually', bn: 'বার্ষিক খাদ্যশস্য ক্ষতি' }
        },
        {
          value: { en: '$1.5B', bn: '১.৫ বিলিয়ন ডলার' },
          unit: { en: 'USD', bn: '' },
          desc: { en: 'Economic loss per year', bn: 'বার্ষিক অর্থনৈতিক ক্ষতি' }
        },
        {
          value: { en: '12-32%', bn: '১২-৩২%' },
          unit: { en: 'Loss Rate', bn: 'ক্ষতির হার' },
          desc: { en: 'Staple foods lost in distribution', bn: 'বিতরণে হারানো প্রধান খাদ্য' }
        }
      ],
      description: {
        en: `Bangladesh loses a significant portion of its food—particularly grains and staple crops—because of inadequate storage systems, poor handling, and inefficient transportation. These losses contribute to food insecurity, economic waste, and environmental impact.`,
        bn: `বাংলাদেশে উৎপাদিত খাদ্যের একটি উল্লেখযোগ্য অংশ—বিশেষত শস্য ও অন্যান্য প্রধান ফসল—অপর্যাপ্ত সংরক্ষণ সুবিধা, ব্যবস্থাপনার দুর্বলতা এবং পরিবহন ব্যবস্থার অদক্ষতার কারণে নষ্ট হয়ে যায়। এর ফলে খাদ্য নিরাপত্তা হুমকির মুখে পড়ে, অর্থনৈতিক ক্ষতি বৃদ্ধি পায় এবং পরিবেশগত প্রভাব আরও তীব্রতর হয়।`
      }
    },
    sdg: {
      title: { en: 'SDG 12: Responsible Consumption & Production', bn: 'এসডিজি ১২: দায়িত্বশীল ভোগ ও উৎপাদন' },
      description: {
        en: 'Sustainable Development Goal 12 aims to ensure sustainable consumption and production patterns across the world. It encourages responsible use of natural resources, reduction of waste, environmentally safe handling of chemicals and promotion of green business practices.',
        bn: 'টেকসই উন্নয়ন লক্ষ্য ১২ বিশ্বজুড়ে টেকসই ভোগ ও উৎপাদন নিশ্চিত করতে চায়। এটি প্রাকৃতিক সম্পদের দায়িত্বশীল ব্যবহার, বর্জ্য হ্রাস, রাসায়নিকের নিরাপদ ব্যবস্থাপনা এবং সবুজ ব্যবসায়িক অনুশীলনকে উৎসাহিত করে।'
      },
      targetsTitle: { en: 'Goal 12 Targets', bn: 'লক্ষ্য ১২ এর লক্ষ্যমাত্রা' },
      targets: [
        { id: '12.1', en: 'Implement the 10-year framework for sustainable consumption and production', bn: 'টেকসই ভোগ ও উৎপাদনের জন্য ১০ বছরের কাঠামো বাস্তবায়ন' },
        { id: '12.2', en: 'Achieve efficient use of natural resources by 2030', bn: '২০৩০ সালের মধ্যে প্রাকৃতিক সম্পদের দক্ষ ব্যবহার অর্জন' },
        { id: '12.3', en: 'Halve food waste & reduce post-harvest losses by 2030', bn: '২০৩০ সালের মধ্যে খাদ্য অপচয় অর্ধেক ও ফসল কাটার পরের ক্ষতি কমানো', highlight: true },
        { id: '12.4', en: 'Manage chemicals & waste responsibly', bn: 'রাসায়নিক ও বর্জ্যের দায়িত্বশীল ব্যবস্থাপনা' },
        { id: '12.5', en: 'Reduce waste through recycling and reuse', bn: 'পুনর্ব্যবহার ও পুনর্চক্রায়ণের মাধ্যমে বর্জ্য হ্রাস' },
        { id: '12.6', en: 'Encourage companies to report sustainability', bn: 'কোম্পানিগুলোকে টেকসই প্রতিবেদন দিতে উৎসাহিত করা' },
        { id: '12.7', en: 'Promote sustainable public procurement', bn: 'টেকসই সরকারি ক্রয় প্রচার' },
        { id: '12.8', en: 'Ensure global awareness for sustainability', bn: 'টেকসই জীবনযাত্রার জন্য বৈশ্বিক সচেতনতা নিশ্চিত করা' },
        { id: '12.A', en: 'Support developing countries technologically', bn: 'উন্নয়নশীল দেশগুলোকে প্রযুক্তিগতভাবে সহায়তা' },
        { id: '12.B', en: 'Monitor sustainable tourism impacts', bn: 'টেকসই পর্যটনের প্রভাব পর্যবেক্ষণ' },
        { id: '12.C', en: 'Rationalize fossil-fuel subsidies', bn: 'জীবাশ্ম জ্বালানি ভর্তুকি যৌক্তিককরণ' }
      ],
      bangladeshFocus: {
        title: { en: '📌 Key Focus for Bangladesh — Target 12.3', bn: '📌 বাংলাদেশের জন্য মূল ফোকাস — লক্ষ্যমাত্রা ১২.৩' },
        text: {
          en: 'Bangladesh loses a significant portion of its food due to inadequate storage, weak handling systems and inefficient transportation. This directly prevents progress towards SDG 12.3. Improving supply chain infrastructure can increase food availability, stabilize farmer income, and ensure long-term food security.',
          bn: 'বাংলাদেশ অপর্যাপ্ত সংরক্ষণ, দুর্বল ব্যবস্থাপনা এবং অদক্ষ পরিবহনের কারণে খাদ্যের একটি উল্লেখযোগ্য অংশ হারায়। এটি সরাসরি এসডিজি ১২.৩ এর অগ্রগতি বাধাগ্রস্ত করে। সরবরাহ চেইন অবকাঠামো উন্নত করলে খাদ্যের প্রাপ্যতা বাড়বে, কৃষকের আয় স্থিতিশীল হবে এবং দীর্ঘমেয়াদী খাদ্য নিরাপত্তা নিশ্চিত হবে।'
        }
      },
      viewTargets: { en: 'View All Targets', bn: 'সব লক্ষ্যমাত্রা দেখুন' },
      hideTargets: { en: 'Hide Targets', bn: 'লক্ষ্যমাত্রা লুকান' }
    },
    solution: {
      title: { en: 'Our Solution', bn: 'আমাদের সমাধান' },
      subtitle: {
        en: 'A simple, mobile-first app designed for farmers',
        bn: 'কৃষকদের জন্য ডিজাইন করা একটি সহজ, মোবাইল-প্রথম অ্যাপ'
      },
      steps: [
        {
          icon: '📊',
          title: { en: 'Log Data', bn: 'তথ্য লগ করুন' },
          desc: { en: 'Record your harvest batches', bn: 'আপনার ফসল ব্যাচ রেকর্ড করুন' }
        },
        {
          icon: '⚠️',
          title: { en: 'Get Warnings', bn: 'সতর্কতা পান' },
          desc: { en: 'Weather alerts in Bangla', bn: 'বাংলায় আবহাওয়া সতর্কতা' }
        },
        {
          icon: '✋',
          title: { en: 'Take Action', bn: 'পদক্ষেপ নিন' },
          desc: { en: 'Follow simple advisories', bn: 'সহজ পরামর্শ অনুসরণ করুন' }
        },
        {
          icon: '✅',
          title: { en: 'Save Food', bn: 'খাদ্য বাঁচান' },
          desc: { en: 'Reduce your losses', bn: 'আপনার ক্ষতি কমান' }
        }
      ]
    },
    features: {
      title: { en: 'Why Foshol Bachao?', bn: 'কেন ফসল বাঁচাও?' },
      items: [
        {
          icon: '📱',
          title: { en: 'Offline Ready', bn: 'অফলাইনে কাজ করে' },
          desc: { en: 'Works without internet', bn: 'ইন্টারনেট ছাড়া কাজ করে' }
        },
        {
          icon: '🌍',
          title: { en: 'Bilingual', bn: 'দ্বিভাষিক' },
          desc: { en: 'English & Bangla support', bn: 'ইংরেজি ও বাংলা সমর্থন' }
        },
        {
          icon: '🌤️',
          title: { en: 'Local Weather', bn: 'স্থানীয় আবহাওয়া' },
          desc: { en: 'Upazila-level forecasts', bn: 'উপজেলা স্তরের পূর্বাভাস' }
        },
        {
          icon: '📤',
          title: { en: 'Data Export', bn: 'ডেটা রপ্তানি' },
          desc: { en: 'CSV & JSON exports', bn: 'সিএসভি ও জেএসওএন রপ্তানি' }
        }
      ]
    },
    cta: {
      experience: { en: 'Click to Experience', bn: 'অভিজ্ঞতা নিন' }
    }
  };
  
  return (
    <div className="landing">
      {/* Language Toggle */}
      <div className="landing-lang-toggle">
        <LanguageToggle lang={lang} onToggle={toggleLang} />
      </div>
      
      {/* Hero Section */}
      <section 
        ref={el => sectionsRef.current[0] = el}
        className={`landing-section hero-section ${isVisible[0] ? 'visible' : ''}`}
      >
        {/* Background Image - inside hero section */}
        <div className="landing-bg-image"></div>
        <div className="hero-content">
          <div className="hero-icon animate-float">🌾</div>
          
          {/* Title changes based on language */}
          <h1 className="hero-title animate-slide-up">
            {content.hero.title[lang]}
          </h1>
          
          <p className="hero-subtitle animate-slide-up delay-1">
            {content.hero.subtitle[lang]}
          </p>
          <p className="hero-tagline animate-slide-up delay-2">
            {content.hero.tagline[lang]}
          </p>
          
          <div className="hero-buttons">
            <button 
              className="btn btn-hero-primary"
              onClick={() => navigate('/dashboard')}
              type="button"
            >
              {lang === 'bn' ? '🔓 অভিজ্ঞতা নিন' : '🔓 Click to Experience'}
            </button>
          </div>
        </div>
        
        {/* Scroll Indicator - Moved lower */}
        <div className="scroll-indicator animate-bounce">
          <span>↓</span>
          <p>{lang === 'bn' ? 'নিচে স্ক্রোল করুন' : 'Scroll to learn more'}</p>
        </div>
      </section>
      
      {/* Problem Section */}
      <section 
        ref={el => sectionsRef.current[1] = el}
        className={`landing-section problem-section ${isVisible[1] ? 'visible' : ''}`}
      >
        <div className="section-content">
          <h2 className="section-title">{content.problem.title[lang]}</h2>
          
          {/* Statistics Grid */}
          <div className="stats-grid">
            {content.problem.stats.map((stat, i) => (
              <div key={i} className={`stat-card animate-scale delay-${i}`}>
                <div className="stat-value">{stat.value[lang]}</div>
                <div className="stat-unit">{stat.unit[lang]}</div>
                <div className="stat-desc">{stat.desc[lang]}</div>
              </div>
            ))}
          </div>
          
          <p className="problem-description">
            {content.problem.description[lang]}
          </p>
          
          {/* Visual Problem Illustration */}
          <div className="problem-visual">
            <div className="problem-icon-flow">
              <div className="flow-item harvest">
                <span className="flow-icon">🌾</span>
                <span className="flow-label">{lang === 'bn' ? 'ফসল' : 'Harvest'}</span>
              </div>
              <div className="flow-arrow animate-pulse">→</div>
              <div className="flow-item warning">
                <span className="flow-icon">📦</span>
                <span className="flow-label">{lang === 'bn' ? 'দুর্বল সংরক্ষণ' : 'Poor Storage'}</span>
              </div>
              <div className="flow-arrow animate-pulse">→</div>
              <div className="flow-item danger">
                <span className="flow-icon">💔</span>
                <span className="flow-label">{lang === 'bn' ? 'ক্ষতি' : 'Loss'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* SDG Section */}
      <section 
        ref={el => sectionsRef.current[2] = el}
        className={`landing-section sdg-section ${isVisible[2] ? 'visible' : ''}`}
      >
        <div className="section-content sdg-content">
          {/* SDG Header */}
          <div className="sdg-header">
            <img 
              src="https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-12-1024x1024.png" 
              alt="SDG 12"
              className="sdg-logo"
            />
            <h2 className="sdg-main-title">{content.sdg.title[lang]}</h2>
          </div>
          
          {/* SDG Description */}
          <p className="sdg-description">
            {content.sdg.description[lang]}
          </p>
          
          {/* Expandable Targets Section */}
          <div className={`sdg-targets-container ${sdgExpanded ? 'expanded' : ''}`}>
            <button 
              className="sdg-expand-btn"
              onClick={() => setSdgExpanded(!sdgExpanded)}
              type="button"
            >
              <span>{sdgExpanded ? content.sdg.hideTargets[lang] : content.sdg.viewTargets[lang]}</span>
              <span className={`expand-icon ${sdgExpanded ? 'rotated' : ''}`}>▼</span>
            </button>
            
            {/* Targets List */}
            <div className={`sdg-targets-list ${sdgExpanded ? 'show' : ''}`}>
              <h3 className="targets-title">{content.sdg.targetsTitle[lang]}</h3>
              <ul className="targets-ul">
                {content.sdg.targets.map((target, i) => (
                  <li 
                    key={target.id} 
                    className={`target-item ${target.highlight ? 'highlight' : ''}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className="target-id">{target.id}</span>
                    <span className="target-text">{target[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bangladesh Focus Highlight */}
          <div className="sdg-bangladesh-focus">
            <h3 className="focus-title">{content.sdg.bangladeshFocus.title[lang]}</h3>
            <p className="focus-text">{content.sdg.bangladeshFocus.text[lang]}</p>
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section 
        ref={el => sectionsRef.current[3] = el}
        className={`landing-section solution-section ${isVisible[3] ? 'visible' : ''}`}
      >
        <div className="section-content">
          <h2 className="section-title">{content.solution.title[lang]}</h2>
          <p className="section-subtitle">{content.solution.subtitle[lang]}</p>
          
          {/* Workflow Steps */}
          <div className="workflow-container">
            {content.solution.steps.map((step, i) => (
              <div key={i} className="workflow-wrapper">
                <div className={`workflow-step animate-slide-up delay-${i}`}>
                  <div className="step-number">{i + 1}</div>
                  <div className="step-icon">{step.icon}</div>
                  <h3 className="step-title">{step.title[lang]}</h3>
                  <p className="step-desc">{step.desc[lang]}</p>
                </div>
                {i < content.solution.steps.length - 1 && (
                  <div className="workflow-connector">
                    <svg viewBox="0 0 50 20" className="connector-svg">
                      <path 
                        d="M0 10 L40 10 M35 5 L45 10 L35 15" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none"
                        className="animate-draw"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section 
        ref={el => sectionsRef.current[4] = el}
        className={`landing-section features-section ${isVisible[4] ? 'visible' : ''}`}
      >
        <div className="section-content">
          <h2 className="section-title">{content.features.title[lang]}</h2>
          
          <div className="features-grid">
            {content.features.items.map((feature, i) => (
              <div key={i} className={`feature-card animate-scale delay-${i}`}>
                <span className="feature-icon">{feature.icon}</span>
                <h3 className="feature-title">{feature.title[lang]}</h3>
                <p className="feature-desc">{feature.desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section 
        ref={el => sectionsRef.current[5] = el}
        className={`landing-section cta-section ${isVisible[5] ? 'visible' : ''}`}
      >
        <div className="section-content cta-content">
          <div className="cta-icon">🌾</div>
          <h2 className="cta-title">
            {lang === 'bn' 
              ? 'আজই শুরু করুন'
              : 'Get Started Today'}
          </h2>
          <p className="cta-text">
            {lang === 'bn'
              ? 'হাজার হাজার কৃষকদের সাথে যোগ দিন যারা তাদের ফসল রক্ষা করছে'
              : 'Join thousands of farmers protecting their harvest'}
          </p>
          
          <div className="cta-buttons">
            <button 
              className="btn btn-cta-primary"
              onClick={() => navigate('/dashboard')}
              type="button"
            >
              {lang === 'bn' ? '🔓 অভিজ্ঞতা নিন' : '🔓 Click to Experience'}
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2025 Foshol Bachao | EDU HackFest</p>
        <p className="footer-tagline">
          {lang === 'bn' 
            ? '"ফসল লগ করুন। আবহাওয়া দেখুন। শস্য রক্ষা করুন।"'
            : '"Log your harvest. Check the weather. Protect your grain."'}
        </p>
      </footer>
    </div>
  );
}

export default Landing;
