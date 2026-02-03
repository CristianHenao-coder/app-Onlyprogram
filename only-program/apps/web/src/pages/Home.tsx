import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumTestimonials from '@/components/PremiumTestimonials';
import { useTranslation } from '@/contexts/I18nContext';
import PremiumPayments from "../components/PremiumPayments";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function Home() {
  const { t } = useTranslation();

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
        title: 'Panel de Links (Landing + Botones)',
        subtitle: 'Cambia textos, orden y CTA. Ves el resultado antes de publicar.',
        icon: 'link',
        accent: 'rgba(29,161,242,.18)',
      },
      {
        key: 'analytics' as const,
        title: 'Panel de Analíticas (Tráfico real)',
        subtitle: 'Sabes qué funciona: de dónde llegan, qué tocan y qué convierte.',
        icon: 'monitoring',
        accent: 'rgba(34,211,238,.14)',
      },
      {
        key: 'telegram' as const,
        title: 'Panel Telegram Rotativo (Anti-ban)',
        subtitle: 'Reparte clicks entre canales y cambia destino en segundos.',
        icon: 'send',
        accent: 'rgba(111,214,255,.14)',
      },
    ],
    []
  );

  const featurePreview = useMemo(() => {
    const base = {
      titleBarMid: 'PANEL DE CONTROL',
      userName: 'Only Program',
      userRole: 'Seguridad + Conversión',
    };

    if (activeFeatureView === 'analytics') {
      return {
        ...base,
        header: 'Analíticas claras (sin complicarte)',
        sub: 'Ves de dónde llega tu gente y qué acciones hacen dentro de tu landing.',
        kpis: [
          { label: 'Clicks reales', value: '124.582', icon: 'ads_click', tone: 'text-primary' },
          { label: 'Intentos filtrados', value: '8.214', icon: 'shield', tone: 'text-green-500' },
          { label: 'Conversión', value: '24.8%', icon: 'trending_up', tone: 'text-purple-400' },
          { label: 'Top países', value: 'ES • USA • MX', icon: 'public', tone: 'text-silver/70' },
        ],
        sidebar: [
          { icon: 'link', label: 'Links', active: false },
          { icon: 'monitoring', label: 'Analíticas', active: true },
          { icon: 'settings', label: 'Ajustes', active: false },
          { icon: 'support_agent', label: 'Soporte', active: false },
        ],
        chartBars: [32, 52, 41, 64, 58, 46, 71, 60, 55, 74, 62, 80],
        countryRows: [
          { c: 'España', v: '52.126' },
          { c: 'Estados Unidos', v: '34.182' },
          { c: 'México', v: '18.867' },
        ],
      };
    }

    if (activeFeatureView === 'telegram') {
      return {
        ...base,
        header: 'Telegram Rotativo (sin perder cuentas)',
        sub: 'Rotas destinos para reducir bans y mantener tu tráfico siempre activo.',
        sidebar: [
          { icon: 'link', label: 'Links', active: false },
          { icon: 'monitoring', label: 'Analíticas', active: false },
          { icon: 'autorenew', label: 'Rotación', active: true },
          { icon: 'settings', label: 'Ajustes', active: false },
          { icon: 'support_agent', label: 'Soporte', active: false },
        ],
        topActions: [
          { label: 'Ver logs', icon: 'receipt_long', primary: false },
          { label: 'Agregar canal', icon: 'add', primary: true },
        ],
        cards: [
          { title: 'Canal VIP Privado', badge: 'ROTANDO', meta: 'Siguiente: 12:46', tone: 'text-primary' },
          { title: 'Anuncios', badge: 'ROTANDO', meta: 'Siguiente: 14:12', tone: 'text-silver/70' },
          { title: 'Premium Comunidad', badge: 'ROTANDO', meta: 'Siguiente: 15:10', tone: 'text-silver/70' },
          { title: 'Lanzamiento', badge: 'ROTANDO', meta: 'Siguiente: 16:20', tone: 'text-silver/70' },
          { title: 'Comunidad', badge: 'ROTANDO', meta: 'Siguiente: 18:02', tone: 'text-silver/70' },
        ],
        config: [
          { label: 'Frecuencia', value: 'Cada 500 clicks' },
          { label: 'Distribución', value: 'Equitativo (50/50)' },
        ],
      };
    }

    // links default
    return {
      ...base,
      header: 'Crea tu landing en minutos',
      sub: 'Editas botones y secciones. Copias tu link protegido y listo.',
      sidebar: [
        { icon: 'link', label: 'Links', active: true },
        { icon: 'monitoring', label: 'Analíticas', active: false },
        { icon: 'autorenew', label: 'Rotación', active: false },
        { icon: 'settings', label: 'Ajustes', active: false },
        { icon: 'support_agent', label: 'Soporte', active: false },
      ],
      toolbar: [
        { label: 'Vista previa', icon: 'visibility', primary: false },
        { label: 'Guardar', icon: 'save', primary: true },
      ],
      form: {
        title: 'Acceso VIP',
        url: 'https://onlyfans.com/tuusuario',
        subtitle: 'Contenido exclusivo',
      },
      socials: ['Instagram', 'TikTok', 'X', 'Email'],
      phone: {
        name: 'Tu Marca',
        items: ['Acceso VIP', 'Telegram Rotativo'],
      },
    };
  }, [activeFeatureView]);

  const activeFeatureAccent = useMemo(() => {
    const found = featureViews.find(v => v.key === activeFeatureView);
    return found?.accent ?? 'rgba(29,161,242,.18)';
  }, [activeFeatureView, featureViews]);

  return (
    <div className="scroll-smooth dark">
      {/* ✅ CSS global para:
          1) Evitar el “corrimiento” y la barra rara en testimonios (overflow-x)
          2) Evitar que overlays tapen clicks (pointer-events)
          3) Mantener layout estable (no saltos)
      */}
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

          /* ✅ FIX: evita el scroll horizontal que “empuja” testimonios y deja barra rara */
          html, body, #root { overflow-x: hidden !important; }

          /* ✅ FIX: wrapper para testimonios (no deja ver “columnas” al mover carrusel) */
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

          /* ✅ FIX: asegura que botones sean clicables aunque haya overlays internos */
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
        {/* HERO */}
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
              {t('hero.badge')}
            </div>

            <h1
              data-reveal
              data-delay="2"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-5 tracking-tight leading-[1.05]"
            >
              {t('hero.title')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            <p
              data-reveal
              data-delay="3"
              className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-silver/75 mb-10 leading-relaxed"
            >
              {t('hero.subtitle')}
            </p>

            <div data-reveal data-delay="4" className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link
                to="/register"
                data-magnetic="0.12"
                className="bg-primary hover:bg-primary-dark text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 hover:translate-y-[-1px]"
              >
                {t('hero.cta')}
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>

              <a
                href="#features"
                className="bg-surface/60 border border-border px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all hover:border-primary/40 text-white flex items-center justify-center gap-2"
              >
                Ver el panel
                <span className="material-symbols-outlined">south</span>
              </a>
            </div>

            <div data-reveal data-delay="4" className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-silver/45">
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Links protegidos</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Dominios propios</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Analíticas</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Rotación anti-ban</span>
            </div>
          </div>
        </section>

        {/* ✅ FEATURES: SOLO “VISTA DEL PANEL” (se quitó la parte de monitoreo/mock anterior) */}
        <section id="features" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <h2 data-reveal className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  Panel simple. Resultado rápido.
                </h2>
                <p data-reveal data-delay="2" className="mt-5 text-silver/70 leading-relaxed">
                  No necesitas saber de tecnología. Entras, eliges lo que quieres, lo ajustas y publicas.
                  Todo queda claro en el panel.
                </p>

                <div data-reveal data-delay="3" className="mt-8 space-y-3">
                  {featureViews.map((v) => {
                    const isActive = v.key === activeFeatureView;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onMouseEnter={() => setActiveFeatureView(v.key)}
                        onClick={() => setActiveFeatureView(v.key)}
                        onFocus={() => setActiveFeatureView(v.key)}
                        className={[
                          "w-full text-left rounded-2xl border px-4 py-4 transition-all fake-btn",
                          isActive ? "border-primary/60 bg-primary/10 tab-glow" : "border-border bg-surface/40 hover:border-white/15",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={[
                              "h-10 w-10 rounded-xl flex items-center justify-center border",
                              isActive ? "border-primary/40 bg-primary/15" : "border-border bg-background-dark/40",
                            ].join(" ")}
                          >
                            <span className={["material-symbols-outlined", isActive ? "text-primary" : "text-silver/50"].join(" ")}>
                              {v.icon}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-bold">{v.title}</p>
                            <p className="text-sm text-silver/55 mt-1">{v.subtitle}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div data-reveal data-delay="4" className="mt-6 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = featureViews.findIndex(v => v.key === activeFeatureView);
                      const next = clamp(idx - 1, 0, featureViews.length - 1);
                      setActiveFeatureView(featureViews[next].key);
                    }}
                    className="h-10 w-10 rounded-full bg-surface/40 border border-border hover:border-primary/40 text-silver/70 hover:text-white transition-all"
                    aria-label="Vista anterior"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = featureViews.findIndex(v => v.key === activeFeatureView);
                      const next = clamp(idx + 1, 0, featureViews.length - 1);
                      setActiveFeatureView(featureViews[next].key);
                    }}
                    className="h-10 w-10 rounded-full bg-surface/40 border border-border hover:border-primary/40 text-silver/70 hover:text-white transition-all"
                    aria-label="Vista siguiente"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>

                  <span className="text-xs text-silver/45 ml-2">
                    {featureViews.findIndex(v => v.key === activeFeatureView) + 1}/{featureViews.length}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div
                  data-reveal
                  data-delay="2"
                  className="relative rounded-3xl border border-border bg-surface/40 overflow-hidden dash-shell"
                >
                  <div
                    className="absolute -inset-10 blur-3xl transition-all duration-700"
                    style={{ background: activeFeatureAccent }}
                  />
                  <div className="absolute inset-0 dash-softgrid opacity-[0.65]" />

                  <div className="relative p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 border border-white/10 bg-background-dark/40 rounded-2xl px-4 py-3">
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
                          Protegido
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-12 gap-4">
                      <div className="col-span-12 sm:col-span-4 lg:col-span-4">
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
                                    "hidden md:inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border transition-all fake-btn",
                                    b.primary
                                      ? "border-primary/30 bg-primary/10 text-primary hover:border-primary/50"
                                      : "border-border bg-surface/30 text-silver/70 hover:text-white hover:border-primary/30",
                                  ].join(" ")}
                                >
                                  <span className="material-symbols-outlined text-[16px]">{b.icon}</span>
                                  {b.label}
                                </button>
                              ))}

                              {(featurePreview as any).topActions?.map((b: any, i: number) => (
                                <button
                                  key={`${b.label}-${i}`}
                                  type="button"
                                  className={[
                                    "hidden md:inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border transition-all fake-btn",
                                    b.primary
                                      ? "border-primary/30 bg-primary text-white hover:bg-primary-dark"
                                      : "border-border bg-surface/30 text-silver/70 hover:text-white hover:border-primary/30",
                                  ].join(" ")}
                                >
                                  <span className="material-symbols-outlined text-[16px]">{b.icon}</span>
                                  {b.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {activeFeatureView === 'links' && (
                            <div className="mt-5 grid md:grid-cols-2 gap-4">
                              <div className="rounded-2xl border border-white/10 bg-surface/20 p-4">
                                <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">Título del botón</p>
                                <div className="mt-2 rounded-xl border border-border bg-background-dark/40 px-3 py-2.5">
                                  <p className="text-white text-sm font-semibold">{(featurePreview as any).form.title}</p>
                                </div>

                                <p className="mt-4 text-[10px] font-mono text-silver/40 uppercase tracking-widest">Destino</p>
                                <div className="mt-2 rounded-xl border border-border bg-background-dark/40 px-3 py-2.5 flex items-center justify-between gap-2">
                                  <p className="text-silver/70 text-xs truncate">{(featurePreview as any).form.url}</p>
                                  <button
                                    type="button"
                                    className="text-[10px] px-2 py-1 rounded-lg border border-border bg-surface/30 text-silver/70 hover:text-white hover:border-primary/30 transition-all fake-btn"
                                  >
                                    Copiar
                                  </button>
                                </div>

                                <p className="mt-4 text-[10px] font-mono text-silver/40 uppercase tracking-widest">Subtítulo</p>
                                <div className="mt-2 rounded-xl border border-border bg-background-dark/40 px-3 py-2.5">
                                  <p className="text-silver/70 text-sm">{(featurePreview as any).form.subtitle}</p>
                                </div>

                                <p className="mt-4 text-[10px] font-mono text-silver/40 uppercase tracking-widest">Canales</p>
                                <div className="mt-2 grid grid-cols-4 gap-2">
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
                                <p className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">Vista previa</p>
                                <div className="mt-3 mx-auto w-full max-w-[320px] rounded-[34px] border border-white/10 bg-background-dark/70 p-3">
                                  <div className="rounded-[26px] border border-white/10 bg-black/40 overflow-hidden">
                                    <div className="p-4 flex items-center gap-3 border-b border-white/10">
                                      <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-silver/60">person</span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{(featurePreview as any).phone.name}</p>
                                        <p className="text-[11px] text-silver/45">Perfil verificado</p>
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
                              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                              <div className="grid md:grid-cols-3 gap-3">
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
                                    <p className="text-white font-extrabold">Config de rotación</p>
                                    <p className="text-silver/60 text-sm mt-1">Define cómo se reparte el tráfico.</p>
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
                          <span>Only Program • Vista del panel</span>
                          <span className="hidden sm:inline">Soporte</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 sm:hidden text-center text-xs text-silver/45">
                      Tip: toca los botones de la izquierda para cambiar la vista.
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
              Métodos de pago seguros
            </h3>
            <p data-reveal data-delay="1" className="mt-3 text-silver/70 max-w-2xl mx-auto">
              Elige tu método y activa tu plan. Rápido, claro y sin pasos raros.
            </p>

            <div data-reveal data-delay="2" className="mt-10">
              <PremiumPayments />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="rounded-3xl border border-border bg-surface/40 p-8 sm:p-10 text-center overflow-hidden relative"
            >
              <div
                className="absolute -inset-16 blur-3xl"
                style={{ background: 'radial-gradient(circle at 50% 40%, rgba(29,161,242,.22) 0%, transparent 65%)' }}
              />
              <div className="relative">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Tu primer link protegido en minutos</h3>
                <p className="mt-4 text-silver/70 max-w-2xl mx-auto">
                  Crea tu cuenta, diseña tu landing, conecta tu dominio y activa analíticas.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/register"
                    data-magnetic="0.12"
                    className="px-7 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
                  >
                    Crear cuenta
                  </Link>
                  <Link
                    to="/pricing"
                    className="px-7 py-3.5 rounded-xl border border-border bg-background-dark/40 text-white font-bold hover:border-primary/50 transition-all"
                  >
                    Ver precios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
