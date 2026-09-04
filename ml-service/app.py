"""
Vidarbha Mandi AI — ML Price Prediction Service

This is an ISOLATED Python service that forecasts mandi crop prices
and returns a selling recommendation (sell_today / wait / price_may_decrease).

It fetches historical price data from Supabase, computes a linear regression
trend + 7-day moving average, and projects forward. When insufficient
historical data exists, it returns a clear "not available" response.

Prediction approach:
  1. Fetch up to 90 days of historical modal prices from Supabase
  2. Require at least 10 data points to produce a prediction
  3. Fit a simple linear regression (least squares) on the price series
  4. Compute the 7-day moving average for smoothing
  5. Project the trend forward for the next 7 days
  6. Derive trend direction and recommendation from the slope

Predictions are clearly labelled as estimates.
"""

import os
import math
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    import requests
except ImportError:
    requests = None

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or ""
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
ML_PORT = int(os.getenv("ML_PORT", "8000"))
MIN_DATA_POINTS = 10
FORECAST_DAYS = 7


def fetch_historical_prices(district, mandi, crop, days=90):
    """Fetch historical modal prices from Supabase mandi_prices table."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []

    if requests is None:
        return []

    since = (datetime.date.today() - datetime.timedelta(days=days)).isoformat()

    url = (
        f"{SUPABASE_URL}/rest/v1/mandi_prices"
        f"?select=price_date,modal_price"
        f"&district_id=eq.{district}"
        f"&mandi_id=eq.{mandi}"
        f"&crop_id=eq.{crop}"
        f"&price_date=gte.{since}"
        f"&order=price_date.asc"
        f"&limit=500"
    )

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Profile": "public",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return []
        return resp.json()
    except Exception:
        return []


def linear_regression(y_values):
    """Simple least-squares linear regression. Returns (slope, intercept)."""
    n = len(y_values)
    if n < 2:
        return 0.0, y_values[0] if y_values else 0.0
    x_mean = (n - 1) / 2.0
    y_mean = sum(y_values) / n
    numerator = 0.0
    denominator = 0.0
    for i in range(n):
        numerator += (i - x_mean) * (y_values[i] - y_mean)
        denominator += (i - x_mean) ** 2
    if denominator == 0:
        return 0.0, y_mean
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    return slope, intercept


def moving_average(y_values, window=7):
    """Compute the moving average of a series."""
    if len(y_values) < window:
        return sum(y_values) / len(y_values) if y_values else 0.0
    return sum(y_values[-window:]) / window


def compute_r2(y_values, slope, intercept):
    """Compute R² coefficient of determination."""
    n = len(y_values)
    if n < 2:
        return 0.0
    y_mean = sum(y_values) / n
    ss_tot = sum((y - y_mean) ** 2 for y in y_values)
    ss_res = sum((y_values[i] - (slope * i + intercept)) ** 2 for i in range(n))
    if ss_tot == 0:
        return 0.0
    return max(0.0, 1.0 - ss_res / ss_tot)


class PricePredictor:
    def __init__(self):
        self.model_name = "linear_regression_moving_average"
        self.model_version = "1.0.0"

    def predict(self, district, mandi, crop, horizon_days=FORECAST_DAYS):
        # Fetch historical data
        history = fetch_historical_prices(district, mandi, crop, days=90)

        if not history or len(history) < MIN_DATA_POINTS:
            return {
                "available": False,
                "message": (
                    f"Insufficient historical data for prediction. "
                    f"Found {len(history) if history else 0} records, "
                    f"need at least {MIN_DATA_POINTS}. "
                    f"Sync mandi price data to enable predictions."
                ),
                "data_points_found": len(history) if history else 0,
                "min_data_points": MIN_DATA_POINTS,
            }

        # Extract modal prices (filter out nulls)
        prices = []
        dates = []
        for row in history:
            price = row.get("modal_price")
            date_str = row.get("price_date")
            if price is not None and date_str:
                try:
                    prices.append(float(price))
                    dates.append(date_str)
                except (ValueError, TypeError):
                    continue

        if len(prices) < MIN_DATA_POINTS:
            return {
                "available": False,
                "message": (
                    f"Insufficient valid price records for prediction. "
                    f"Found {len(prices)} valid records, need at least {MIN_DATA_POINTS}."
                ),
                "data_points_found": len(prices),
                "min_data_points": MIN_DATA_POINTS,
            }

        # Fit linear regression
        slope, intercept = linear_regression(prices)
        r2 = compute_r2(prices, slope, intercept)

        # Compute moving average for current reference
        ma7 = moving_average(prices, window=7)
        current_price = prices[-1]

        # Generate predictions for next N days
        predictions = []
        n = len(prices)
        today = datetime.date.today()

        for d in range(1, horizon_days + 1):
            x = n + d - 1
            predicted = slope * x + intercept
            # Blend regression with moving average for stability
            blended = 0.6 * predicted + 0.4 * ma7
            # Ensure non-negative
            blended = max(0.0, blended)
            target_date = (today + datetime.timedelta(days=d)).isoformat()
            predictions.append({
                "target_date": target_date,
                "predicted_price": round(blended, 2),
            })

        # Determine trend
        if slope > 0.5:
            trend = "up"
        elif slope < -0.5:
            trend = "down"
        else:
            trend = "stable"

        # Recommendation
        avg_predicted = sum(p["predicted_price"] for p in predictions) / len(predictions)
        if current_price < avg_predicted * 0.95:
            recommendation = "wait"
        elif current_price > avg_predicted * 1.05:
            recommendation = "sell_today"
        else:
            recommendation = "stable"

        # Confidence: based on R² and data volume
        data_factor = min(1.0, len(prices) / 30.0)
        confidence = round(r2 * data_factor * 100, 1)

        return {
            "available": True,
            "predictions": predictions,
            "trend": trend,
            "recommendation": recommendation,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "confidence_pct": confidence,
            "r_squared": round(r2, 4),
            "data_points_used": len(prices),
            "current_price": round(current_price, 2),
            "average_predicted": round(avg_predicted, 2),
            "disclaimer": "This is a statistical estimate based on historical prices, not financial advice.",
        }


predictor = PricePredictor()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "vidarbha-mandi-ai-ml",
        "model_ready": True,
        "model_name": predictor.model_name,
        "model_version": predictor.model_version,
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    district = data.get("district")
    mandi = data.get("mandi")
    crop = data.get("crop")

    if not all([district, mandi, crop]):
        return jsonify({"error": "district, mandi, and crop are required"}), 400

    result = predictor.predict(district, mandi, crop)
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=ML_PORT, debug=False)
