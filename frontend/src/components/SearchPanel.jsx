import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { DistrictSelect, CropSelect, MandiSelect } from './Selectors';
import { fetchMandiAvailability } from '@/services/mandiService';

export function SearchPanel({
  defaultDistrict,
  defaultCrop,
  defaultMandi,
  submitTo = '/mandi-prices',
  showDate = false,
  date,
  onDateChange,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [districtId, setDistrictId] = useState(defaultDistrict ?? '');
  const [cropId, setCropId] = useState(defaultCrop ?? '');
  const [mandiId, setMandiId] = useState(defaultMandi ?? '');
  const [availability, setAvailability] = useState({ crops: null, mandis: null });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const districtRequestId = useRef(0);
  const mandiRequestId = useRef(0);
  const cropRequestStarted = useRef(false);

  useEffect(() => {
    setDistrictId(defaultDistrict ?? '');
    setCropId(defaultCrop ?? '');
    setMandiId(defaultMandi ?? '');
  }, [defaultDistrict, defaultCrop, defaultMandi]);

  useEffect(() => {
    if (!districtId) {
      setAvailability({ crops: null, mandis: null });
      setAvailabilityError(null);
      return;
    }

    cropRequestStarted.current = false;
    const currentRequest = ++districtRequestId.current;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    fetchMandiAvailability(districtId)
      .then((districtAvailability) => {
        if (currentRequest !== districtRequestId.current) return;
        setAvailability((current) => ({
          ...current,
          crops: districtAvailability.crops,
          mandis: cropRequestStarted.current ? current.mandis : districtAvailability.mandis,
        }));
      })
      .catch((error) => {
        if (currentRequest === districtRequestId.current) setAvailabilityError(error.message);
      })
      .finally(() => {
        if (currentRequest === districtRequestId.current) setAvailabilityLoading(false);
      });
  }, [districtId]);

  useEffect(() => {
    if (!districtId || !cropId) return;

    cropRequestStarted.current = true;
    const currentRequest = ++mandiRequestId.current;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    fetchMandiAvailability(districtId, cropId)
      .then(({ mandis }) => {
        if (currentRequest === mandiRequestId.current) {
          setAvailability((current) => ({ ...current, mandis }));
        }
      })
      .catch((error) => {
        if (currentRequest === mandiRequestId.current) setAvailabilityError(error.message);
      })
      .finally(() => {
        if (currentRequest === mandiRequestId.current) setAvailabilityLoading(false);
      });
  }, [districtId, cropId]);

  const handleDistrictChange = (value) => {
    setDistrictId(value);
    setCropId('');
    setMandiId('');
    setAvailability({ crops: null, mandis: null });
  };

  const handleCropChange = (value) => {
    setCropId(value);
    setMandiId('');
    setAvailability((current) => ({ ...current, mandis: [] }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (districtId) params.set('district', districtId);
    if (cropId) params.set('crop', cropId);
    if (mandiId) params.set('mandi', mandiId);
    if (showDate && date) params.set('date', date);
    navigate(`${submitTo}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="card grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <DistrictSelect value={districtId} onChange={handleDistrictChange} />
      <CropSelect
        value={cropId}
        onChange={handleCropChange}
        options={districtId ? availability.crops ?? [] : undefined}
        disabled={availabilityLoading && !availability.crops}
      />
      <MandiSelect
        value={mandiId}
        onChange={setMandiId}
        districtId={districtId || undefined}
        options={districtId ? availability.mandis ?? [] : undefined}
        disabled={availabilityLoading && !availability.mandis}
      />
      {availabilityError && <p className="text-sm text-red-600">{availabilityError}</p>}
      {showDate ? (
        <div>
          <label className="label" htmlFor="date-select">
            {t.search.date}
          </label>
          <input
            id="date-select"
            type="date"
            className="input"
            value={date ?? ''}
            onChange={(e) => onDateChange?.(e.target.value)}
          />
        </div>
      ) : null}

      <div className="lg:col-span-1">
        <button type="submit" className="btn-primary w-full">
          <Search className="h-5 w-5" />
          {t.search.check}
        </button>
      </div>
    </form>
  );
}
