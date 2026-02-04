  import { useEffect } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import AuthShell from '@/components/AuthShell';
  import { useTranslation } from '@/contexts/I18nContext';
  import { useAuth } from '@/hooks/useAuth';

export default function Welcome() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Check if user has completed profile. 
      // We look for a flag or missing fields.
      const meta = user.user_metadata;
      const isComplete = meta?.profile_completed || (meta?.phone && meta?.country && meta?.full_name);
      
      if (!isComplete) {
        navigate('/complete-profile');
      }
    }
  }, [user, navigate]);

  return (
    <AuthShell>
      <div data-reveal className="bg-surface/50 border border-border rounded-3xl p-8 md:p-10 shadow-2xl text-center">
        <div className="mb-6 flex justify-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-pulse">waving_hand</span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-white mb-4">
          {t('auth.welcomeBack') || "Welcome!"}
        </h1>
        
        <p className="text-silver/70 mb-8">
          Bienvenido a Only Program. Tu cuenta ha sido creada exitosamente.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-lg shadow-primary/25"
        >
          Ir al Dashboard
          <span className="material-symbols-outlined ml-2">arrow_forward</span>
        </Link>
      </div>
    </AuthShell>
  );
}
