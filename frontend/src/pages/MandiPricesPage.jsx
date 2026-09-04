import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Store,
  TrendingDown,
  TrendingUp,
  Coins,
  Clock,
  Database,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SearchPanel } from '@/components/SearchPanel';
import { SectionHeader, EmptyState } from '@/components/ui';
import {
  fetchMandiPrices,
  formatPrice,
  formatDate,
} from '@/services/mandiService';

export function MandiPricesPage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const districtId = params.get('district') ?? '';
  const cropId = params.get('crop') ?? '';
  const mandiId = params.get('mandi') ?? '';
  const [date, setDate] = useState(() => params.get('date') ?? '');

  const [records, setRecords] = useState([]);
  const [dateNotice, setDateNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasQuery = Boolean(districtId && cropId && mandiId);

  useEffect(() => {
    if (!hasQuery) {
      setRecords([]);
      setDateNotice(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchMandiPrices({
      districtId: districtId || undefined,
      cropId: cropId || undefined,
      mandiId: mandiId || undefined,
      date: date || undefined,
      limit: 200,
    })
      .then(({ records: nextRecords, usedDate, usedFallback, requestedDate }) => {
        setRecords(nextRecords);
        setDateNotice(usedFallback ? { requestedDate, usedDate } : null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [districtId, cropId, mandiId, date, hasQuery]);

  const latest = records[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader title={t.prices.title} subtitle={t.prices.subtitle} icon={<Store className="h-6 w-6" />} />

      <SearchPanel
        defaultDistrict={districtId}
        defaultCrop={cropId}
        defaultMandi={mandiId}
        showDate
        date={date}
        onDateChange={setDate}
      />

      <div className="mt-8">
        {loading && <p className="py-10 text-center text-field-500">{t.prices.fetching}</p>}

        {error && (
          <EmptyState title={t.common.error} description={error} icon={<Info className="h-10 w-10" />} />
        )}

        {!loading && !error && !hasQuery && (
          <EmptyState
            title={t.prices.noData}
            description={t.prices.noDataDesc}
            icon={<Store className="h-10 w-10" />}
          />
        )}

        {!loading && !error && hasQuery && records.length === 0 && (
          <EmptyState
            title={t.prices.dataUnavailable}
            description={t.prices.dataUnavailableDesc}
            icon={<Database className="h-10 w-10" />}
          />
        )}

        {!loading && !error && records.length > 0 && latest && (
          <>
            {dateNotice && (
              <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Data for the selected date is unavailable. Showing the latest available data from {formatDate(dateNotice.usedDate)}.
              </p>
            )}
            <h2 className="mb-4 text-xl font-bold text-mandi-900">{t.prices.summary}</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <SummaryCard label={t.prices.minPrice} value={formatPrice(latest.minPrice)} icon={<TrendingDown className="h-5 w-5" />} />
              <SummaryCard label={t.prices.maxPrice} value={formatPrice(latest.maxPrice)} icon={<TrendingUp className="h-5 w-5" />} accent />
              <SummaryCard label={t.prices.modalPrice} value={formatPrice(latest.modalPrice)} icon={<Coins className="h-5 w-5" />} />
              <SummaryCard label={t.prices.lastUpdated} value={formatDate(latest.priceDate)} icon={<Clock className="h-5 w-5" />} />
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="card min-w-full divide-y divide-field-200 text-sm">
                <thead className="bg-field-50">
                  <tr>
                    <Th>{t.prices.table.market}</Th>
                    <Th>{t.prices.table.commodity}</Th>
                    <Th>{t.prices.table.variety}</Th>
                    <Th>{t.prices.table.min}</Th>
                    <Th>{t.prices.table.max}</Th>
                    <Th>{t.prices.table.modal}</Th>
                    <Th>{t.prices.table.date}</Th>
                    <Th>{t.prices.table.source}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-field-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-field-50">
                      <Td className="font-semibold text-mandi-800">{r.mandiName}</Td>
                      <Td>{r.cropName}</Td>
                      <Td className="text-field-500">{r.variety ?? '—'}</Td>
                      <Td>{formatPrice(r.minPrice)}</Td>
                      <Td>{formatPrice(r.maxPrice)}</Td>
                      <Td className="font-semibold">{formatPrice(r.modalPrice)}</Td>
                      <Td>{formatDate(r.priceDate)}</Td>
                      <Td className="text-field-500">{r.source}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-field-500">
              {t.prices.dataSource}: {latest.source} · {t.prices.unit} · {t.prices.latestAvailable}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-mandi-700">{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function SummaryCard({
  label,
  value,
  icon,
  accent = false,
}) {
  return (
    <div className={`card p-5 ${accent ? 'bg-mandi-600 text-white' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={accent ? 'text-mandi-100' : 'text-mandi-400'}>{icon}</span>
        <span className={`text-sm font-semibold ${accent ? 'text-mandi-50' : 'text-field-500'}`}>{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-white' : 'text-mandi-800'}`}>{value}</p>
    </div>
  );
}
