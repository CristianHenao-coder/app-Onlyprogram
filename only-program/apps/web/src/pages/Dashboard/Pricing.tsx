import { useNavigate } from "react-router-dom";
import { useState } from "react";
import instagramLogo from "@/assets/animations/instagram.png";
import tiktokLogo from "@/assets/animations/tik-tok.png";
import { supabase } from "@/services/supabase";
import toast from "react-hot-toast";

export default function DashboardPricing() {
  const navigate = useNavigate();
  const [linkCount, setLinkCount] = useState<number>(1);
  const [dualTab, setDualTab] = useState<'dual' | 'meta' | 'tiktok'>('dual');
  const [linkType, setLinkType] = useState<'meta' | 'tiktok' | 'dual'>('dual');

  const SERVICE_PRICES = { meta: 59, tiktok: 69, dual: 83 } as const;
  const basePrice = SERVICE_PRICES[linkType];

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount_percent: number} | null>(null);
  const [couponError, setCouponError] = useState('');

  const getDiscount = (count: number) => {
    if (count >= 20) return 0.25;
    if (count >= 10) return 0.12;
    if (count >= 5) return 0.05;
    return 0;
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('code, discount_percent, is_active, expires_at')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setCouponError('Cupón no válido o inactivo.');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('Este cupón ha expirado.');
        return;
      }

      setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
      toast.success(`¡Cupón de ${data.discount_percent}% aplicado!`);
    } catch {
      setCouponError('Error al validar el cupón.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const currentDiscount = getDiscount(linkCount);
  let totalPrice = (basePrice * linkCount) * (1 - currentDiscount);
  
  if (appliedCoupon) {
    totalPrice = totalPrice * (1 - appliedCoupon.discount_percent / 100);
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar lg:p-4 pb-32">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* ENCABEZADO */}
        <div className="text-center space-y-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -z-10" />
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
            Planes y <span className="text-primary">Servicios</span>
          </h1>
          <p className="text-silver/60 max-w-2xl mx-auto text-sm leading-relaxed">
            Tu Póliza de Seguro Digital. Infraestructura Anti-Baneos B2B para Creadores de Contenido de Alto Riesgo. Diseñada con técnicas de <strong>Hacking Ético</strong> para blindar tus redes sociales y llevar tu tráfico a OnlyFans sin filtros.
          </p>
        </div>

        {/* CONCEPTOS CLAVE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon="security" 
            title="Escudo Cloaking & Antidetección" 
            color="text-blue-500"
            bg="bg-blue-500/10"
            border="border-blue-500/20"
            desc="Ocultamos la URL real a los algoritmos de revisión (bots). Cuando un revisor entra, ve un sitio 'limpio', pero tus usuarios reales ven tu contenido."
          />
          <FeatureCard 
            icon="smart_toy" 
            title="Detención de Bots" 
            color="text-red-500"
            bg="bg-red-500/10"
            border="border-red-500/20"
            desc="Bloqueamos automáticamente crawlers, bots espías y software malicioso que intentan rastrear o banear tus enlaces de redes sociales."
          />
          <FeatureCard 
            icon="travel_explore" 
            title="Geofilter Avanzado" 
            color="text-green-500"
            bg="bg-green-500/10"
            border="border-green-500/20"
            desc="Elige qué países pueden ver tu enlace y cuáles no. Bloquea regiones enteras para proteger tu identidad y evitar denuncias irrelevantes."
          />
          <FeatureCard 
            icon="rotate_right" 
            title="Rotador de Tráfico Inteligente" 
            color="text-orange-500"
            bg="bg-orange-500/10"
            border="border-orange-500/20"
            desc="Distribuye automáticamente a tus visitantes entre múltiples URLs. Ideal para agencias que manejan varios perfiles o grupos de Telegram sin saturar un solo enlace."
          />
          <FeatureCard 
            icon="language" 
            title="Dominios Personalizados Seguros" 
            color="text-purple-500"
            bg="bg-purple-500/10"
            border="border-purple-500/20"
            desc="Mejora la confianza del usuario y aumenta enormemente tus clics. Conecta tus propios dominios web y nosotros los aseguramos y blindamos automáticamente."
          />
          <FeatureCard 
            icon="support_agent" 
            title="Atención Personalizada y Garantía" 
            color="text-teal-500"
            bg="bg-teal-500/10"
            border="border-teal-500/20"
            desc="Te ofrecemos garantía total. Aunque es extremadamente raro que un dominio falle en nuestra plataforma, si llega a suceder te aseguramos un reemplazo inmediato y un servicio excelente en todo momento."
          />
        </div>


        {/* EL SISTEMA DUAL (PRO) CON TABS */}
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
                  <button onClick={() => navigate('/dashboard/links')} className="mt-4 w-full md:w-auto px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all uppercase tracking-wider">
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

            {/* DERECHA: FLOWCHART VISUAL (A LO 2D PLANO) */}
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
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                            <span className="text-[8px] font-black text-blue-500">OF</span>
                          </div>
                        </div>

                        {/* Meta Path */}
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black border border-blue-500/50 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <img src={instagramLogo} alt="Meta" className="w-full h-full object-contain opacity-90" />
                          </div>
                          <div className="px-3 py-1.5 bg-[#0A0A0A] border border-blue-500/30 text-[10px] text-blue-400 font-bold rounded shadow-lg text-center leading-tight">Cloaking<br/>Link Directo</div>
                          <div className="h-4 w-px bg-blue-500/50" />
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                            <span className="text-[8px] font-black text-blue-500">OF</span>
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
                          <span className="text-[14px] font-black text-blue-500 mt-2">Only<span className="text-black">Fans</span></span>
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

                     <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-[3px] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                        <span className="text-xs font-black text-blue-500">OF</span>
                     </div>
                  </div>
                )}
               </div>
            </div>
          </div>
        </div>

        {/* USO DE CUPONES */}
        <div className="mb-12 p-6 rounded-[2rem] bg-[#0A0A0A] border border-white/5 flex flex-col md:flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/30 shadow-[0_0_20px_rgba(147,51,234,0.4)] animate-bounce" style={{animationDuration: '2.5s', animationTimingFunction: 'cubic-bezier(0.28,0.84,0.42,1)'}}>
            <span className="material-symbols-outlined text-3xl drop-shadow-[0_0_8px_rgba(147,51,234,0.9)]">local_activity</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Pagos Transparentes y Cupones</h3>
            <p className="text-sm text-silver/60 leading-relaxed max-w-2xl">
              Al renovar o adquirir tu suscripción mensual, incluyendo el <strong className="text-white">Sistema Dual (+16$/mes)</strong>, si tienes un <strong>Cupón de Descuento</strong>, el porcentaje aplicará directamente sobre la suma total de tu compra. ¡Consigue tus pro-links todavía más baratos!
            </p>
          </div>
        </div>

        {/* CALCULADORA Y PLANES BASE */}
        <div className="space-y-6 bg-gradient-to-br from-[#0A0A12] to-[#080810] p-6 lg:p-10 rounded-[2rem] border border-blue-500/10 shadow-xl shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/8 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/6 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-silver/40">Calculadora</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-1">Compra individual o <br className="hidden md:block"/> masiva</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap items-end sm:items-center gap-3">
              
              {appliedCoupon ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-500/10 border border-green-500/20 shrink-0">
                  <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                  <span className="text-sm font-bold text-green-400">{appliedCoupon.code} <span className="text-xs opacity-70">(-{appliedCoupon.discount_percent}%)</span></span>
                  <button onClick={removeCoupon} className="ml-1 text-green-400 hover:text-green-300">
                    <span className="material-symbols-outlined text-sm pt-1">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1 items-end relative shrink-0">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Código del cupón"
                      className="w-36 sm:w-44 px-4 py-2.5 rounded-xl border border-white/10 bg-[#0F1414] text-xs font-mono text-white placeholder:text-silver/30 focus:outline-none focus:border-primary/50"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || couponLoading}
                      className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {couponLoading ? (
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                    </button>
                  </div>
                  {couponError && <span className="text-[10px] text-red-400 absolute -bottom-5 right-0">{couponError}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-6">
            {/* SELECTOR DE TIPO DE SERVICIO */}
            <p className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-3">Tipo de servicio</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => setLinkType('meta')}
                className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                  linkType === 'meta'
                    ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                    : 'bg-[#050505] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${linkType === 'meta' ? 'text-blue-400' : 'text-silver/40'}`}>public</span>
                  <span className={`text-xs font-black uppercase tracking-wide ${linkType === 'meta' ? 'text-blue-300' : 'text-silver/50'}`}>Meta</span>
                </div>
                <span className={`text-xl font-black leading-none ${linkType === 'meta' ? 'text-white' : 'text-silver/60'}`}>
                  $59<span className="text-[11px] font-bold opacity-60">/mes</span>
                </span>
                <span className={`text-[10px] font-semibold ${linkType === 'meta' ? 'text-blue-400/70' : 'text-silver/30'}`}>Instagram &amp; Facebook</span>
              </button>

              <button
                onClick={() => setLinkType('tiktok')}
                className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                  linkType === 'tiktok'
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : 'bg-[#050505] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${linkType === 'tiktok' ? 'text-rose-400' : 'text-silver/40'}`}>smart_display</span>
                  <span className={`text-xs font-black uppercase tracking-wide ${linkType === 'tiktok' ? 'text-rose-300' : 'text-silver/50'}`}>TikTok</span>
                </div>
                <span className={`text-xl font-black leading-none ${linkType === 'tiktok' ? 'text-white' : 'text-silver/60'}`}>
                  $69<span className="text-[11px] font-bold opacity-60">/mes</span>
                </span>
                <span className={`text-[10px] font-semibold ${linkType === 'tiktok' ? 'text-rose-400/70' : 'text-silver/30'}`}>Landing VIP TikTok</span>
              </button>

              <button
                onClick={() => setLinkType('dual')}
                className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                  linkType === 'dual'
                    ? 'bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(147,51,234,0.15)]'
                    : 'bg-[#050505] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${linkType === 'dual' ? 'text-primary' : 'text-silver/40'}`}>alt_route</span>
                  <span className={`text-xs font-black uppercase tracking-wide ${linkType === 'dual' ? 'text-purple-300' : 'text-silver/50'}`}>Dual</span>
                  {linkType === 'dual' && <span className="text-[8px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">⭐ Top</span>}
                </div>
                <span className={`text-xl font-black leading-none ${linkType === 'dual' ? 'text-white' : 'text-silver/60'}`}>
                  $83<span className="text-[11px] font-bold opacity-60">/mes</span>
                </span>
                <span className={`text-[10px] font-semibold ${linkType === 'dual' ? 'text-primary/70' : 'text-silver/30'}`}>Meta + TikTok incluidos</span>
              </button>
            </div>

            <div className="flex justify-between text-sm mb-3">
              <span className="text-silver/60">Cantidad de links</span>
              <span className="font-bold text-white text-lg">{linkCount}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="30" 
              value={linkCount} 
              onChange={(e) => setLinkCount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 relative z-10">
            <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount < 5 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(1)}>
              <span className="text-base font-black text-white mb-1">1 por link</span>
              <span className={`text-lg font-black ${linkCount < 5 ? 'text-primary' : 'text-silver/70'}`}>${basePrice}<span className="text-xs font-bold opacity-60">/mes</span></span>
              <span className={`text-[11px] font-semibold mt-0.5 ${linkCount < 5 ? 'text-primary/70' : 'text-silver/40'}`}>Precio base</span>
            </div>
            <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount >= 5 && linkCount < 10 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(5)}>
              <span className="text-base font-black text-white mb-1">5 links</span>
              <span className={`text-lg font-black ${linkCount >= 5 && linkCount < 10 ? 'text-primary' : 'text-silver/70'}`}>${(basePrice * 5 * 0.95).toFixed(0)}<span className="text-xs font-bold opacity-60">/mes</span></span>
              <span className={`text-[11px] font-semibold mt-0.5 ${linkCount >= 5 && linkCount < 10 ? 'text-primary/70' : 'text-silver/40'}`}>-5% dto.</span>
            </div>
            <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount >= 10 && linkCount < 20 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(10)}>
              <span className="text-base font-black text-white mb-1">10 links</span>
              <span className={`text-lg font-black ${linkCount >= 10 && linkCount < 20 ? 'text-primary' : 'text-silver/70'}`}>${(basePrice * 10 * 0.88).toFixed(0)}<span className="text-xs font-bold opacity-60">/mes</span></span>
              <span className={`text-[11px] font-semibold mt-0.5 ${linkCount >= 10 && linkCount < 20 ? 'text-primary/70' : 'text-silver/40'}`}>-12% dto.</span>
            </div>
            <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount >= 20 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(20)}>
              <span className="text-base font-black text-white mb-1">20 links</span>
              <span className={`text-lg font-black ${linkCount >= 20 ? 'text-primary' : 'text-silver/70'}`}>${(basePrice * 20 * 0.75).toFixed(0)}<span className="text-xs font-bold opacity-60">/mes</span></span>
              <span className={`text-[11px] font-semibold mt-0.5 ${linkCount >= 20 ? 'text-primary/70' : 'text-silver/40'}`}>-25% dto.</span>
            </div>
          </div>

          <div className="pt-6 relative z-10 flex flex-col sm:flex-row justify-between items-center bg-[#050505] border border-white/5 p-6 rounded-2xl mt-4">
            <div className="w-full sm:w-auto text-center sm:text-left mb-4 sm:mb-0">
              <p className="text-silver/50 text-xs font-bold uppercase tracking-wider mb-1">Costo Estimado Mensual</p>
              <div className="flex items-end justify-center sm:justify-start gap-3">
                 <span className="text-4xl font-black text-white">${totalPrice.toFixed(0)} <span className="text-lg text-silver/40 font-bold">USD</span></span>
                 {currentDiscount > 0 && (
                   <span className="text-sm text-silver/50 line-through mb-1">${(basePrice * linkCount).toFixed(0)}</span>
                 )}
              </div>
            </div>
            <button 
                onClick={() => navigate('/dashboard/links')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black text-sm font-black hover:bg-silver transition-all uppercase tracking-widest shadow-xl shadow-white/10"
            >
              Comenzar Ahora
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, bg, border }: { icon: string, title: string, desc: string, color: string, bg: string, border: string }) {
  return (
    <div className="p-6 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 hover:bg-[#0E0E0E] transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${bg} ${border} border`}>
        <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-silver/50 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
}
