# 🚀 How to Run Foshol Bachao Locally

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version` (should show v18.x or higher)

2. **Git** (already installed if you cloned the repo)

---

## ⚡ Quick Start (5 minutes)

### Step 1: Clone/Open the Repository
```bash
cd C:\Users\mahmu\Foshol-Bachao
```

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd harvestguard\backend

# Install dependencies
npm install

# Create .env file (copy from example below)
# Then start the server
npm start
```

**Backend will run on:** http://localhost:3001

### Step 3: Setup Frontend (New Terminal)

```bash
# Navigate to frontend folder
cd harvestguard\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will run on:** http://localhost:5173

---

## 🔧 Detailed Setup

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd harvestguard\backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** in `harvestguard/backend/`:
   ```env
   JWT_SECRET=your_super_secret_jwt_key_change_this
   OPENWEATHER_API_KEY=b76f9df700beb2863abea6d362adcaf8
   GEMINI_API_KEY=your_gemini_key_here_optional
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start backend:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   node index.js
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd harvestguard\frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** in `harvestguard/frontend/`:
   ```env
   VITE_API_BASE=http://localhost:3001/api
   VITE_HF_TOKEN=your_huggingface_token_optional
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```

---

## 🌐 Access the Application

Once both servers are running:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

---

## 🐛 Troubleshooting

### Port Already in Use

**Backend (port 3001):**
```bash
# Windows - Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

**Frontend (port 5173):**
```bash
# Windows - Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Backend Not Starting

1. Check if `.env` file exists
2. Check if `db` folder exists (it will auto-create)
3. Check console for errors

### Frontend Not Connecting to Backend

1. Make sure backend is running on port 3001
2. Check `VITE_API_BASE` in frontend `.env`
3. Check browser console (F12) for CORS errors

---

## 📝 Environment Variables Reference

### Backend `.env` (Required)
```env
JWT_SECRET=any_random_string_here
OPENWEATHER_API_KEY=b76f9df700beb2863abea6d362adcaf8
FRONTEND_URL=http://localhost:5173
```

### Backend `.env` (Optional)
```env
GEMINI_API_KEY=your_key_here  # For pest identification
```

### Frontend `.env` (Required)
```env
VITE_API_BASE=http://localhost:3001/api
```

### Frontend `.env` (Optional)
```env
VITE_HF_TOKEN=your_token_here  # For disease detection
```

---

## 🎯 Quick Commands Reference

### Backend
```bash
cd harvestguard\backend
npm install          # First time only
npm start            # Start server
```

### Frontend
```bash
cd harvestguard\frontend
npm install          # First time only
npm run dev          # Start dev server
npm run build        # Build for production
```

---

## ✅ Verify Everything Works

1. **Backend Health Check:**
   - Visit: http://localhost:3001/api/health
   - Should return: `{"status":"ok",...}`

2. **Frontend:**
   - Visit: http://localhost:5173
   - Should see landing page

3. **Test Login:**
   - Click "Get Started"
   - Register new account or use demo:
     - Email: `demo@harvestguard.com`
     - Password: `demo123`

---

## 🚀 Production Deployment

The app is already deployed:
- **Frontend:** https://foshol-bachao-k3rb.vercel.app
- **Backend:** https://foshol-bachao-api.onrender.com

No need to run locally if you just want to use it!

---

## 💡 Tips

1. **Run both terminals side-by-side** to see logs from both servers
2. **Keep backend running** - frontend needs it for API calls
3. **Check console** (F12) for any errors
4. **API keys are optional** - app works with mock data if missing

---

## 📞 Need Help?

- Check console logs (F12 in browser)
- Check terminal output for errors
- See `API_KEYS_SETUP.md` for API configuration
- See `DEPLOYMENT_CHECKLIST.md` for feature list

---

**You're all set! 🎉**


