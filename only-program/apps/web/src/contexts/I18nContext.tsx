import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { translations, Language } from "../i18n/translations";

type InterpolateValues = Record<string, string | number | boolean | null | undefined>;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, values?: InterpolateValues) => any;
  availableLanguages: Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "language";

function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(template: string, values?: InterpolateValues): string {
  if (!values) return template;
  return template
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(values[k] ?? ""))
    .replace(/\{\s*(\w+)\s*\}/g, (_, k) => String(values[k] ?? ""));
}

function detectDefaultLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && (saved === "es" || saved === "en" || saved === "fr")) return saved;
  } catch { }

  const nav = (navigator.language || "es").toLowerCase();
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("en")) return "en";
  return "es";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => detectDefaultLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { }
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, values?: InterpolateValues): any => {
    if (!translations) {
      console.warn("I18nContext: Translations object is undefined");
      return key;
    }

    const dict = translations[language] ?? translations.es;

    if (!dict) {
      console.warn(`I18nContext: No translations found for language ${language}`);
      return key;
    }

    const raw = getByPath(dict, key);
    if (raw !== undefined) {
      if (typeof raw === "string") return interpolate(raw, values);
      return raw;
    }

    // fallback a español si falta la clave en el idioma actual
    const rawEs = getByPath(translations.es, key);
    if (rawEs !== undefined) {
      if (typeof rawEs === "string") return interpolate(rawEs, values);
      return rawEs;
    }

    return key;
  };

  const value = useMemo<I18nContextType>(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages: ["es", "en", "fr"],
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}
