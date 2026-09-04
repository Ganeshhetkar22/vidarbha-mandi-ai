/**
 * Thin client for the isolated Python ML prediction service.
 * The ML service exposes a POST /predict endpoint that accepts
 * { district, mandi, crop } and returns forecasted prices + recommendation.
 *
 * If the ML service URL is not configured or unreachable, we return
 * a clear "not available" response instead of fake predictions.
 */
const ML_SERVICE_URL = process.env.ML_SERVICE_URL
  ? process.env.ML_SERVICE_URL.replace(/\/$/, '')
  : '';

const TIMEOUT_MS = 15000;

export async function fetchPredictionFromML({ district, mandi, crop }) {
  if (!ML_SERVICE_URL) {
    return { available: false, message: 'ML service URL not configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district, mandi, crop }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      return { available: false, message: 'ML service timed out' };
    }
    return {
      available: false,
      message: `ML service unreachable: ${err.message}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}
