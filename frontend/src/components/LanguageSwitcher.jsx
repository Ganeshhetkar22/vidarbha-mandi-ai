import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const options = [
    { code: 'en', label: 'EN' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-field-300 bg-white p-1 shadow-soft">
      <Globe className="ml-1.5 h-4 w-4 text-mandi-500" />
      {options.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLang(opt.code)}
          className={`rounded-lg px-2.5 py-1 text-sm font-semibold transition-colors ${
            lang === opt.code
              ? 'bg-mandi-600 text-white'
              : 'text-mandi-700 hover:bg-mandi-50'
          }`}
          aria-pressed={lang === opt.code}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
