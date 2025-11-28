# 🌾 Foshol Bachao (ফসল বাঁচাও)

A mobile-first MVP that helps small farmers in Bangladesh log harvested paddy (rice) batches, view localized weather, and receive simple Bangla advisories to prevent post-harvest loss.

## 📋 Project Summary

Bangladesh loses a significant portion of its food—particularly grains and staple crops—because of inadequate storage systems, poor handling, and inefficient transportation. According to data:

- **4.5 Million Metric Tonnes** of food grains lost annually
- **$1.5 Billion USD** in economic losses per year
- **12-32%** of staple foods lost in production and distribution

These losses contribute to food insecurity, economic waste, and environmental impact. Reducing food loss is directly linked to **SDG 12: Responsible Consumption and Production**, especially **Target 12.3**, which focuses on cutting food loss along supply chains.

**Foshol Bachao** empowers farmers with a lightweight, bilingual (Bangla/English) web app to:
- Log and track paddy batches with storage details
- View local weather forecasts for Chittagong, Dhaka, and Sylhet
- Predict crop loss risks based on weather and storage conditions
- Detect crop diseases using AI-powered image scanning
- Receive actionable Bangla advisories
- Work offline and sync when connected
- Export comprehensive reports as PDF (English/Bangla)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │
│  │ Landing │ │Dashboard │ │Weather │ │ RiskPrediction│  │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └──────┬───────┘  │
│       │           │           │             │           │
│  ┌────┴─────┐ ┌──┴───────────┴──────────────┴────┐     │
│  │CropScanner│ │ Profile  │  Login/Register        │     │
│  │   (AI)    │ └────┬─────┘ └─────┬───────────────┘     │
│  └────┬─────┘       │             │                     │
│       │             │             │                     │
│  ┌────┴─────────────┴─────────────┴───────────────┐    │
│  │           LocalStorage (offline-first)           │    │
│  └──────────────────────┬──────────────────────────┘    │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┼───────────────────────────────┐
│                    Backend (Express)                     │
│  ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────┐         │
│  │  Auth   │ │Batches │ │ Weather│ │ Scanner │         │
│  │(bcrypt) │ │ (CRUD) │ │  (API) │ │  (AI)   │         │
│  └────┬────┘ └───┬────┘ └────┬───┘ └────┬────┘         │
│       │          │           │          │               │
│  ┌────┴──────────┴───────────┴──────────┴───────────┐  │
│  │              lowdb (db.json)                      │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### A2: Farmer & Crop Management
- ✅ Secure registration/login (bcrypt + JWT)
- ✅ Add, edit, and delete paddy batches with weight, date, location, storage
- ✅ Offline-first with LocalStorage - works without internet
- ✅ Automatic sync when online
- ✅ Comprehensive PDF reports (English/Bangla)
- ✅ Achievement badges
- ✅ Loss event tracking and success rate calculation

### A3: Weather Integration
- ✅ Weather forecasts for Chittagong, Dhaka, and Sylhet
- ✅ Current conditions (temperature, humidity, rain probability)
- ✅ Weather data integrated into risk prediction

### A4: Risk Prediction & ETCL Model
- ✅ Risk analysis for each crop batch
- ✅ Risk scoring based on weather and storage conditions
- ✅ ETCL (Estimated Time to Critical Loss) calculation
- ✅ Visual risk indicators (low/medium/high/critical)
- ✅ Real-time weather integration per batch location

### A5: AI Crop Health Scanner
- ✅ Upload crop photos for disease detection
- ✅ AI-powered analysis using Hugging Face model
- ✅ Disease detection with confidence scores
- ✅ Bilingual recommendations (English/Bangla)
- ✅ Demo mode fallback when API unavailable

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### 1. Clone and Install

