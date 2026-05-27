# HarvestGuard (Foshol Bachao) — CLAUDE.md

## Project Overview
EDU HackFest 2025 hackathon project. React (Vite) frontend + Express/LowDB backend.
Goal: Help Bangladeshi farmers reduce post-harvest food loss. Bilingual (Bangla/English).

## Project Structure
```
harvestguard/
  frontend/       React + Vite (port 5173)
  backend/        Express + LowDB (port 3001)
  backend-py/     DELETE THIS — incomplete junk
  backend/hello.py DELETE THIS — stray file
```

## How to Run
```bash
# Backend
cd harvestguard/backend
npm install
node index.js        # runs on port 3001

# Frontend
cd harvestguard/frontend
npm install
npm run dev          # runs on port 5173
```

## Required Environment Variables

### Backend (.env in harvestguard/backend/)
```
JWT_SECRET=your_secret_here
GEMINI_API_KEY=your_gemini_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
HF_TOKEN=your_huggingface_token_here
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Frontend (.env in harvestguard/frontend/)
```
VITE_API_BASE=http://localhost:3001/api
VITE_HF_TOKEN=your_huggingface_token_here
```

---

## WHAT NEEDS TO BE FIXED (Priority Order)

### 🔴 CRITICAL — Fix First

#### 1. Security: Remove hardcoded Gemini API key
**File:** `harvestguard/backend/routes/pest.js` line 28
**Problem:** `'AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o'` is hardcoded as fallback.
**Fix:** Remove fallback value. Only use `process.env.GEMINI_API_KEY`. If missing, return proper error.
```js
// CHANGE THIS:
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o';
// TO THIS:
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
```

#### 2. Auth middleware rejects all frontend requests
**Problem:** Frontend sends `Bearer demo-token-auto-login` (not a valid JWT). Backend's `authMiddleware` in `harvestguard/backend/utils/jwt.js` rejects it → all protected routes return 401.
**Fix Option A (recommended for hackathon):** In `jwt.js` authMiddleware, check if token is `demo-token-auto-login` and allow it through with a demo user object.
**Fix Option B:** On app load, call `/api/auth/login` with demo credentials and store the real JWT.
**Affected routes:** `/api/batches`, `/api/sync`, `/api/scanner/analyze`, `/api/export`

#### 3. Production backend URL doesn't exist
**File:** `harvestguard/frontend/src/utils/api.js` line 16
**Problem:** `https://foshol-bachao-api.onrender.com/api` is hardcoded but Render app not deployed yet.
**Fix:** Deploy backend to Render first, get real URL, then update this OR use `VITE_API_BASE` env var.

#### 4. Remove duplicate/broken floating VoiceButton
**File:** `harvestguard/frontend/src/App.jsx` line 68 — `<VoiceButton />`
**Problem:** This floating mic button uses raw MediaRecorder + no real STT. It conflicts with the proper VoiceChat in Sidebar. The backend `/api/voice/process` has no Whisper API so audio just gets a hardcoded fallback reply.
**Fix:** Delete the `<VoiceButton />` line from App.jsx. The Sidebar already has a proper VoiceChat button.

---

### 🟡 INCOMPLETE — Hackathon Requirements Missing

#### 5. Add Gemini Voice Chat (Text-to-Speech output)
**What user requested.** VoiceChat.jsx already does: voice input (Web Speech API bn-BD) → Gemini text reply. But Gemini's reply is never spoken aloud.
**File:** `harvestguard/frontend/src/components/VoiceChat.jsx`
**Fix:** After receiving `data.reply` from `/api/voice/chat`, speak it using browser TTS:
```js
const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'bn-BD';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};
// Call speak(data.reply) after setting bot message
```
This makes it truly voice-in → Gemini → voice-out. No extra API needed.

#### 6. Add Bangla crop advisories to Weather page
**Hackathon requirement (A3):** "Show simple Bangla advisories based on weather + crop data"
Example: `"আগামী ৩ দিন বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"`
**File:** `harvestguard/frontend/src/components/WeatherWidget.jsx`
**Fix:** After fetching weather, check forecast rain probability. If >70% and user has active paddy batches → show Bangla advisory. If temp >36°C → show watering advisory.

