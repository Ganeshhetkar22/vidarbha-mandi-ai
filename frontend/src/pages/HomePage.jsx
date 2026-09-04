import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Store,
  LineChart,
  Brain,
  CloudSun,
  BadgeCheck,
  ArrowRight,
  MapPin,
  Database,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SearchPanel } from '@/components/SearchPanel';
import { StatCard } from '@/components/ui';
import { DISTRICTS, MANDIS, CROPS } from '@/data/vidarbha';
import { fetchLatestPriceDate, formatDate } from '@/services/mandiService';
import { useEffect, useState } from 'react';

export function HomePage() {
  const { t } = useLanguage();
  const [latestDate, setLatestDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLatestPriceDate()
      .then((d) => {
        if (active) setLatestDate(d);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const features = [
    { icon: Store, title: t.features.livePrices, desc: t.features.livePricesDesc, to: '/mandi-prices' },
    { icon: TrendingUp, title: t.features.compareMandis, desc: t.features.compareMandisDesc, to: '/compare-mandis' },
    { icon: LineChart, title: t.features.historicalTrends, desc: t.features.historicalTrendsDesc, to: '/crop-analysis' },
    { icon: Brain, title: t.features.aiPrediction, desc: t.features.aiPredictionDesc, to: '/price-prediction' },
    { icon: CloudSun, title: t.features.weatherInsights, desc: t.features.weatherInsightsDesc, to: '/weather' },
    { icon: BadgeCheck, title: t.features.sellRecommendation, desc: t.features.sellRecommendationDesc, to: '/price-prediction' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-field-200 bg-gradient-to-b from-mandi-50 via-field-50 to-field-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip bg-mandi-100 text-mandi-700">
              <MapPin className="h-3.5 w-3.5" />
              {t.hero.badge}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-mandi-950 sm:text-5xl lg:text-6xl">
              {t.hero.headline1}
              <br />
              <span className="text-harvest-600">{t.hero.headline2}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-field-700 sm:text-lg">
              {t.hero.subtext}
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <SearchPanel submitTo="/mandi-prices" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={t.stats.districts}
            value={DISTRICTS.length}
            icon={<MapPin className="h-5 w-5" />}
          />
          <StatCard
            label={t.stats.markets}
            value={MANDIS.length}
            icon={<Store className="h-5 w-5" />}
            accent
          />
          <StatCard
            label={t.stats.crops}
            value={CROPS.length}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            label={t.stats.latestData}
            value={
              loading ? t.stats.loading : latestDate ? formatDate(latestDate) : t.stats.unavailable
            }
            icon={<Database className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="section-title">{t.features.title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-field-600">{t.features.subtitle}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link key={f.title} to={f.to} className="card card-hover group p-6">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-mandi-50 text-mandi-600 transition-colors group-hover:bg-mandi-600 group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-mandi-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-field-600">{f.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-harvest-600">
                {t.nav[f.to === '/mandi-prices' ? 'mandiPrices' : f.to === '/compare-mandis' ? 'compareMandis' : f.to === '/crop-analysis' ? 'cropAnalysis' : f.to === '/price-prediction' ? 'pricePrediction' : 'weather']}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