```bash
# Backend
cd harvestguard/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Run the App

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

---

## 🔑 Demo Credentials

**Email:** `demo@harvestguard.com`  
**Password:** `demo123`

---

## 📂 File Structure

```
harvestguard/
├── backend/
│   ├── index.js              # Express server entry point
│   ├── routes/               # API endpoints
│   │   ├── auth.js          # Authentication (login/register)
│   │   ├── batches.js       # Batch CRUD operations
│   │   ├── weather.js       # Weather data proxy
│   │   ├── scanner.js       # AI scanner proxy
│   │   └── export.js        # Data export endpoints
│   ├── utils/                # Backend utilities
│   │   ├── jwt.js           # JWT token handling
│   │   └── hash.js          # Password hashing (bcrypt)
│   └── db/                   # JSON database files
│       └── db.json          # Main database
│
├── frontend/
│   ├── index.html           # HTML template
│   └── src/
│       ├── main.jsx         # Application entry point
│       ├── App.jsx          # Routing configuration
│       ├── index.css        # Global styles
│       ├── components/      # Reusable UI components
│       │   ├── Sidebar.jsx          # Navigation sidebar
│       │   ├── BatchCard.jsx        # Batch display card
│       │   ├── BatchForm.jsx        # Batch add/edit form
│       │   ├── WeatherWidget.jsx    # Weather display
│       │   ├── LanguageToggle.jsx   # Language switcher
│       │   ├── LanguageSelectionModal.jsx # PDF language selector
│       │   ├── SyncBanner.jsx       # Sync status banner
│       │   ├── BadgeList.jsx        # Achievement badges
│       │   ├── LandingHero.jsx      # Landing hero section
│       │   └── OnboardingSlides.jsx # Tutorial slides
│       ├── pages/           # Page components
│       │   ├── Landing.jsx         # Landing/home page
│       │   ├── Login.jsx           # Login page
│       │   ├── Register.jsx        # Registration page
│       │   ├── Dashboard.jsx       # Main dashboard
│       │   ├── Weather.jsx         # Weather page
│       │   ├── RiskPrediction.jsx  # Risk analysis page
│       │   ├── CropScanner.jsx     # AI crop scanner
│       │   └── Profile.jsx         # User profile
│       └── utils/           # Utility functions
│           ├── api.js              # Backend API calls
│           ├── localSync.js        # Offline storage
│           ├── translations.js     # Language translations
│           ├── csvExport.js        # CSV/PDF export
│           └── pdfGenerator.js     # PDF generation (Bangla support)
│
└── README.md
```

---

## 🎯 Demo Script (2 minutes)

1. **Landing Page** (20s)
   - Show landing page
   - Toggle language (EN/বাংলা)
   - Explain the problem

2. **Login** (10s)
   - Use demo credentials to login

3. **Dashboard** (30s)
   - View existing batches
   - Add new batch with form
   - Show sync status (offline-first)
   - Download comprehensive PDF report

4. **Risk Prediction** (25s)
   - Select a batch
   - Show risk analysis
   - Explain risk calculation based on weather

5. **Crop Scanner** (25s)
   - Upload crop photo
   - Show AI analysis
   - Display recommendations

6. **Weather & Profile** (20s)
   - Show weather for locations
   - View profile with statistics
   - Show achievement badges

---

## 🌍 SDG 12 Alignment

> **Target 12.3**: By 2030, halve per capita global food waste at the retail and consumer levels and reduce food losses along production and supply chains, including post-harvest losses.

Foshol Bachao directly contributes to this goal by:
- Enabling farmers to track and manage harvests
- Predicting crop loss risks with ETCL model
- Detecting crop diseases early using AI
- Providing weather-based advisories to prevent spoilage
- Creating data for better decision-making
- Supporting offline access for rural areas

---

## 📄 License

MIT License - Built for EDU HackFest 2025

---

## 👥 Team

Foshol Bachao Team

---

*"ফসল লগ করুন। ঝুঁকি জানুন। রোগ সনাক্ত করুন। শস্য রক্ষা করুন।"*  
*"Log your harvest. Know the risks. Detect diseases. Protect your grain."*
