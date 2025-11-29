# 🐛 Simple Test Steps for Pest Detection

## Step 1: Test Gemini API Connection

Open in browser:
```
http://localhost:3001/api/pest/test
```

**Expected:** Should return `{"status":"success", "response": "API is working"}`

If this fails → API key issue

---

## Step 2: Check Backend Logs

1. Open your backend terminal (where `npm start` is running)
2. Upload an image in the frontend
3. Watch the terminal - you should see:
   ```
   === PEST IDENTIFICATION REQUEST ===
   API Key present: true
   Image data length: [number]
   Sending image to Gemini API...
   === GEMINI API RESPONSE ===
   Full response: [text]
   ```

---

## Step 3: Test with Different Images

Try uploading:
1. **Fresh green leaf** → Should say "Healthy" or "Low Risk"
2. **Yellow/brown leaf** → Should identify disease
3. **Dead leaf** → Should identify cause
4. **Pest image** → Should identify pest

**Each should give DIFFERENT results!**

---

## Step 4: Check Browser Console

1. Press F12 in browser
2. Go to "Console" tab
3. Upload an image
4. Look for logs:
   - "Sending image to API, size: [number]"
   - "Pest identification result: {source: 'gemini-live', ...}"

---

## Step 5: Verify API Key

Check backend `.env` file:
```env
GEMINI_API_KEY=AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o
```

**If missing or wrong → Add it and restart backend**

---

## Quick Fix: Restart Backend

```bash
# Stop backend (Ctrl+C)
# Then restart:
cd harvestguard\backend
npm start
```

---

## Still Same Results?

1. Check backend terminal logs - is Gemini API being called?
2. Check browser console - any errors?
3. Test API directly: `http://localhost:3001/api/pest/test`
4. Verify API key is correct in `.env`

---

**The logs will show exactly what's happening!**


