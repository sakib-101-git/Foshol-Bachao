# 🔑 API Keys Setup Guide - Foshol Bachao

## ⚡ QUICK SETUP (5 minutes)

### 1. OpenWeatherMap API (Weather Data)
**Status: ✅ Already configured**
- **Current Key:** `b76f9df700beb2863abea6d362adcaf8`
- **Where to get:** https://openweathermap.org/api
- **Free Tier:** 1,000 calls/day
- **Backend:** Already set in `harvestguard/backend/.env` as `OPENWEATHER_API_KEY`

### 2. Google Gemini API (Pest Identification - B3)
**Status: ⚠️ NEEDS SETUP**

**Steps:**
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add to backend `.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. **Free Tier:** 15 requests/minute, 1,500 requests/day

**Alternative (if Gemini not available):**
- The system will use mock data automatically
- Still works for demo purposes

### 3. Hugging Face API (Disease Detection)
**Status: ⚠️ NEEDS SETUP**

**Steps:**
1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Select "Read" permission
4. Copy the token
5. Add to frontend `.env`:
   ```
   VITE_HF_TOKEN=your_hf_token_here
   ```
6. **Free Tier:** Unlimited for public models

---

## 📝 Environment Variables Setup

### Backend (`harvestguard/backend/.env`):
```env
# JWT Secret (any random string)
JWT_SECRET=your_super_secret_jwt_key_here

# OpenWeatherMap (Already set)
OPENWEATHER_API_KEY=b76f9df700beb2863abea6d362adcaf8

# Gemini API (Add this)
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173,https://foshol-bachao-k3rb.vercel.app
```

### Frontend (`harvestguard/frontend/.env`):
```env
# Backend API URL
VITE_API_BASE=https://foshol-bachao-api.onrender.com/api

# Hugging Face Token (for disease detection)
VITE_HF_TOKEN=your_hf_token_here
```

### Render.com Environment Variables:
1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add:
   - `OPENWEATHER_API_KEY` = `b76f9df700beb2863abea6d362adcaf8`
   - `GEMINI_API_KEY` = `your_gemini_key`
   - `JWT_SECRET` = `any_random_string`
   - `FRONTEND_URL` = `https://foshol-bachao-k3rb.vercel.app`

### Vercel Environment Variables:
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add:
   - `VITE_API_BASE` = `https://foshol-bachao-api.onrender.com/api`
   - `VITE_HF_TOKEN` = `your_hf_token`

---

## 🚀 Quick Start (No API Keys)

**If you don't have time to get API keys:**
- ✅ Weather API: Already working
- ✅ Disease Detection: Uses mock data if no HF token
- ✅ Pest Identification: Uses mock data if no Gemini key
- ✅ Everything else: Works offline

**The app will work with mock data for demo purposes!**

---

## 📞 Support

If you need help:
1. Check console logs (F12)
2. Check backend logs on Render
3. All APIs have fallback to mock data

---

## ✅ Checklist

- [x] OpenWeatherMap API - Already configured
- [ ] Gemini API - Optional (uses mock if missing)
- [ ] Hugging Face Token - Optional (uses mock if missing)
- [x] Backend deployed on Render
- [x] Frontend deployed on Vercel

**You're ready to go! 🎉**


