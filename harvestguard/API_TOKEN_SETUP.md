# How to Get Hugging Face API Token for Crop Scanner

## Step-by-Step Instructions

### 1. Create Hugging Face Account
   - Go to: https://huggingface.co/join
   - Sign up for a free account
   - Verify your email

### 2. Create API Token
   - Login to Hugging Face
   - Go to: https://huggingface.co/settings/tokens
   - Click **"New token"** button
   - **Name**: "Foshol Bachao Scanner" (or any name)
   - **Type**: Select **"Read"** (Read access is enough)
   - Click **"Generate token"**
     - **IMPORTANT**: Copy the token immediately (starts with `hf_...`)
     - You won't be able to see it again!
     - It looks like: `hf_your_token_here` (example format)

### 3. Add Token to Project
   - Open the file: `harvestguard/frontend/.env`
   - Replace `your_token_here` with your actual token:
   ```
   VITE_HF_TOKEN=hf_your_actual_token_here
   ```
   - Save the file

### 4. Restart Dev Server
   - Stop the current server (Ctrl+C)
   - Run: `npm run dev`
   - Refresh your browser

## What to Share
When asking for help, just share:
- Your API token (starts with `hf_...`)

That's it! The token will be saved in your `.env` file (which is NOT committed to git for security).

