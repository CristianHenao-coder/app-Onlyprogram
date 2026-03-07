import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import PasswordInput, { PasswordStrengthChecklist } from '@/components/PasswordInput';
import { useTranslation } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/services/apiConfig';

export default function Register() {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth() as any;
  const { t, language } = useTranslation() as any;
  const lang = language;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch") || "Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*#?&]/.test(password);

    if (password.length < 6 || !hasUppercase || !hasNumber || !hasSpecial) {
      setError("La contraseña debe cumplir todos los requisitos de seguridad.");
      setLoading(false);
      return;
    }

    try {
      // Send OTP to email (no Turnstile required)
      const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, usage: 'register', lang }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'No se pudo enviar el código');
        setLoading(false);
        return;
      }

      // Redirect to verification page with state
      navigate('/auth/verify', {
        state: { email, password, name, usage: 'register' },
      });
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="w-full max-w-md px-4 z-10 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-silver/40 hover:text-white transition-colors text-sm font-medium group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            {t("pricingPage.backHome")}
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Logo className="h-10 w-10" />
              <span className="text-xl font-black tracking-tighter text-white uppercase">
                Only <span className="text-primary">Program</span>
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">{t("nav.signup")}</h1>
            <p className="text-silver/50 text-sm">{t("auth.joinCreators")}</p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <p className="text-sm text-red-400 font-medium text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleRegister}
            className="space-y-5"
          >
            <div>
              <label className="block text-[10px] font-black text-silver/40 uppercase tracking-[0.2em] mb-2 ml-1">
                {t("auth.fullName")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-silver/10"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-silver/40 uppercase tracking-[0.2em] mb-2 ml-1">
                {t("auth.email")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-silver/10"
                placeholder="jane@example.com"
              />
            </div>

            <div className="space-y-4">
              <PasswordInput
                id="password"
                label={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••"
              />
              <PasswordInput
                id="confirmPassword"
                label={t("auth.confirmPassword") || t("auth.password")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••"
              />
            </div>

            <PasswordStrengthChecklist value={password} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando código...
                </span>
              ) : (
                t("nav.signup")
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-[#0f0f0f] px-4 text-silver/20">{t("auth.loginWith")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </motion.form>

          {/* Login Link */}
          <div className="mt-10 text-center">
            <p className="text-sm text-silver/40">
              {t("auth.alreadyHaveAccount")}{' '}
              <Link to="/login" className="text-primary hover:text-primary-light font-bold ml-1 transition-colors">
                {t("nav.login")}
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto mb-8 text-center z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-silver/10">
          © {new Date().getFullYear()} Only Program. {t("footer.rights")}
        </p>
      </footer>
    </div>
  );
}
