import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Logo } from './Logo';
import { useLanguage } from '@/hooks/useLanguage';

export function Footer() {
  const { t } = useLanguage();
  const links = [
    { to: '/', label: t.nav.home },
    { to: '/mandi-prices', label: t.nav.mandiPrices },
    { to: '/compare-mandis', label: t.nav.compareMandis },
    { to: '/crop-analysis', label: t.nav.cropAnalysis },
    { to: '/price-prediction', label: t.nav.pricePrediction },
    { to: '/weather', label: t.nav.weather },
    { to: '/about', label: t.nav.about },
  ];

  return (
    <footer className="mt-16 border-t border-field-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-field-600">{t.brand.tagline}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-mandi-700">
            {t.footer.quickLinks}
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-field-600 hover:text-mandi-700">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-mandi-700">
            {t.footer.contact}
          </h3>
          <p className="mt-3 text-sm text-field-600">{t.footer.project}</p>
          <p className="mt-1 text-sm text-field-600">{t.common.regionValue}</p>
        </div>
      </div>

      <div className="border-t border-field-200 bg-field-50">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-3 text-xs text-field-500 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-mandi-500" />
              © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
            </p>
            <p className="max-w-xl sm:text-right">{t.footer.disclaimerText}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
