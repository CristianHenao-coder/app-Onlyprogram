import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/contexts/I18nContext';

export default function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background-dark">
      <div className="hero-gradient absolute inset-0 -z-10" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.12) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          maskImage: 'radial-gradient(circle at 50% 35%, black 0%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 35%, black 0%, transparent 65%)',
        }}
      />

      {/* Soft glows */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] bg-primary/10 blur-3xl -z-10" />
      <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] bg-secondary/10 blur-3xl -z-10" />

      <main className="w-full max-w-md px-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        <div data-reveal className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-silver/60 hover:text-white transition-colors text-sm font-medium nav-underline">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {t('nav.home')}
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
