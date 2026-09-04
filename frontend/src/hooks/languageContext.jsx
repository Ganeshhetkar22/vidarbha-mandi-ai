import { createContext, useEffect, useMemo, useState } from 'react';
import en from '@/locales/en';
import mr from '@/locales/mr';

const dictionaries = { en, mr };

export const LanguageContext = createContext(undefined);

const STORAGE_KEY = 'vidarbha-mandi-lang';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'mr' ? 'mr' : 'en';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (l) => {
        window.localStorage.setItem(STORAGE_KEY, l);
        setLangState(l);
      },
      t: dictionaries[lang],
      dir: 'ltr',
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
