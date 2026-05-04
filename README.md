# 🗞️ Maharashtra Digest

**Mumbai + Aurangabad daily news — without the noise.**

A self-updating news digest app that:
- Fetches real news every morning at **7:00 AM IST** via GitHub Actions
- Summarizes each story into 3 crisp bullet points (no API key needed)
- Stores daily news as JSON files in the repo (full history forever)
- Serves a fast, beautiful React app on Vercel
- Supports **English + मराठी** toggle

---

## 🏗️ Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React + Vite on Vercel | Free |
| News Fetch | GitHub Actions (cron) | Free |
| News Source | RSS feeds (TOI, HT, Mid-Day, Lokmat, Sakal…) | Free |
| Summarization | Extractive (TF-IDF, no API) | Free |
| Storage | JSON files committed to this repo | Free |

**Total cost: ₹0/month**

---

## 🚀 One-Time Setup (15 minutes)

### Step 1 — Fork & Clone

```bash
# Fork this repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/maharashtra-digest.git
cd maharashtra-digest
npm install
```

### Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Vercel auto-detects Vite. Click **Deploy**
4. Your site is live at `https://maharashtra-digest.vercel.app` (or custom domain)

### Step 3 — Get Vercel Deploy Hook

1. In Vercel → Your Project → **Settings → Git → Deploy Hooks**
2. Create a hook named `github-actions`, branch `main`
3. Copy the hook URL (looks like `https://api.vercel.com/v1/integrations/deploy/xxx/yyy`)

### Step 4 — Add GitHub Secret

1. In your GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `VERCEL_DEPLOY_HOOK`
4. Value: paste the Vercel hook URL from Step 3

### Step 5 — Test the Action

1. Go to **Actions** tab in GitHub
2. Click **Daily News Digest** → **Run workflow** → **Run workflow**
3. Wait ~2 minutes — it will fetch news, commit a JSON file, and trigger Vercel redeploy
4. Check your Vercel URL — today's news should appear!

---

## 📁 Project Structure

```
maharashtra-digest/
├── .github/
│   └── workflows/
│       └── daily-digest.yml     ← GitHub Action (runs 7am IST daily)
├── scripts/
│   ├── package.json
│   └── fetch-news.mjs           ← RSS fetcher + summarizer
├── public/
│   └── news/
│       ├── 2026-05-04.json      ← Today's news (committed by Action)
│       └── 2026-05-03.json      ← Yesterday's (history preserved forever)
├── src/
│   ├── components/
│   ├── utils/
│   │   ├── summarizer.js        ← Extractive summarizer (no API needed)
│   │   ├── i18n.js              ← English + Marathi translations
│   │   └── categories.js
│   ├── App.jsx
│   └── main.jsx
└── vercel.json
```

---

## 🔧 Local Development

```bash
npm install
npm run dev       # App at http://localhost:5173

# Test the news fetcher locally:
cd scripts && npm install && node fetch-news.mjs
```

---

## 📰 News Sources

### Mumbai
- Times of India
- Hindustan Times
- Indian Express (Mumbai edition)
- Mid-Day
- Economic Times (Markets)
- Business Standard
- Mint (Technology)
- TOI Sports

### Aurangabad
- Lokmat
- Sakal
- Maharashtra Times (Aurangabad)

---

## 🗓️ How Daily History Works

Every day the GitHub Action:
1. Fetches RSS feeds
2. Generates `public/news/YYYY-MM-DD.json`
3. Commits it to the `main` branch
4. Triggers Vercel redeploy

The React app fetches `/news/YYYY-MM-DD.json` based on the date you select.
Since all JSON files stay in the repo, you can navigate to any past date.

---

## ➕ Adding More Cities / Sources

Edit `scripts/fetch-news.mjs` — add entries to the `FEEDS` array:

```js
{ url: 'YOUR_RSS_URL', source: 'Source Name', city: 'pune', hint: 'general' }
```

Then add the city to `src/utils/categories.js` and update the city tabs in `src/components/CityTabs.jsx`.

---

## 📝 License

MIT — free to use, modify and deploy.
