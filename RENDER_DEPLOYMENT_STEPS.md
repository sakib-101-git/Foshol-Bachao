# 🚀 Step-by-Step: Render.com Deployment

## Quick Steps (5 minutes)

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Login with your account
3. Find your backend service: `foshol-bachao-api` (or similar name)

### Step 2: Add Environment Variables

Click on your backend service → **"Environment"** tab → **"Add Environment Variable"**

Add these **4 variables** one by one:

#### Variable 1: Weather API
- **Key:** `OPENWEATHER_API_KEY`
- **Value:** `b76f9df700beb2863abea6d362adcaf8`
- Click **"Save Changes"**

#### Variable 2: Pest Detection API
- **Key:** `GEMINI_API_KEY`
- **Value:** `AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o`
- Click **"Save Changes"**

#### Variable 3: JWT Secret
- **Key:** `JWT_SECRET`
- **Value:** `harvestguard_secret_2025` (or any random string)
- Click **"Save Changes"**

#### Variable 4: Frontend URL
- **Key:** `FRONTEND_URL`
- **Value:** `https://foshol-bachao-k3rb.vercel.app`
- Click **"Save Changes"**

### Step 3: Wait for Redeploy
- Render will automatically redeploy (takes 2-3 minutes)
- Watch the **"Logs"** tab to see progress
- Wait until you see: "Your service is live"

### Step 4: Test APIs

#### Test Weather:
Open in browser:
```
https://foshol-bachao-api.onrender.com/api/weather?upazila=Dhaka&lang=en
```

Should return JSON with weather data.

#### Test Health:
```
https://foshol-bachao-api.onrender.com/api/health
```

Should return: `{"status":"ok"}`

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Weather API returns real data (not mock)
- [ ] Pest detection works (upload image)
- [ ] Voice chat works (record voice)
- [ ] No errors in Render.com logs
- [ ] Frontend can connect to backend

---

## 🎯 That's It!

Your APIs are now deployed and working! 🎉


