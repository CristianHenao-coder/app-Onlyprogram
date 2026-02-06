import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumTestimonials from '@/components/PremiumTestimonials';
import { useTranslation } from '@/contexts/I18nContext';
import PremiumPayments from "../components/PremiumPayments";
import ManagerReviews from "@/components/ManagerReviews";
import { cmsService } from '@/services/cmsService';



import { useAuth } from '@/hooks/useAuth';
import instagramLogo from '../assets/animations/instagram.png';
import tiktokLogo from '../assets/animations/tik-tok.png';

export default function Home({
  previewData
}: {
  previewData?: any;
}) {

  const { t } = useTranslation();
  const { user } = useAuth();

  // ✅ Velada-like reveal: aparece en foco y se atenúa si sale (sin borrar nada, solo agrega)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    els.forEach((el) => {
      const delay = Number(el.getAttribute('data-delay') || '0');
      el.style.transitionDelay = `${delay * 90}ms`;
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            el.classList.add('is-inview');
            el.classList.remove('is-outview');
          } else {
            if (el.classList.contains('is-inview')) {
              el.classList.add('is-outview');
              el.classList.remove('is-inview');
            }
          }
        });
      },
      {
        threshold: [0.08, 0.2, 0.35],
        rootMargin: '0px 0px -20% 0px',
      }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ✅ “PÁGINAS” INTERACTIVAS tipo dashboard (basadas en tus imágenes)
  type FeatureViewKey = 'links' | 'analytics' | 'telegram';
  const [activeFeatureView, setActiveFeatureView] = useState<FeatureViewKey>('links');

  const featureViews = useMemo(
    () => [
      {
        key: 'links' as const,
        title: t('home.featureViews.links.title'),
        subtitle: t('home.featureViews.links.subtitle'),
        label: 'Links',
        icon: 'link',
        accent: 'rgba(29,161,242,.18)',
      },
      {
        key: 'analytics' as const,
        title: t('home.featureViews.analytics.title'),
        subtitle: t('home.featureViews.analytics.subtitle'),
        label: 'Analíticas',
        icon: 'monitoring',
        accent: 'rgba(34,211,238,.14)',
      },
      {
        key: 'telegram' as const,
        title: t('home.featureViews.telegram.title'),
        subtitle: t('home.featureViews.telegram.subtitle'),
        label: 'Telegram',
        icon: 'send',
        accent: 'rgba(111,214,255,.14)',
      },
    ],
    [t]
  );



  const activeFeatureAccent = useMemo(() => {
    const found = featureViews.find(v => v.key === activeFeatureView);
    return found?.accent ?? 'rgba(29,161,242,.18)';
  }, [activeFeatureView, featureViews]);

  // ✅ Load CMS Configs
  const [heroConfig, setHeroConfig] = useState<any>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (previewData?.hero) {
      setHeroConfig(previewData.hero);
      return;
    }

    const fetchHomeConfigs = async () => {
      const hero = await cmsService.getConfig('hero');
      if (hero) setHeroConfig(hero);
    };
    fetchHomeConfigs();
  }, [previewData]);

  return (
    <div className="scroll-smooth dark">
      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-6 right-6 text-white hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-surface animate-in zoom-in-95 duration-500">
            <video
              src="https://cdn.coverr.co/videos/coverr-woman-typing-on-a-laptop-9262/1080p.mp4"
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <style>
        {`
          /* ===== Velada-like Scroll Reveal ===== */
          [data-reveal]{
            opacity:0;
            transform: translateY(18px) scale(0.985);
            filter: blur(10px);
            transition:
              opacity 900ms cubic-bezier(0.2, 0.8, 0.2, 1),
              transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1),
              filter 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
            will-change: opacity, transform, filter;
          }
          [data-reveal].is-inview{
            opacity:1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          [data-reveal].is-outview{
            opacity:.18;
            transform: translateY(-6px) scale(.99);
            filter: blur(8px);
          }

          /* iOS/Android dynamic viewport helpers */
          .min-dvh{ min-height: 100dvh; }

          /*  FIX: evita el scroll horizontal que “empuja” testimonios y deja barra rara */
          html, body, #root { overflow-x: hidden !important; }

          /*  FIX: wrapper para testimonios (no deja ver “columnas” al mover carrusel) */
          .testimonials-wrap{
            position: relative;
            overflow: hidden;
            isolation: isolate;
            background: radial-gradient(circle at 50% 20%, rgba(29,161,242,.10) 0%, transparent 60%);
          }
          .testimonials-wrap::before,
          .testimonials-wrap::after{
            content:"";
            position:absolute;
            top:0; bottom:0;
            width:48px;
            pointer-events:none;
            z-index:2;
          }
          .testimonials-wrap::before{
            left:0;
            background: linear-gradient(to right, rgba(0,0,0,.85), transparent);
          }
          .testimonials-wrap::after{
            right:0;
            background: linear-gradient(to left, rgba(0,0,0,.85), transparent);
          }

          /*  FIX: asegura que botones sean clicables aunque haya overlays internos */
          .testimonials-wrap button,
          .testimonials-wrap [role="button"]{
            pointer-events: auto;
          }

          /* ===== Dashboard Preview micro interactions (solo visual) ===== */
          .dash-shell{
            position: relative;
            overflow: hidden;
            border-radius: 24px;
          }
          .dash-softgrid{
            background-image:
              radial-gradient(circle at 20% 30%, rgba(255,255,255,.05), transparent 55%),
              radial-gradient(circle at 80% 10%, rgba(255,255,255,.04), transparent 52%);
            mask-image: radial-gradient(circle at 50% 30%, black 0%, transparent 70%);
            -webkit-mask-image: radial-gradient(circle at 50% 30%, black 0%, transparent 70%);
          }
          .fake-btn{
            transition: transform 260ms cubic-bezier(.2,.8,.2,1), border-color 260ms, background 260ms, box-shadow 260ms;
          }
          .fake-btn:hover{ transform: translateY(-1px); }
          .tab-glow{ box-shadow: 0 0 0 1px rgba(255,255,255,.06), 0 18px 40px rgba(0,0,0,.45); }

          @media (max-width: 480px) {
            .xs\:inline { display: inline !important; }
            .xs\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .xs\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          }
        `}
      </style>

      <Navbar />

      <main
        className="min-dvh"
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/*HERO*/}
        <section id="home" className="relative pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-20 overflow-hidden">
          <div className="hero-gradient absolute inset-0 -z-10" />

          <div
            className="absolute inset-0 -z-10 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.12) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
              maskImage: 'radial-gradient(circle at 50% 20%, black 0%, transparent 65%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 20%, black 0%, transparent 65%)',
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div
              data-reveal
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold uppercase tracking-wider mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {heroConfig?.badge || t('hero.badge')}
            </div>

            <h1
              data-reveal
              data-delay="2"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-5 tracking-tight leading-[1.05]"
            >
              {heroConfig?.title || t('hero.title')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {heroConfig?.titleHighlight || t('hero.titleHighlight')}
              </span>
            </h1>

            <p
              data-reveal
              data-delay="3"
              className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-silver/75 mb-10 leading-relaxed"
            >
              {heroConfig?.subtitle || t('hero.subtitle')}
            </p>

            <div data-reveal data-delay="4" className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <a
                href="#features"
                data-magnetic="0.12"
                className="group relative bg-gradient-to-r from-primary via-blue-500 to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-[0_0_30px_rgba(29,161,242,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] flex items-center justify-center gap-3 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" />
                <span className="relative z-10 uppercase tracking-wide">Explora Tu Potencial</span>
                 <span className="material-symbols-outlined relative z-10 group-hover:rotate-12 transition-transform">rocket_launch</span>
              </a>
            </div>

            <div data-reveal data-delay="4" className="mt-16 flex flex-wrap justify-center gap-4 text-xs text-silver/45">
              <span className="px-4 py-1.5 rounded-full border border-border bg-surface/30 uppercase tracking-wider font-medium">{t('home.preview.linksDemo.verified')}</span>
              <span className="px-4 py-1.5 rounded-full border border-border bg-surface/30 uppercase tracking-wider font-medium">{t('home.preview.linksDemo.channels')}</span>
              <span className="px-4 py-1.5 rounded-full border border-border bg-surface/30 uppercase tracking-wider font-medium">{t('home.featureViews.analytics.title')}</span>
              <span className="px-4 py-1.5 rounded-full border border-border bg-surface/30 uppercase tracking-wider font-medium">{t('home.featureViews.telegram.title')}</span>
            </div>
          </div>
          
          {/* Soft Gradient Transition & Ambient Glow */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-background z-20" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/20 blur-[120px] rounded-full z-10 opacity-50 pointer-events-none" />
        </section>

        {/* ✅ FEATURES: SOLO “VISTA DEL PANEL” */}
        <section id="features" className="py-24 sm:py-32 bg-background relative z-10 overflow-hidden">
             {/* Organic shapes for background depth */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-12 gap-10 items-start">
              <div className="col-span-12 text-center mb-6">
                <h2 data-reveal className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  Lo que puedes hacer con nosotros
                </h2>
                <p data-reveal data-delay="2" className="mt-5 text-silver/70 leading-relaxed max-w-2xl mx-auto">
                  {t('home.simplePanel.desc')}
                </p>

                <div className="flex flex-col items-center mb-8 mt-12 sm:mt-16">
                  {/* Horizontal scroll container for mobile, centered wrapped for desktop */}
                  <div data-reveal data-delay="3" className="w-full overflow-x-auto pb-4 -mb-4 sm:overflow-visible sm:pb-0 sm:mb-0 flex justify-start sm:justify-center px-4 sm:px-0">
                    <div className="flex flex-nowrap sm:flex-wrap gap-3 sm:gap-4 shrink-0 mx-auto sm:mx-0">
                      {featureViews.map((v) => {
                        const isActive = v.key === activeFeatureView;
                        return (
                          <button
                            key={v.key}
                            type="button"
                            onMouseEnter={() => setActiveFeatureView(v.key)}
                            onClick={() => setActiveFeatureView(v.key)}
                            className={[
                              "flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full border transition-all fake-btn shrink-0 whitespace-nowrap",
                              isActive
                                ? "border-primary/60 bg-primary/10 tab-glow"
                                : "border-border bg-surface/40 hover:border-white/15",
                            ].join(" ")}
                          >
                            <span className={["material-symbols-outlined", isActive ? "text-primary" : "text-silver/50"].join(" ")}>
                              {v.icon}
                            </span>
                            <span className={isActive ? "text-white font-bold" : "text-silver/70 font-medium"}>
                              {v.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-silver/50 hidden md:block">
                    {featureViews.find(v => v.key === activeFeatureView)?.title} - {featureViews.find(v => v.key === activeFeatureView)?.subtitle}
                  </p>
                </div>


              </div>
              <div className="col-span-12">
                <div className="w-full overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0">
                    <div
                      data-reveal
                      data-delay="2"
                      className="relative rounded-3xl border border-border bg-surface/40 overflow-hidden dash-shell min-w-[350px] xs:min-w-full"
                    >
                      <div
                        className="absolute -inset-10 blur-3xl transition-all duration-700"
                        style={{ background: activeFeatureAccent }}
                      />
                      <div className="absolute inset-0 dash-softgrid opacity-[0.65]" />

                      <div className="relative p-6 sm:p-10 min-h-[500px] flex items-center justify-center">
                        {/* ✅ VIEW: LINKS (Phone Mockup) */}
                        {activeFeatureView === 'links' && (
                          <div className="w-full grid lg:grid-cols-2 gap-10 items-center animate-in slide-in-from-right-8 fade-in duration-500">
                             {/* Left: Text Info */}
                             <div className="text-left space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <span className="material-symbols-outlined">hub</span>
                                        <h3 className="font-bold text-lg">Unifica tus Redes</h3>
                                    </div>
                                    <p className="text-silver/70 leading-relaxed text-base sm:text-lg">
                                        Convierte seguidores de Instagram, TikTok y Twitter en clientes. 
                                        Centraliza todo tu tráfico en un solo lugar y maximiza tus conversiones.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <span className="material-symbols-outlined">verified_user</span>
                                        <h3 className="font-bold text-lg">Protección Simple y Total</h3>
                                    </div>
                                    <p className="text-silver/70 leading-relaxed text-base sm:text-lg">
                                        Olvídate de las filtraciones. Nuestro sistema bloquea automáticamente a los "toms peepers" y bots. 
                                        Tu contenido exclusivo solo lo verán personas reales.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-white">
                                        <span className="material-symbols-outlined">dns</span>
                                        <h3 className="font-bold text-lg">Tu Nombre, Tu Marca</h3>
                                    </div>
                                    <p className="text-silver/70 leading-relaxed text-base sm:text-lg">
                                        Dale confianza a tus seguidores. En lugar de un link extraño, usa tu propio dominio personalizado.
                                    </p>
                                    
                                    {/* Domain Example Visual */}
                                    <div className="mt-4 bg-[#0B0B0B] border border-white/10 rounded-xl p-4 flex items-center justify-between group cursor-default hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                                <span className="material-symbols-outlined text-sm">lock</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-silver/50 uppercase tracking-wider font-bold">Ejemplo Real</span>
                                                <span className="text-white font-mono text-sm sm:text-base">links.zara-exclusive.com</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-silver/30 group-hover:text-primary transition-colors">check_circle</span>
                                    </div>
                                </div>
                             </div>

                             {/* Right: Phone Mockup with Rotation */}
                             <div className="flex justify-center perspective-[1000px]">
                                 <PhoneRotator />
                             </div>
                          </div>
                        )}

                        {/* ✅ VIEW: ANALYTICS (PC + Mobile / Split Layout) */}
                        {activeFeatureView === 'analytics' && (
                          <div className="w-full grid lg:grid-cols-2 gap-10 items-center animate-in slide-in-from-right-8 fade-in duration-500">
                             {/* Left: Text Info */}
                             <div className="text-left space-y-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <span className="material-symbols-outlined">monitoring</span>
                                        <h3 className="font-bold text-lg">Métricas en Tiempo Real</h3>
                                    </div>
                                    <p className="text-silver/70 leading-relaxed">
                                        Visualiza clicks, países y dispositivos al instante. Toma decisiones basadas en datos reales, no en suposiciones.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <span className="material-symbols-outlined">shield</span>
                                        <h3 className="font-bold text-lg">Filtrado de Bots</h3>
                                    </div>
                                    <p className="text-silver/70 leading-relaxed">
                                        Nuestro sistema elimina el tráfico basura automáticamente, asegurando que solo pagues por usuarios reales.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-400">
                                        <span className="material-symbols-outlined">public</span>
                                        <h3 className="font-bold text-lg">Geolocalización Precisa</h3>
                                    </div>
                                    <p className="text-silver/70 leading-relaxed">
                                        Entiende de dónde viene tu audiencia y optimiza tus campañas por región o idioma.
                                    </p>
                                </div>
                             </div>

                             {/* Right: Visuals (PC + Mobile overlay) */}
                             <div className="relative">
                                {/* PC Mockup */}
                                <div className="relative bg-background-dark border border-white/10 rounded-xl shadow-2xl p-2 aspect-[16/10] overflow-hidden">
                                     <div className="absolute inset-x-0 top-0 h-6 bg-surface border-b border-white/5 flex items-center px-4 gap-1.5">
                                         <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                         <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                                     </div>
                                     <div className="mt-6 h-full w-full bg-background-dark flex flex-col p-4 gap-4">
                                          {/* Analytics Fake UI */}
                                          <div className="grid grid-cols-3 gap-3">
                                              <div className="bg-surface/30 rounded-lg p-3 border border-white/5">
                                                  <div className="text-[10px] text-silver/50">Total Clicks</div>
                                                  <div className="text-xl font-bold text-white">124k</div>
                                              </div>
                                              <div className="bg-surface/30 rounded-lg p-3 border border-white/5">
                                                  <div className="text-[10px] text-silver/50">Conv. Rate</div>
                                                  <div className="text-xl font-bold text-green-400">24.8%</div>
                                              </div>
                                              <div className="bg-surface/30 rounded-lg p-3 border border-white/5">
                                                  <div className="text-[10px] text-silver/50">Countries</div>
                                                  <div className="text-xl font-bold text-primary">12</div>
                                              </div>
                                          </div>
                                          <div className="flex-1 bg-surface/20 rounded-lg border border-white/5 p-4 flex items-end justify-between gap-1 relative overflow-hidden">
                                              {/* Scanning Line Animation */}
                                              <div className="absolute top-0 bottom-0 w-[2px] bg-primary/50 shadow-[0_0_10px_rgba(29,161,242,0.8)] z-10 animate-[scan_3s_ease-in-out_infinite]" />
                                              
                                              {[40, 60, 45, 70, 50, 80, 65, 90, 75].map((h, i) => (
                                                  <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors relative group" style={{ height: `${h}%` }}>
                                                      <div className="absolute bottom-0 left-0 right-0 h-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                  </div>
                                              ))}
                                          </div>
                                     </div>
                                </div>
                                {/* Mobile Overlay */}
                                <div className="absolute -bottom-6 -right-2 w-32 sm:w-40 bg-black border-[4px] border-zinc-800 rounded-[28px] shadow-2xl overflow-hidden aspect-[9/19] flex flex-col">
                                    <div className="bg-zinc-900 p-2 flex items-center justify-between border-b border-white/5">
                                        <div className="w-8 h-2 rounded bg-white/10" />
                                        <div className="w-4 h-4 rounded-full bg-primary/20" />
                                    </div>
                                    <div className="p-2 space-y-2 flex-1 bg-black">
                                        <div className="bg-surface/40 p-2 rounded border border-white/5">
                                            <div className="h-2 w-12 bg-white/20 rounded mb-1" />
                                            <div className="h-4 w-16 bg-green-500/20 rounded" />
                                        </div>
                                        <div className="flex gap-1">
                                             <div className="flex-1 bg-surface/40 h-16 rounded border border-white/5" />
                                             <div className="flex-1 bg-surface/40 h-16 rounded border border-white/5" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-6 w-full bg-surface/40 rounded border border-white/5 flex items-center px-2">
                                                 <div className="w-4 h-4 rounded bg-primary/20 mr-2" />
                                                 <div className="w-10 h-1 bg-white/10 rounded" />
                                            </div>
                                            <div className="h-6 w-full bg-surface/40 rounded border border-white/5 flex items-center px-2">
                                                 <div className="w-4 h-4 rounded bg-purple-500/20 mr-2" />
                                                 <div className="w-8 h-1 bg-white/10 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                          </div>
                        )}

                        {/* ✅ VIEW: TELEGRAM (2 Phones + Chat) */}
                        {activeFeatureView === 'telegram' && (
                           <div className="w-full grid lg:grid-cols-2 gap-16 items-center animate-in slide-in-from-right-8 fade-in duration-500">
                               {/* Left: 2 Phones */}
                               <div className="relative h-[480px] flex justify-center items-center">
                                   {/* Phone 1 */}
                                   <div className="absolute left-0 lg:left-4 transform -rotate-12 scale-90 z-10 w-[250px] bg-black border-[8px] border-zinc-900 rounded-[36px] shadow-2xl overflow-hidden aspect-[9/19]">
                                        <div className="bg-[#182533] w-full h-full flex flex-col">
                                            {/* Header */}
                                            <div className="bg-[#232E3C] p-4 text-white flex items-center gap-3 shadow-md">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold shadow-lg">OP</div>
                                                <div>
                                                    <div className="font-bold text-sm">Canal VIP</div>
                                                    <div className="text-xs text-blue-300 font-medium">15.4k suscriptores</div>
                                                </div>
                                            </div>
                                            {/* Chat */}
                                            <div className="p-4 space-y-4">
                                                <div className="bg-[#1F2C39] p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl max-w-[90%] text-xs text-white shadow-sm border border-white/5">
                                                    ¡Chicos! Acabo de subir contenido exclusivo. 👀🔥
                                                </div>
                                                <div className="bg-[#1F2C39] p-3 rounded-lg text-white shadow-sm border border-white/5">
                                                    <div className="w-full aspect-video bg-black/40 mb-3 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                         <span className="material-symbols-outlined text-4xl text-white/80 drop-shadow-lg z-10">play_circle</span>
                                                    </div>
                                                    <p className="text-xs mb-3 font-medium text-blue-100">Haz click para ver el video completo 👇</p>
                                                    <button className="w-full bg-[#2AABEE] hover:bg-[#229ED9] py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-[#2AABEE]/20 transition-all active:scale-95">Abrir Bot Privado</button>
                                                </div>
                                            </div>
                                        </div>
                                   </div>
                                   {/* Phone 2 */}
                                   <div className="absolute right-0 lg:right-4 transform rotate-6 z-20 w-[250px] bg-black border-[8px] border-zinc-900 rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden aspect-[9/19]">
                                        <div className="bg-[#182533] w-full h-full flex flex-col">
                                             {/* Header */}
                                             <div className="bg-[#232E3C] p-4 text-white flex items-center gap-3 shadow-md">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">Bot</div>
                                                <div>
                                                    <div className="font-bold text-sm">Rotation Bot</div>
                                                    <div className="text-xs text-blue-300 font-medium">Automatizado</div>
                                                </div>
                                            </div>
                                            {/* Chat */}
                                            <div className="p-4 space-y-4 flex flex-col">
                                                <div className="bg-[#2B5278] p-3 rounded-tl-xl rounded-bl-xl rounded-br-xl max-w-[90%] text-xs text-white self-end shadow-sm">
                                                    /start
                                                </div>
                                                <div className="bg-[#1F2C39] p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl max-w-[95%] text-xs text-white self-start shadow-sm border border-white/5">
                                                    <p className="font-bold text-[#2AABEE] mb-1">¡Hola! 👋</p>
                                                    Bienvenido al sistema de rotación inteligente.
                                                    <div className="my-2 p-2 bg-black/20 rounded border border-white/5">
                                                        <div className="flex items-center gap-2 text-[10px] text-green-400 mb-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            Anti-ban activo
                                                        </div>
                                                        <span className="text-silver/60 text-[10px]">Tu enlace seguro temporal:</span>
                                                        <div className="text-[#2AABEE] underline font-mono mt-0.5">op.link/tmp/x9s2</div>
                                                    </div>
                                                    <p className="text-[10px] text-silver/50">Este enlace expirará en 24h.</p>
                                                </div>
                                            </div>
                                        </div>
                                   </div>
                               </div>

                               {/* Right: Text Info */}
                               <div className="text-left space-y-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-[#2AABEE]">
                                            <div className="p-2 rounded-lg bg-[#2AABEE]/10">
                                                <span className="material-symbols-outlined text-2xl">autorenew</span>
                                            </div>
                                            <h3 className="font-bold text-2xl">Rotación Inteligente</h3>
                                        </div>
                                        <p className="text-silver/70 leading-relaxed text-lg pl-14">
                                            Distribuye el tráfico entre múltiples canales o bots automáticamente. Evita saturaciones y baneos distribuyendo la carga de forma equitativa.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-white">
                                            <div className="p-2 rounded-lg bg-white/10">
                                                <span className="material-symbols-outlined text-2xl">chat</span>
                                            </div>
                                            <h3 className="font-bold text-2xl">Gestión de Conversaciones</h3>
                                        </div>
                                        <p className="text-silver/70 leading-relaxed text-lg pl-14">
                                            Simula conversaciones reales y mantén a tu audiencia engaged con respuestas automáticas, menús interactivos y flujos de venta predefinidos.
                                        </p>
                                    </div>
                               </div>
                           </div>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Ambient Transition to Testimonials */}
        <div className="relative h-20 w-full overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent" />
             <div className="absolute top-1/2 left-1/4 w-[600px] h-[200px] bg-blue-600/10 blur-[90px] rounded-full -translate-y-1/2" />
        </div>

        <section className="testimonials-wrap relative z-10">
          <PremiumTestimonials />
        </section>

        {/* ✅ Manager Reviews */}
        <ManagerReviews />

        {/* ✅ Payments: SOLO PremiumPayments (sin lluvia / sin sección duplicada / sin payments.headline roto) */}
        <section id="pricing" className="relative py-16 border-y border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <h3 data-reveal className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Paga como quieras, <span className="text-primary">sin complicaciones</span>
            </h3>
            <p data-reveal data-delay="1" className="mt-4 text-lg text-silver/60 max-w-2xl mx-auto leading-relaxed">
              Aceptamos todos los métodos de pago principales. Activación instantánea para que no pierdas tiempo.
            </p>

            <div data-reveal data-delay="2" className="mt-10">
              <PremiumPayments />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="relative rounded-[3rem] overflow-hidden p-10 sm:p-20 text-center group"
            >
              {/* Hypnotic Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.4),transparent_70%)] animate-pulse" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* Floating Orbs */}
              <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-[80px] animate-bounce duration-[5000ms]" />
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px] animate-bounce duration-[7000ms]" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                  <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-2xl tracking-tight">
                    {t('home.finalCta.title')}
                  </h3>
                  <p className="text-lg sm:text-xl text-blue-200/80 leading-relaxed font-medium">
                    {t('home.finalCta.desc')}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-5 justify-center mt-10">
                    {user ? (
                      <Link
                        to="/dashboard/links"
                        className="px-10 py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-blue-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
                      >
                        Ir al Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/register"
                        className="px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-lg hover:brightness-110 transition-all shadow-[0_0_40px_rgba(29,161,242,0.4)] hover:shadow-[0_0_60px_rgba(29,161,242,0.6)] transform hover:-translate-y-1"
                      >
                        {t('home.finalCta.btn')}
                      </Link>
                    )}
                    <Link
                      to="/pricing"
                      className="px-10 py-5 rounded-2xl border border-white/10 bg-white/5 text-white font-bold backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center gap-2 group-hover:border-white/20"
                    >
                      <span>Ver Planes y Precios</span>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                  </div>
              </div>
            </div>
          </div>
        </section>

        <FloatingScrollButton />
        
        <Footer />
      </main>
    </div>
  );
}

function PhoneRotator() {
    const [step, setStep] = useState(0); // 0: LinkBuilder, 1: Instagram, 2: TikTok
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimating(true);
            setTimeout(() => {
                setStep((prev) => (prev + 1) % 3);
                setAnimating(false);
            }, 600); // Wait for half rotation to switch content
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex justify-center items-center">
            
            {/* Background Animations (Behind Phone) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                 {/* Instagram Bg */}
                 <div className={`absolute transition-all duration-1000 transform ${step === 1 ? 'opacity-100 scale-125 blur-sm' : 'opacity-0 scale-50'}`}>
                    <img src={instagramLogo} alt="Instagram" className="w-[500px] h-[500px] max-w-none opacity-60 object-contain" />
                 </div>
                 {/* TikTok Bg */}
                 <div className={`absolute transition-all duration-1000 transform ${step === 2 ? 'opacity-100 scale-125 blur-sm' : 'opacity-0 scale-50'}`}>
                    <img src={tiktokLogo} alt="TikTok" className="w-[500px] h-[500px] max-w-none opacity-60 invert dark:invert-0 object-contain" />
                 </div>
            </div>

            {/* Phone Device */}
            <div 
                className={`relative z-10 w-[280px] h-[580px] bg-black rounded-[40px] border-[8px] border-zinc-800 shadow-2xl overflow-hidden ring-1 ring-white/10 transition-all duration-1000 transform-style-3d ${animating ? 'rotate-y-180 scale-95' : 'rotate-y-0 scale-100'}`}
            >
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                    <div className="w-32 h-4 bg-zinc-800 rounded-b-xl" />
                </div>

                {/* Content Container */}
                <div className="h-full w-full bg-zinc-900 text-white scrollbar-hide transition-opacity duration-300">
                    
                    {/* STATE 0: LINK BUILDER */}
                    {step === 0 && (
                        <div className="h-full overflow-y-auto pt-10 pb-4 px-4 animate-in fade-in duration-300">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full border-2 border-white/10 shadow-lg mb-3 relative group">
                                    <img
                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" 
                                        alt="Profile" 
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <div className="flex items-center gap-1 mb-1">
                                    <h2 className="text-xl font-bold">Zara</h2>
                                    <span className="material-symbols-outlined text-blue-400 text-base">verified</span>
                                </div>
                                <p className="text-sm text-zinc-400 mb-6 text-center max-w-[200px]">Creadora de contenido ✨<br/>Aquí abajo todos mis links 👇</p>
                                
                                <div className="w-full space-y-3">
                                    <button className="w-full bg-[#E1306C] hover:bg-[#C13584] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#E1306C]/20">
                                        <i className="fab fa-instagram text-xl"></i>
                                        Sígueme en IG
                                    </button>
                                    <button className="w-full bg-[#229ED9] hover:bg-[#1C88BD] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/20">
                                        <i className="fab fa-telegram text-xl"></i>
                                        Telegram VIP
                                    </button>
                                    <button className="w-full bg-black hover:bg-zinc-900 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 shadow-lg">
                                        <i className="fab fa-tiktok text-xl"></i>
                                        TikTok
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATE 1: INSTAGRAM */}
                    {step === 1 && (
                        <div className="h-full flex flex-col bg-black pt-10 animate-in fade-in duration-300">
                            {/* Fake Header */}
                            <div className="flex items-center justify-between px-4 pb-2 border-b border-white/10">
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                                <span className="font-bold text-sm">zara_official</span>
                                <span className="material-symbols-outlined text-lg">more_horiz</span>
                            </div>
                            {/* Profile Info */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1" className="w-full h-full rounded-full object-cover border-2 border-black" />
                                    </div>
                                    <div className="flex gap-4 text-center">
                                        <div><div className="font-bold">1.2k</div><div className="text-[10px]">Posts</div></div>
                                        <div><div className="font-bold">45k</div><div className="text-[10px]">Followers</div></div>
                                        <div><div className="font-bold">320</div><div className="text-[10px]">Following</div></div>
                                    </div>
                                </div>
                                <div className="text-xs space-y-1">
                                    <div className="font-bold">Zara</div>
                                    <div className="text-zinc-300">Creadora de contenido</div>
                                    <div>Aquí abajo todos mis links 👇</div>
                                    <div className="text-[#E0F1FF] font-semibold bg-[#2AABEE]/20 rounded px-1 w-fit mt-1">links.zara-exclusive.com</div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button className="flex-1 bg-[#1F1F1F] py-1.5 rounded-lg text-xs font-semibold">Following</button>
                                    <button className="flex-1 bg-[#1F1F1F] py-1.5 rounded-lg text-xs font-semibold">Message</button>
                                </div>
                            </div>
                            {/* Grid */}
                            <div className="flex-1 grid grid-cols-3 gap-0.5 mt-2">
                                {[1,2,3,4,5,6,7,8,9].map(i => (
                                    <div key={i} className="aspect-square bg-zinc-800 border border-black/50" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STATE 2: TIKTOK */}
                    {step === 2 && (
                        <div className="h-full flex flex-col bg-black pt-10 animate-in fade-in duration-300">
                             {/* Fake Header */}
                             <div className="flex items-center justify-between px-4 py-2">
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                <span className="font-bold text-sm">Zara <span className="material-symbols-outlined text-blue-400 text-[10px] align-middle">verified</span></span>
                                <span className="material-symbols-outlined text-lg">menu</span>
                            </div>
                            {/* Profile */}
                            <div className="flex flex-col items-center p-4 border-b border-white/5">
                                 <div className="w-24 h-24 rounded-full border-2 border-white/10 mb-3">
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1" className="w-full h-full rounded-full object-cover" />
                                 </div>
                                 <h3 className="font-bold text-lg">@zara_exclusive</h3>
                                 <div className="flex gap-6 my-4 text-center">
                                     <div><div className="font-bold">128</div><div className="text-[10px] text-zinc-400">Following</div></div>
                                     <div><div className="font-bold">120.4k</div><div className="text-[10px] text-zinc-400">Followers</div></div>
                                     <div><div className="font-bold">1.2M</div><div className="text-[10px] text-zinc-400">Likes</div></div>
                                 </div>
                                 <div className="text-center text-xs space-y-1 mb-3">
                                    <p>Creadora de contenido</p>
                                    <p>Aquí abajo todos mis links 👇</p>
                                    <div className="flex items-center justify-center gap-1 text-[#FE2C55] font-semibold mt-1">
                                        <span className="material-symbols-outlined text-sm">link</span>
                                        links.zara-exclusive.com
                                    </div>
                                 </div>
                                 <div className="flex gap-2 w-full px-8">
                                    <button className="flex-1 bg-[#FE2C55] py-2 rounded text-xs font-bold">Follow</button>
                                    <button className="w-10 bg-zinc-800 rounded flex items-center justify-center"><span className="material-symbols-outlined text-sm">arrow_drop_down</span></button>
                                 </div>
                            </div>
                             {/* Grid */}
                             <div className="flex-1 grid grid-cols-3 gap-0.5">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="aspect-[3/4] bg-zinc-800 border border-black/50" />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-1 inset-x-0 h-4 flex justify-center items-end pb-1 pointer-events-none z-30">
                    <div className="w-32 h-1 bg-white/20 rounded-full" />
                </div>
            </div>
        </div>
    );
}

function FloatingScrollButton() {
    const scrollToNextSection = () => {
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + window.innerHeight / 3; // Tolerance
        
        for (const section of sections) {
            if (section.offsetTop > scrollPosition) {
                section.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }
        // If no more sections, scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button 
            onClick={scrollToNextSection}
            className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl shadow-primary/40 transition-all hover:scale-110 active:scale-95 animate-bounce"
            aria-label="Next Section"
        >
            <span className="material-symbols-outlined text-2xl">arrow_downward</span>
        </button>
    );
}


