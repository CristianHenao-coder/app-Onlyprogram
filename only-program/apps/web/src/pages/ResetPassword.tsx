import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '@/components/AuthShell';
import { supabase } from '@/services/supabase';
import PasswordInput from '@/components/PasswordInput';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Basic validation (Checklist handles visual feedback, this is final guard)
    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage('Contraseña actualizada. Ahora puedes iniciar sesión.');
    setLoading(false);
    setTimeout(() => navigate('/login'), 700);
  };

  return (
    <AuthShell>
      <div data-reveal className="bg-surface/50 border border-border rounded-3xl p-8 md:p-10 shadow-2xl">
        <h1 className="text-2xl font-extrabold text-white">Restablecer contraseña</h1>
        <p className="mt-2 text-silver/65 text-sm">Define una nueva contraseña segura.</p>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {message && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-sm text-green-300">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <PasswordInput
            id="password"
            label="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            showStrength={true}
            placeholder="Mínimo 6 caracteres"
          />

          <PasswordInput
            id="confirm"
            label="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            data-magnetic="0.12"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                Guardando...
              </>
            ) : (
              <>
                Actualizar
                <span className="material-symbols-outlined">lock</span>
              </>
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
