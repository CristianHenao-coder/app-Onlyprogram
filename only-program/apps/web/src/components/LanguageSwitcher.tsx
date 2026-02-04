import { useTranslation } from '@/contexts/I18nContext';
import { Language } from '@/i18n/translations';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();

    const langs: { code: Language; label: string }[] = [
        { code: 'en', label: 'EN' },
        { code: 'es', label: 'ES' },
        { code: 'fr', label: 'FR' },
    ];

    return (
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
            {langs.map((l) => (
                <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${language === l.code
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-silver/40 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {l.label}
                </button>
            ))}
        </div>
    );
}
