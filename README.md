# Manuscript Writer — Deployment Guide

## What Changed From Emergent Version
- ✅ Replaced Emergent/LiteLLM with **direct Anthropic Claude API** (claude-sonnet-4-6)
- ✅ Cleaned up requirements.txt (removed 80+ unused packages)
- ✅ Fixed all known server errors
- ✅ Stable background job generation with proper polling
- ✅ Real PubMed, Semantic Scholar, Europe PMC search

---

## Project Structure

```
manuscript-app/
├── backend/
│   ├── server.py          ← FastAPI backend
│   ├── requirements.txt   ← Minimal, clean dependencies
│   └── .env.example       ← Copy to .env and fill in
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── pages/
    │   ├── components/
    │   └── context/
    ├── package.json
    └── .env.example       ← Copy to .env and fill in
```

---

## Step 1 — MongoDB Atlas

If you don't already have a cluster:
1. Go to https://cloud.mongodb.com → Create free cluster
2. Create a database user (note username + password)
3. Whitelist 0.0.0.0/0 in Network Access
4. Copy the connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/`)

---

## Step 2 — Deploy Backend on Render

1. Push `backend/` folder to a GitHub repo (or use your existing one)
2. Go to https://render.com → New → Web Service
3. Connect repo, select the `backend` folder as root
4. Set:
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add these **Environment Variables**:
   ```
   MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
   DB_NAME=manuscript_writer
   JWT_SECRET=any-long-random-string
   ANTHROPIC_API_KEY=sk-ant-your-actual-key
   CORS_ORIGINS=https://your-frontend.onrender.com
   ```
6. Deploy → note the backend URL (e.g. `https://manuscript-backend.onrender.com`)

---

## Step 3 — Deploy Frontend on Render

1. Push `frontend/` folder to GitHub (same or different repo)
2. Go to Render → New → Static Site
3. Connect repo, select `frontend` folder as root
4. Set:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
5. Add **Environment Variable**:
   ```
   REACT_APP_BACKEND_URL=https://manuscript-backend.onrender.com
   ```
6. Deploy

---

## Step 4 — Update CORS

Go back to your backend Render service → Environment → update:
```
CORS_ORIGINS=https://your-actual-frontend-url.onrender.com
```
Then redeploy backend.

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Fill in your values
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
cp .env.example .env      # Set REACT_APP_BACKEND_URL=http://localhost:8000
npm install
npm start
```

---

## Workflow

1. **Create Project** → Projects page → New Project
2. **Upload Report** → Upload PDF or paste text → AI parses study summary
3. **Literature Search** → Add keywords → Search PubMed, Semantic Scholar, Europe PMC → Select papers
4. **Generate Manuscript** → Click Generate → Wait ~30-60 seconds → Edit sections
5. **Export** → PDF, Word (.docx), or Markdown

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Make sure CORS_ORIGINS in backend env matches your frontend URL exactly |
| MongoDB connection fails | Check IP whitelist is 0.0.0.0/0, check connection string format |
| Manuscript generation fails | Check ANTHROPIC_API_KEY is correct and has credits |
| Frontend shows blank page | Check REACT_APP_BACKEND_URL doesn't have trailing slash |
| Search returns no results | PubMed/Semantic Scholar may be rate limiting — try fewer keywords |