#### 7. Simulate SMS in browser console for critical risk (B2)
**Hackathon requirement:** "Simulate an SMS notification in the browser console when risk hits Critical"
**File:** `harvestguard/frontend/src/components/SmartAlertSystem.jsx`
**Fix:** When `riskLevel === 'critical'`, add:
```js
console.log('%c📱 SMS SENT:', 'color: red; font-weight: bold',
  `TO: ${farmerPhone || '+880XXXXXXXXXX'} | আপনার ফসলের ঝুঁকি সংকটাপন্ন! অবিলম্বে ব্যবস্থা নিন।`);
```

#### 8. Achievement badge granting logic
**File:** `harvestguard/frontend/src/pages/Dashboard.jsx` — `handleAddBatch` function
**Problem:** Badges are displayed but never awarded. No code checks actions and grants badges.
**Fix:** After first batch is created, check localStorage for badge state and award "First Harvest Logged". After a batch with critical risk gets action taken, award "Risk Mitigated Expert".
```js
// In handleAddBatch, after successful save:
const existingBadges = JSON.parse(localStorage.getItem('hg_badges') || '[]');
if (batches.length === 0 && !existingBadges.includes('first_harvest')) {
  existingBadges.push('first_harvest');
  localStorage.setItem('hg_badges', JSON.stringify(existingBadges));
}
```

#### 9. Data export: CSV button is behind a PDF modal
**File:** `harvestguard/frontend/src/pages/Dashboard.jsx`
**Problem:** The "Download Report" button opens a language modal that generates PDF. The hackathon requires CSV/JSON export too. Add separate CSV and JSON export buttons.
**Fix:** Add two more buttons calling `exportCSV(batches)` and `exportJSON(batches)` from `csvExport.js`.

---

### 🟢 DEPLOYMENT STEPS

#### Step 1: Deploy Backend to Render
1. Go to render.com → New Web Service
2. Connect GitHub repo
3. Root Directory: `harvestguard/backend`
4. Build Command: `npm install`
5. Start Command: `node index.js`
6. Add environment variables:
   - `JWT_SECRET` = (any random string)
   - `GEMINI_API_KEY` = your key
   - `OPENWEATHER_API_KEY` = your key
   - `HF_TOKEN` = your key
   - `FRONTEND_URL` = your Vercel URL (add after step 2)
7. Note the Render URL (e.g. `https://xyz.onrender.com`)

#### Step 2: Deploy Frontend to Vercel
1. Go to vercel.com → New Project
2. Connect GitHub repo
3. Root Directory: `harvestguard/frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add environment variables:
   - `VITE_API_BASE` = `https://your-render-url.onrender.com/api`
   - `VITE_HF_TOKEN` = your key
7. Deploy

#### Step 3: Update CORS
In Render dashboard, update `FRONTEND_URL` env var to your Vercel URL.

#### Render config file (create this): `harvestguard/backend/render.yaml`
```yaml
services:
  - type: web
    name: foshol-bachao-api
    env: node
    rootDir: harvestguard/backend
    buildCommand: npm install
    startCommand: node index.js
    envVars:
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
```

---

### 🗑️ CLEANUP

#### Delete these junk files
```bash
rm -rf harvestguard/backend-py/
rm harvestguard/backend/hello.py
```

#### Files already correctly gitignored
- `.env` files (do not commit)
- `node_modules/`

---

## What's Already Working (Don't Break These)

- Landing page (A1) — bilingual, animations, storytelling, SDG section
- Batch form (A2) — all required fields present (crop type, weight, harvest date, division/district, storage type)
- Offline LocalStorage sync with SyncBanner
- Weather page with division selector (A3)
- Risk Prediction + ETCL calculation (A4)
- Crop Scanner with HuggingFace + demo fallback (A5)
- Pest Identifier with Gemini Visual RAG (B3)
- Local Risk Map with Leaflet (B1)
- VoiceChat with Web Speech API + Gemini text (B4, needs TTS added)
- Profile page with badges and loss tracking
- Collapsible sidebar navigation with mobile support
- CSV/PDF export utilities exist

## API Keys Needed
- **Gemini API key** — from Google AI Studio (aistudio.google.com)
- **OpenWeatherMap API key** — from openweathermap.org (free tier)
- **HuggingFace token** — from huggingface.co/settings/tokens (for crop scanner)
