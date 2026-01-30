import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';

export default function Register() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    acceptTerms: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Google');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background-dark">
      {/* Animated Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl pointer-events-none animate-floating"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-secondary/20 to-primary/20 blur-3xl pointer-events-none animate-floating" style={{ animationDelay: '3s' }}></div>
      <div className="absolute inset-0 bg-glow opacity-30 pointer-events-none"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particle-small particle-sm-1"></div>
        <div className="floating-particle-small particle-sm-2"></div>
        <div className="floating-particle-small particle-sm-3"></div>
        <div className="floating-particle-small particle-sm-4"></div>
        <div className="floating-particle-small particle-sm-5"></div>
      </div>

      <main className="w-full max-w-2xl px-4 z-10 py-12" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
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

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 shadow-2xl backdrop-blur-sm animate-scale-in hover:border-primary/30 transition-all duration-500">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-10 w-10 overflow-hidden rounded-lg transform hover:scale-110 transition-transform">
                <img src="/src/assets/img/logoinc.png" alt="Only Program" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase">
                Only <span className="text-primary text-sm">Program</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('auth.createAccount')}</h1>
            <p className="text-silver text-sm">
              Únete a miles de creadores protegiendo su contenido
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-shake">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name & Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="name" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                  Nombre Completo *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-silver/20 hover:border-silver/30"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <label htmlFor="phone" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-silver/20 hover:border-silver/30"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Email */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="email" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                {t('auth.email')} *
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-silver/20 hover:border-silver/30"
                placeholder={t('auth.enterEmail')}
              />
            </div>

            {/* Country */}
            <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <label htmlFor="country" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                País
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:border-silver/30"
              >
                <option value="">Selecciona tu país</option>
                <option value="US">Estados Unidos</option>
                <option value="MX">México</option>
                <option value="CO">Colombia</option>
                <option value="AR">Argentina</option>
                <option value="ES">España</option>
                <option value="FR">Francia</option>
                <option value="GB">Reino Unido</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            {/* Password */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <label htmlFor="password" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                  {t('auth.password')} *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-silver/20 hover:border-silver/30"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.35s' }}>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                  {t('auth.confirmPassword')} *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-silver/20 hover:border-silver/30"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <input
                id="terms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                className="mt-1 w-4 h-4 rounded border-border bg-background-dark text-primary focus:ring-primary focus:ring-offset-0"
              />
              <label htmlFor="terms" className="text-sm text-silver">
                Acepto los{' '}
                <a href="#" className="text-primary hover:underline">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="#" className="text-primary hover:underline">
                  política de privacidad
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform group animate-slide-up"
              style={{ animationDelay: '0.45s' }}
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  Creando cuenta...
                </>
              ) : (
                <>
                  {t('auth.createAccount')}
                  <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-silver/60">{t('auth.loginWith')}</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 rounded-xl transition-all border border-gray-300 flex items-center justify-center gap-3 hover:scale-105 transform group animate-slide-up"
            style={{ animationDelay: '0.55s' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Login Link */}
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-silver">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-silver/40 text-xs mt-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          💳 No solicitamos información de pago en el registro
        </p>
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
          top: 15%;
          left: 10%;
          animation-delay: 0s;
        }

        .particle-sm-2 {
          top: 60%;
          right: 20%;
          animation-delay: 2s;
        }

        .particle-sm-3 {
          bottom: 25%;
          left: 30%;
          animation-delay: 4s;
        }

        .particle-sm-4 {
          top: 40%;
          right: 35%;
          animation-delay: 6s;
        }

        .particle-sm-5 {
          bottom: 50%;
          left: 50%;
          animation-delay: 8s;
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
