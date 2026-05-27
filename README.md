# HarvestGuard (ফসল বাঁচাও)

EDU HackFest 2025 — Reducing post-harvest food loss for Bangladeshi farmers.

## Stack
- **Frontend:** React + Vite (port 5173)
- **Backend:** Express + LowDB (port 3002)

## Setup

### 1. Backend
Create `harvestguard/backend/.env`:
```
PORT=3002
JWT_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key      # aistudio.google.com
OPENWEATHER_API_KEY=your_owm_key   # openweathermap.org
HF_TOKEN=your_hf_token              # huggingface.co
FRONTEND_URL=http://localhost:5173
```

```bash
cd harvestguard/backend
npm install
node index.js
```

### 2. Frontend
```bash
cd harvestguard/frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features
- A1: Bilingual landing page (Bangla/English)
- A2: Farmer registration + batch management
- A3: Weather forecast with Bangla advisories
- A4: Risk prediction + ETCL calculation
- A5: Crop health scanner (HuggingFace)
- B1: Local risk map (Leaflet)
- B3: Pest identifier (Gemini Vision)
- B4: Voice assistant with realtime Gemini streaming + TTS
