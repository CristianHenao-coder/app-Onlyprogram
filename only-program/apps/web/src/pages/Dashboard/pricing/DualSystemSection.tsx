import React from "react";
import tiktokLogo from "@/assets/animations/tik-tok.png";

interface DualSystemSectionProps {
  dualTab: 'dual' | 'meta' | 'tiktok';
  setDualTab: (tab: 'dual' | 'meta' | 'tiktok') => void;
  onNavigateLinks: () => void;
}

const DualSystemSection: React.FC<DualSystemSectionProps> = ({
  dualTab,
  setDualTab,
  onNavigateLinks,
}) => {
  return (
    <div className={`relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden pt-6 mb-16 group ${dualTab === 'dual' ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.15)]' : 'bg-gradient-to-br from-[#0e0e0e] to-[#111116] border-white/8 shadow-[0_0_30px_rgba(0,0,0,0.4)]'}`}>
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full mix-blend-screen transition-all pointer-events-none ${dualTab === 'dual' ? 'bg-purple-500/20 group-hover:bg-purple-500/30' : 'bg-white/5'}`} />
      
      {/* TABS SUPERIOR IZQUIERDA */}
      <div className="relative z-20 flex items-center gap-2 px-8 md:px-12 overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setDualTab('dual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dualTab === 'dual' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-silver hover:bg-white/10'}`}
        >
          <span className="material-symbols-outlined text-[1em]">alt_route</span>
          Sistema Dual Completo
        </button>
        <button 
          onClick={() => setDualTab('meta')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dualTab === 'meta' ? 'bg-[#1e1e1e] text-white border border-white/15 shadow-lg' : 'bg-white/5 text-silver hover:bg-white/10'}`}
        >
          <span className="material-symbols-outlined text-[1em]">public</span>
          Meta Directo
        </button>
        <button 
          onClick={() => setDualTab('tiktok')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dualTab === 'tiktok' ? 'bg-[#1e1e1e] text-white border border-white/15 shadow-lg' : 'bg-white/5 text-silver hover:bg-white/10'}`}
        >
          <span className="material-symbols-outlined text-[1em]">smart_display</span>
          TikTok Landing VIP
        </button>
      </div>

      <div className="p-8 md:p-12 pt-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[480px]">
        
        {/* IZQUIERDA: CONTENIDO DINAMICO */}
        <div className="space-y-6">
          {dualTab === 'dual' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span> El más recomendado
                </div>
                <div className="flex items-end gap-1 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-white font-black text-2xl leading-none">$69</span>
                  <span className="text-silver/50 text-xs font-bold mb-0.5">/mes por link</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Sistema Híbrido <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Dual</span>
              </h2>
              <p className="text-silver/70 text-sm leading-relaxed">
                ¡La solución definitiva! El <strong>Sistema Dual</strong> segmenta a tus visitantes automáticamente y los redirige por la ruta más segura y con mayor conversión según la red social de donde vengan.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-purple-400 mt-0.5 text-lg">savings</span>
                  <p className="text-sm text-silver/80"><strong>Ahorro masivo:</strong> Obtienes tecnología para ambas redes por una pequeña fracción del costo, en lugar de comprar links separados.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-purple-400 mt-0.5 text-lg">rocket_launch</span>
                  <p className="text-sm text-silver/80"><strong>Evita el Shadowbanneo:</strong> Disminuye masivamente el riesgo de bloqueo al usar rutas hiper-especializadas para cada plataforma.</p>
                </li>
              </ul>
              <button onClick={onNavigateLinks} className="mt-4 w-full md:w-auto px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all uppercase tracking-wider">
                Crear Link Dual Ahora
              </button>
            </div>
          )}

          {dualTab === 'meta' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">security</span> Cloaking Activo
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Máxima velocidad para <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Instagram / FB</span>
              </h2>
              <p className="text-silver/70 text-sm leading-relaxed">
                Dado que en Meta los usuarios buscan gratificación instantánea, no usamos pasos intermedios. El <strong>Link Directo</strong> redirige al instante a tu plataforma de pago (+18).
              </p>
              <div className="p-4 rounded-xl bg-[#0A0A0A]/50 border border-white/5 space-y-2 mt-4 backdrop-blur-sm">
                <h4 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">visibility_off</span>  Escudo Electrónico Anti-Bots
                </h4>
                <p className="text-xs text-silver/60">
                  Cuando los bots de Meta entran a revisar tu link, les mostramos automáticamente una "Safe Page" inofensiva que cumple todas sus políticas. Y los reales pasan directo sin detectar la trampa.
                </p>
              </div>
            </div>
          )}

          {dualTab === 'tiktok' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">local_fire_department</span> Puente Interactivo
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Aceptación total en <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400">TikTok</span>
              </h2>
              <p className="text-silver/70 text-sm leading-relaxed">
                TikTok es hiper-estricto. Poner un link directo a OnlyFans te lleva a un "Shadowban" o suspensión casi al instante. Nuestra <strong className="text-white">Landing VIP</strong> funciona como un área legal de paso.
              </p>
              <div className="p-4 rounded-xl bg-[#0A0A0A]/50 border border-white/5 space-y-2 mt-4 backdrop-blur-sm">
                <h4 className="text-rose-400 font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">psychology</span> Filtrado Psicológico
                </h4>
                <p className="text-xs text-silver/60">
                  Esta 'Landing' retiene al usuario, le pregunta su edad (+18) y ofrece un botón gigantesco que lo saca de TikTok suavemente hacia el contenido explícito, asegurando 0 baneos a nivel de algoritmo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* DERECHA: FLOWCHART VISUAL */}
        <div className="bg-[#050505]/95 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative overflow-hidden h-[380px] flex flex-col items-center justify-center">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
           <div className="w-full h-full relative z-10">
            
            {dualTab === 'dual' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                 <div className="px-5 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs font-bold shadow-lg text-white mb-6 z-20">Llegada de Tráfico (Usuarios)</div>
                 
                 <svg className="absolute w-[200px] h-[100px] top-[40px] -z-10" preserveAspectRatio="none">
                   <path d="M 100,0 C 100,20 20,40 20,100" stroke="rgba(244,63,94,0.4)" fill="transparent" strokeWidth="2" strokeDasharray="4" className="animate-[dash_2s_linear_infinite]" />
                   <path d="M 100,0 C 100,20 180,40 180,100" stroke="rgba(59,130,246,0.4)" fill="transparent" strokeWidth="2" strokeDasharray="4" className="animate-[dash_2s_linear_infinite]" />
                 </svg>

                 <div className="flex w-full justify-center gap-8 lg:gap-16 mt-6">
                    {/* TikTok Path */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black border border-rose-500/50 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                        <img src={tiktokLogo} alt="TikTok" className="w-full h-full object-contain filter invert opacity-90" />
                      </div>
                      <div className="px-3 py-1.5 bg-[#0A0A0A] border border-rose-500/30 text-[10px] text-rose-400 font-bold rounded shadow-lg text-center leading-tight">Landing Page<br/>VIP</div>
                      <div className="h-4 w-px bg-rose-500/50" />
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-[#00aff0] shadow-[0_0_15px_rgba(0,175,240,0.4)]">
                        <svg className="w-4 h-4 text-[#00aff0] fill-current" viewBox="0 0 24 24">
                          <path d="M12,14.66C8.32,14.66,5.33,11.67,5.33,8S8.32,1.33,12,1.33S18.66,4.32,18.66,8S15.68,14.66,12,14.66z M12,4.66c-1.84,0-3.33,1.5-3.33,3.33S10.16,11.33,12,11.33s3.33-1.5,3.33-3.33S13.84,4.66,12,4.66z M12,22.66c-3.68,0-6.66-2.98-6.66-6.66c0-0.74,0.12-1.45,0.34-2.11c0.16-0.49,0.59-0.84,1.1-0.9c0.51-0.06,1.01,0.17,1.26,0.61c0.41,0.72,0.63,1.54,0.63,2.4c0,2.02,1.64,3.66,3.66,3.66s3.66-1.64,3.66-3.66c0-0.86-0.22-1.68-0.63-2.4c-0.25-0.44-0.17-0.99,0.19-1.34c0.36-0.35,0.91-0.4,1.32-0.12c0.88,0.6,1.45,1.6,1.45,2.73C18.66,19.68,15.68,22.66,12,22.66z" />
                        </svg>
                      </div>
                    </div>

                    {/* Meta Path */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black border border-blue-500/50 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/1024px-Instagram_icon.png" alt="Meta" className="w-full h-full object-contain opacity-90" />
                      </div>
                      <div className="px-3 py-1.5 bg-[#0A0A0A] border border-blue-500/30 text-[10px] text-blue-400 font-bold rounded shadow-lg text-center leading-tight">Cloaking<br/>Link Directo</div>
                      <div className="h-4 w-px bg-blue-500/50" />
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-[#00aff0] shadow-[0_0_15px_rgba(0,175,240,0.4)]">
                        <svg className="w-4 h-4 text-[#00aff0] fill-current" viewBox="0 0 24 24">
                          <path d="M12,14.66C8.32,14.66,5.33,11.67,5.33,8S8.32,1.33,12,1.33S18.66,4.32,18.66,8S15.68,14.66,12,14.66z M12,4.66c-1.84,0-3.33,1.5-3.33,3.33S10.16,11.33,12,11.33s3.33-1.5,3.33-3.33S13.84,4.66,12,4.66z M12,22.66c-3.68,0-6.66-2.98-6.66-6.66c0-0.74,0.12-1.45,0.34-2.11c0.16-0.49,0.59-0.84,1.1-0.9c0.51-0.06,1.01,0.17,1.26,0.61c0.41,0.72,0.63,1.54,0.63,2.4c0,2.02,1.64,3.66,3.66,3.66s3.66-1.64,3.66-3.66c0-0.86-0.22-1.68-0.63-2.4c-0.25-0.44-0.17-0.99,0.19-1.34c0.36-0.35,0.91-0.4,1.32-0.12c0.88,0.6,1.45,1.6,1.45,2.73C18.66,19.68,15.68,22.66,12,22.66z" />
                        </svg>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {dualTab === 'meta' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                 <div className="flex gap-4 mb-4">
                   <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] uppercase font-bold text-red-400 text-center w-[120px] shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                     Algoritmo (Revisión)
                   </div>
                   <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-[10px] uppercase font-bold text-green-400 text-center w-[120px] shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                     Usuario Real (Humano)
                   </div>
                 </div>

                 <svg className="absolute w-[200px] h-[50px] top-[75px] -z-10" preserveAspectRatio="none">
                   <path d="M 60,0 C 60,25 100,25 100,50" stroke="rgba(239,68,68,0.5)" fill="transparent" strokeWidth="2" strokeDasharray="4" />
                   <path d="M 140,0 C 140,25 100,25 100,50" stroke="rgba(34,197,94,0.5)" fill="transparent" strokeWidth="2" strokeDasharray="4" />
                 </svg>

                 <div className="px-4 py-2 mt-4 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400 rounded-xl text-xs font-bold shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">security</span> Inteligencia Cloaking
                 </div>

                 <svg className="absolute w-[200px] h-[50px] top-[155px] -z-10" preserveAspectRatio="none">
                   <path d="M 100,0 C 100,25 40,25 40,50" stroke="rgba(239,68,68,0.5)" fill="transparent" strokeWidth="2" strokeDasharray="4" />
                   <path d="M 100,0 C 100,25 160,25 160,50" stroke="rgba(34,197,94,0.5)" fill="transparent" strokeWidth="2" strokeDasharray="4" />
                 </svg>
                 
                 <div className="flex gap-8 lg:gap-16 mt-4">
                   <div className="w-[100px] h-[100px] bg-red-950/20 border border-red-500/40 rounded-xl flex flex-col items-center justify-center p-2 shadow-lg backdrop-blur-sm">
                      <span className="material-symbols-outlined text-red-500 text-2xl mb-1 mt-1">block</span>
                      <span className="text-[8px] font-bold text-red-400 text-center uppercase">Contenido Falso<br/>Libre de +18</span>
                   </div>
                   <div className="w-[100px] h-[100px] bg-white border-[3px] border-green-500 rounded-xl flex flex-col items-center justify-center p-2 shadow-[0_0_20px_rgba(34,197,94,0.4)] relative">
                      <div className="absolute -top-3 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Acceso Libre</div>
                      <svg className="w-8 h-8 text-[#00aff0] fill-current mt-2" viewBox="0 0 24 24">
                        <path d="M12,14.66C8.32,14.66,5.33,11.67,5.33,8S8.32,1.33,12,1.33S18.66,4.32,18.66,8S15.68,14.66,12,14.66z M12,4.66c-1.84,0-3.33,1.5-3.33,3.33S10.16,11.33,12,11.33s3.33-1.5,3.33-3.33S13.84,4.66,12,4.66z M12,22.66c-3.68,0-6.66-2.98-6.66-6.66c0-0.74,0.12-1.45,0.34-2.11c0.16-0.49,0.59-0.84,1.1-0.9c0.51-0.06,1.01,0.17,1.26,0.61c0.41,0.72,0.63,1.54,0.63,2.4c0,2.02,1.64,3.66,3.66,3.66s3.66-1.64,3.66-3.66c0-0.86-0.22-1.68-0.63-2.4c-0.25-0.44-0.17-0.99,0.19-1.34c0.36-0.35,0.91-0.4,1.32-0.12c0.88,0.6,1.45,1.6,1.45,2.73C18.66,19.68,15.68,22.66,12,22.66z" />
                      </svg>
                      <span className="text-[8px] font-black text-white bg-red-600 px-1 py-0.5 mt-1 rounded uppercase">+18 Explícito</span>
                   </div>
                 </div>
              </div>
            )}

            {dualTab === 'tiktok' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                 <div className="flex items-center gap-2 px-4 py-2.5 bg-black border border-white/10 rounded-xl shadow-lg relative z-20">
                   <img src={tiktokLogo} alt="TikTok" className="w-5 h-5 filter invert opacity-80" />
                   <span className="text-sm font-bold text-white">Tráfico TikTok (1 Millón Views)</span>
                 </div>
                 
                 <div className="h-10 w-px bg-rose-500/50 my-1 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                 
                 <div className="w-[220px] bg-[#0A0A0A] border-2 border-rose-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(244,63,94,0.15)] relative">
                    <div className="absolute top-2.5 right-3 flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/60" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                      <div className="w-2 h-2 rounded-full bg-green-500/60" />
                    </div>
                    <div className="w-12 h-3 bg-white/20 rounded mx-auto mt-2" />
                    <div className="w-28 h-2 bg-white/10 rounded mx-auto mt-2 mb-4" />
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="h-10 bg-white/5 rounded-lg border border-white/10" />
                      <div className="h-10 bg-[#1A1A1A] rounded-lg border border-white/10" />
                    </div>
                    <div className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-[10px] text-white font-bold text-center rounded-lg shadow-lg uppercase tracking-wider transition-colors cursor-pointer">
                      Ver contenido explícito
                    </div>
                 </div>

                 <div className="h-10 w-px bg-blue-500/50 my-1 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.3)]" />

                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-[3px] border-[#00aff0] shadow-[0_0_20px_rgba(0,175,240,0.4)]">
                    <svg className="w-8 h-8 text-[#00aff0] fill-current" viewBox="0 0 24 24">
                      <path d="M12,14.66C8.32,14.66,5.33,11.67,5.33,8S8.32,1.33,12,1.33S18.66,4.32,18.66,8S15.68,14.66,12,14.66z M12,4.66c-1.84,0-3.33,1.5-3.33,3.33S10.16,11.33,12,11.33s3.33-1.5,3.33-3.33S13.84,4.66,12,4.66z M12,22.66c-3.68,0-6.66-2.98-6.66-6.66c0-0.74,0.12-1.45,0.34-2.11c0.16-0.49,0.59-0.84,1.1-0.9c0.51-0.06,1.01,0.17,1.26,0.61c0.41,0.72,0.63,1.54,0.63,2.4c0,2.02,1.64,3.66,3.66,3.66s3.66-1.64,3.66-3.66c0-0.86-0.22-1.68-0.63-2.4c-0.25-0.44-0.17-0.99,0.19-1.34c0.36-0.35,0.91-0.4,1.32-0.12c0.88,0.6,1.45,1.6,1.45,2.73C18.66,19.68,15.68,22.66,12,22.66z" />
                    </svg>
                  </div>
              </div>
            )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DualSystemSection;
