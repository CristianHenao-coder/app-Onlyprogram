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
              {user && user.id ? (
                <Link
                  to="/dashboard/links"
                  data-magnetic="0.12"
                  className="bg-primary hover:bg-primary-dark text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 hover:translate-y-[-1px]"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  data-magnetic="0.12"
                  className="bg-primary hover:bg-primary-dark text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 hover:translate-y-[-1px]"
                >
                  {t('nav.login') || "Iniciar Sesión"}
                  <span className="material-symbols-outlined">login</span>
                </Link>
              )}

              <a
                href="#features"
                className="bg-surface/60 border border-border px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all hover:border-primary/40 text-white flex items-center justify-center gap-2"
              >
                {t('hero.viewPanel')}
                <span className="material-symbols-outlined">south</span>
              </a>


            </div>

            <div data-reveal data-delay="4" className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-silver/45">
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">{t('home.preview.linksDemo.verified')}</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">{t('home.preview.linksDemo.channels')}</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">{t('home.featureViews.analytics.title')}</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">{t('home.featureViews.telegram.title')}</span>
            </div>
          </div>
        </section>

        {/* ✅ FEATURES: SOLO “VISTA DEL PANEL” (se quitó la parte de monitoreo/mock anterior) */}
        <section id="features" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12 gap-10 items-start">
              <div className="col-span-12 text-center mb-6">
                <h2 data-reveal className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {t('home.simplePanel.title')}
                </h2>
                <p data-reveal data-delay="2" className="mt-5 text-silver/70 leading-relaxed">
                  {t('home.simplePanel.desc')}
                </p>

                <div className=" flex flex-col items-center mb-8">
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
                          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                             <div className="relative w-[300px] h-[600px] bg-black rounded-[40px] border-[8px] border-zinc-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
                                {/* Notch */}
                                <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                                    <div className="w-32 h-4 bg-zinc-800 rounded-b-xl" />
                                </div>
                                {/* Content */}
                                <div className="h-full w-full overflow-y-auto bg-zinc-900 text-white pt-10 pb-4 px-4 scrollbar-hide">
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 rounded-full border-2 border-white/10 shadow-lg mb-3 relative group">
                                            <img
                                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" 
                                              alt="Profile" 
                                              className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                        <h2 className="text-xl font-bold mb-1">Zara</h2>
                                        <p className="text-sm text-zinc-400 mb-6 text-center max-w-[200px]">Content Creator & Model ✨ Exclusive content below 👇</p>
                                        
                                        <div className="w-full space-y-3">
                                            <button className="w-full bg-[#E1306C] hover:bg-[#C13584] text-white py-3.5 px-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-[#E1306C]/20">
                                                <i className="fab fa-instagram text-xl"></i>
                                                Sígueme en IG
                                            </button>
                                            <button className="w-full bg-[#229ED9] hover:bg-[#1C88BD] text-white py-3.5 px-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/20">
                                                <i className="fab fa-telegram text-xl"></i>
                                                Telegram VIP
                                            </button>
                                            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3.5 px-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 border border-white/5">
                                                Nuevo Botón
                                            </button>
                                            <button className="w-full bg-black hover:bg-zinc-900 text-white py-3.5 px-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 border border-white/10 shadow-lg">
                                                <i className="fab fa-tiktok text-xl"></i>
                                                TikTok
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* Home Indicator */}
                                <div className="absolute bottom-1 inset-x-0 h-4 flex justify-center items-end pb-1 pointer-events-none">
                                    <div className="w-32 h-1 bg-white/20 rounded-full" />
                                </div>
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
                                          <div className="flex-1 bg-surface/20 rounded-lg border border-white/5 p-4 flex items-end justify-between gap-1">
                                              {[40, 60, 45, 70, 50, 80, 65, 90, 75].map((h, i) => (
                                                  <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }} />
                                              ))}
                                          </div>
                                     </div>
                                </div>
                                {/* Mobile Overlay */}
                                <div className="absolute -bottom-6 -right-2 w-28 sm:w-36 bg-black border-[4px] border-zinc-800 rounded-[24px] shadow-2xl overflow-hidden aspect-[9/19]">
                                    <div className="w-full h-full bg-surface flex flex-col p-2">
                                        <div className="w-full h-20 bg-primary/10 rounded-lg mb-2" />
                                        <div className="w-full h-8 bg-white/5 rounded-md mb-1" />
                                        <div className="w-full h-8 bg-white/5 rounded-md mb-1" />
                                        <div className="w-full h-8 bg-white/5 rounded-md" />
                                    </div>
                                </div>
                             </div>
                          </div>
                        )}

                        {/* ✅ VIEW: TELEGRAM (2 Phones + Chat) */}
                        {activeFeatureView === 'telegram' && (
                           <div className="w-full grid lg:grid-cols-2 gap-10 items-center animate-in slide-in-from-right-8 fade-in duration-500">
                               {/* Left: 2 Phones */}
                               <div className="relative h-[400px] flex justify-center items-center">
                                   {/* Phone 1 */}
                                   <div className="absolute left-0 lg:left-10 transform -rotate-6 scale-90 z-10 w-[240px] bg-black border-[6px] border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden aspect-[9/18]">
                                        <div className="bg-[#182533] w-full h-full flex flex-col">
                                            {/* Header */}
                                            <div className="bg-[#232E3C] p-3 text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">OP</div>
                                                <div>
                                                    <div className="font-bold text-xs">Canal VIP</div>
                                                    <div className="text-[10px] text-blue-300">15.4k suscriptores</div>
                                                </div>
                                            </div>
                                            {/* Chat */}
                                            <div className="p-3 space-y-3">
                                                <div className="bg-[#1F2C39] p-2 rounded-tr-lg rounded-bl-lg rounded-br-lg max-w-[85%] text-[10px] text-white self-start">
                                                    ¡Nuevo contenido disponible! 🔥
                                                </div>
                                                <div className="bg-[#1F2C39] p-3 rounded-lg text-white">
                                                    <div className="w-full aspect-video bg-black/40 mb-2 rounded flex items-center justify-center text-xs text-white/30">
                                                        Video Preview
                                                    </div>
                                                    <p className="text-[10px]">Haz click abajo para entrar</p>
                                                    <button className="mt-2 w-full bg-[#2AABEE] py-1.5 rounded text-[10px] font-bold">Entrar al Bot</button>
                                                </div>
                                            </div>
                                        </div>
                                   </div>
                                   {/* Phone 2 */}
                                   <div className="absolute right-0 lg:right-10 transform rotate-6 z-20 w-[240px] bg-black border-[6px] border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden aspect-[9/18]">
                                        <div className="bg-[#182533] w-full h-full flex flex-col">
                                             {/* Header */}
                                             <div className="bg-[#232E3C] p-3 text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold">Bot</div>
                                                <div>
                                                    <div className="font-bold text-xs">Rotation Bot</div>
                                                    <div className="text-[10px] text-blue-300">bot</div>
                                                </div>
                                            </div>
                                            {/* Chat */}
                                            <div className="p-3 space-y-3 flex flex-col">
                                                <div className="bg-[#2B5278] p-2 rounded-tl-lg rounded-bl-lg rounded-br-lg max-w-[85%] text-[10px] text-white self-end">
                                                    /start
                                                </div>
                                                <div className="bg-[#1F2C39] p-2 rounded-tr-lg rounded-bl-lg rounded-br-lg max-w-[85%] text-[10px] text-white self-start">
                                                    Bienvenido al sistema de rotación. Tu link temporal es:
                                                    <span className="block mt-1 text-[#2AABEE] underline">only-program.com/temp/x9s2</span>
                                                </div>
                                            </div>
                                        </div>
                                   </div>
                               </div>

                               {/* Right: Text Info */}
                               <div className="text-left space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[#2AABEE]">
                                            <span className="material-symbols-outlined">autorenew</span>
                                            <h3 className="font-bold text-lg">Rotación Inteligente</h3>
                                        </div>
                                        <p className="text-silver/70 leading-relaxed">
                                            Distribuye el tráfico entre múltiples canales o bots automáticamente. Evita saturaciones y baneos distribuyendo la carga.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-white">
                                            <span className="material-symbols-outlined">chat</span>
                                            <h3 className="font-bold text-lg">Gestión de Conversaciones</h3>
                                        </div>
                                        <p className="text-silver/70 leading-relaxed">
                                            Simula conversaciones reales y mantén a tu audiencia engaged con respuestas automáticas y flujos predefinidos.
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

        {/* ✅ FIX WRAP: Testimonials (evita corrimiento + barra rara + botones que “mueren”) */}
        <section className="testimonials-wrap">
          <PremiumTestimonials />
        </section>

        {/* ✅ Manager Reviews */}
        <ManagerReviews />

        {/* ✅ Payments: SOLO PremiumPayments (sin lluvia / sin sección duplicada / sin payments.headline roto) */}
        <section className="relative py-16 border-y border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <h3 data-reveal className="text-3xl sm:text-4xl font-extrabold text-white">
              {t('payments.title')}
            </h3>
            <p data-reveal data-delay="1" className="mt-3 text-silver/70 max-w-2xl mx-auto">
              {t('pricingPage.subtitle')}
            </p>

            <div data-reveal data-delay="2" className="mt-10">
              <PremiumPayments previewData={previewData?.pricing} />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="rounded-3xl border border-border bg-surface/40 p-8 sm:p-10 text-center overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full" />
              <h3 className="text-3xl font-black text-white mb-4 relative z-10">{t('home.finalCta.title')}</h3>
              <p className="text-silver/60 mb-8 max-w-xl mx-auto relative z-10">{t('home.finalCta.desc')}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
                {user ? (
                  <Link
                    to="/dashboard/links"
                    className="px-8 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
                  >
                    Ir al Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
                  >
                    {t('home.finalCta.btn')}
                  </Link>
                )}
                <Link
                  to="/pricing"
                  className="px-8 py-4 rounded-xl border border-border bg-background-dark/40 text-white font-bold hover:border-primary/50 transition-all"
                >
                  {t('common.viewPrices') || 'Ver Precios'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
