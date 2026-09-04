# Vidarbha Mandi AI — Local Setup Guide (VS Code)

This guide walks you through running the project on your own machine.

---

## 1. Requirements

| Tool | Version | Used for |
|------|---------|----------|
| Node.js | 18+ | Frontend + Backend |
| npm | comes with Node.js | Installing JavaScript packages |
| Python | 3.10+ | ML prediction service |
| pip | comes with Python | Installing Python packages |
| VS Code | latest | Code editor |
| Supabase project | already provisioned | Database (URL + keys provided in `.env`) |

---

## 2. Project Structure

```
project/
├── frontend/          React + JavaScript (Vite)
├── backend/           Node.js + Express API
├── ml-service/        Python Flask ML service
├── supabase/          Database migrations + Edge Functions
└── docs/              This file
```

---

## 3. Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install
```

### ML Service

```bash
cd ml-service
pip install -r requirements.txt
```

---

## 4. Environment Files

Each service has its own `.env` file. Create them by copying the examples and filling in the values.

### frontend/.env

| Variable | Required? | Description |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_API_BASE_URL` | For prediction | Backend API URL, e.g. `http://localhost:5000` |

### backend/.env

| Variable | Required? | Description |
|----------|-----------|-------------|
| `PORT` | No (default 5000) | Backend server port |
| `SUPABASE_URL` | Yes | Same Supabase URL as frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role key (server-side only, never expose to frontend) |
| `ML_SERVICE_URL` | For prediction | URL of the ML service, e.g. `http://localhost:8000` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (empty = allow all) |
| `DATA_GOV_API_KEY` | For mandi sync | Free key from data.gov.in |
| `DATA_GOV_RESOURCE_ID` | No (pre-set) | data.gov.in resource ID for mandi prices |

### ml-service/.env

| Variable | Required? | Description |
|----------|-----------|-------------|
| `ML_PORT` | No (default 8000) | ML service port |
| `SUPABASE_URL` | Yes | Same Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Same service-role key as backend |

**Never commit `.env` files to git. They are already in `.gitignore`.**

---

## 5. Start Each Service

Open three terminals in VS Code (Terminal → New Terminal).

### Terminal 1 — Frontend (port 5173)

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Terminal 2 — Backend (port 5000)

```bash
cd backend
npm run dev
```

### Terminal 3 — ML Service (port 8000)

```bash
cd ml-service
python app.py
```

---

## 6. How the Services Connect

```
Frontend (React, port 5173)
  │
  ├──→ Supabase (database)          Direct read using anon key
  │     ├── weather_snapshots        Weather page reads from here
  │     ├── mandi_prices             Mandi Prices, Compare, Analysis read from here
  │     └── price_predictions        Price Prediction page reads from here
  │
  └──→ Backend (Express, port 5000)  Via VITE_API_BASE_URL
        │
        └──→ ML Service (Flask, port 8000)  Via ML_SERVICE_URL
              │
              └──→ Supabase (database)     Fetches historical mandi_prices for forecasting
```

---

## 7. Testing Each Feature

### Weather Page (works immediately)

1. Open http://localhost:5173/weather
2. Select any Vidarbha district
3. You should see current temperature, humidity, rainfall, wind, and a 5-day forecast
4. Data comes from Open-Meteo (free, no API key needed) via the `sync-weather` Edge Function

### Mandi Prices Page (requires DATA_GOV_API_KEY)

1. Open http://localhost:5173/mandi-prices
2. Select a district, crop, and mandi
3. If `DATA_GOV_API_KEY` is configured and the sync function has been triggered, you will see real prices
4. If not configured, you will see a "Mandi data unavailable" message — this is expected

### Compare Mandis Page (requires mandi data)

1. Open http://localhost:5173/compare-mandis
2. Select a district and crop
3. You will see price comparisons across mandis in that district
4. Requires the same `DATA_GOV_API_KEY` and synced data

### Crop Analysis Page (requires mandi history)

1. Open http://localhost:5173/crop-analysis
2. Select a district, mandi, and crop
3. You will see historical price charts and statistics
4. Requires synced mandi price data (at least a few days of history)

### Price Prediction Page (requires all services running)

1. Start all three services (frontend, backend, ML service)
2. Set `VITE_API_BASE_URL=http://localhost:5000` in `frontend/.env`
3. Set `ML_SERVICE_URL=http://localhost:8000` in `backend/.env`
4. Open http://localhost:5173/price-prediction
5. Select a district, mandi, and crop
6. Click the prediction trigger button
7. The prediction requires at least 10 days of historical mandi price data in the database

---

## 8. Enabling Live Mandi Prices

The mandi price sync uses the Government of India's open data platform (data.gov.in / AGMARKNET).

### Steps

1. Go to https://data.gov.in and create a free account
2. Go to "My Account" → "Generate API Key"
3. Copy the API key
4. Add it as a Supabase Edge Function secret:
   - In your Supabase dashboard: Project Settings → Edge Functions → Secrets
   - Name: `DATA_GOV_API_KEY`
   - Value: your key
5. Trigger the sync function:
   ```bash
   curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/sync-mandi-prices" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
6. Verify data appeared:
   ```sql
   SELECT count(*) FROM mandi_prices;
   SELECT DISTINCT district_id FROM mandi_prices;
   ```

---

## 9. Syncing Weather Data

Weather data is already synced via the `sync-weather` Edge Function. To manually refresh:

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/sync-weather" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

No API key is needed — Open-Meteo is free and keyless.
