import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  // const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar que hay un hash de recuperación en la URL
  useEffect(() => {
    // Supabase automáticamente maneja el hash de recuperación
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (!hashParams.get('access_token')) {
      setError('Link de recuperación inválido o expirado');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Redirigir al login
      navigate('/login', {
        state: { message: 'Contraseña actualizada exitosamente. Inicia sesión con tu nueva contraseña.' },
      });
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background-dark">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-glow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-glow pointer-events-none"></div>
      <div className="absolute inset-0 bg-glow opacity-50 pointer-events-none"></div>

      <main className="w-full max-w-md px-4 z-10">
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-10 w-10 overflow-hidden rounded-lg">
                <img src="/src/assets/logo.png" alt="Only Program" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase">
                Only <span className="text-primary text-sm">Program</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Nueva Contraseña</h1>
            <p className="text-silver text-sm">Ingresa tu nueva contraseña</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-0 input-glow transition-all placeholder:text-silver/20"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-0 input-glow transition-all placeholder:text-silver/20"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
