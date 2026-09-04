import {
  Info,
  Target,
  Map,
  Layers,
  Cpu,
  Cloud,
  Globe2,
  ArrowRightCircle,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SectionHeader } from '@/components/ui';
import { DISTRICTS } from '@/data/vidarbha';

export function AboutPage() {
  const { t } = useLanguage();

  const techStack = [
    { icon: Cpu, label: t.about.frontend, value: 'React · Vite · JavaScript · Tailwind CSS · Recharts · Lucide' },
    { icon: Layers, label: t.about.backend, value: 'Node.js · Express.js · REST APIs (backend/ structure provided)' },
    { icon: Globe2, label: t.about.database, value: 'Supabase (PostgreSQL) — live schema for prices, weather, predictions' },
    { icon: Cpu, label: t.about.ml, value: 'Isolated Python prediction service (ml-service/ structure provided)' },
    { icon: Cloud, label: t.about.externalData, value: 'AGMARKNET / data.gov.in (mandi), configurable Weather API' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader title={t.about.title} subtitle={t.about.subtitle} icon={<Info className="h-6 w-6" />} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-mandi-900">{t.about.overview}</h2>
          <p className="mt-3 text-field-700">{t.about.overviewText}</p>
        </div>

        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-mandi-900">
            <Map className="h-5 w-5 text-mandi-500" />
            {t.about.scopeTitle}
          </h2>
          <p className="mt-3 text-sm text-field-700">{t.about.scopeText}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {DISTRICTS.map((d) => (
              <span key={d.id} className="chip bg-mandi-50 text-mandi-700">
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-mandi-900">
          <Target className="h-5 w-5 text-harvest-500" />
          {t.about.objectivesTitle}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {t.about.objectives.map((o, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-field-700">
              <ArrowRightCircle className="mt-0.5 h-4 w-4 shrink-0 text-mandi-500" />
              {o}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-xl font-bold text-mandi-900">{t.about.techStackTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((s) => (
            <div key={s.label} className="rounded-xl border border-field-200 bg-field-50 p-4">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-mandi-700">
                <s.icon className="h-4 w-4 text-mandi-500" />
                {s.label}
              </span>
              <p className="mt-1.5 text-xs text-field-600">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-xl font-bold text-mandi-900">{t.about.modulesTitle}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {t.about.modules.map((m, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-field-700">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mandi-100 text-[10px] font-bold text-mandi-700">
                {i + 1}
              </span>
              {m}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 card border-mandi-200 bg-mandi-50 p-6">
        <h2 className="text-xl font-bold text-mandi-900">{t.about.futureTitle}</h2>
        <p className="mt-3 text-field-700">{t.about.futureText}</p>
      </div>
    </div>
  );
}
