import { useTranslation } from '@/contexts/I18nContext';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden bg-background-dark flex flex-col items-center justify-center p-6">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-floating pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full animate-floating pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-glow opacity-20 pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-4xl text-center">
        {/* Logo Container */}
        <div className="mb-12 animate-fade-in">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500"></div>
            <img 
              src="/src/assets/img/logoinc.png" 
              alt="Only Program" 
              className="relative h-24 md:h-32 w-auto mx-auto drop-shadow-[0_0_25px_rgba(255,108,34,0.3)] hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-xl text-silver/80 max-w-2xl mx-auto font-light leading-relaxed">
            Tu panel de control de seguridad está siendo configurado. Pronto tendrás acceso a todas tus métricas de protección de enlaces.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-surface/50 border border-border/50 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse-glow">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-sm font-medium text-silver">Sistema de Protección Activo</span>
            </div>
            
            <button 
              onClick={() => signOut()}
              className="text-silver/60 hover:text-white transition-opacity text-sm font-medium underline underline-offset-4"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Info Grid (Placeholder) */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 grayscale pointer-events-none">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-6 h-32 flex items-center justify-center">
              <div className="w-full h-4 bg-white/5 rounded-full"></div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        @keyframes floating {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-floating {
          animation: floating 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
