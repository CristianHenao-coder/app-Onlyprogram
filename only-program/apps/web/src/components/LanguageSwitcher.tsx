import { useTranslation } from '@/contexts/I18nContext';
import { Language } from '@/i18n/translations';

// Import flag icons
import esFlag from '@/assets/img/espana.png';
import enFlag from '@/assets/img/reino-unido.png';
import frFlag from '@/assets/img/francia.png';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();

    const langs: { code: Language; label: string; flag: string }[] = [
        { code: 'en', label: 'EN', flag: enFlag },
        { code: 'es', label: 'ES', flag: esFlag },
        { code: 'fr', label: 'FR', flag: frFlag },
    ];

    return (
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
            {langs.map((l) => (
                <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`flex items-center justify-center w-7 h-7 rounded transition-all ${language === l.code
                            ? 'bg-primary/20 text-white shadow-sm border border-primary/30'
                            : 'opacity-40 hover:opacity-100 hover:bg-white/5'
                        }`}
                    title={l.code.toUpperCase()}
                >
                    <img 
                        src={l.flag} 
                        alt={l.label} 
                        className="w-4 h-4 object-contain"
                    />
                </button>
            ))}
        </div>
    );
}
