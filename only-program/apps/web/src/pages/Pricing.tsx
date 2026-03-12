import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from '@/contexts/I18nContext';
import { productPricingService, type ProductPricingConfig, DEFAULT_PRODUCT_PRICING } from '@/services/productPricing.service';
import instagramLogo from '@/assets/animations/instagram.png';
import tiktokLogo from '@/assets/animations/tik-tok.png';

export default function Pricing() {
  const { t } = useTranslation();

  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(DEFAULT_PRODUCT_PRICING);
  useEffect(() => {
    let mounted = true;
    productPricingService.get().then((cfg) => { if (mounted) setPricingCfg(cfg); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  void pricingCfg;

  const [showCouponGuide, setShowCouponGuide] = useState(false);
  const [dualTab, setDualTab] = useState<'dual' | 'meta' | 'tiktok'>('dual');
  const [linkType, setLinkType] = useState<'meta' | 'tiktok' | 'dual'>('dual');
  const [linkCount, setLinkCount] = useState(1);

  const SERVICE_PRICES = { meta: 59, tiktok: 69, dual: 83 } as const;
  const basePrice = SERVICE_PRICES[linkType];

  const getDiscount = (count: number) => {
    if (count >= 20) return 0.25;
    if (count >= 10) return 0.12;
    if (count >= 5) return 0.05;
    return 0;
  };
  const currentDiscount = getDiscount(linkCount);
  const totalPrice = basePrice * linkCount * (1 - currentDiscount);

  return (
    <div className="min-h-screen bg-background-dark text-silver">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-16" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        <section className="relative overflow-hidden">
          <div className="hero-gradient absolute inset-0 -z-10" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 data-reveal className="text-3xl sm:text-5xl font-extrabold text-white">
                {t('pricing.title')}
              </h1>
              <p data-reveal data-delay="2" className="mt-4 text-silver/65 max-w-2xl mx-auto">
                {t('pricingPage.subtitle')} <span className="text-white">{t('pricingPage.warning')}</span>.
              </p>
            </div>

            {/* CONCEPTOS CLAVE */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-reveal>
              <PubFeatureCard icon="security" title="Escudo Cloaking & Antidetección" color="text-blue-500" bg="bg-blue-500/10" border="border-blue-500/20" desc="Ocultamos la URL real a los algoritmos de revisión (bots). Cuando un revisor entra, ve un sitio 'limpio', pero tus usuarios reales ven tu contenido." />
              <PubFeatureCard icon="smart_toy" title="Detención de Bots" color="text-red-500" bg="bg-red-500/10" border="border-red-500/20" desc="Bloqueamos automáticamente crawlers, bots espías y software malicioso que intentan rastrear o banear tus enlaces de redes sociales." />
              <PubFeatureCard icon="travel_explore" title="Geofilter Avanzado" color="text-green-500" bg="bg-green-500/10" border="border-green-500/20" desc="Elige qué países pueden ver tu enlace y cuáles no. Bloquea regiones enteras para proteger tu identidad y evitar denuncias irrelevantes." />
              <PubFeatureCard icon="rotate_right" title="Rotador de Tráfico Inteligente" color="text-orange-500" bg="bg-orange-500/10" border="border-orange-500/20" desc="Distribuye automáticamente a tus visitantes entre múltiples URLs. Ideal para agencias que manejan varios perfiles o grupos de Telegram sin saturar un solo enlace." />
              <PubFeatureCard icon="language" title="Dominios Personalizados Seguros" color="text-purple-500" bg="bg-purple-500/10" border="border-purple-500/20" desc="Mejora la confianza del usuario y aumenta enormemente tus clics. Conecta tus propios dominios web y nosotros los aseguramos y blindamos automáticamente." />
              <PubFeatureCard icon="support_agent" title="Atención Personalizada y Garantía" color="text-teal-500" bg="bg-teal-500/10" border="border-teal-500/20" desc="Te ofrecemos garantía total. Aunque es extremadamente raro que un dominio falle en nuestra plataforma, si llega a suceder te aseguramos un reemplazo inmediato y un servicio excelente en todo momento." />
            </div>

            {/* SISTEMA DUAL CON TABS */}
            <div className={`mt-14 relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden pt-6 mb-12 group ${dualTab === 'dual' ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.15)]' : 'bg-gradient-to-br from-[#0e0e0e] to-[#111116] border-white/8 shadow-[0_0_30px_rgba(0,0,0,0.4)]'}`} data-reveal>
              <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full mix-blend-screen transition-all pointer-events-none ${dualTab === 'dual' ? 'bg-purple-500/20 group-hover:bg-purple-500/30' : 'bg-white/5'}`} />

              <div className="relative z-20 flex items-center gap-2 px-8 md:px-12 overflow-x-auto">
                <button onClick={() => setDualTab('dual')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dualTab === 'dual' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-silver hover:bg-white/10'}`}>
                  <span className="material-symbols-outlined text-[1em]">alt_route</span>Sistema Dual Completo
                </button>
                <button onClick={() => setDualTab('meta')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dualTab === 'meta' ? 'bg-[#1e1e1e] text-white border border-white/15 shadow-lg' : 'bg-white/5 text-silver hover:bg-white/10'}`}>
                  <span className="material-symbols-outlined text-[1em]">public</span>Meta Directo
                </button>
                <button onClick={() => setDualTab('tiktok')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dualTab === 'tiktok' ? 'bg-[#1e1e1e] text-white border border-white/15 shadow-lg' : 'bg-white/5 text-silver hover:bg-white/10'}`}>
                  <span className="material-symbols-outlined text-[1em]">smart_display</span>TikTok Landing VIP
                </button>
              </div>

              <div className="p-8 md:p-12 pt-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[440px]">
                <div className="space-y-6">
                  {dualTab === 'dual' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                          <span className="material-symbols-outlined text-sm">auto_awesome</span> El más recomendado
                        </div>
                        <div className="flex items-end gap-1 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10">
                          <span className="text-white font-black text-2xl leading-none">$83</span>
                          <span className="text-silver/50 text-xs font-bold mb-0.5">/mes por link</span>
                        </div>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">Sistema Híbrido <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Dual</span></h2>
                      <p className="text-silver/70 text-sm leading-relaxed">¡La solución definitiva! El <strong>Sistema Dual</strong> segmenta a tus visitantes automáticamente y los redirige por la ruta más segura y con mayor conversión según la red social de donde vengan.</p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3"><span className="material-symbols-outlined text-purple-400 mt-0.5 text-lg">savings</span><p className="text-sm text-silver/80"><strong>Ahorro masivo:</strong> Obtienes tecnología para ambas redes por una pequeña fracción del costo.</p></li>
                        <li className="flex items-start gap-3"><span className="material-symbols-outlined text-purple-400 mt-0.5 text-lg">rocket_launch</span><p className="text-sm text-silver/80"><strong>Evita el Shadowbanneo:</strong> Disminuye masivamente el riesgo de bloqueo al usar rutas hiper-especializadas.</p></li>
                      </ul>
                      <Link to="/register" className="mt-4 inline-block px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all uppercase tracking-wider">Crear Link Dual Ahora</Link>
                    </div>
                  )}
                  {dualTab === 'meta' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest"><span className="material-symbols-outlined text-sm">security</span> Cloaking Activo</div>
                        <div className="flex items-end gap-1 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10"><span className="text-white font-black text-2xl leading-none">$59</span><span className="text-silver/50 text-xs font-bold mb-0.5">/mes por link</span></div>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">Máxima velocidad para <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Instagram / FB</span></h2>
                      <p className="text-silver/70 text-sm leading-relaxed">El <strong>Link Directo</strong> redirige al instante a tu plataforma de pago (+18) sin pasos intermedios.</p>
                      <div className="p-4 rounded-xl bg-[#0A0A0A]/50 border border-white/5 space-y-2 backdrop-blur-sm">
                        <h4 className="text-blue-400 font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined text-base">visibility_off</span> Escudo Anti-Bots</h4>
                        <p className="text-xs text-silver/60">Los bots de Meta ven una "Safe Page" inofensiva. Tus usuarios reales pasan directo sin detectar la trampa.</p>
                      </div>
                    </div>
                  )}
                  {dualTab === 'tiktok' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-widest"><span className="material-symbols-outlined text-sm">local_fire_department</span> Puente Interactivo</div>
                        <div className="flex items-end gap-1 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10"><span className="text-white font-black text-2xl leading-none">$69</span><span className="text-silver/50 text-xs font-bold mb-0.5">/mes por link</span></div>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">Aceptación total en <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400">TikTok</span></h2>
                      <p className="text-silver/70 text-sm leading-relaxed">Nuestra <strong className="text-white">Landing VIP</strong> funciona como un área legal de paso para evitar el Shadowban de TikTok.</p>
                      <div className="p-4 rounded-xl bg-[#0A0A0A]/50 border border-white/5 space-y-2 backdrop-blur-sm">
                        <h4 className="text-rose-400 font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined text-base">psychology</span> Filtrado Psicológico</h4>
                        <p className="text-xs text-silver/60">Pregunta la edad (+18) y saca al usuario de TikTok suavemente hacia tu contenido. 0 baneos a nivel de algoritmo.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* DERECHA: FLOWCHART */}
                <div className="bg-[#050505]/95 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative overflow-hidden h-[360px] flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  <div className="w-full h-full relative z-10">
                    {dualTab === 'dual' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="px-5 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs font-bold shadow-lg text-white mb-6">Llegada de Tráfico (Usuarios)</div>
                        <div className="flex w-full justify-center gap-8 lg:gap-16 mt-6">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-black border border-rose-500/50 flex items-center justify-center p-2"><img src={tiktokLogo} alt="TikTok" className="w-full h-full object-contain filter invert opacity-90" /></div>
                            <div className="px-3 py-1.5 bg-[#0A0A0A] border border-rose-500/30 text-[10px] text-rose-400 font-bold rounded text-center">Landing Page<br/>VIP</div>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-rose-500"><span className="text-[8px] font-black text-blue-500">OF</span></div>
                          </div>
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-black border border-blue-500/50 flex items-center justify-center p-2"><img src={instagramLogo} alt="Meta" className="w-full h-full object-contain opacity-90" /></div>
                            <div className="px-3 py-1.5 bg-[#0A0A0A] border border-blue-500/30 text-[10px] text-blue-400 font-bold rounded text-center">Cloaking<br/>Link Directo</div>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-blue-500"><span className="text-[8px] font-black text-blue-500">OF</span></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {dualTab !== 'dual' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 gap-4">
                        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center p-3 ${dualTab === 'meta' ? 'bg-black border-blue-500/50' : 'bg-black border-rose-500/50'}`}>
                          <img src={dualTab === 'meta' ? instagramLogo : tiktokLogo} alt={dualTab} className={`w-full h-full object-contain ${dualTab === 'tiktok' ? 'filter invert opacity-90' : 'opacity-90'}`} />
                        </div>
                        <div className={`text-xs font-bold uppercase tracking-wider ${dualTab === 'meta' ? 'text-blue-400' : 'text-rose-400'}`}>{dualTab === 'meta' ? 'Instagram / Facebook' : 'TikTok'}</div>
                        <div className="h-8 w-px bg-white/20" />
                        <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${dualTab === 'meta' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                          {dualTab === 'meta' ? '🛡️ Cloaking + Redirección Directa' : '🔞 Landing VIP + Filtro de Edad'}
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-blue-500"><span className="text-xs font-black text-blue-500">OF</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* INFO CARD - PAGOS Y CUPONES */}
            <div className="mb-12 p-6 rounded-[2rem] bg-[#0A0A0A] border border-white/5 flex flex-col md:flex-row items-center gap-5" data-reveal>
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/30 shadow-[0_0_20px_rgba(147,51,234,0.4)] animate-bounce" style={{animationDuration:'2.5s', animationTimingFunction:'cubic-bezier(0.28,0.84,0.42,1)'}}>
                <span className="material-symbols-outlined text-3xl drop-shadow-[0_0_8px_rgba(147,51,234,0.9)]">local_activity</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Pagos Transparentes y Cupones</h3>
                <p className="text-sm text-silver/60 leading-relaxed max-w-2xl">Al renovar o adquirir tu suscripción mensual, incluyendo el <strong className="text-white">Sistema Dual (+16$/mes)</strong>, si tienes un <strong>Cupón de Descuento</strong>, el porcentaje aplicará directamente sobre la suma total de tu compra. ¡Consigue tus pro-links todavía más baratos!</p>
              </div>
            </div>

            {/* CALCULADORA */}
            <div className="space-y-6 bg-gradient-to-br from-[#0A0A12] to-[#080810] p-6 lg:p-10 rounded-[2rem] border border-blue-500/10 shadow-xl shadow-blue-900/10 relative overflow-hidden mb-12" data-reveal>
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/8 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/6 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-silver/40">Calculadora</span>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">Compra individual o masiva</h2>
              </div>

              <div className="relative z-10 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-3">Tipo de servicio</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {(['meta','tiktok','dual'] as const).map((type) => {
                    const cfg = { meta: { icon:'public', label:'Meta', price:59, sub:'Instagram & Facebook', color:'blue' }, tiktok: { icon:'smart_display', label:'TikTok', price:69, sub:'Landing VIP TikTok', color:'rose' }, dual: { icon:'alt_route', label:'Dual', price:83, sub:'Meta + TikTok incluidos', color:'purple' } }[type];
                    const active = linkType === type;
                    const colorsStr = { blue: active ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 text-blue-300' : 'bg-[#050505] border-white/5 hover:border-white/10 text-silver/40 text-silver/50', rose: active ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 text-rose-300' : 'bg-[#050505] border-white/5 hover:border-white/10 text-silver/40 text-silver/50', purple: active ? 'bg-primary/10 border-primary/40 text-primary text-purple-300' : 'bg-[#050505] border-white/5 hover:border-white/10 text-silver/40 text-silver/50' }[cfg.color] ?? 'bg-[#050505] border-white/5 text-silver/40 text-silver/50';
                    const parts = colorsStr.split(' ');
                    return (
                      <button key={type} onClick={() => setLinkType(type)} className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${active ? parts.slice(0,2).join(' ') : 'bg-[#050505] border-white/5 hover:border-white/10'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-base ${active ? parts[2] : 'text-silver/40'}`}>{cfg.icon}</span>
                          <span className={`text-xs font-black uppercase tracking-wide ${active ? parts[3] : 'text-silver/50'}`}>{cfg.label}</span>
                          {type === 'dual' && active && <span className="text-[8px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase">⭐ Top</span>}
                        </div>
                        <span className={`text-xl font-black leading-none ${active ? 'text-white' : 'text-silver/60'}`}>${cfg.price}<span className="text-[11px] font-bold opacity-60">/mes</span></span>
                        <span className={`text-[10px] font-semibold ${active ? (parts[2] ?? '') + '/70' : 'text-silver/30'}`}>{cfg.sub}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between text-sm mb-3">
                  <span className="text-silver/60">Cantidad de links</span>
                  <span className="font-bold text-white text-lg">{linkCount}</span>
                </div>
                <input type="range" min="1" max="30" value={linkCount} onChange={(e) => setLinkCount(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {[{n:1,label:'1 por link',sub:'Precio base',min:0,max:5},{n:5,label:'5 links',sub:'-5% dto.',min:5,max:10},{n:10,label:'10 links',sub:'-12% dto.',min:10,max:20},{n:20,label:'20 links',sub:'-25% dto.',min:20,max:999}].map(tier => {
                  const active = linkCount >= tier.min && (tier.min === 0 ? linkCount < 5 : tier.min === 5 ? linkCount < 10 : tier.min === 10 ? linkCount < 20 : linkCount >= 20);
                  const disc = [0,0.05,0.12,0.25][[0,1,2,3].find(i => [0,5,10,20][i] === tier.min) ?? 0];
                  const price = (basePrice * tier.n * (1 - disc)).toFixed(0);
                  return (
                    <div key={tier.n} className={`p-4 rounded-2xl border transition-all flex flex-col cursor-pointer ${active ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(tier.n)}>
                      <span className="text-base font-black text-white mb-1">{tier.label}</span>
                      <span className={`text-lg font-black ${active ? 'text-primary' : 'text-silver/70'}`}>${price}<span className="text-xs font-bold opacity-60">/mes</span></span>
                      <span className={`text-[11px] font-semibold mt-0.5 ${active ? 'text-primary/70' : 'text-silver/40'}`}>{tier.sub}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 relative z-10 flex flex-col sm:flex-row justify-between items-center bg-[#050505] border border-white/5 p-6 rounded-2xl">
                <div className="w-full sm:w-auto text-center sm:text-left mb-4 sm:mb-0">
                  <p className="text-silver/50 text-xs font-bold uppercase tracking-wider mb-1">Costo Estimado Mensual</p>
                  <div className="flex items-end justify-center sm:justify-start gap-3">
                    <span className="text-4xl font-black text-white">${totalPrice.toFixed(0)} <span className="text-lg text-silver/40 font-bold">USD</span></span>
                    {currentDiscount > 0 && <span className="text-sm text-silver/50 line-through mb-1">${(basePrice * linkCount).toFixed(0)}</span>}
                  </div>
                </div>
                <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black text-sm font-black hover:bg-silver transition-all uppercase tracking-widest shadow-xl shadow-white/10 text-center">Comenzar Ahora</Link>
              </div>
            </div>


            <div className="mt-12 max-w-4xl mx-auto" data-reveal>
              <div className="rounded-[2rem] border border-primary/30 bg-primary/10 p-6 sm:p-8 text-center cursor-pointer transition-all hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_30px_rgba(29,161,242,0.1)]" onClick={() => setShowCouponGuide(!showCouponGuide)}>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary text-3xl">local_offer</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">¿Cómo conseguir un cupón del 33% OFF?</h3>
                </div>
                <p className="text-silver/70 font-medium text-sm sm:text-base">Haz clic aquí para descubrir cómo obtener un descuento especial para tu primera compra.</p>
                
                {showCouponGuide && (
                  <div className="mt-8 pt-8 border-t border-primary/20 text-left animate-fade-in">
                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">stars</span>
                      Sigue estos sencillos pasos:
                    </h4>
                    <ol className="list-decimal list-outside ml-6 space-y-4 text-silver/80 font-medium">
                      <li>Síguenos en nuestra cuenta oficial de Instagram: <a href="http://instagram.com/blackonlypro/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors underline font-bold">@blackonlypro</a>.</li>
                      <li>Busca nuestra <strong className="text-white">última publicación fijada</strong> relacionada con el cupón.</li>
                      <li>Comenta la palabra <span className="text-primary font-extrabold uppercase bg-primary/20 px-2 py-0.5 rounded text-[13px]">"CUPON"</span> en esa publicación.</li>
                      <li>¡Listo! Recibirás inmediatamente tu cupón del <strong className="text-green-400">33% de descuento</strong> por mensaje directo para aplicarlo en tu primera compra en la plataforma.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ */}
            <div id="faq" className="mt-16 grid md:grid-cols-3 gap-6">
              <div data-reveal className="rounded-3xl border border-border bg-surface/30 p-6 card-hover">
                <p className="text-white font-bold">{t('pricingPage.faq.q1')}</p>
                <p className="text-sm text-silver/60 mt-2">
                  {t('pricingPage.faq.a1')}
                </p>
              </div>
              <div data-reveal data-delay="2" className="rounded-3xl border border-border bg-surface/30 p-6 card-hover">
                <p className="text-white font-bold">{t('pricingPage.faq.q2')}</p>
                <p className="text-sm text-silver/60 mt-2">
                  {t('pricingPage.faq.a2')}
                </p>
              </div>
              <div data-reveal data-delay="3" className="rounded-3xl border border-border bg-surface/30 p-6 card-hover">
                <p className="text-white font-bold">{t('pricingPage.faq.q3')}</p>
                <p className="text-sm text-silver/60 mt-2">
                  {t('pricingPage.faq.a3')}
                </p>
              </div>
            </div>

            {/* REFERIDOS SECTION */}
            <div className="mt-20 max-w-5xl mx-auto" data-reveal data-delay="3">
              <div className="rounded-[2.5rem] border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center relative overflow-hidden shadow-[0_0_50px_rgba(29,161,242,0.1)]">
                <div className="absolute top-0 right-0 p-8 blur-3xl opacity-30 bg-primary w-64 h-64 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-8 blur-3xl opacity-20 bg-green-500 w-64 h-64 rounded-full pointer-events-none" />

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20">
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Programa de Afiliados
                  </span>

                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Multiplica tus ingresos con referidos 💸
                  </h2>

                  <p className="text-lg text-silver/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                    ¿Conoces a alguien que necesite potenciar su marketing digital? Recomienda nuestro servicio y empieza a generar <strong>ingresos pasivos reales</strong> desde el primer día.
                  </p>

                  <div className="grid sm:grid-cols-3 gap-6 mb-10 text-left">
                    <div className="bg-background-dark/80 border border-white/5 rounded-3xl p-6 hover:bg-white/5 transition-all relative overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mb-5 text-2xl font-bold border border-green-500/20">$</div>
                      <h4 className="text-white text-lg font-bold mb-2">Comienza con $3 USD</h4>
                      <p className="text-sm text-silver/60">Obtienes 3 dólares inmediatos y directos a tu bolsillo por <strong>cada persona</strong> que invite a adquirir un plan a través de ti.</p>
                    </div>

                    <div className="bg-background-dark/80 border border-white/5 rounded-3xl p-6 hover:bg-white/5 transition-all relative overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-5 text-2xl font-bold border border-primary/20">∞</div>
                      <h4 className="text-white text-lg font-bold mb-2">Renueva mes a mes</h4>
                      <p className="text-sm text-silver/60">Nuestro servicio es por suscripción. Si tu cliente decide quedarse, <strong>tú ganas tu comisión todos los meses</strong>. Ingreso recurrente sin esfuerzo.</p>
                    </div>

                    <div className="bg-background-dark/80 border border-white/5 rounded-3xl p-6 hover:bg-white/5 transition-all relative overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-5 font-bold border border-purple-500/20">
                        <span className="material-symbols-outlined text-2xl">trending_up</span>
                      </div>
                      <h4 className="text-white text-lg font-bold mb-2">Escala tu Capital</h4>
                      <p className="text-sm text-silver/60">Los tres dólares son solo tu inicio. Entre más referidos sumes a tu red, el retorno pasivo puede hacer crecer tus ganancias hasta límites impensables.</p>
                    </div>
                  </div>

                  <p className="text-sm text-silver/50 max-w-2xl mx-auto">
                    Construye un modelo de comisiones que trabaje por ti todos los meses y benefíciate de nuestro crecimiento compartiéndolo con tu círculo.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-14 text-center" data-reveal data-delay="4">
              <Link to="/" className="text-silver/60 hover:text-white transition-colors font-medium nav-underline">
                {t('pricingPage.backHome')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PubFeatureCard({ icon, title, desc, color, bg, border }: { icon: string; title: string; desc: string; color: string; bg: string; border: string }) {
  return (
    <div className="p-6 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 hover:bg-[#0E0E0E] transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${bg} ${border} border`}>
        <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-silver/50 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
