# 🚀 Complete API Deployment Guide

## 📋 Overview

This guide will help you deploy:
1. **Weather API** (OpenWeatherMap) - Already configured
2. **Pest Detection API** (Gemini) - Needs setup

---

## 🌤️ Part 1: Weather API (OpenWeatherMap)

### ✅ Current Status
- **API Key:** `b76f9df700beb2863abea6d362adcaf8`
- **Status:** ✅ Already configured
- **Service:** OpenWeatherMap

### 📝 Local Setup (Already Done)

The weather API is already configured in:
- **Backend `.env`:** `OPENWEATHER_API_KEY=b76f9df700beb2863abea6d362adcaf8`

### 🌐 Render.com Deployment

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Login to your account

2. **Select Your Backend Service:**
   - Find: `foshol-bachao-api` (or your backend service name)
   - Click on it

3. **Add Environment Variable:**
   - Click on **"Environment"** tab (left sidebar)
   - Scroll to **"Environment Variables"** section
   - Click **"Add Environment Variable"**

4. **Add Weather API Key:**
   - **Key:** `OPENWEATHER_API_KEY`
   - **Value:** `b76f9df700beb2863abea6d362adcaf8`
   - Click **"Save Changes"**

5. **Verify:**
   - Service will automatically redeploy
   - Wait 2-3 minutes for deployment
   - Check logs to confirm it's working

---

## 🐛 Part 2: Pest Detection API (Gemini)

### 📝 Local Setup

1. **Open Backend `.env` File:**
   ```bash
   cd harvestguard\backend
   notepad .env
   ```
   (Or use any text editor)

2. **Add Gemini API Key:**
   ```
   GEMINI_API_KEY=AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o
   ```

3. **Save the file**

4. **Restart Backend:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   npm start
   ```

### 🌐 Render.com Deployment

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Select your backend service

2. **Add Environment Variable:**
   - Click **"Environment"** tab
   - Click **"Add Environment Variable"**

3. **Add Gemini API Key:**
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o`
   - Click **"Save Changes"**

4. **Verify:**
   - Service will auto-redeploy
   - Check deployment logs

---

## 📝 Complete Backend `.env` File

Your `harvestguard/backend/.env` should have:

```env
# JWT Secret (any random string)
JWT_SECRET=harvestguard_secret_key_2025

# OpenWeatherMap API (Weather Data)
OPENWEATHER_API_KEY=b76f9df700beb2863abea6d362adcaf8

# Gemini API (Pest Detection + Voice Chat)
GEMINI_API_KEY=AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173,https://foshol-bachao-k3rb.vercel.app
```

---

## 🌐 Render.com Environment Variables Checklist

Add ALL of these to Render.com:

| Key | Value | Purpose |
|-----|-------|---------|
| `OPENWEATHER_API_KEY` | `b76f9df700beb2863abea6d362adcaf8` | Weather data |
| `GEMINI_API_KEY` | `AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o` | Pest detection + Voice |
| `JWT_SECRET` | `any_random_string_here` | Authentication |
| `FRONTEND_URL` | `https://foshol-bachao-k3rb.vercel.app` | CORS |

---

## ✅ Verification Steps

### 1. Test Weather API

**Local:**
```bash
# Start backend
cd harvestguard\backend
npm start

# In another terminal, test:
curl http://localhost:3001/api/weather?upazila=Dhaka&lang=en
```

**Render.com:**
```bash
# Test deployed API
curl https://foshol-bachao-api.onrender.com/api/weather?upazila=Dhaka&lang=en
```

**Expected Response:**
```json
{
  "upazila": "Dhaka",
  "source": "openweathermap",
  "current": {
    "temp": 27,
    "humidity": 41,
    ...
  }
}
```

### 2. Test Pest Detection API

**Local:**
```bash
# Test with a sample image (base64)
curl -X POST http://localhost:3001/api/pest/identify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token-auto-login" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,...",
    "cropType": "Paddy",
    "location": "Dhaka"
  }'
```

**Render.com:**
```bash
# Test deployed API
curl -X POST https://foshol-bachao-api.onrender.com/api/pest/identify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-token-auto-login" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,...",
    "cropType": "Paddy",
    "location": "Dhaka"
  }'
```

**Expected Response:**
```json
{
  "pestName": "Brown Plant Hopper",
  "pestNameBn": "বাদামি পাতা হপার",
  "riskLevel": "High",
  "riskLevelBn": "উচ্চ",
  "description": "...",
  "treatmentPlan": {
    "immediateBn": [...],
    "preventiveBn": [...]
  },
  "source": "gemini"
}
```

---

## 🐛 Troubleshooting

### Weather API Not Working

**Problem:** Weather shows "Failed to load"

**Solutions:**
1. ✅ Check `OPENWEATHER_API_KEY` is set in Render.com
2. ✅ Verify API key is correct: `b76f9df700beb2863abea6d362adcaf8`
3. ✅ Check Render.com logs for errors
4. ✅ Wait 2-3 minutes after adding env var (redeploy time)

### Pest Detection Not Working

**Problem:** Returns error "Gemini API key not configured"

**Solutions:**
1. ✅ Add `GEMINI_API_KEY` to Render.com environment variables
2. ✅ Verify key is correct: `AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o`
3. ✅ Check backend logs on Render.com
4. ✅ Restart backend service on Render.com

### How to Check Render.com Logs

1. Go to Render.com dashboard
2. Select your backend service
3. Click **"Logs"** tab
4. Look for errors or API key issues

---

## 📱 Quick Test from Browser

### Test Weather:
```
https://foshol-bachao-api.onrender.com/api/weather?upazila=Dhaka&lang=en
```

### Test Health:
```
https://foshol-bachao-api.onrender.com/api/health
```

---

## 🎯 Final Checklist

### Local Development:
- [x] Weather API key in `.env`
- [x] Gemini API key in `.env`
- [ ] Backend restarted after adding keys

### Render.com Deployment:
- [ ] `OPENWEATHER_API_KEY` added
- [ ] `GEMINI_API_KEY` added
- [ ] `JWT_SECRET` added
- [ ] `FRONTEND_URL` added
- [ ] Service redeployed
- [ ] Tested weather API
- [ ] Tested pest detection API

---

## 🚀 After Setup

Once both APIs are configured:

1. **Weather will work for:**
   - All 8 divisions (Dhaka, Chittagong, Rajshahi, etc.)
   - Real-time temperature, humidity, rain
   - 5-day forecast

2. **Pest Detection will work for:**
   - Image upload and analysis
   - Real Gemini AI identification
   - Bangla treatment plans
   - Risk assessment

3. **Voice Chat will work for:**
   - Voice transcription (Gemini)
   - Intelligent responses (Gemini)
   - Bangla language support

---

## 📞 Need Help?

- Check Render.com logs for errors
- Verify environment variables are set correctly
- Test APIs using curl commands above
- Check browser console (F12) for frontend errors

---

**You're all set! 🎉**


