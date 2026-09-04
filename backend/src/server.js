import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mandiRoutes from './routes/mandiRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { isSupabaseConfigured } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the Vite dev server origin and any deployed origin
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : true; // true = allow all origins (fine for dev)
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/prediction', predictionRoutes);

app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Vidarbha Mandi AI backend running on port ${PORT}`);
  if (!isSupabaseConfigured()) {
    console.warn('[warn] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — database operations will fail');
  }
});
