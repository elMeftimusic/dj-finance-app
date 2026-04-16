# DJ Finance App — Setup Guide

This guide takes you from zero to a live app in about 30 minutes.
No coding knowledge needed — just follow the steps.

---

## STEP 1 — Download & install Node.js

1. Go to https://nodejs.org and download the **LTS version**
2. Install it (just click through the installer)
3. Open a Terminal (Mac: Spotlight → Terminal, Windows: Start → cmd)
4. Type `node -v` — you should see a version number like `v20.x.x`

---

## STEP 2 — Set up your Google Cloud project

### 2a. Create the project
1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top → **New Project**
3. Name it `dj-finance` → **Create**

### 2b. Enable APIs
1. In the left menu → **APIs & Services** → **Library**
2. Search for **Google Sheets API** → Enable it
3. Search for **Google Drive API** → Enable it

### 2c. Create OAuth credentials
1. Left menu → **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, configure the consent screen first:
   - User type: **External**
   - App name: `DJ Finance`
   - Add your Gmail as test user
   - Save
4. Back to Create Credentials → OAuth client ID:
   - Application type: **Web application**
   - Name: `DJ Finance Web`
   - Authorized JavaScript origins — add both:
     - `http://localhost:3000` (for local testing)
     - `https://your-app-name.netlify.app` (add this after Step 6 once you know the URL)
5. Click **Create** → copy the **Client ID** (looks like `...apps.googleusercontent.com`)

---

## STEP 3 — Set up Google Sheets as your database

1. Go to https://sheets.google.com → Create a new spreadsheet
2. Name it `DJ Finance Data`
3. Create these 4 sheets (tabs at the bottom, click the + button):
   - `Transactions`
   - `Invoices`
   - `TaxQuarters`
   - `Settings`
4. Copy the Spreadsheet ID from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/**THIS_IS_THE_ID**/edit`
   - Copy that long ID string

### Add headers — copy-paste into Row 1 of each sheet:

**Transactions sheet, Row 1:**
```
ID    Type    Date    Amount (Net)    VAT    Description    Category    Quarter    Receipt ID
```

**Invoices sheet, Row 1:**
```
ID    Date    Client    Client Address    Description    Net Amount    VAT (19%)    Total    Status    Notes
```

**TaxQuarters sheet — paste Row 1 headers AND pre-fill rows 2–5:**
```
Quarter    Year    Deadline      Voranmeldung Filed    Payment Sent    Estimated Amount    Actual Amount
Q1         2026    2026-05-10    FALSE                 FALSE           0                   0
Q2         2026    2026-08-10    FALSE                 FALSE           0                   0
Q3         2026    2026-11-10    FALSE                 FALSE           0                   0
Q4         2026    2027-02-10    FALSE                 FALSE           0                   0
```

**Settings sheet, Row 1:**
```
Key    Value
```
Then Row 2: `owner_name` | `Moe`
Then Row 3: `vat_rate` | `0.19`

---

## STEP 4 — Set up Google Drive folder for receipts

1. Go to https://drive.google.com
2. Create a new folder called **DJ Finance Receipts**
3. Open the folder and copy the ID from the URL:
   - URL looks like: `https://drive.google.com/drive/folders/**THIS_IS_THE_FOLDER_ID**`

---

## STEP 5 — Run the app locally (recommended before going live)

1. In the `dj-finance-app` folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor and fill in your values:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=paste_your_client_id_here
   REACT_APP_SPREADSHEET_ID=paste_your_spreadsheet_id_here
   REACT_APP_DRIVE_FOLDER_ID=paste_your_folder_id_here
   ```
3. In Terminal, inside the `dj-finance-app` folder:
   ```bash
   npm install
   npm start
   ```
4. App opens at http://localhost:3000 — test it out!
5. Go to Settings → Sign in with Google to connect your real data.

---

## STEP 6 — Push code to GitHub

Netlify connects to GitHub to deploy your app. You don't have to do anything on GitHub after this — Netlify handles it automatically.

1. Create a free account at https://github.com (if you don't have one)
2. Click **+** → **New repository**
3. Name it `dj-finance-app`, leave it **Private** (unlike GitHub Pages, Netlify works with private repos)
4. Click **Create repository**
5. In Terminal, inside the `dj-finance-app` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/dj-finance-app.git
   git push -u origin main
   ```

