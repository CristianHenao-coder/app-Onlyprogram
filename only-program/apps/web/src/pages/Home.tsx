import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumTestimonials from '@/components/PremiumTestimonials';
import { useTranslation } from '@/contexts/I18nContext';
import PremiumPayments from "../components/PremiumPayments";

import { cmsService } from '@/services/cmsService';



import LinkControlCenter from "@/components/LinkControlCenter";
import { useAuth } from '@/hooks/useAuth';


export default function Home({
  previewData
}: {
  previewData?: any;
}) {

  const { t } = useTranslation();
  const {  } = useAuth();

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

          /*  FIX: asegura que botones sean clicables aunque haya overlays internos */
          .testimonials-wrap button,
          .testimonials-wrap [role="button"]{
            pointer-events: auto;
          }

          /*  FIX double scrollbar: Prevent overflow on root elements while allowing main scroll */
          html, body { 
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden !important; 
          }
          #root {
            min-height: 100%;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
          }

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
              <Link
                to="/features"
                data-magnetic="0.12"
                className="group relative bg-gradient-to-r from-primary via-blue-500 to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-[0_0_30px_rgba(29,161,242,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] flex items-center justify-center gap-3 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" />
                <span className="relative z-10 uppercase tracking-wide">Explorar Características</span>
                <span className="material-symbols-outlined relative z-10 group-hover:rotate-12 transition-transform">rocket_launch</span>
              </Link>
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

        {/* ✅ FEATURES: CENTRO DE CONTROL DE ENLACES (NUEVO DISEÑO) */}
        <LinkControlCenter />

        {/* Ambient Transition to Testimonials */}
        <div className="relative h-20 w-full overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[200px] bg-blue-600/10 blur-[90px] rounded-full -translate-y-1/2" />
        </div>

        <section className="testimonials-wrap relative z-10">
          <PremiumTestimonials />
        </section>



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


        <FloatingScrollButton />

        <Footer />
      </main>
    </div>
  );
}



function FloatingScrollButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down more than 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToNextSection = () => {
    const sections = document.querySelectorAll('section');
    const scrollPosition = window.scrollY + window.innerHeight / 3;

    for (const section of sections) {
      if (section.offsetTop > scrollPosition) {
        section.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    scrollToTop();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`scroll-to-top bg-white/10 hover:bg-white/20 text-white p-4 rounded-full shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-4'
        }`}
        aria-label="Scroll to Top"
      >
        <span className="material-symbols-outlined text-2xl">arrow_upward</span>
      </button>

      {/* Next Section Button */}
      <button
        onClick={scrollToNextSection}
        className="bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl shadow-primary/40 transition-all hover:scale-110 active:scale-95 animate-bounce"
        aria-label="Next Section"
      >
        <span className="material-symbols-outlined text-2xl">arrow_downward</span>
      </button>
    </div>
  );
}


