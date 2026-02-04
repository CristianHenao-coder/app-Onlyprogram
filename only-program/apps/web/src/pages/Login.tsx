import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';
import Logo from '@/components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate('/welcome');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div data-reveal className="bg-surface/50 border border-border rounded-3xl p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Logo />
            <span className="text-xl font-bold tracking-tight text-white uppercase">
              Only <span className="text-primary text-sm">Program</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{t('auth.welcomeBack')}</h1>
          <p className="mt-2 text-silver/65 text-sm">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background-dark/50 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-silver/20"
              placeholder={t('auth.enterEmail')}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider">
                {t('auth.password')}
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors nav-underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background-dark/50 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-silver/20 pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-silver/50 hover:text-white transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-magnetic="0.12"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                {t('auth.loginButton')}...
              </>
            ) : (
              <>
                {t('auth.loginButton')}
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface/50 px-4 text-silver/40">{t('auth.loginWith')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-background-dark/50 border border-border hover:border-white/15 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-silver/60">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary font-bold hover:underline ml-1">
              {t('auth.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