---

## STEP 7 — Deploy on Netlify

1. Go to https://netlify.com and sign up free (use your GitHub account — easier)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** → authorize Netlify → select your `dj-finance-app` repository
4. Build settings are auto-detected from `netlify.toml` — no changes needed:
   - Build command: `npm run build` ✓
   - Publish directory: `build` ✓
5. Click **Deploy site**

Netlify gives your app a random URL like `amazing-dj-12345.netlify.app`. You can rename it to something nicer under **Site settings → Site details → Change site name**.

---

## STEP 8 — Add environment variables in Netlify

This is where Netlify shines — no secrets, no YAML, just a simple UI.

1. In Netlify → your site → **Site configuration** → **Environment variables**
2. Click **Add a variable** and add these three:

| Key | Value |
|-----|-------|
| `REACT_APP_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `REACT_APP_SPREADSHEET_ID` | Your Google Spreadsheet ID |
| `REACT_APP_DRIVE_FOLDER_ID` | Your Google Drive folder ID |

3. After adding all three, go to **Deploys** → **Trigger deploy** → **Deploy site**

Your app is now live with your Google credentials baked in.

---

## STEP 9 — Add your Netlify URL to Google OAuth

1. Go back to https://console.cloud.google.com → **Credentials** → your OAuth client
2. Under **Authorized JavaScript origins**, add your Netlify URL:
   `https://your-app-name.netlify.app`
3. Click **Save**

Now Google will allow sign-in from your live app.

---

## STEP 10 — Install on your phone (PWA)

Once live on Netlify:

**iPhone (Safari):**
1. Open your Netlify URL in Safari
2. Tap the Share button → **Add to Home Screen**
3. The app appears on your home screen like a native app!

**Android (Chrome):**
1. Open your Netlify URL in Chrome
2. Tap the 3-dot menu → **Add to Home Screen**

---

## How updates work going forward

Every time you push to GitHub, Netlify auto-deploys within about 1 minute:
```bash
git add .
git commit -m "describe your change"
git push
```
That's it — no manual steps needed.

If you only change environment variables (e.g. new spreadsheet ID), just go to Netlify → Environment variables → update the value → Trigger deploy. No code change needed.

---

## Troubleshooting

**"Sign in failed"** — Your Netlify URL is not in Google OAuth authorized origins, or has a trailing slash (remove it)

**App loads but Google sign-in does nothing** — Check that environment variables are set in Netlify and a new deploy was triggered after adding them

**"Sheets API error 403"** — Make sure you enabled the Google Sheets API in Cloud Console (Step 2b)

**Receipts not uploading** — Make sure you enabled the Google Drive API in Cloud Console (Step 2b)

**App shows demo data only after signing in** — The Spreadsheet ID is wrong, or the sheet tab names don't match exactly (`Transactions`, `Invoices`, `TaxQuarters`, `Settings`)

**Page not found on refresh** — This is fixed automatically by `netlify.toml` — make sure the file is in your repo

---

## Updating your invoice details

In the app → **Settings tab** → fill in your name, address, Steuernummer, and bank details.
These are saved in your browser and printed on every PDF invoice.

---

## File structure overview

```
dj-finance-app/
├── netlify.toml                   ← tells Netlify how to build + fixes page refresh
├── src/
│   ├── lib/
│   │   ├── google.js              ← all Google Sheets & Drive API calls
│   │   ├── pdfInvoice.js          ← PDF invoice generator (German Rechnung format)
│   │   ├── AppContext.js          ← app-wide state, works in demo mode without Google
│   │   └── mockData.js            ← demo data shown before Google login
│   ├── views/
│   │   ├── Dashboard.js           ← home screen, overview, Finanzamt gauge, charts
│   │   ├── Finances.js            ← income & expense transactions
│   │   ├── Tax.js                 ← quarterly USt-Voranmeldung tracker
│   │   ├── Invoices.js            ← invoice list + PDF generator
│   │   ├── Receipts.js            ← photo/file upload + manual expense entry
│   │   └── Settings.js            ← Google connection + invoice profile
│   └── components/ui.js           ← shared UI components (buttons, modals, icons)
├── .env.example                   ← copy to .env for local development
└── SETUP_GUIDE.md                 ← this file
```
