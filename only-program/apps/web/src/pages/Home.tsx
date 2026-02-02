import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumTestimonials from '@/components/PremiumTestimonials';
import { useTranslation } from '@/contexts/I18nContext';
import PremiumPayments from "../components/PremiumPayments";

type RainItem = {
  id: number;
  x: number;
  duration: number;
  delay: number;
  rotation: number;
  size: number;
  src: string;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function Home() {
  const { t } = useTranslation();

  // Payment micro-interactions (subtle rain assets)
  const [rain, setRain] = useState<RainItem[]>([]);
  const rainTimeouts = useRef<number[]>([]);
  const rainBatchId = useRef(0);

  // ✅ Control de spawn para que no se dispare 1000 veces al mover el mouse
  const lastSpawnRef = useRef<Record<string, number>>({ crypto: 0, card: 0, paypal: 0 });
  const [activeRainType, setActiveRainType] = useState<'crypto' | 'card' | 'paypal' | null>(null);

  // ✅ Auto-load de assets locales en src/assets/payments (sin depender de URLs feas)
  // Detecta por keywords en el nombre del archivo
  const paymentAssets: Record<'crypto' | 'card' | 'paypal', string[]> = useMemo(() => {
    // Vite glob eager import (TS ok)
    const modules = import.meta.glob('../assets/payments/*.{png,jpg,jpeg,webp,svg}', {
      eager: true,
      import: 'default',
    }) as Record<string, string>;

    const all = Object.entries(modules).map(([path, src]) => ({
      path: path.toLowerCase(),
      src,
    }));

    const crypto = all
      .filter(a =>
        a.path.includes('btc') ||
        a.path.includes('bitcoin') ||
        a.path.includes('eth') ||
        a.path.includes('ethereum') ||
        a.path.includes('usdt') ||
        a.path.includes('tether') ||
        a.path.includes('sol') ||
        a.path.includes('solana') ||
        a.path.includes('coin') ||
        a.path.includes('crypto')
      )
      .map(a => a.src);

    const card = all
      .filter(a =>
        a.path.includes('visa') ||
        a.path.includes('master') ||
        a.path.includes('mastercard') ||
        a.path.includes('amex') ||
        a.path.includes('american') ||
        a.path.includes('card') ||
        a.path.includes('black') ||
        a.path.includes('bank')
      )
      .map(a => a.src);

    const paypal = all
      .filter(a =>
        a.path.includes('paypal') ||
        a.path.includes('bill') ||
        a.path.includes('money') ||
        a.path.includes('cash') ||
        a.path.includes('note')
      )
      .map(a => a.src);

    // Fallback: si el usuario aún no metió assets, evita crash (queda vacío)
    return {
      crypto,
      card,
      paypal,
    };
  }, []);

  const spawnRain = (type: 'crypto' | 'card' | 'paypal') => {
    const assets = paymentAssets[type] ?? [];
    if (!assets.length) return;

    // ✅ throttle: mínimo 450ms entre spawns por tipo (más premium / más lento)
    const now = Date.now();
    const last = lastSpawnRef.current[type] ?? 0;
    if (now - last < 450) return;
    lastSpawnRef.current[type] = now;

    // ✅ evita que el estado se vuelva enorme si pasan el mouse muchas veces
    const MAX_ITEMS = 75;
    const batchSize = 5;

    const batchKey = ++rainBatchId.current;

    const batch: RainItem[] = Array.from({ length: batchSize }).map((_, i) => {
      const src = assets[Math.floor(Math.random() * assets.length)];

      // ✅ tamaños “premium” más coherentes según tipo
      const baseSize =
        type === 'crypto' ? 36 :
        type === 'card' ? 84 :
        66;

      const size =
        type === 'crypto'
          ? baseSize + Math.random() * 16
          : type === 'card'
          ? baseSize + Math.random() * 34
          : baseSize + Math.random() * 28;

      return {
        // ✅ id estable y único
        id: Number(`${Date.now()}${batchKey}${i}`),
        x: 6 + Math.random() * 88, // evita bordes extremos
        duration: 13.5 + Math.random() * 7.5, // ✅ más lento (13.5s–21s)
        delay: Math.random() * 1.6, // más "cinemático"
        rotation: type === 'card' ? (-10 + Math.random() * 20) : (Math.random() * 360),
        size,
        src,
      };
    });

    setRain((prev) => {
      const next = [...prev, ...batch];
      if (next.length <= MAX_ITEMS) return next;
      return next.slice(next.length - MAX_ITEMS);
    });

    const timeout = window.setTimeout(() => {
      setRain((prev) => prev.filter((r) => !batch.some((b) => b.id === r.id)));
    }, 24000);

    rainTimeouts.current.push(timeout);
  };

  const startRain = (type: 'crypto' | 'card' | 'paypal') => {
    setActiveRainType(type);
    spawnRain(type);
  };

  const stopRain = () => {
    setActiveRainType(null);
  };

  // ✅ mientras esté hover/focus, genera bursts suaves (no spam)
  useEffect(() => {
    if (!activeRainType) return;
    const id = window.setInterval(() => spawnRain(activeRainType), 1100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRainType]);

  // ✅ Cleanup de timeouts (evita leaks cuando navegas fuera del Home)
  useEffect(() => {
    return () => {
      rainTimeouts.current.forEach((tId) => window.clearTimeout(tId));
      rainTimeouts.current = [];
    };
  }, []);

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

  const productDeck = useMemo(
    () => [
      {
        title: 'Bot Shield',
        subtitle: 'Bloqueo inteligente y scoring por comportamiento.',
        icon: 'shield_lock',
        accent: 'rgba(29,161,242,.22)',
        key: 'bot',
      },
      {
        title: 'Smart Routing',
        subtitle: 'Ruteo por país, dispositivo y fuente.',
        icon: 'route',
        accent: 'rgba(111,214,255,.18)',
        key: 'routing',
      },
      {
        title: 'Telegram Rotativo',
        subtitle: 'Rotación anti-ban y control de cupos.',
        icon: 'autorenew',
        accent: 'rgba(34,211,238,.16)',
        key: 'telegram',
      },
      {
        title: 'Analytics',
        subtitle: 'Tiempo real + funnels + eventos.',
        icon: 'monitoring',
        accent: 'rgba(29,161,242,.18)',
        key: 'analytics',
      },
      {
        title: 'Dominios',
        subtitle: 'Marca siempre visible con dominios propios.',
        icon: 'dns',
        accent: 'rgba(111,214,255,.14)',
        key: 'domains',
      },
    ],
    []
  );

  const [activeProduct, setActiveProduct] = useState(0);

  const goProduct = (dir: -1 | 1) => {
    setActiveProduct((prev) => clamp(prev + dir, 0, productDeck.length - 1));
  };

  // ✅ Info ampliada (basada en tus pantallas: Editor Avanzado, Analytics Pro, Monitor Telegram)
  const productDetail = useMemo(() => {
    const key = productDeck[activeProduct]?.key;

    const commonPills = [
      { label: 'Tiempo real', icon: 'bolt' },
      { label: 'Anti-ban', icon: 'verified' },
      { label: 'Control total', icon: 'tune' },
    ];

    if (key === 'telegram') {
      return {
        title: 'Monitor de Telegram Rotativo',
        caption: 'Gestión centralizada de canales, rotación y tráfico (anti-ban).',
        pills: [
          { label: 'Rotación por clicks', icon: 'autorenew' },
          { label: 'Cupos por canal', icon: 'group' },
          { label: 'Logs globales', icon: 'receipt_long' },
        ],
        blocks: [
          {
            heading: 'Canales en rotación',
            lines: [
              '• Vista por tarjetas: estado, prioridad y siguiente rotación.',
              '• Acciones rápidas: refrescar, ver logs, activar/pausar.',
              '• Segmentación: canales para “VIP”, comunidad, anuncios, lanzamientos.',
            ],
          },
          {
            heading: 'Configuración global',
            lines: [
              '• Frecuencia: cada X clicks / tiempo / reglas personalizadas.',
              '• Prioridad: equitativo 50/50 o ponderado por conversión.',
              '• Protección: fallback automático si un canal cae o se limita.',
            ],
          },
        ],
        stats: [
          { k: 'Canales activos', v: '6+', sub: 'Rotando en vivo' },
          { k: 'Tiempo de reacción', v: '< 1s', sub: 'Cambio de destino' },
        ],
        mockRows: [
          { icon: 'send', label: 'Canal VIP Privado', badge: 'ROTANDO', meta: 'Siguiente: 12:46 | +1h', color: 'text-primary' },
          { icon: 'campaign', label: 'Anuncios', badge: 'ROTANDO', meta: 'Siguiente: 14:12 | +2h', color: 'text-silver/70' },
          { icon: 'stars', label: 'Premium Comunidad', badge: 'ROTANDO', meta: 'Siguiente: 15:10 | +3h', color: 'text-silver/70' },
        ],
      };
    }

    if (key === 'analytics') {
      return {
        title: 'Analíticas Pro Only Program',
        caption: 'Métricas pro, heatmap de interacción y fuentes de tráfico.',
        pills: [
          { label: 'Heatmap', icon: 'grid_view' },
          { label: 'Comparativa', icon: 'swap_horiz' },
          { label: 'Últimos 30 días', icon: 'date_range' },
        ],
        blocks: [
          {
            heading: 'Métrica de tráfico pro',
            lines: [
              '• Vista por periodos y comparativa (antes vs ahora).',
              '• Lecturas por país y fuente social (IG/TikTok/etc).',
              '• Detección de patrones: clicks, scroll, tiempo y rutas.',
            ],
          },
          {
            heading: 'Mapa de calor',
            lines: [
              '• Visualiza dónde interactúan más dentro de la landing.',
              '• Identifica secciones con fricción y optimiza conversión.',
              '• Eventos: botones, tabs, métodos de pago y CTA.',
            ],
          },
        ],
        stats: [
          { k: 'Top orígenes', v: 'ES / USA', sub: 'Distribución' },
          { k: 'Modo', v: 'Tiempo real', sub: 'Live feed' },
        ],
        mockRows: [
          { icon: 'public', label: 'Top orígenes', badge: 'LIVE', meta: 'España 42% · USA 28% · México 15%', color: 'text-primary' },
          { icon: 'hub', label: 'Redes sociales', badge: 'FUENTES', meta: 'Instagram · TikTok · X', color: 'text-silver/70' },
        ],
      };
    }

    if (key === 'routing') {
      return {
        title: 'Smart Routing',
        caption: 'Ruteo inteligente por país, dispositivo, fuente y score.',
        pills: [
          { label: 'Georouting', icon: 'language' },
          { label: 'Device split', icon: 'devices' },
          { label: 'Source aware', icon: 'alternate_email' },
        ],
        blocks: [
          {
            heading: 'Rutas por contexto',
            lines: [
              '• Instagram → landing optimizada (más conversión).',
              '• TikTok → vista rápida + CTA fuerte.',
              '• País/idioma → contenido localizado y horarios.',
            ],
          },
          {
            heading: 'Control antifraude',
            lines: [
              '• Score de riesgo: bots vs humanos.',
              '• Reglas: bloquear, pedir verificación o redirigir a parking.',
              '• Fallback: ruta segura si hay picos sospechosos.',
            ],
          },
        ],
        stats: [
          { k: 'Rutas', v: '∞', sub: 'Reglas por link' },
          { k: 'Latencia', v: 'ms', sub: 'Cambio instantáneo' },
        ],
        mockRows: [
          { icon: 'route', label: 'Regla: IG → Landing A', badge: 'ON', meta: 'Prioridad alta', color: 'text-primary' },
          { icon: 'smartphone', label: 'Mobile → UX rápida', badge: 'ON', meta: 'Menos fricción', color: 'text-silver/70' },
          { icon: 'desktop_windows', label: 'Desktop → Premium', badge: 'ON', meta: 'Más información', color: 'text-silver/70' },
        ],
      };
    }

    if (key === 'domains') {
      return {
        title: 'Dominios + Branding',
        caption: 'Tu marca siempre visible: dominio propio, SSL y control.',
        pills: [
          { label: 'SSL', icon: 'lock' },
          { label: 'DNS', icon: 'dns' },
          { label: 'Marca', icon: 'brush' },
        ],
        blocks: [
          {
            heading: 'Dominio conectado',
            lines: [
              '• Conecta tu dominio (CNAME) y activa SSL automático.',
              '• Evita bans por dominios genéricos: marca consistente.',
              '• Subdominios por campaña (promo.tudominio.com).',
            ],
          },
          {
            heading: 'Landing personalizable',
            lines: [
              '• Editor visual de botones, secciones y orden.',
              '• Perfil/preview tipo móvil para ver cómo queda.',
              '• Control de accesos: verificación y parking.',
            ],
          },
        ],
        stats: [
          { k: 'Confianza', v: '+', sub: 'Marca visible' },
          { k: 'Setup', v: 'min', sub: 'Rápido' },
        ],
        mockRows: [
          { icon: 'dns', label: 'CNAME configurado', badge: 'OK', meta: 'Verificado', color: 'text-primary' },
          { icon: 'lock', label: 'SSL activo', badge: 'ON', meta: 'Seguridad', color: 'text-silver/70' },
        ],
      };
    }

    // bot / default
    return {
      title: 'Bot Shield + Firewall',
      caption: 'Protección inteligente: scoring, bloqueo y logs en vivo.',
      pills: [
        { label: 'Scoring', icon: 'data_thresholding' },
        { label: 'Firewall logs', icon: 'policy' },
        ...commonPills,
      ],
      blocks: [
        {
          heading: 'Bloqueo inteligente',
          lines: [
            '• Identifica scraping y automatizaciones por patrón.',
            '• Score por comportamiento: velocidad, repetición, fingerprint.',
            '• Acciones: bloquear, desafiar o enrutar seguro.',
          ],
        },
        {
          heading: 'Logs en vivo',
          lines: [
            '• Registro por IP/ASN/país/dispositivo.',
            '• Eventos: intentos denegados, spikes y anomalías.',
            '• Exportable para auditoría.',
          ],
        },
      ],
      stats: [
        { k: 'Bloqueos hoy', v: '1,284', sub: 'Tráfico inválido' },
        { k: 'Escudo', v: 'ON', sub: 'Siempre activo' },
      ],
      mockRows: [
        { icon: 'shield', label: 'Bot Shield', badge: 'ON', meta: 'Scoring activo', color: 'text-primary' },
        { icon: 'warning', label: 'Spike detectado', badge: 'ALERT', meta: 'Auto-mitigado', color: 'text-silver/70' },
      ],
    };
  }, [activeProduct, productDeck]);

  return (
    <div className="scroll-smooth dark">
      {/* ✅ Velada-like reveal CSS + mobile viewport helpers (no borra nada, solo agrega) */}
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

          {/* Subtle background grid */}
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
                Explorar productos
                <span className="material-symbols-outlined">south</span>
              </a>
            </div>

            {/* Minimal social proof */}
            <div data-reveal data-delay="4" className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-silver/45">
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Anti-bot</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Dominios propios</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Analytics en vivo</span>
              <span className="px-3 py-1 rounded-full border border-border bg-surface/30">Telegram rotativo</span>
            </div>
          </div>
        </section>

        {/* PRODUCT EXPLORER */}
        <section id="features" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <h2 data-reveal className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {t('features.title')}
                </h2>
                <p data-reveal data-delay="2" className="mt-5 text-silver/70 leading-relaxed">
                  {t('features.subtitle')}
                </p>

                <div data-reveal data-delay="3" className="mt-8 space-y-3">
                  {productDeck.map((p, idx) => (
                    <button
                      key={p.title}
                      type="button"
                      onMouseEnter={() => setActiveProduct(idx)}
                      onFocus={() => setActiveProduct(idx)}
                      className={`w-full text-left rounded-2xl border px-4 py-4 transition-all ${
                        idx === activeProduct ? 'border-primary/60 bg-primary/10' : 'border-border bg-surface/40 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                            idx === activeProduct ? 'border-primary/40 bg-primary/15' : 'border-border bg-background-dark/40'
                          }`}
                        >
                          <span className={`material-symbols-outlined ${idx === activeProduct ? 'text-primary' : 'text-silver/50'}`}>
                            {p.icon}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-bold">{p.title}</p>
                          <p className="text-sm text-silver/55 mt-1">{p.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* ✅ Keyboard-friendly controls (no borra nada, solo agrega) */}
                <div data-reveal data-delay="4" className="mt-6 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goProduct(-1)}
                    className="h-10 w-10 rounded-full bg-surface/40 border border-border hover:border-primary/40 text-silver/70 hover:text-white transition-all"
                    aria-label="Producto anterior"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goProduct(1)}
                    className="h-10 w-10 rounded-full bg-surface/40 border border-border hover:border-primary/40 text-silver/70 hover:text-white transition-all"
                    aria-label="Producto siguiente"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                  <span className="text-xs text-silver/45 ml-2">
                    {activeProduct + 1}/{productDeck.length}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div data-reveal data-delay="3" className="relative rounded-3xl border border-border bg-surface/40 overflow-hidden">
                  {/* Accent */}
                  <div
                    className="absolute -inset-10 blur-3xl transition-all duration-700"
                    style={{ background: productDeck[activeProduct]?.accent }}
                  />

                  <div className="relative p-6 sm:p-8">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        <span className="ml-4 text-xs font-mono text-silver/40 uppercase tracking-widest">
                          {t('features.liveLinks')}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-primary animate-pulse">● {t('features.liveStatus')}</span>
                    </div>

                    {/* Mock content (mantengo) */}
                    <div className="mt-6 space-y-3 font-mono">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-green-500 text-sm">lock</span>
                          <div className="flex flex-col">
                            <span className="text-xs text-white">LNK-8921-XPR</span>
                            <span className="text-[10px] text-silver/40">
                              {t('features.created')}: {t('features.ago')} 2m
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            AES-256
                          </span>
                          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                          <div className="flex flex-col">
                            <span className="text-xs text-white">LNK-4412-VFY</span>
                            <span className="text-[10px] text-silver/40">
                              {t('features.created')}: {t('features.ago')} 15m
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/30">
                            BOT-SHIELD
                          </span>
                          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-yellow-500 text-sm">warning</span>
                          <div className="flex flex-col">
                            <span className="text-xs text-white">LNK-9011-BOT</span>
                            <span className="text-[10px] text-silver/40">{t('features.blockedAttempt')}: 1s</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            {t('features.denied')}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 grid sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border bg-background-dark/40 p-4">
                        <p className="text-xs text-silver/50">Bloqueos hoy</p>
                        <p className="mt-1 text-2xl font-bold text-white">1,284</p>
                        <p className="mt-2 text-sm text-silver/60">Bots, scrapers y tráfico inválido.</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-background-dark/40 p-4">
                        <p className="text-xs text-silver/50">Conversiones</p>
                        <p className="mt-1 text-2xl font-bold text-white">+23%</p>
                        <p className="mt-2 text-sm text-silver/60">Al limpiar el tráfico y dirigir mejor.</p>
                      </div>
                    </div>

                    {/* ✅ NUEVO: panel ampliado por producto (no borra nada) */}
                    <div className="mt-8 rounded-2xl border border-border bg-background-dark/30 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-white font-extrabold text-lg">{productDetail.title}</p>
                          <p className="text-silver/60 text-sm mt-1">{productDetail.caption}</p>
                        </div>
                        <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full whitespace-nowrap">
                          {productDeck[activeProduct]?.title}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {productDetail.pills.map((p: any, idx: number) => (
                          <span
                            key={`${p.label}-${idx}`}
                            className="inline-flex items-center gap-1.5 text-xs text-silver/70 border border-border bg-surface/30 rounded-full px-3 py-1"
                          >
                            <span className="material-symbols-outlined text-[16px] text-primary">{p.icon}</span>
                            {p.label}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 grid md:grid-cols-2 gap-4">
                        {productDetail.blocks.map((b: any, idx: number) => (
                          <div key={`${b.heading}-${idx}`} className="rounded-2xl border border-border bg-surface/30 p-4">
                            <p className="text-white font-bold">{b.heading}</p>
                            <div className="mt-2 space-y-1.5 text-sm text-silver/60">
                              {b.lines.map((ln: string, i: number) => (
                                <p key={`${idx}-${i}`}>{ln}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        {productDetail.stats.map((s: any, idx: number) => (
                          <div key={`${s.k}-${idx}`} className="rounded-2xl border border-border bg-surface/20 p-4">
                            <p className="text-xs text-silver/50">{s.k}</p>
                            <p className="mt-1 text-2xl font-bold text-white">{s.v}</p>
                            <p className="mt-2 text-sm text-silver/60">{s.sub}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 space-y-2">
                        {productDetail.mockRows.map((r: any, idx: number) => (
                          <div key={`${r.label}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-sm ${r.color}`}>{r.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-xs text-white">{r.label}</span>
                                <span className="text-[10px] text-silver/40">{r.meta}</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {r.badge}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* ✅ FIN panel ampliado */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials (Velada-like background) */}
        <PremiumTestimonials />

        {/* Payments */}
        <section className="relative py-16 border-y border-border overflow-hidden">
          {/* ✅ Mantengo la lluvia, más lenta y más limpia visualmente */}
          <style>
            {`
              .rain-layer {
                position: absolute;
                inset: 0;
                z-index: 0;
                pointer-events: none;
                overflow: hidden;
              }
              .rain-item {
                position: absolute;
                top: -160px;
                opacity: 0;
                filter: drop-shadow(0 10px 24px rgba(0,0,0,.55));
                animation-name: rainFall;
                animation-timing-function: cubic-bezier(.2,.8,.2,1);
                animation-iteration-count: 1;
                will-change: transform, opacity;
              }
              @keyframes rainFall {
                0%   { transform: translate3d(0,-60px,0) rotate(var(--rot)); opacity: 0; }
                10%  { opacity: .22; }
                55%  { opacity: .18; }
                100% { transform: translate3d(var(--drift), 130vh, 0) rotate(calc(var(--rot) + 12deg)); opacity: 0; }
              }
              .rain-softmask {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 50% 18%, rgba(255,255,255,.06) 0%, transparent 58%);
                opacity: .55;
                filter: blur(2px);
              }
            `}
          </style>

          <div className="rain-layer">
            <div className="rain-softmask" />
            {rain.map((c) => {
              const drift = `${(-70 + Math.random() * 140).toFixed(0)}px`;
              return (
                <img
                  key={c.id}
                  className="rain-item"
                  src={c.src}
                  alt=""
                  style={{
                    left: `${c.x}%`,
                    width: `${c.size}px`,
                    height: 'auto',
                    animationDuration: `${c.duration}s`,
                    animationDelay: `${c.delay}s`,
                    // @ts-ignore
                    ['--rot' as any]: `${c.rotation}deg`,
                    // @ts-ignore
                    ['--drift' as any]: drift,
                  }}
                />
              );
            })}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h3 data-reveal className="text-xs font-bold uppercase tracking-[0.2em] text-silver/40 mb-10">
              {t('payments.title')}
            </h3>

            {/* ✅ Evita textos repetidos: PremiumPayments como principal */}
            <div data-reveal className="mb-10">
              <PremiumPayments />
            </div>

            {/* ✅ Botones “disparadores” de lluvia (sin duplicar UI) */}
            <div className="grid md:grid-cols-3 gap-6">
              <button
                type="button"
                data-reveal
                data-delay="1"
                onMouseEnter={() => startRain('card')}
                onMouseLeave={stopRain}
                onFocus={() => startRain('card')}
                onBlur={stopRain}
                className="text-left rounded-3xl bg-surface/40 border border-border p-6 card-hover transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{t('payments.card')}</p>
                    <p className="text-silver/60 text-sm mt-1">{t('payments.cardDesc')}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">credit_card</span>
                </div>
                <p className="mt-6 text-xs text-silver/50">Hover para micro-interacción</p>
              </button>

              <button
                type="button"
                data-reveal
                data-delay="2"
                onMouseEnter={() => startRain('crypto')}
                onMouseLeave={stopRain}
                onFocus={() => startRain('crypto')}
                onBlur={stopRain}
                className="text-left rounded-3xl bg-surface/40 border border-border p-6 card-hover transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{t('payments.crypto')}</p>
                    <p className="text-silver/60 text-sm mt-1">{t('payments.cryptoDesc')}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">currency_bitcoin</span>
                </div>
                <p className="mt-6 text-xs text-silver/50">Validación manual (seguridad)</p>
              </button>

              <button
                type="button"
                data-reveal
                data-delay="3"
                onMouseEnter={() => startRain('paypal')}
                onMouseLeave={stopRain}
                onFocus={() => startRain('paypal')}
                onBlur={stopRain}
                className="text-left rounded-3xl bg-surface/40 border border-border p-6 card-hover transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{t('payments.paypal')}</p>
                    <p className="text-silver/60 text-sm mt-1">{t('payments.paypalDesc')}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <p className="mt-6 text-xs text-silver/50">Checkout rápido y confiable</p>
              </button>
            </div>

            {(paymentAssets.crypto.length + paymentAssets.card.length + paymentAssets.paypal.length === 0) && (
              <p className="mt-8 text-xs text-silver/45">
                Tip: agrega tus imágenes en <span className="font-mono">src/assets/payments/</span> para activar lluvia premium.
              </p>
            )}
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
                  Crea tu cuenta, diseña tu landing, conecta tu dominio y activa analytics en tiempo real.
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
