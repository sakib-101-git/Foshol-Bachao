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
- View local 5-day weather forecasts
- Receive actionable Bangla advisories
- Work offline and sync when connected
- Export data as CSV/JSON

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │
│  │ Landing │ │Dashboard │ │Weather │ │ Profile  │  │
│  │  (3D)   │ │          │ │        │ │          │  │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └────┬─────┘  │
│       │           │           │           │         │
│  ┌────┴───────────┴───────────┴───────────┴────┐   │
│  │              LocalStorage (offline)          │   │
│  └──────────────────────┬──────────────────────┘   │
└─────────────────────────┼───────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┼───────────────────────────┐
│                    Backend (Express)                 │
│  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐   │
│  │  Auth   │ │Batches │ │ Weather │ │  Export  │   │
│  │(bcrypt) │ │ (CRUD) │ │  (API)  │ │(CSV/JSON)│   │
│  └────┬────┘ └───┬────┘ └────┬────┘ └────┬─────┘   │
│       │          │           │           │          │
│  ┌────┴──────────┴───────────┴───────────┴─────┐   │
│  │              lowdb (db.json)                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### A1: Storytelling Landing Page
- ✅ Immersive 3D rice field scene (Three.js + React Three Fiber)
- ✅ Bilingual (English/Bangla) content
- ✅ Problem statistics with visual impact
- ✅ SDG 12 integration
- ✅ Animated workflow: Data → Warning → Action → Saved Food
- ✅ Mobile-first design with large tap targets
- ✅ Smooth scroll animations

### A2: Farmer & Crop Management
- ✅ Secure registration/login (bcrypt + JWT)
- ✅ Add paddy batches with weight, date, location, storage
- ✅ Offline-first with LocalStorage
- ✅ Manual sync button
- ✅ CSV and JSON export
- ✅ Achievement badges

### A3: Weather Integration
- ✅ 5-day forecast for selected Upazila
- ✅ Bangla advisories based on conditions
- ✅ Visual weather icons

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
│   ├── index.js              # Express server
│   ├── routes/               # API endpoints
│   ├── utils/                # bcrypt + JWT
│   └── db/                   # JSON database
│
├── frontend/
│   ├── index.html
│   └── src/
│       ├── components/
│       │   ├── Scene3D.jsx   # 3D rice field (Three.js)
│       │   ├── Header.jsx
│       │   ├── BatchCard.jsx
│       │   └── WeatherWidget.jsx
│       ├── pages/
│       │   ├── Landing.jsx   # Storytelling page
│       │   ├── Login.jsx     # 3D background
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Weather.jsx
│       │   └── Profile.jsx
│       └── utils/
│           ├── api.js
│           ├── localSync.js
│           └── translations.js
│
└── README.md
```

---

## 🎯 Demo Script (90 seconds)

1. **Landing Page** (20s)
   - Show 3D rice field animation
   - Toggle language (EN/বাংলা)
   - Scroll through problem statistics
   - Show SDG 12 section

2. **Registration/Login** (15s)
   - Use Demo Login button
   - Show 3D background

3. **Dashboard** (25s)
   - View existing batches
   - Add new batch with form
   - Show sync status

4. **Weather** (15s)
   - Select upazila
   - View 5-day forecast
   - Read Bangla advisory

5. **Export & Profile** (15s)
   - Download CSV
   - View badges
   - Logout

---

## 🌍 SDG 12 Alignment

> **Target 12.3**: By 2030, halve per capita global food waste at the retail and consumer levels and reduce food losses along production and supply chains, including post-harvest losses.

Foshol Bachao directly contributes to this goal by:
- Enabling farmers to track and manage harvests
- Providing weather-based advisories to prevent spoilage
- Creating data for better decision-making

---

## 📄 License

MIT License - Built for EDU HackFest 2025

---

## 👥 Team

Foshol Bachao Team

---

*"ফসল লগ করুন। আবহাওয়া দেখুন। শস্য রক্ষা করুন।"*  
*"Log your harvest. Check the weather. Protect your grain."*
