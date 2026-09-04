import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CloudSun,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Info,
  CalendarDays,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { SectionHeader, EmptyState, StatCard } from '@/components/ui';
import { DistrictSelect } from '@/components/Selectors';
import {
  fetchCurrentWeather,
  fetchWeatherForecast,
} from '@/services/weatherService';
import { formatDate } from '@/services/mandiService';
import { getDistrict } from '@/data/vidarbha';

export function WeatherPage() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const districtId = params.get('district') ?? '';
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!districtId) {
      setCurrent(null);
      setForecast([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([fetchCurrentWeather(districtId), fetchWeatherForecast(districtId)])
      .then(([c, f]) => {
        setCurrent(c);
        setForecast(f);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [districtId]);

  const district = getDistrict(districtId);
  const chartData = forecast.map((f) => ({
    date: formatDate(f.forecastDate),
    temp: f.tempC ?? 0,
    rainfall: f.rainfallMm ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        title={t.weather.title}
        subtitle={t.weather.subtitle}
        icon={<CloudSun className="h-6 w-6" />}
      />

      <div className="card max-w-md p-5">
        <DistrictSelect
          value={districtId}
          onChange={(v) => setParams(v ? { district: v } : {})}
        />
      </div>

      <div className="mt-8">
        {loading && <p className="py-10 text-center text-field-500">{t.common.loading}</p>}
        {error && <EmptyState title={t.common.error} description={error} icon={<Info className="h-10 w-10" />} />}

        {!loading && !error && !districtId && (
          <EmptyState
            title={t.weather.notAvailable}
            description={t.weather.notAvailableDesc}
            icon={<CloudSun className="h-10 w-10" />}
          />
        )}

        {!loading && !error && districtId && !current && forecast.length === 0 && (
          <EmptyState
            title={t.weather.dataUnavailable}
            description={t.weather.dataUnavailableDesc}
            icon={<CloudSun className="h-10 w-10" />}
          />
        )}

        {!loading && !error && district && (current || forecast.length > 0) && (
          <>
            <div className="mb-6">
              <span className="chip bg-mandi-100 text-mandi-700">
                {lang === 'mr' ? district.nameMr : district.name}
              </span>
            </div>

            {current && (
              <>
                <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard label={t.weather.temp} value={current.tempC != null ? `${current.tempC}°C` : '—'} icon={<Thermometer className="h-5 w-5" />} accent />
                  <StatCard label={t.weather.humidity} value={current.humidityPct != null ? `${current.humidityPct}%` : '—'} icon={<Droplets className="h-5 w-5" />} />
                  <StatCard label={t.weather.rainfall} value={current.rainfallMm != null ? `${current.rainfallMm} mm` : '—'} icon={<CloudRain className="h-5 w-5" />} />
                  <StatCard label={t.weather.wind} value={current.windKmph != null ? `${current.windKmph} km/h` : '—'} icon={<Wind className="h-5 w-5" />} />
                </div>

                {current.description && (
                  <div className="card mb-8 flex items-center gap-4 p-6">
                    <CloudSun className="h-12 w-12 text-mandi-500" />
                    <div>
                      <p className="text-lg font-bold text-mandi-900">{current.description}</p>
                      {current.feelsLikeC != null && (
                        <p className="text-sm text-field-500">
                          {t.weather.feelsLike}: {current.feelsLikeC}°C
                        </p>
                      )}
                      <p className="mt-1 text-xs text-field-400">
                        {t.prices.dataSource}: {current.source} · {formatDate(current.forecastDate)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {forecast.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-mandi-900">
                  <CalendarDays className="h-5 w-5 text-mandi-500" />
                  {t.weather.forecast}
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9e4d6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#584d3c' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#584d3c' }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e9e4d6' }} />
                      <Line type="monotone" dataKey="temp" stroke="#e68d2c" strokeWidth={2.5} name={t.weather.temp} />
                      <Line type="monotone" dataKey="rainfall" stroke="#4f8a31" strokeWidth={2.5} name={t.weather.rainfall} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
