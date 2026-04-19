# FOFA — Football Open For All

The FOFA website. Single-page React app built with Vite.

## Deploy to Vercel (5 minutes, free)

### Step 1 — Get the code into GitHub

**Easy way (no command line):**
1. Go to https://github.com/new and create a new repo called `fofa-site` (Public or Private — your call)
2. On the new repo page, click **"uploading an existing file"**
3. Drag this entire folder's contents into the upload area
4. Click **"Commit changes"**

**Command line way (if you prefer):**
```bash
cd fofa-site
git init
git add .
git commit -m "Initial FOFA site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fofa-site.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to https://vercel.com and sign in with your GitHub account
2. Click **"Add New… → Project"**
3. Select your `fofa-site` repo and click **"Import"**
4. Vercel auto-detects Vite — just click **"Deploy"**
5. Wait ~60 seconds. Done.

You'll get a URL like `https://fofa-site-xyz.vercel.app` — open it on your phone.

### Step 3 — (Optional) Custom domain

In your Vercel project: Settings → Domains → add `fofa.com` or whatever you own. Vercel walks you through the DNS step.

---

## Run locally (if you want to preview before deploying)

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite will also print a "Network" URL like `http://192.168.x.x:5173` — open that on your phone if it's on the same WiFi.

---

## Future updates

Any change you push to GitHub auto-redeploys on Vercel. Edit `src/FOFA.jsx`, commit, push — live in 60 seconds.

---

© 2026 Legacy Protocol Labs Pte. Ltd.
