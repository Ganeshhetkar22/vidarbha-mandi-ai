const DISTRICTS = {
  nagpur: { latitude: 21.1458, longitude: 79.0882 },
  wardha: { latitude: 20.7453, longitude: 78.6022 },
  bhandara: { latitude: 21.1702, longitude: 79.6488 },
  gondia: { latitude: 21.4549, longitude: 80.1961 },
  chandrapur: { latitude: 19.9615, longitude: 79.2961 },
  gadchiroli: { latitude: 20.1849, longitude: 80.0037 },
  amravati: { latitude: 20.9374, longitude: 77.7796 },
  akola: { latitude: 20.7002, longitude: 77.0082 },
  buldhana: { latitude: 20.5293, longitude: 76.1842 },
  washim: { latitude: 20.1118, longitude: 77.1335 },
  yavatmal: { latitude: 20.3888, longitude: 78.1204 },
};

const getLocation = (districtId) => {
  return DISTRICTS[districtId?.toLowerCase()] || DISTRICTS.nagpur;
};

const getDescription = (code) => {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Moderate showers',
    82: 'Heavy showers',
    95: 'Thunderstorm',
  };

  return weatherCodes[code] || 'Unknown';
};

export async function fetchCurrentWeather(districtId) {
  const location = getLocation(districtId);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
    `rain,weather_code,wind_speed_10m`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to fetch live weather');
  }

  const data = await response.json();
  const current = data.current;

  return {
    id: `live-${districtId}`,
    districtId,
    tempC: current.temperature_2m,
    feelsLikeC: current.apparent_temperature,
    humidityPct: current.relative_humidity_2m,
    rainfallMm: current.rain,
    windKmph: current.wind_speed_10m,
    description: getDescription(current.weather_code),
    forecastDate: current.time?.slice(0, 10),
    isForecast: false,
    source: 'Open-Meteo Live',
    fetchedAt: current.time,
  };
}

export async function fetchWeatherForecast(districtId) {
  const location = getLocation(districtId);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
    `precipitation_sum,wind_speed_10m_max` +
    `&timezone=Asia%2FKolkata`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to fetch weather forecast');
  }

  const data = await response.json();
  const daily = data.daily;

  return daily.time.slice(0, 5).map((date, index) => ({
    id: `forecast-${districtId}-${date}`,
    districtId,
    tempC: daily.temperature_2m_max[index],
    feelsLikeC: daily.temperature_2m_min[index],
    humidityPct: null,
    rainfallMm: daily.precipitation_sum[index],
    windKmph: daily.wind_speed_10m_max[index],
    description: getDescription(daily.weather_code[index]),
    forecastDate: date,
    isForecast: true,
    source: 'Open-Meteo Forecast',
    fetchedAt: new Date().toISOString(),
  }));
}