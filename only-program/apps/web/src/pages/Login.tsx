import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';

export default function Login() {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } else {
      navigate('/dashboard');
    }
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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background-dark">
      {/* Animated Background with glows and particles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl pointer-events-none animate-floating"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-secondary/20 to-primary/20 blur-3xl pointer-events-none animate-floating" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-glow opacity-30 pointer-events-none"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particle-small particle-sm-1"></div>
        <div className="floating-particle-small particle-sm-2"></div>
        <div className="floating-particle-small particle-sm-3"></div>
        <div className="floating-particle-small particle-sm-4"></div>
      </div>

      <main className="w-full max-w-md px-4 z-10" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Back Button */}
        <div className="mb-6 animate-slide-in-right">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-silver/60 hover:text-white transition-colors text-sm font-medium group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            {t('nav.home')}
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 shadow-2xl backdrop-blur-sm animate-scale-in hover:border-primary/30 transition-all duration-500">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-10 w-10 overflow-hidden rounded-lg transform hover:scale-110 transition-transform">
                <img src="/src/assets/img/logoinc.png" alt="Only Program" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase">
                Only <span className="text-primary text-sm">Program</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('auth.welcomeBack')}</h1>
            <p className="text-silver text-sm">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-shake">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-6">
            {/* Email */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2"
              >
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-silver/20 hover:border-silver/30"
                placeholder={t('auth.enterEmail')}
              />
            </div>

            {/* Password */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-silver/70 uppercase tracking-wider"
                >
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-cyan hover:text-cyan/80 transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-silver/20 hover:border-silver/30"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform group animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  {t('auth.loginButton')}...
                </>
              ) : (
                <>
                  {t('auth.loginButton')}
                  <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative py-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-4 text-silver/40">{t('auth.loginWith')}</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-background-dark border border-border hover:border-silver/30 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform group animate-slide-up"
              style={{ animationDelay: '0.5s' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              Google
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-silver/60">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold ml-1">
                {t('auth.createAccount')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Animations CSS */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(5deg); }
          66% { transform: translateY(10px) rotate(-5deg); }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-floating {
          animation: floating 8s ease-in-out infinite;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }

        .floating-particle-small {
          position: absolute;
          width: 3px;
          height: 3px;
          background: linear-gradient(45deg, #FFD93D, #6BCF7F);
          border-radius: 50%;
          animation: floating 10s ease-in-out infinite;
          opacity: 0.6;
        }

        .particle-sm-1 {
          top: 20%;
          left: 15%;
          animation-delay: 0s;
        }

        .particle-sm-2 {
          top: 70%;
          right: 25%;
          animation-delay: 3s;
        }

        .particle-sm-3 {
          bottom: 30%;
          left: 35%;
          animation-delay: 6s;
        }

        .particle-sm-4 {
          top: 50%;
          right: 45%;
          animation-delay: 9s;
        }

        /* Prevent horizontal scroll */
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }

        /* Touch optimizations */
        @media (max-width: 640px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}
