# Vidarbha Mandi AI

### Vidarbha Live Mandi Price Prediction & Analysis System

**Real-Time Mandi Intelligence for Vidarbha Farmers**

A full-stack agricultural intelligence platform built as a final-year B.Tech Computer Science project. It gives Vidarbha's farmers transparent access to mandi prices across all 11 districts, historical trends, weather, and AI-driven price forecasts — in English and Marathi.

---

## Project Scope

This application is designed **exclusively for the Vidarbha region** of Maharashtra, India. It supports only these 11 districts:

| # | District | Division |
|---|----------|----------|
| 1 | Nagpur | Nagpur |
| 2 | Wardha | Nagpur |
| 3 | Bhandara | Nagpur |
| 4 | Gondia | Nagpur |
| 5 | Chandrapur | Nagpur |
| 6 | Gadchiroli | Nagpur |
| 7 | Amravati | Amravati |
| 8 | Akola | Amravati |
| 9 | Buldhana | Amravati |
| 10 | Washim | Amravati |
| 11 | Yavatmal | Amravati |

No Maharashtra-wide or India-wide location selection is included.

---

## Architecture

```
project/
├── frontend/                   # Frontend (React + JavaScript + Vite)
│   └── src/
│       ├── components/          # Navbar, Footer, SearchPanel, Selectors, UI
│       ├── pages/               # 7 pages (Home, Mandi Prices, Comparison, Analysis, Prediction, Weather, About)
│       ├── services/            # Supabase data-access layer + API config
│       ├── data/                # Static Vidarbha reference data (districts, mandis, crops)
│       ├── hooks/               # Language context hook
│       └── locales/             # English + Marathi translations
│
├── backend/                    # Backend (Node.js + Express)
│   └── src/
│       ├── config/             # Supabase client
│       ├── controllers/        # Route handlers (mandi, weather, prediction)
│       ├── routes/             # REST API routes
│       ├── services/           # data.gov.in client, ML service client
│       └── utils/              # Normalization helpers
│
├── ml-service/                 # Isolated Python ML prediction service (Flask)
│   └── app.py
│
└── supabase/                   # Database migrations + Edge Functions
    ├── migrations/             # PostgreSQL schema with RLS
    └── functions/              # sync-mandi-prices, sync-weather
```

### Frontend
- **React 18** with **Vite**
- **JavaScript (JSX)** — no TypeScript
- **Tailwind CSS** with a custom agricultural green + warm orange theme
- **Recharts** for price trend, comparison, and prediction charts
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **Node.js + Express.js** REST API
- **Supabase (PostgreSQL)** for data storage — the backend uses the same Supabase database as the frontend
- Routes for mandi prices, weather, and prediction orchestration
- A thin client (`mlClient.js`) that proxies requests to the Python ML service

### Database
- **Supabase (PostgreSQL)** is the database. The schema (`mandi_prices`, `weather_snapshots`, `price_predictions`, `data_sync_log`) is already migrated with RLS enabled.

### Machine Learning
- An **isolated Python Flask service** (`ml-service/app.py`) handles price forecasting.
- It exposes `POST /predict` and `GET /health` endpoints.
- The `PricePredictor` class fetches real historical data from Supabase and computes a linear regression + 7-day moving average forecast.
- When insufficient historical data exists (fewer than 10 data points), it returns a clear "insufficient data" response — it never generates fake predictions.

### External Data
- Mandi prices: pulls from **AGMARKNET / data.gov.in** APIs.
- Weather: integrates with **Open-Meteo** API (free, no API key required).
- API keys are read from environment variables — never hardcoded.

---

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+ (for the ML service)

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```
The app runs on `http://localhost:5173`.

### 2. Backend
```bash
cd backend
npm install
npm run dev
```
The API runs on `http://localhost:5000`.

### 3. ML Service
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```
The ML service runs on `http://localhost:8000`.

---

## Environment Variables

Copy `.env.example` and fill in the values. Key variables:

| Variable | Used by | Description |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL (pre-populated) |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anon key (pre-populated) |
| `VITE_API_BASE_URL` | Frontend | Backend API URL (e.g. `http://localhost:5000`) |
| `SUPABASE_URL` | Backend / ML / Edge Fn | Supabase project URL (same as VITE_ version) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend / ML / Edge Fn | Supabase service-role key (server-side only) |
| `ML_SERVICE_URL` | Backend | URL of the Python ML service |
| `DATA_GOV_API_KEY` | Backend / Edge Function | Government mandi data API key (free from data.gov.in) |
| `DATA_GOV_RESOURCE_ID` | Backend / Edge Function | data.gov.in resource ID for mandi prices (pre-set) |

Weather uses **Open-Meteo** (free, no API key needed). No weather-related environment variables are required.

---

## Language System

- **English** (default) and **Marathi** (मराठी) are fully supported.
- Translations live in `src/locales/en.js` and `src/locales/mr.js`.
- Marathi text is hand-written, not machine-translated.
- The language switcher in the navbar persists the choice in `localStorage`.

---

## Data Honesty

This project does **not** display fake or randomly generated mandi prices or ML predictions. When real data feeds are not yet connected, the UI shows clear empty/loading states explaining what will appear once data is available.

---

## Connecting the Mandi Price Data Feed

The app is wired to pull daily mandi prices from the official **Government of India Open Data platform (data.gov.in / AGMARKNET)**. Until the API key is configured, every price page shows a clear "Mandi data unavailable" message instead of fake data.

### Steps to enable live mandi prices

1. **Request a free API key** from [data.gov.in](https://data.gov.in):
   - Create an account
   - Go to "My Account" → "Generate API Key"
   - Copy the key

2. **Add the key to your environment**:
   ```
   DATA_GOV_API_KEY=your-key-here
   DATA_GOV_RESOURCE_ID=9ef84268-d588-465a-a308-a864a43d0070
   ```
   The resource ID is pre-set — it points to the "Current Daily Price of Various Commodities from Various Markets (Mandi)" dataset.

3. **Sync data** using one of two methods:

   **Option A — Edge Function (recommended):**
   The `sync-mandi-prices` Supabase Edge Function fetches Maharashtra records from data.gov.in, filters to the 11 Vidarbha districts, normalizes crop/district/market names, and upserts into the `mandi_prices` table. Trigger it via an HTTP request or a Supabase scheduled function.

   **Option B — CSV Import:**
   Download the CSV from data.gov.in, then run:
   ```bash
   node backend/data/importMandiData.js path/to/mandi_prices.csv
   ```
   Use `--dry-run` first to preview without writing.

4. **Verify**: Once data is synced, the Mandi Prices, Comparison, and Crop Analysis pages will display real prices, charts, and statistics.

### Data pipeline details

- **Normalization** (`backend/src/utils/normalize.js`): handles spelling variants for district names (e.g. "Yeotmal" → "yavatmal"), commodity aliases (e.g. "Kapas" → "cotton"), market name cleanup (strips "APMC", "Market" suffixes), date parsing (DD/MM/YYYY and ISO), and price validation.
- **Vidarbha filter**: only records from the 11 Vidarbha districts are kept — all other Maharashtra districts are discarded.
- **Deduplication**: a unique constraint on `(district_id, mandi_id, crop_id, price_date)` prevents duplicate records.
