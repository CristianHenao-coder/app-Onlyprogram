import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el email de recuperación');
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
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-silver/60 hover:text-white transition-colors text-sm font-medium group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            Volver al login
          </Link>
        </div>

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
            <h1 className="text-2xl font-bold text-white mb-2">Recuperar Contraseña</h1>
            <p className="text-silver text-sm">
              Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
            </p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">¡Email enviado!</h2>
              <p className="text-silver/70 mb-6">
                Revisa tu correo electrónico. Te hemos enviado un enlace para restablecer tu contraseña.
              </p>
              <Link
                to="/login"
                className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-silver/70 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background-dark border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-0 input-glow transition-all placeholder:text-silver/20"
                    placeholder="nombre@ejemplo.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-silver/60">
                  ¿Recordaste tu contraseña?{' '}
                  <Link to="/login" className="text-primary hover:underline font-semibold">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
