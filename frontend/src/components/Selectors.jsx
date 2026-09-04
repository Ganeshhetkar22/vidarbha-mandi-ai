import { useLanguage } from '@/hooks/useLanguage';
import { DISTRICTS, MANDIS, CROPS } from '@/data/vidarbha';

export function DistrictSelect({ value, onChange, disabled }) {
  const { lang, t } = useLanguage();
  return (
    <div>
      <label className="label" htmlFor="district-select">
        {t.search.district}
      </label>
      <select
        id="district-select"
        className="input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t.search.districtPlaceholder}</option>
        {DISTRICTS.map((d) => (
          <option key={d.id} value={d.id}>
            {lang === 'mr' ? d.nameMr : d.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CropSelect({ value, onChange, disabled, options }) {
  const { lang, t } = useLanguage();
  const crops = options ?? CROPS;
  return (
    <div>
      <label className="label" htmlFor="crop-select">
        {t.search.crop}
      </label>
      <select
        id="crop-select"
        className="input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t.search.cropPlaceholder}</option>
        {options && crops.length === 0 && <option value="" disabled>{t.search.noCrops}</option>}
        {crops.map((c) => (
          <option key={c.id} value={c.id}>
            {lang === 'mr' ? c.nameMr ?? c.name : c.name}{c.category ? ` · ${c.category}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MandiSelect({
  value,
  onChange,
  districtId,
  disabled,
  options,
}) {
  const { lang, t } = useLanguage();
  const mandis = options ?? (districtId ? MANDIS.filter((m) => m.districtId === districtId) : MANDIS);
  return (
    <div>
      <label className="label" htmlFor="mandi-select">
        {t.search.mandi}
      </label>
      <select
        id="mandi-select"
        className="input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t.search.mandiPlaceholder}</option>
        {options && mandis.length === 0 && <option value="" disabled>{t.search.noMandis}</option>}
        {mandis.map((m) => (
          <option key={m.id} value={m.id}>
            {lang === 'mr' ? m.nameMr ?? m.name : m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
