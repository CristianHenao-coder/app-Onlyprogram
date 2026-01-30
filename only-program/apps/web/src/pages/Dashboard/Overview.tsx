import { useTranslation } from '@/contexts/I18nContext';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img 
            src="/src/assets/img/logo.png" 
            alt="Only Program" 
            className="h-32 w-auto mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Welcome Text */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-slide-up">
          {t('dashboard.welcome')}
        </h1>

        {/* Subtle decoration */}
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full animate-pulse-glow"></div>
      </div>
    </div>
  );
}
