import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Welcome() {
  const { user, isAdmin, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only proceed if auth has finished loading and we have a user
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }

      // Check profile completion
      const meta = user.user_metadata;
      const isComplete = profile?.profile_completed || meta?.profile_completed || (meta?.phone && meta?.country && meta?.full_name);
      
      if (!isComplete && profile) {
        // Only redirect to complete-profile if we actually have the profile loaded
        // AND it's not complete.
        navigate('/complete-profile');
        return;
      }

      if (profile) {
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [user, isAdmin, authLoading, profile, navigate]);

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}
