import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumTestimonials from '@/components/PremiumTestimonials';
import { useTranslation } from '@/contexts/I18nContext';
import PremiumPayments from "../components/PremiumPayments";
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

  const featurePreview = useMemo(() => {
    const base = {
      titleBarMid: t('home.preview.titleBarMid'),
      userName: 'Only Program',
      userRole: t('home.preview.userRole'),
    };

    if (activeFeatureView === 'analytics') {
      return {
        ...base,
        header: t('home.preview.headerAnalytics'),
        sub: t('home.preview.subAnalytics'),
        kpis: [
          { label: t('home.preview.kpis.clicks'), value: '124.582', icon: 'ads_click', tone: 'text-primary' },
          { label: t('home.preview.kpis.filtered'), value: '8.214', icon: 'shield', tone: 'text-green-500' },
          { label: t('home.preview.kpis.conversion'), value: '24.8%', icon: 'trending_up', tone: 'text-purple-400' },
          { label: t('home.preview.kpis.topCountries'), value: 'ES • USA • MX', icon: 'public', tone: 'text-silver/70' },
        ],
        sidebar: [
          { icon: 'link', label: t('home.preview.sidebar.links'), active: false },
          { icon: 'monitoring', label: t('home.preview.sidebar.analytics'), active: true },
          { icon: 'settings', label: t('home.preview.sidebar.settings'), active: false },
          { icon: 'support_agent', label: t('home.preview.sidebar.support'), active: false },
        ],
        chartBars: [32, 52, 41, 64, 58, 46, 71, 60, 55, 74, 62, 80],
        countryRows: [
          { c: t('countries.spain'), v: '52.126' },
          { c: t('countries.usa'), v: '34.182' },
          { c: t('countries.mexico'), v: '18.867' },
        ],
      };
    }

    if (activeFeatureView === 'telegram') {
      return {
        ...base,
        header: t('home.preview.headerTelegram'),
        sub: t('home.preview.subTelegram'),
        sidebar: [
          { icon: 'link', label: t('home.preview.sidebar.links'), active: false },
          { icon: 'monitoring', label: t('home.preview.sidebar.analytics'), active: false },
          { icon: 'autorenew', label: t('home.preview.sidebar.rotation'), active: true },
          { icon: 'settings', label: t('home.preview.sidebar.settings'), active: false },
          { icon: 'support_agent', label: t('home.preview.sidebar.support'), active: false },
        ],
        topActions: [
          { label: t('home.preview.actions.logs'), icon: 'receipt_long', primary: false },
          { label: t('home.preview.actions.addChannel'), icon: 'add', primary: true },
        ],
        cards: [
          { title: t('home.preview.cards.vip'), badge: t('home.preview.cards.rotating'), meta: `${t('home.preview.cards.next')} 12:46`, tone: 'text-primary' },
          { title: t('home.preview.cards.ads'), badge: t('home.preview.cards.rotating'), meta: `${t('home.preview.cards.next')} 14:12`, tone: 'text-silver/70' },
          { title: t('home.preview.cards.community'), badge: t('home.preview.cards.rotating'), meta: `${t('home.preview.cards.next')} 15:10`, tone: 'text-silver/70' },
          { title: t('home.preview.cards.launch'), badge: t('home.preview.cards.rotating'), meta: `${t('home.preview.cards.next')} 16:20`, tone: 'text-silver/70' },
          { title: t('home.preview.cards.general'), badge: t('home.preview.cards.rotating'), meta: `${t('home.preview.cards.next')} 18:02`, tone: 'text-silver/70' },
        ],
        config: [
          { label: t('home.preview.config.freq'), value: t('home.preview.config.freqVal') },
          { label: t('home.preview.config.dist'), value: t('home.preview.config.distVal') },
        ],
      };
    }

    // links default
    return {
      ...base,
      header: t('home.preview.headerLinks'),
      sub: t('home.preview.subLinks'),
      sidebar: [
        { icon: 'link', label: t('home.preview.sidebar.links'), active: true },
        { icon: 'monitoring', label: t('home.preview.sidebar.analytics'), active: false },
        { icon: 'autorenew', label: t('home.preview.sidebar.rotation'), active: false },
        { icon: 'settings', label: t('home.preview.sidebar.settings'), active: false },
        { icon: 'support_agent', label: t('home.preview.sidebar.support'), active: false },
      ],
      toolbar: [
        { label: t('home.preview.actions.preview'), icon: 'visibility', primary: false },
        { label: t('home.preview.actions.save'), icon: 'save', primary: true },
      ],
      form: {
        title: t('home.preview.linksDemo.vipAccess'),
        url: 'https://onlyfans.com/tuusuario',
        subtitle: t('home.preview.linksDemo.subtitle'),
      },
      socials: ['Instagram', 'TikTok', 'X', 'Email'],
      phone: {
        name: 'Tu Marca',
        items: [t('home.preview.linksDemo.vipAccess'), t('home.preview.linksDemo.rotary')],
      },
    };
  }, [activeFeatureView, t]);

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

              <button
                onClick={() => setShowVideo(true)}
                className="bg-primary/10 border border-primary/20 px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all hover:bg-primary/20 text-primary flex items-center justify-center gap-2"
              >
                {t('hero.watchDemo') || "Ver Video"}
                <span className="material-symbols-outlined">play_circle</span>
              </button>
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

                  <div className="relative p-3 sm:p-5">
                    <div className="flex items-center justify-between gap-3 border border-white/10 bg-background-dark/40 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-surface border border-border flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-silver/40 font-mono uppercase tracking-widest">
                            {featurePreview.titleBarMid}
                          </p>
                          <p className="text-white font-bold truncate">{featurePreview.header}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:border-primary/50 transition-all fake-btn"
                        >
                          <span className="material-symbols-outlined text-[16px]">lock</span>
                          {t('home.preview.linksDemo.verified')}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-12 gap-4">
                      <div className="col-span-12 sm:col-span-4 lg:col-span-4 hidden sm:block">
                        <div className="rounded-2xl border border-white/10 bg-background-dark/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">Menú</p>
                            <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                              {featurePreview.userName}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {featurePreview.sidebar.map((it: any, i: number) => (
                              <button
                                key={`${it.label}-${i}`}
                                type="button"
                                className={[
                                  "w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all fake-btn",
                                  it.active
                                    ? "border-primary/40 bg-primary/10 text-white"
                                    : "border-transparent bg-surface/20 text-silver/70 hover:bg-surface/30 hover:text-white",
                                ].join(" ")}
                              >
                                <span className={["material-symbols-outlined text-[18px]", it.active ? "text-primary" : "text-silver/50"].join(" ")}>
                                  {it.icon}
                                </span>
                                <span className="text-sm font-semibold">{it.label}</span>
                              </button>
                            ))}
                          </div>

                          <div className="mt-3 rounded-xl border border-white/10 bg-surface/20 p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-silver/60">person</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-bold text-sm truncate">{featurePreview.userName}</p>
                                <p className="text-[11px] text-silver/45">{featurePreview.userRole}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 sm:col-span-8 lg:col-span-8">
                        <div className="rounded-2xl border border-white/10 bg-background-dark/40 p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-white font-extrabold text-lg">{featurePreview.header}</p>
                              <p className="text-silver/60 text-sm mt-1">{featurePreview.sub}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              {(featurePreview as any).toolbar?.map((b: any, i: number) => (
                                <button
                                  key={`${b.label}-${i}`}
                                  type="button"
                                  className={[
                                    "inline-flex items-center gap-1.5 text-[11px] px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all fake-btn",
                                    b.primary
                                      ? "border-primary/30 bg-primary/10 text-primary hover:border-primary/50"
                                      : "border-border bg-surface/30 text-silver/70 hover:text-white hover:border-primary/30",
                                  ].join(" ")}
                                >
                                  <span className="material-symbols-outlined text-[16px]">{b.icon}</span>
                                  <span className="hidden xs:inline">{b.label}</span>
                                </button>
                              ))}

                              {(featurePreview as any).topActions?.map((b: any, i: number) => (
                                <button
                                  key={`${b.label}-${i}`}
                                  type="button"
                                  className={[
                                    "inline-flex items-center gap-1.5 text-[11px] px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all fake-btn",
                                    b.primary
                                      ? "border-primary/30 bg-primary text-white hover:bg-primary-dark"
                                      : "border-border bg-surface/30 text-silver/70 hover:text-white hover:border-primary/30",
                                  ].join(" ")}
                                >
                                  <span className="material-symbols-outlined text-[16px]">{b.icon}</span>
                                  <span className="hidden xs:inline">{b.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {activeFeatureView === 'links' && (
                            <div className="mt-5 grid md:grid-cols-2 gap-4">
                              <div className="rounded-2xl border border-white/10 bg-surface/20 p-4">
                                <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">{t('home.preview.linksDemo.btnTitle')}</p>
                                <div className="mt-2 rounded-xl border border-border bg-background-dark/40 px-3 py-2.5">
                                  <p className="text-white text-sm font-semibold">{(featurePreview as any).form.title}</p>
                                </div>

                                <p className="mt-4 text-[10px] font-mono text-silver/40 uppercase tracking-widest">{t('home.preview.linksDemo.dest')}</p>
                                <div className="mt-2 rounded-xl border border-border bg-background-dark/40 px-3 py-2.5 flex items-center justify-between gap-2">
                                  <p className="text-silver/70 text-xs truncate">{(featurePreview as any).form.url}</p>
                                  <button
                                    type="button"
                                    className="text-[10px] px-2 py-1 rounded-lg border border-border bg-surface/30 text-silver/70 hover:text-white hover:border-primary/30 transition-all fake-btn"
                                  >
                                    {t('common.copy')}
                                  </button>
                                </div>

                                <p className="mt-4 text-[10px] font-mono text-silver/40 uppercase tracking-widest">{t('home.preview.linksDemo.subtitle')}</p>
                                <div className="mt-2 rounded-xl border border-border bg-background-dark/40 px-3 py-2.5">
                                  <p className="text-silver/70 text-sm">{(featurePreview as any).form.subtitle}</p>
                                </div>

                                <p className="mt-4 text-[10px] font-mono text-silver/40 uppercase tracking-widest">{t('home.preview.linksDemo.channels')}</p>
                                <div className="mt-2 grid grid-cols-2 xs:grid-cols-4 gap-2">
                                  {(featurePreview as any).socials.map((s: string, i: number) => (
                                    <button
                                      key={`${s}-${i}`}
                                      type="button"
                                      className="rounded-xl border border-border bg-surface/20 px-2 py-2 text-[10px] text-silver/60 hover:text-white hover:border-primary/30 transition-all fake-btn"
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/10 bg-surface/20 p-4">
                                <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">{t('home.preview.linksDemo.previewTitle')}</p>
                                <div className="mt-3 mx-auto w-full max-w-[280px] sm:max-w-[320px] rounded-[34px] border border-white/10 bg-background-dark/70 p-2 sm:p-3">
                                  <div className="rounded-[26px] border border-white/10 bg-black/40 overflow-hidden">
                                    <div className="p-4 flex items-center gap-3 border-b border-white/10">
                                      <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-silver/60">person</span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{(featurePreview as any).phone.name}</p>
                                        <p className="text-[11px] text-silver/45">{t('home.preview.linksDemo.verified')}</p>
                                      </div>
                                    </div>
                                    <div className="p-4 space-y-2">
                                      {(featurePreview as any).phone.items.map((it: string, i: number) => (
                                        <button
                                          key={`${it}-${i}`}
                                          type="button"
                                          className="w-full rounded-2xl border border-border bg-surface/20 px-3 py-3 text-left hover:border-primary/40 transition-all fake-btn"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[18px]">link</span>
                                            <span className="text-white text-sm font-semibold">{it}</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeFeatureView === 'analytics' && (
                            <div className="mt-5 space-y-4">
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {(featurePreview as any).kpis.map((k: any, i: number) => (
                                  <div key={`${k.label}-${i}`} className="rounded-2xl border border-white/10 bg-surface/20 p-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">{k.label}</p>
                                      <span className={["material-symbols-outlined text-[18px]", k.tone].join(" ")}>{k.icon}</span>
                                    </div>
                                    <p className="mt-2 text-white font-extrabold text-lg">{k.value}</p>
                                    <p className="mt-1 text-[11px] text-silver/45">Actualizado hace 1m</p>
                                  </div>
                                ))}
                              </div>

                              <div className="grid lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-surface/20 p-4">
                                  <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">Actividad</p>
                                  <div className="mt-4 flex items-end gap-2 h-40">
                                    {(featurePreview as any).chartBars.map((h: number, i: number) => (
                                      <div
                                        key={i}
                                        className="flex-1 rounded-lg border border-white/10 bg-primary/10 hover:bg-primary/15 transition-all fake-btn"
                                        style={{ height: `${h + 18}%` }}
                                        title={`Día ${i + 1}`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-surface/20 p-4">
                                  <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">Top países</p>
                                  <div className="mt-3 space-y-2">
                                    {(featurePreview as any).countryRows.map((r: any, i: number) => (
                                      <button
                                        key={`${r.c}-${i}`}
                                        type="button"
                                        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-background-dark/30 px-3 py-2 hover:border-primary/30 transition-all fake-btn"
                                      >
                                        <span className="text-white text-sm font-semibold">{r.c}</span>
                                        <span className="text-silver/60 text-xs font-mono">{r.v}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    className="mt-3 w-full rounded-xl border border-border bg-surface/20 px-3 py-2 text-[11px] text-silver/60 hover:text-white hover:border-primary/30 transition-all fake-btn"
                                  >
                                    Ver más
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeFeatureView === 'telegram' && (
                            <div className="mt-5 space-y-4">
                              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                                {(featurePreview as any).cards.map((c: any, i: number) => (
                                  <button
                                    key={`${c.title}-${i}`}
                                    type="button"
                                    className="rounded-2xl border border-white/10 bg-surface/20 p-4 text-left hover:border-primary/30 transition-all fake-btn"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-white font-bold text-sm">{c.title}</p>
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                        {c.badge}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-[11px] text-silver/55">{c.meta}</p>
                                    <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                      <div className="h-full bg-primary/60" style={{ width: `${42 + (i * 9)}%` }} />
                                    </div>
                                  </button>
                                ))}
                              </div>

                              <div className="rounded-2xl border border-white/10 bg-surface/20 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-white font-extrabold">{t('home.preview.config.rotationConfig')}</p>
                                    <p className="text-silver/60 text-sm mt-1">{t('home.preview.config.rotationDesc')}</p>
                                  </div>
                                  <button
                                    type="button"
                                    className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] text-primary hover:border-primary/50 transition-all fake-btn"
                                  >
                                    Guardar
                                  </button>
                                </div>

                                <div className="mt-4 grid md:grid-cols-2 gap-3">
                                  {(featurePreview as any).config.map((row: any, i: number) => (
                                    <div key={`${row.label}-${i}`} className="rounded-2xl border border-white/10 bg-background-dark/30 p-4">
                                      <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">{row.label}</p>
                                      <button
                                        type="button"
                                        className="mt-2 w-full rounded-xl border border-border bg-surface/20 px-3 py-2 text-left text-sm text-white hover:border-primary/30 transition-all fake-btn"
                                      >
                                        {row.value}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[10px] text-silver/40 px-1">
                          <span>Only Program • {t('home.preview.linksDemo.previewTitle')}</span>
                          <span className="hidden sm:inline">{t('home.preview.sidebar.support')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 sm:hidden text-center text-xs text-silver/45">
                      {t('panelPreview.hintMobile')}
                    </div>
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
