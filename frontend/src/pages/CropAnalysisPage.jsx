import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart as LineChartIcon, TrendingUp, TrendingDown, Activity, Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { SearchPanel } from '@/components/SearchPanel';
import { SectionHeader, EmptyState, StatCard } from '@/components/ui';
import {
  fetchPriceHistory,
  formatPrice,
  formatDate,
} from '@/services/mandiService';
import { getCrop, getMandi, getDistrict } from '@/data/vidarbha';

export function CropAnalysisPage() {
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const districtId = params.get('district') ?? '';
  const cropId = params.get('crop') ?? '';
  const mandiId = params.get('mandi') ?? '';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasQuery = Boolean(districtId && mandiId && cropId);

  useEffect(() => {
    if (!hasQuery) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchPriceHistory(districtId, mandiId, cropId, 30)
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [districtId, mandiId, cropId, hasQuery]);

  const stats = useMemo(() => {
    if (records.length === 0) return null;
    const prices = records
      .map((r) => r.modalPrice)
      .filter((p) => p != null);
    if (prices.length === 0) return null;
    const current = prices[prices.length - 1];
    const first = prices[0];
    const change = first !== 0 ? ((current - first) / first) * 100 : 0;
    return {
      current,
      change,
      highest: Math.max(...prices),
      lowest: Math.min(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }, [records]);

  const chartData = records.map((r) => ({
    date: formatDate(r.priceDate),
    price: r.modalPrice ?? 0,
  }));

  const last7 = chartData.slice(-7);
  const crop = getCrop(cropId);
  const mandi = getMandi(mandiId);
  const district = getDistrict(districtId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        title={t.analysis.title}
        subtitle={t.analysis.subtitle}
        icon={<LineChartIcon className="h-6 w-6" />}
      />

      <SearchPanel
        defaultDistrict={districtId}
        defaultCrop={cropId}
        defaultMandi={mandiId}
        submitTo="/crop-analysis"
      />

      <div className="mt-8">
        {loading && <p className="py-10 text-center text-field-500">{t.common.loading}</p>}
        {error && <EmptyState title={t.common.error} description={error} icon={<Info className="h-10 w-10" />} />}

        {!loading && !error && !hasQuery && (
          <EmptyState
            title={t.analysis.noHistory}
            description={t.analysis.noHistoryDesc}
            icon={<LineChartIcon className="h-10 w-10" />}
          />
        )}

        {!loading && !error && hasQuery && records.length === 0 && (
          <EmptyState
            title={t.analysis.dataUnavailable}
            description={t.analysis.dataUnavailableDesc}
            icon={<LineChartIcon className="h-10 w-10" />}
          />
        )}

        {!loading && !error && hasQuery && records.length > 0 && records.length < 3 && (
          <EmptyState
            title={t.analysis.insufficientData}
            description={t.analysis.insufficientDataDesc}
            icon={<LineChartIcon className="h-10 w-10" />}
          />
        )}

        {!loading && !error && records.length > 0 && stats && crop && mandi && district && (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="chip bg-mandi-100 text-mandi-700">
                {lang === 'mr' ? district.nameMr : district.name}
              </span>
              <span className="chip bg-mandi-100 text-mandi-700">
                {lang === 'mr' ? crop.nameMr : crop.name}
              </span>
              <span className="chip bg-mandi-100 text-mandi-700">
                {lang === 'mr' ? mandi.nameMr : mandi.name}
              </span>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatCard label={t.analysis.currentPrice} value={formatPrice(stats.current)} icon={<Activity className="h-5 w-5" />} accent />
              <StatCard
                label={t.analysis.priceChange}
                value={`${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)}%`}
                icon={stats.change >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              />
              <StatCard label={t.analysis.highest} value={formatPrice(stats.highest)} icon={<TrendingUp className="h-5 w-5" />} />
              <StatCard label={t.analysis.lowest} value={formatPrice(stats.lowest)} icon={<TrendingDown className="h-5 w-5" />} />
              <StatCard label={t.analysis.average} value={formatPrice(stats.average)} icon={<Activity className="h-5 w-5" />} />
              <StatCard label={t.prices.unit} value={t.prices.unit} icon={<LineChartIcon className="h-5 w-5" />} />
            </div>

            <div className="card mb-6 p-6">
              <h3 className="mb-4 text-lg font-bold text-mandi-900">{t.analysis.sevenDay}</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9e4d6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#584d3c' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#584d3c' }} />
                    <Tooltip formatter={(v) => [formatPrice(typeof v === 'number' ? v : Number(v)), t.prices.table.modal]} contentStyle={{ borderRadius: 12, border: '1px solid #e9e4d6' }} />
                    <Line type="monotone" dataKey="price" stroke="#4f8a31" strokeWidth={2.5} dot={{ r: 3, fill: '#4f8a31' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="mb-4 text-lg font-bold text-mandi-900">{t.analysis.thirtyDay}</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9e4d6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#584d3c' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#584d3c' }} />
                    <Tooltip formatter={(v) => [formatPrice(typeof v === 'number' ? v : Number(v)), t.prices.table.modal]} contentStyle={{ borderRadius: 12, border: '1px solid #e9e4d6' }} />
                    <ReferenceLine y={stats.average} stroke="#e68d2c" strokeDasharray="4 4" label={{ value: t.analysis.average, fontSize: 10, fill: '#9c3f14' }} />
                    <Line type="monotone" dataKey="price" stroke="#2d561e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
