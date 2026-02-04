import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import type { Language } from '@/i18n/translations';

const languages = [
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface/80 transition-all text-sm font-medium text-silver"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden md:inline">{currentLang.code.toUpperCase()}</span>
        <span className="material-symbols-outlined text-sm">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-background-dark transition-colors ${
                language === lang.code ? 'bg-primary/10 text-primary' : 'text-silver'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{lang.name}</div>
                <div className="text-xs opacity-60">{lang.code.toUpperCase()}</div>
              </div>
              {language === lang.code && (
                <span className="material-symbols-outlined text-primary">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
