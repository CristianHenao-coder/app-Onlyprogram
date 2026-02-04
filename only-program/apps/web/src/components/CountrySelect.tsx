import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { useTranslation } from '@/contexts/I18nContext';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

// Common countries list. You can expand this list as needed.
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Deutschland' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brasil' },
  { code: 'IT', name: 'Italia' },
];

export default function CountrySelect({ value, onChange, required = false }: CountrySelectProps) {
  const { t } = useTranslation();

  // If the value passed is a country name (from old logic), we try to find the code, or just show it if strict code not enforced yet.
  // Ideally, we should store CODE not NAME. But for now, let's assume we store what the user selects.
  // We will emit the COUNTRY NAME or CODE? The previous code used lowercase names like 'spain'.
  // Let's standarize to use the CODE as value if possible, or mapping for backward compatibility?
  // Previous list: ['spain', 'usa', 'mexico'...]
  // Let's use the CODE as the value for new entries to be standard.
  
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
        {value && Flags[value as keyof typeof Flags] ? (
          React.createElement(Flags[value as keyof typeof Flags], { className: "w-5 h-auto rounded-sm shadow-sm" })
        ) : (
          <span className="material-symbols-outlined text-silver/50 text-xl">public</span>
        )}
      </div>
      
      <select
        id="country"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background-dark/50 border border-border rounded-xl pl-12 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
      >
        <option value="" disabled className="text-silver/20">{t('auth.selectCountry')}</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code} className="bg-background-dark text-white">
            {c.name}
          </option>
        ))}
        <option value="OTHER" className="bg-background-dark text-white">Other</option>
      </select>

      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-silver/50">
        <span className="material-symbols-outlined text-xl">expand_more</span>
      </div>
    </div>
  );
}
