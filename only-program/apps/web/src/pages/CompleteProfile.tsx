import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';
import { supabase } from '@/services/supabase';
import CountrySelect, { COUNTRIES } from '@/components/CountrySelect';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user_metadata) {
      if (user.user_metadata.full_name) setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasMinLength = password.length >= 6;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*#?&]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('La contraseña no cumple con todos los requisitos.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!country) {
      setError('Selecciona un país.');
      return;
    }
    // Phone is now optional
    // if (!validatePhone(phone)) ...

    setLoading(true);

    try {
      const { error: pwdError } = await (supabase.auth as any).updateUser({ password });
      if (pwdError) throw pwdError;

      const { error: metaError } = await (supabase.auth as any).updateUser({
        data: { full_name: fullName, phone, country, profile_completed: true }
      });
      if (metaError) throw metaError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          country,
          profile_completed: true,
          is_suspended: false,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
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

  return (
    <AuthShell>
      <div data-reveal className="bg-surface/50 border border-border rounded-3xl p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Completa tu Perfil</h1>
          <p className="text-silver/60 text-sm">Necesitamos algunos datos extra para proteger tu cuenta.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
              {t('auth.fullName')}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-background-dark/50 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
              {t('auth.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-background-dark/50 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="+1 234 567 890"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
              {t('auth.country')}
            </label>
            <CountrySelect
              value={country}
              onChange={(val) => {
                setCountry(val);
                // Auto-fill phone code
                const found = COUNTRIES.find(c => c.code === val);
                if (found && found.dial) {
                  setPhone(found.dial);
                }
              }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
              Establecer Contraseña
            </label>
            <div className="relative">
              <input
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

            {password.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 p-3 bg-surface/30 rounded-lg border border-white/5">
                <PasswordRequirement met={hasMinLength} text="Mínimo 6 caracteres" />
                <PasswordRequirement met={hasLetter} text="Al menos una letra" />
                <PasswordRequirement met={hasNumber} text="Al menos un número" />
                <PasswordRequirement met={hasSpecial} text="Carácter especial (@$!%*#?&)" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full bg-background-dark/50 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-silver/20 pr-12
                    ${confirm && password === confirm ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' : 'border-border focus:border-primary focus:ring-primary/30'}
                  `}
                placeholder="Confirm Password"
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
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Guardando...' : 'Completar Registro'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
