# 🚀 Vercel Deployment Guide - Foshol Bachao

## ✅ Step 1: Code Pushed to GitHub
**Status:** ✅ **DONE** - All code has been pushed to: `https://github.com/sakib-101-git/Foshol-Bachao`

---

## 📋 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com
   - Sign in with your GitHub account (same as `sakib-101-git`)

2. **Import Your Project:**
   - Click **"Add New..."** → **"Project"**
   - Find and select: **`sakib-101-git/Foshol-Bachao`**
   - Click **"Import"**

3. **Configure Project Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** `harvestguard/frontend` ⚠️ **IMPORTANT**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Environment Variables (Optional):**
   - If you have any frontend environment variables, add them here:
     - `VITE_API_BASE` = `https://foshol-bachao-api.onrender.com/api`
   - **Note:** The API URL is already configured in code, so this is optional.

5. **Deploy:**
   - Click **"Deploy"**
   - Wait 2-3 minutes for build to complete
   - Your site will be live at: `https://foshol-bachao-[random].vercel.app`

---

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Navigate to Frontend Directory:**
   ```bash
   cd harvestguard/frontend
   ```

4. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Select your project settings
   - Deploy!

---

## 🔧 Important Configuration

### Root Directory Setting
Since your frontend is in `harvestguard/frontend`, you **MUST** set:
- **Root Directory:** `harvestguard/frontend`

This tells Vercel where to find your `package.json` and build files.

### Build Settings (Auto-detected by Vercel)
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** 18.x (or latest)

---

## 🌐 After Deployment

### Your Live URLs:
- **Frontend:** `https://foshol-bachao-[random].vercel.app`
- **Backend API:** `https://foshol-bachao-api.onrender.com/api` (already deployed)

### Custom Domain (Optional):
1. Go to your project settings in Vercel
2. Click **"Domains"**
3. Add your custom domain (e.g., `foshol-bachao.com`)

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at Vercel URL
- [ ] Weather API works (connects to Render backend)
- [ ] Pest detection works (Gemini API)
- [ ] Voice chat works (Web Speech API)
- [ ] All pages load correctly
- [ ] Mobile responsive design works

---

## 🐛 Troubleshooting

### Build Fails:
- Check that **Root Directory** is set to `harvestguard/frontend`
- Verify `package.json` exists in `harvestguard/frontend`
- Check build logs in Vercel dashboard

### API Not Working:
- Verify backend is running on Render: `https://foshol-bachao-api.onrender.com`
- Check browser console for API errors
- Ensure CORS is configured on backend

### Environment Variables:
- Add `VITE_API_BASE` in Vercel dashboard if needed
- Redeploy after adding environment variables

---

## 📝 Quick Deploy Steps Summary

1. ✅ Code pushed to GitHub
2. Go to https://vercel.com
3. Import project: `sakib-101-git/Foshol-Bachao`
4. Set **Root Directory:** `harvestguard/frontend`
5. Click **Deploy**
6. Wait 2-3 minutes
7. Get your live URL! 🎉

---

## 🔗 Links

- **GitHub Repo:** https://github.com/sakib-101-git/Foshol-Bachao
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Backend API:** https://foshol-bachao-api.onrender.com

---

**Need Help?** Check Vercel docs: https://vercel.com/docs

