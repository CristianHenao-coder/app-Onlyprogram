import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Welcome() {
  const { user, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until both auth AND profile have finished loading
    if (authLoading) return;

    // Not logged in → send to login
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // Profile not loaded yet → keep waiting
    if (!profile) return;

    // Profile complete check (phone not required)
    const meta = user.user_metadata;
    const isComplete =
      profile?.profile_completed ||
      meta?.profile_completed ||
      (meta?.country && meta?.full_name);

    if (!isComplete) {
      navigate('/complete-profile', { replace: true });
      return;
    }

    // Use profile.role from DB — single source of truth
    if (profile.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, profile, navigate]);

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-silver/40 text-sm animate-pulse">Cargando tu perfil...</p>
      </div>
    </div>
  );
}
