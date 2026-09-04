import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  BadgeCheck,
  Clock,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { SearchPanel } from '@/components/SearchPanel';
import { SectionHeader, EmptyState, StatCard } from '@/components/ui';
import { fetchPredictions, triggerPrediction } from '@/services/predictionService';
import { isApiConfigured } from '@/services/apiConfig';
import { formatPrice, formatDate } from '@/services/mandiService';
import { getCrop, getMandi, getDistrict } from '@/data/vidarbha';

export function PricePredictionPage() {
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const districtId = params.get('district') ?? '';
  const cropId = params.get('crop') ?? '';
  const mandiId = params.get('mandi') ?? '';

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState(null);
  const hasQuery = Boolean(districtId && mandiId && cropId);

  useEffect(() => {
    if (!hasQuery) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchPredictions(districtId, mandiId, cropId)
      .then(setPredictions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [districtId, mandiId, cropId, hasQuery]);

  const chartData = predictions.map((p) => ({
    date: formatDate(p.targetDate),
    price: p.predictedPrice,
  }));

  const summary = useMemo(() => {
    if (predictions.length === 0) return null;
    const last = predictions[predictions.length - 1];
    const first = predictions[0];
    return {
      predicted: last.predictedPrice,
      confidence: last.confidencePct,
      trend: last.trend,
      recommendation: last.recommendation,
      horizon: predictions.length,
      firstDate: first.targetDate,
      lastDate: last.targetDate,
    };
  }, [predictions]);

  const crop = getCrop(cropId);
  const mandi = getMandi(mandiId);
  const district = getDistrict(districtId);

  const recConfig = (rec) => {
    if (rec === 'sell_today')
      return { icon: BadgeCheck, color: 'bg-mandi-600', text: t.prediction.sellToday, desc: t.prediction.sellTodayDesc };
    if (rec === 'wait')
      return { icon: Clock, color: 'bg-harvest-500', text: t.prediction.waitForBetter, desc: t.prediction.waitForBetterDesc };
    return { icon: TrendingDown, color: 'bg-red-500', text: t.prediction.priceMayDecrease, desc: t.prediction.priceMayDecreaseDesc };
  };

  const trendConfig = (tr) => {
    if (tr === 'up') return { icon: TrendingUp, text: t.prediction.trendUp, color: 'text-mandi-600' };
    if (tr === 'down') return { icon: TrendingDown, text: t.prediction.trendDown, color: 'text-harvest-600' };
    return { icon: Minus, text: t.prediction.trendStable, color: 'text-field-500' };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        title={t.prediction.title}
        subtitle={t.prediction.subtitle}
        icon={<Brain className="h-6 w-6" />}
      />

      <SearchPanel
        defaultDistrict={districtId}
        defaultCrop={cropId}
        defaultMandi={mandiId}
        submitTo="/price-prediction"
      />

      <div className="mt-8">
        {loading && <p className="py-10 text-center text-field-500">{t.common.loading}</p>}
        {error && <EmptyState title={t.common.error} description={error} icon={<Info className="h-10 w-10" />} />}

        {!loading && !error && !hasQuery && (
          <EmptyState
            title={t.prediction.notAvailable}
            description={t.prediction.notAvailableDesc}
            icon={<Brain className="h-10 w-10" />}
          />
        )}

        {!loading && !error && hasQuery && predictions.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-10">
            <EmptyState
              title={t.prediction.dataUnavailable}
              description={t.prediction.dataUnavailableDesc}
              icon={<Brain className="h-10 w-10" />}
            />
            {isApiConfigured ? (
              <button
                onClick={async () => {
                  setTriggering(true);
                  setTriggerMsg(null);
                  const result = await triggerPrediction(districtId, mandiId, cropId);
                  if (result.available) {
                    fetchPredictions(districtId, mandiId, cropId)
                      .then(setPredictions)
                      .catch(() => {});
                  } else {
                    setTriggerMsg(result.message ?? t.prediction.dataUnavailableDesc);
                  }
                  setTriggering(false);
                }}
                disabled={triggering}
                className="btn-primary"
              >
                {triggering ? t.common.loading : t.prediction.generate}
              </button>
            ) : (
              <p className="text-sm text-field-500">{t.prediction.backendRequired}</p>
            )}
            {triggerMsg && (
              <p className="max-w-lg text-center text-sm text-field-600">{triggerMsg}</p>
            )}
          </div>
        )}

        {!loading && !error && predictions.length > 0 && summary && crop && mandi && district && (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="chip bg-mandi-100 text-mandi-700">{lang === 'mr' ? district.nameMr : district.name}</span>
              <span className="chip bg-mandi-100 text-mandi-700">{lang === 'mr' ? crop.nameMr : crop.name}</span>
              <span className="chip bg-mandi-100 text-mandi-700">{lang === 'mr' ? mandi.nameMr : mandi.name}</span>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label={t.prediction.predictedPrice} value={formatPrice(summary.predicted)} icon={<Brain className="h-5 w-5" />} accent />
              <StatCard
                label={t.prediction.confidence}
                value={summary.confidence != null ? `${summary.confidence}%` : '—'}
                icon={<BadgeCheck className="h-5 w-5" />}
              />
              <div className="card p-5">
                <span className="text-sm font-semibold text-field-500">{t.prediction.trend}</span>
                <p className={`mt-2 inline-flex items-center gap-1.5 text-xl font-bold ${trendConfig(summary.trend).color}`}>
                  {(() => {
                    const Tc = trendConfig(summary.trend);
                    return <Tc.icon className="h-5 w-5" />;
                  })()}
                  {trendConfig(summary.trend).text}
                </p>
              </div>
              <StatCard label={t.prediction.next30Days} value={summary.horizon} icon={<Clock className="h-5 w-5" />} />
            </div>

            {summary.recommendation && (
              <div className={`card mb-8 p-6 text-white ${recConfig(summary.recommendation).color}`}>
                <div className="flex items-start gap-4">
                  {(() => {
                    const Rc = recConfig(summary.recommendation);
                    return <Rc.icon className="mt-1 h-8 w-8 shrink-0" />;
                  })()}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      {t.prediction.recommendation}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{recConfig(summary.recommendation).text}</p>
                    <p className="mt-2 max-w-2xl text-sm text-white/90">
                      {recConfig(summary.recommendation).desc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="mb-4 text-lg font-bold text-mandi-900">{t.prediction.next30Days}</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f8a31" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f8a31" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9e4d6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#584d3c' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#584d3c' }} />
                    <Tooltip formatter={(v) => [formatPrice(typeof v === 'number' ? v : Number(v)), t.prediction.predictedPrice]} contentStyle={{ borderRadius: 12, border: '1px solid #e9e4d6' }} />
                    <Area type="monotone" dataKey="price" stroke="#4f8a31" strokeWidth={2.5} fill="url(#predGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-field-200 bg-field-50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-harvest-600" />
              <p className="text-sm text-field-700">{t.prediction.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
