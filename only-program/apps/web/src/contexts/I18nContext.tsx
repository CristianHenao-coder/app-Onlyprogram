import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../i18n/translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Obtener idioma guardado o detectar del navegador
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['es', 'en', 'fr'].includes(saved)) {
      return saved;
    }
    
    // Detectar idioma del navegador
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es' || browserLang === 'en' || browserLang === 'fr') {
      return browserLang as Language;
    }
    
    return 'es'; // Default
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  // Función para obtener traducción por clave
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Retornar key si no se encuentra traducción
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
