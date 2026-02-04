import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';
import Logo from '@/components/Logo';
import CountrySelect from '@/components/CountrySelect';

export default function Register() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* New States for UI */
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePhone = (p: string) => {
    return /^\+?[\d\s-]{8,20}$/.test(p);
  };

  /* Real-time Checks */
  const hasMinLength = password.length >= 6;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*#?&]/.test(password);
  
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Explicit Check
    if (!isPasswordValid) {
      setError('La contraseña no cumple con todos los requisitos.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!country) {
      setError('Por favor selecciona un país.');
      return;
    }
    if (!validatePhone(phone)) {
       setError('El teléfono debe incluir el código de país (ej. +573001234567).');
       return;
    }

    setLoading(true);

    try {
      const { error } = await signUpWithEmail(email, password, {
        full_name: fullName,
        phone,
        country,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg("Cuenta creada exitosamente. Por favor verifica tu correo para activar tu cuenta.");
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || 'Error con Google Auth');
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-400' : 'text-silver/40'}`}>
      <span className="material-symbols-outlined text-sm">
        {met ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      <span className={met ? 'line-through' : ''}>{text}</span>
    </div>
  );

  /* In Render: Password Input */
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{t('auth.createAccount')}</h1>
          <p className="mt-2 text-silver/65 text-sm">Crea tu cuenta y empieza a generar links protegidos.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-sm text-green-400">{successMsg}</p>
          </div>
        )}

        {!successMsg ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2" htmlFor="fullName">
                {t('auth.fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-background-dark/50 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-silver/20"
                placeholder="John Doe"
              />
            </div>

            {/* Phone */}
             <div>
              <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2" htmlFor="phone">
                {t('auth.phone')}
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background-dark/50 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-silver/20"
                placeholder="+1 234 567 890"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2" htmlFor="country">
                {t('auth.country')}
              </label>
              <CountrySelect 
                value={country} 
                onChange={setCountry} 
                required 
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2" htmlFor="email">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background-dark/50 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-silver/20"
                placeholder={t('auth.enterEmail')}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-background-dark/50 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-silver/20 pr-12
                    ${isPasswordValid ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' : 'border-border focus:border-primary focus:ring-primary/30'}
                  `}
                  placeholder="Min. 6 chars"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-silver/50 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Real-time Checklist */}
              {password.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 p-3 bg-surface/30 rounded-lg border border-white/5">
                  <PasswordRequirement met={hasMinLength} text="Mínimo 6 caracteres" />
                  <PasswordRequirement met={hasLetter} text="Al menos una letra" />
                  <PasswordRequirement met={hasNumber} text="Al menos un número" />
                  <PasswordRequirement met={hasSpecial} text="Carácter especial (@$!%*#?&)" />
                </div>
              )}
            </div>

            {/* Confirm Field */}
            <div>
              <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                {t('auth.confirmPassword') || "Confirmar contraseña"}
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`w-full bg-background-dark/50 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-silver/20 pr-12
                     ${confirm && password === confirm ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' : 'border-border focus:border-primary focus:ring-primary/30'}
                  `}
                  placeholder="••••••••"
                />
                 <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-4 flex items-center text-silver/50 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-magnetic="0.12"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  Processing...
                </>
              ) : (
                <>
                  {t('auth.createAccount')}
                  <span className="material-symbols-outlined">chevron_right</span>
                </>
              )}
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface/50 px-4 text-silver/40">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
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
        ) : (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-6xl text-green-500 mb-4">mark_email_read</span>
            <p className="text-white text-lg font-bold mb-2">¡Confirma tu correo!</p>
            <p className="text-silver/70 text-sm">{successMsg}</p>
            <Link to="/login" className="mt-6 inline-block text-primary font-bold hover:underline">
              {t('auth.login')}
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-silver/60">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary font-bold hover:underline ml-1">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
