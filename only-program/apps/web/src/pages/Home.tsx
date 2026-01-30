import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/contexts/I18nContext';
import { useState } from 'react';

export default function Home() {
  const { t } = useTranslation();
  const [hoveredTestimonial, setHoveredTestimonial] = useState<number | null>(null);

  return (
    <div className="scroll-smooth dark">
      <Navbar />

      <main className="pb-safe-bottom" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-4 sm:px-6" id="home">
          <div className="hero-gradient absolute inset-0 -z-10"></div>
          
          {/* Animated particles background */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="floating-particle particle-1"></div>
            <div className="floating-particle particle-2"></div>
            <div className="floating-particle particle-3"></div>
            <div className="floating-particle particle-4"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold uppercase tracking-wider mb-6 sm:mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t('hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-[1.1] animate-slide-up px-2">
              {t('hero.title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-gradient">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-silver/80 mb-8 sm:mb-10 leading-relaxed animate-fade-in px-4">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up">
              <Link
                to="/login"
                className="bg-primary hover:bg-primary-dark text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 hover:scale-105 transform w-full sm:w-auto group"
              >
                {t('hero.cta')}
                <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>
              <button className="bg-surface border border-border px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all hover:border-primary/50 flex items-center justify-center gap-2 text-white hover:scale-105 transform w-full sm:w-auto group">
                {t('hero.watchDemo')}
                <span className="material-symbols-outlined transform group-hover:scale-110 transition-transform">play_circle</span>
              </button>
            </div>
          </div>
        </section>

        {/* Screenshots Gallery */}
        <section className="py-12 bg-surface/30">
          <div className="max-w-7xl mx-auto px-4 overflow-hidden">
            <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar snap-x">
              <div className="flex-none w-[350px] md:w-[600px] aspect-video bg-surface border border-border rounded-2xl overflow-hidden snap-center group">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <span className="text-silver/40 text-sm">Vista previa del panel</span>
                </div>
              </div>
              <div className="flex-none w-[350px] md:w-[600px] aspect-video bg-surface border border-border rounded-2xl overflow-hidden snap-center group">
                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <span className="text-silver/40 text-sm">Ajustes de seguridad</span>
                </div>
              </div>
              <div className="flex-none w-[350px] md:w-[600px] aspect-video bg-surface border border-border rounded-2xl overflow-hidden snap-center group">
                <div className="w-full h-full bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                  <span className="text-silver/40 text-sm">Analíticas de datos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-in">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                  {t('features.title')}
                </h2>
                <p className="text-sm sm:text-base text-silver/70 mb-6 sm:mb-8 leading-relaxed">
                  {t('features.subtitle')}
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">verified</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">{t('features.encryption')}</span>
                      <p className="text-sm text-silver/50">{t('features.encryptionDesc')}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">shield</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">{t('features.botShield')}</span>
                      <p className="text-sm text-silver/50">{t('features.botShieldDesc')}</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Live Dashboard Preview */}
              <div className="relative animate-fade-in">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl rounded-3xl -z-10 animate-pulse-glow"></div>
                <div className="bg-[#0F1012] border border-border rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-4 text-xs font-mono text-silver/40 uppercase tracking-widest">
                        {t('features.liveLinks')}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-primary animate-pulse">● {t('features.liveStatus')}</span>
                  </div>
                  <div className="p-6 space-y-4 font-mono">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors animate-slide-in-right">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-500 text-sm">lock</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white">LNK-8921-XPR</span>
                          <span className="text-[10px] text-silver/40">{t('features.created')}: {t('features.ago')} 2m</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                          AES-256
                        </span>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse-glow"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white">LNK-4412-VFY</span>
                          <span className="text-[10px] text-silver/40">{t('features.created')}: {t('features.ago')} 15m</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/30">
                          BOT-SHIELD
                        </span>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse-glow"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-500 text-sm">warning</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white">LNK-9011-BOT</span>
                          <span className="text-[10px] text-silver/40">{t('features.blockedAttempt')}: 1s</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/30">
                          {t('features.denied')}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse-glow"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section with Special Effects */}
        <section className="py-12 sm:py-16 md:py-24 bg-surface/10 px-4 sm:px-6 relative overflow-hidden" id="testimonials">
          {/* Animated silhouette backgrounds */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className={`absolute left-0 top-0 w-96 h-96 transition-all duration-700 ${hoveredTestimonial === 0 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 blur-3xl animate-floating"></div>
              <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full animate-spin-slow"></div>
            </div>
            <div className={`absolute right-0 top-1/2 w-96 h-96 transition-all duration-700 ${hoveredTestimonial === 1 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/30 to-blue-500/30 blur-3xl animate-floating" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-0 border-4 border-cyan/20 rounded-full animate-spin-slow" style={{ animationDelay: '0.3s' }}></div>
            </div>
            <div className={`absolute left-1/2 bottom-0 w-96 h-96 transition-all duration-700 ${hoveredTestimonial === 2 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-500/30 blur-3xl animate-floating" style={{ animationDelay: '1s' }}></div>
              <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-spin-slow" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('testimonials.title')}</h2>
              <p className="text-silver/60">{t('testimonials.subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div 
                className="bg-surface border border-border p-6 rounded-2xl hover:border-primary/30 transition-all hover:scale-105 transform relative group"
                onMouseEnter={() => setHoveredTestimonial(0)}
                onMouseLeave={() => setHoveredTestimonial(null)}
              >
                <div className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg mb-6 relative overflow-hidden group cursor-pointer border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-white group-hover:scale-110 transition-transform">
                      play_circle
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <p className="text-silver/80 italic mb-6">
                  "{t('testimonials.testimonial1')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    AL
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{t('testimonials.name1')}</h4>
                    <p className="text-xs text-silver/40">{t('testimonials.role1')}</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div 
                className="bg-surface border border-border p-6 rounded-2xl hover:border-primary/30 transition-all hover:scale-105 transform relative group"
                onMouseEnter={() => setHoveredTestimonial(1)}
                onMouseLeave={() => setHoveredTestimonial(null)}
              >
                <div className="aspect-video bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-lg mb-6 relative overflow-hidden group cursor-pointer border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-white group-hover:scale-110 transition-transform">
                      play_circle
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <p className="text-silver/80 italic mb-6">
                  "{t('testimonials.testimonial2')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                    MC
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{t('testimonials.name2')}</h4>
                    <p className="text-xs text-silver/40">{t('testimonials.role2')}</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div 
                className="bg-surface border border-border p-6 rounded-2xl hover:border-primary/30 transition-all hover:scale-105 transform relative group"
                onMouseEnter={() => setHoveredTestimonial(2)}
                onMouseLeave={() => setHoveredTestimonial(null)}
              >
                <div className="aspect-video bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg mb-6 relative overflow-hidden group cursor-pointer border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-white group-hover:scale-110 transition-transform">
                      play_circle
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <p className="text-silver/80 italic mb-6">
                  "{t('testimonials.testimonial3')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    VR
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{t('testimonials.name3')}</h4>
                    <p className="text-xs text-silver/40">{t('testimonials.role3')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="py-16 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-silver/40 mb-10">
              {t('payments.title')}
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors transform hover:scale-110">credit_card</span>
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors transform hover:scale-110">
                currency_bitcoin
              </span>
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors transform hover:scale-110">payments</span>
              <span className="material-symbols-outlined text-4xl hover:text-primary transition-colors transform hover:scale-110">
                account_balance
              </span>
              <div className="flex items-center gap-1 font-bold text-2xl text-white hover:text-primary transition-colors transform hover:scale-110">
                <span className="material-symbols-outlined">contactless</span> Pay
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Advanced Animations CSS */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(5deg); }
          66% { transform: translateY(10px) rotate(-5deg); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease-in-out infinite;
        }

        .animate-floating {
          animation: floating 6s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out forwards;
        }

        .floating-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: linear-gradient(45deg, #FFD93D, #6BCF7F);
          border-radius: 50%;
          animation: floating 8s ease-in-out infinite;
        }

        .particle-1 {
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .particle-2 {
          top: 60%;
          right: 20%;
          animation-delay: 2s;
        }

        .particle-3 {
          bottom: 20%;
          left: 30%;
          animation-delay: 4s;
        }

        .particle-4 {
          top: 40%;
          right: 40%;
          animation-delay: 6s;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFD93D;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ffdd5c;
        }

        /* Prevent horizontal scroll */
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }

        /* Touch optimizations */
        @media (max-width: 640px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}
