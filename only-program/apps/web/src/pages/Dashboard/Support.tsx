import { useLocation } from 'react-router-dom';

export default function Support() {
  const location = useLocation();
  const managedDomain = location.state?.domain;
  const isManagedRequest = location.state?.type === 'managed';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight">Centro de Soporte</h1>
        <p className="text-silver/60 font-medium">Estamos aquí para ayudarte a escalar tu contenido.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Card */}
        <div className="bg-surface/50 border border-border rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl font-bold">headset_mic</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Canales Directos</h3>
                <p className="text-silver/50 text-sm font-bold uppercase tracking-widest">Respuesta inmediata</p>
              </div>
            </div>

            <div className="space-y-4">
              <a 
                href="https://wa.me/1234567890" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/5 border border-green-500/10 hover:border-green-500/30 hover:bg-green-500/10 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white text-2xl">call</span>
                </div>
                <div>
                  <p className="text-xs font-black text-green-500 uppercase tracking-widest">WhatsApp / Celular</p>
                  <p className="text-white font-bold text-lg">+1 234 567 890</p>
                </div>
              </a>

              <a 
                href="mailto:support@onlyprogram.com"
                className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:border-primary/30 hover:bg-primary/10 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white text-2xl">mail</span>
                </div>
                <div>
                  <p className="text-xs font-black text-primary uppercase tracking-widest">Correo Electrónico</p>
                  <p className="text-white font-bold text-lg">support@onlyprogram.com</p>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-yellow-500 text-xl font-bold">bolt</span>
            </div>
            <div>
              <p className="text-sm font-black text-white">Atención 24 Horas</p>
              <p className="text-xs text-silver/60 font-medium">Nuestro equipo técnico está activo 24/7 para ti.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Context Card (Managed Request) */}
        <div className="space-y-6">
          {isManagedRequest && (
            <div className="bg-primary/10 border-2 border-primary/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-slide-up">
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                  <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
                </div>
                <h3 className="text-xl font-black text-white">Solicitud de Gestión</h3>
                <p className="text-silver/70 text-sm font-medium">
                  Has seleccionado el dominio <strong>{managedDomain}</strong> para que lo configuremos por ti. 
                </p>
                <p className="text-primary text-[10px] uppercase font-black tracking-[0.2em] pt-2">
                  Por favor, envíanos un mensaje por WhatsApp para proceder.
                </p>
              </div>
            </div>
          )}

          <div className="bg-surface/30 border border-border rounded-[2.5rem] p-10 space-y-6">
            <h3 className="text-xl font-black text-white">Preguntas Frecuentes</h3>
            <div className="space-y-4">
              {[
                '¿Cómo funciona la protección anti-bot?',
                '¿Puedo usar mi propio dominio?',
                '¿Cómo configurar la rotación de Telegram?'
              ].map((q, i) => (
                <button key={i} className="w-full text-left p-4 rounded-xl border border-border/50 hover:bg-white/5 transition-colors flex items-center justify-between group">
                  <span className="text-sm font-bold text-silver/60 group-hover:text-white transition-colors">{q}</span>
                  <span className="material-symbols-outlined text-silver/20 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
