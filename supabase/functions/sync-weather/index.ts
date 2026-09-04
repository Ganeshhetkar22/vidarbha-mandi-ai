import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Vidarbha district coordinates (lat, lon) for weather queries
const DISTRICT_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  nagpur:     { lat: 21.1458, lon: 79.0882,  name: "Nagpur" },
  wardha:     { lat: 20.7453, lon: 78.6022,  name: "Wardha" },
  bhandara:   { lat: 21.4700, lon: 79.6400,  name: "Bhandara" },
  gondia:     { lat: 21.4600, lon: 80.2000,  name: "Gondia" },
  chandrapur: { lat: 19.9500, lon: 79.3000,  name: "Chandrapur" },
  gadchiroli: { lat: 20.1800, lon: 80.0000,  name: "Gadchiroli" },
  amravati:   { lat: 20.9300, lon: 77.7500,  name: "Amravati" },
  akola:      { lat: 20.7000, lon: 77.0000,  name: "Akola" },
  buldhana:   { lat: 20.5300, lon: 76.1800,  name: "Buldhana" },
  washim:     { lat: 20.1100, lon: 77.1300,  name: "Washim" },
  yavatmal:   { lat: 20.4100, lon: 78.1300,  name: "Yavatmal" },
};

// WMO Weather Code → human-readable description
function wmoDescription(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return map[code] ?? "Unknown";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Optional: ?district=nagpur to sync only one district
    const url = new URL(req.url);
    const singleDistrict = url.searchParams.get("district");

    const districtsToSync = singleDistrict
      ? [singleDistrict].filter((d) => DISTRICT_COORDS[d])
      : Object.keys(DISTRICT_COORDS);

    if (districtsToSync.length === 0) {
      return new Response(JSON.stringify({
        available: true,
        message: "No valid Vidarbha district specified",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stats = {
      districtsProcessed: 0,
      currentRecords: 0,
      forecastRecords: 0,
      errors: [] as string[],
    };

    const today = new Date().toISOString().slice(0, 10);

    for (const districtId of districtsToSync) {
      const coords = DISTRICT_COORDS[districtId];

      try {
        // Open-Meteo: current weather + 5-day forecast (free, no API key)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_max` +
          `&forecast_days=6&timezone=auto`;

        const resp = await fetch(weatherUrl);
        if (!resp.ok) {
          stats.errors.push(`${districtId}: Open-Meteo returned ${resp.status}`);
          continue;
        }

        const data = await resp.json();
        const current = data.current;
        const daily = data.daily;

        // Current weather record
        const currentRecord = {
          district_id: districtId,
          temp_c: current?.temperature_2m ?? null,
          feels_like_c: current?.apparent_temperature ?? null,
          humidity_pct: current?.relative_humidity_2m ?? null,
          rainfall_mm: current?.precipitation ?? 0,
          wind_kmph: current?.wind_speed_10m ? Math.round(current.wind_speed_10m) : null,
          description: wmoDescription(current?.weather_code ?? 0),
          forecast_date: today,
          is_forecast: false,
          source: "Open-Meteo",
        };

        // Delete old current weather for this district, then insert
        await fetch(`${supabaseUrl}/rest/v1/weather_snapshots?district_id=eq.${districtId}&is_forecast=eq.false`, {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Profile": "public",
          },
        });

        await fetch(`${supabaseUrl}/rest/v1/weather_snapshots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Profile": "public",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(currentRecord),
        });

        stats.currentRecords++;

        // Forecast records (skip today, take next 5 days)
        const forecastRecords: Record<string, unknown>[] = [];
        const dailyDates: string[] = daily?.time ?? [];
        for (let i = 0; i < dailyDates.length; i++) {
          const dateStr = dailyDates[i];
          if (dateStr === today) continue;
          forecastRecords.push({
            district_id: districtId,
            temp_c: daily?.temperature_2m_max?.[i] ?? null,
            feels_like_c: null,
            humidity_pct: daily?.relative_humidity_2m_max?.[i] ?? null,
            rainfall_mm: daily?.precipitation_sum?.[i] ?? 0,
            wind_kmph: daily?.wind_speed_10m_max?.[i] ? Math.round(daily.wind_speed_10m_max[i]) : null,
            description: wmoDescription(daily?.weather_code?.[i] ?? 0),
            forecast_date: dateStr,
            is_forecast: true,
            source: "Open-Meteo",
          });
          if (forecastRecords.length >= 5) break;
        }

        if (forecastRecords.length > 0) {
          // Delete old forecast rows for this district, then insert
          await fetch(`${supabaseUrl}/rest/v1/weather_snapshots?district_id=eq.${districtId}&is_forecast=eq.true`, {
            method: "DELETE",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Profile": "public",
            },
          });

          await fetch(`${supabaseUrl}/rest/v1/weather_snapshots`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Profile": "public",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(forecastRecords),
          });

          stats.forecastRecords += forecastRecords.length;
        }

        stats.districtsProcessed++;
      } catch (err) {
        stats.errors.push(`${districtId}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }

    return new Response(JSON.stringify({
      available: true,
      stats,
      message: `Weather sync complete: ${stats.districtsProcessed} districts, ${stats.currentRecords} current, ${stats.forecastRecords} forecast records`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      available: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
