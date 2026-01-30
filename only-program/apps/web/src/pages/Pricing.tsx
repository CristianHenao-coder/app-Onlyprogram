import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from '@/contexts/I18nContext';

export default function Pricing() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
  const [linkCount, setLinkCount] = useState(1);

  // Precios base por link
  const pricePerLink = {
    basic: {
      monthly: 10,
      yearly: 96, // 20% descuento: 10*12*0.8
    },
    pro: {
      monthly: 20,
      yearly: 192, // 20% descuento: 20*12*0.8
    }
  };

  const calculatePrice = () => {
    const basePrice = pricePerLink[selectedPlan][billingCycle];
    return basePrice * linkCount;
  };

  const pricePerMonth = billingCycle === 'yearly' 
    ? (calculatePrice() / 12).toFixed(2)
    : calculatePrice().toFixed(2);

  // Features para cada plan
  const features = {
    basic: [
      { name: 'Direct Links', info: 'Enlaces directos protegidos' },
      { name: 'Link Protection', info: 'Protección básica contra bots' },
      { name: 'Custom Domains', info: 'Dominios personalizados' },
      { name: 'Deeplink Technology', info: 'Tecnología de enlaces profundos' },
      { name: 'Traffic Routing', info: 'Enrutamiento de tráfico' },
      { name: 'Split Tester', info: 'Pruebas A/B de enlaces' },
      { name: 'Advanced Analytics', info: 'Analíticas en tiempo real' },
      { name: 'Password Link', info: 'Enlaces con contraseña' },
    ],
    pro: [
      { name: 'Direct Links', info: 'Enlaces directos protegidos' },
      { name: 'Advanced Bot Protection', info: 'Protección avanzada con IA contra bots' },
      { name: t('pricing.telegramRotativo'), info: 'Sistema anti-ban para Telegram' },
      { name: 'Custom Domains', info: 'Dominios personalizados ilimitados' },
      { name: 'Deeplink Technology', info: 'Tecnología de enlaces profundos' },
      { name: 'Traffic Routing', info: 'Enrutamiento inteligente de tráfico' },
      { name: 'Retarget Users', info: 'Retargeting de usuarios' },
      { name: 'Split Tester', info: 'Pruebas A/B avanzadas' },
      { name: 'Advanced Analytics', info: 'Analíticas en tiempo real con IA' },
      { name: 'Team Management', info: 'Gestión de equipos' },
      { name: 'Sensitive Warning', info: 'Advertencias de contenido sensible' },
      { name: 'Password Link', info: 'Enlaces con contraseña' },
      { name: 'Priority Support', info: 'Soporte prioritario 24/7' },
    ]
  };

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <main className="pt-20 sm:pt-24 pb-8 sm:pb-12 md:pb-16 lg:pb-20" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Header */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 animate-fade-in">
            <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-primary"></div>
            <span className="text-primary font-bold text-sm sm:text-base uppercase tracking-wider">Pricing</span>
            <div className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-primary"></div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 animate-slide-up">
            <span className="text-white">{t('pricing.title').split(' ').slice(0, -2).join(' ')} </span>
            <span className="text-primary">{t('pricing.title').split(' ').slice(-2).join(' ')}</span>
          </h1>
          
          <p className="text-silver/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 animate-fade-in">
            {t('pricing.subtitle')}
          </p>
        </section>

        {/* Plan Selector */}
        <section className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12 animate-slide-up">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setSelectedPlan('basic')}
              className={`py-3 sm:py-4 rounded-lg font-bold transition-all text-sm sm:text-base ${
                selectedPlan === 'basic'
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                  : 'text-silver hover:text-white'
              }`}
            >
              {t('pricing.basicPlan')}
            </button>
            <button
              onClick={() => setSelectedPlan('pro')}
              className={`py-3 sm:py-4 rounded-lg font-bold transition-all text-sm sm:text-base relative ${
                selectedPlan === 'pro'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-silver hover:text-white'
              }`}
            >
              {t('pricing.proPlan')}
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {t('pricing.best')}
              </span>
            </button>
          </div>
        </section>

        {/* Main Pricing Card */}
        <section className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Toggle Annual/Monthly */}
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all text-sm sm:text-base relative ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-white'
                    : 'text-silver hover:text-white'
                }`}
              >
                {t('pricing.annual')}
                {billingCycle === 'yearly' && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                    {t('pricing.save')} 20%
                  </span>
                )}
              </button>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-white'
                    : 'text-silver hover:text-white'
                }`}
              >
                {t('pricing.monthly')}
              </button>
            </div>

            {/* Price Display */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-start justify-center mb-2">
                <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                  ${pricePerMonth}
                </span>
                {billingCycle === 'yearly' && (
                  <span className="text-silver/60 text-sm ml-2 mt-2 line-through">
                    ${(pricePerLink[selectedPlan].monthly * linkCount).toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-silver/70 text-sm sm:text-base">
                {t('pricing.perMonth')}, {billingCycle === 'yearly' ? t('pricing.billedAnnually') : t('pricing.billedMonthly')}
              </p>
              {billingCycle === 'yearly' && (
                <p className="text-primary text-xs sm:text-sm font-semibold mt-2">
                  Free for 7 days
                </p>
              )}
            </div>

            {/* Link Count Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-silver font-medium text-sm sm:text-base">{t('pricing.links')}</label>
                <span className="text-white font-bold text-lg sm:text-xl">{linkCount}</span>
              </div>
              
              <input
                type="range"
                min="1"
                max="50"
                value={linkCount}
                onChange={(e) => setLinkCount(Number(e.target.value))}
                className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #FFD93D 0%, #FFD93D ${(linkCount / 50) * 100}%, #1a1a1a ${(linkCount / 50) * 100}%, #1a1a1a 100%)`
                }}
              />
              
              <div className="flex justify-between text-xs text-silver/40 mt-2">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {features[selectedPlan].map((feature, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    {feature.name === 'Telegram Rotativo' ? (
                      <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0">
                        autorenew
                      </span>
                    ) : feature.name.includes('Bot Protection') || feature.name.includes('Advanced Bot') ? (
                      <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
                        shield
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
                        check_circle
                      </span>
                    )}
                    <span className="text-white font-medium text-sm sm:text-base">{feature.name}</span>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined text-silver/40 hover:text-silver text-lg cursor-help">
                      info
                    </span>
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-background-dark border border-border rounded-lg p-2 shadow-xl z-10">
                      <p className="text-xs text-silver">{feature.info}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              to="/register"
              className="block w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 sm:py-4 rounded-xl transition-all text-center text-sm sm:text-base shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:scale-105 group"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
            {t('pricing.comparison')}
          </h2>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-background-dark">
                <tr>
                  <th className="text-left p-4 text-silver font-semibold">Feature</th>
                  <th className="text-center p-4 text-silver font-semibold">{t('pricing.basicPlan')}</th>
                  <th className="text-center p-4 text-silver font-semibold">{t('pricing.proPlan')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-4 text-white">{t('pricing.botProtection')}</td>
                  <td className="p-4 text-center">
                    <span className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">Basic</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">{t('pricing.advancedAI')}</span>
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4 text-white">Telegram Rotativo</td>
                  <td className="p-4 text-center">
                    <span className="material-symbols-outlined text-silver/30">close</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4 text-white">{t('pricing.analytics')}</td>
                  <td className="p-4 text-center text-silver">{t('pricing.standard')}</td>
                  <td className="p-4 text-center text-primary font-semibold">{t('pricing.realTimeAI')}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4 text-white">{t('pricing.support')}</td>
                  <td className="p-4 text-center text-silver">{t('pricing.emailSupport')}</td>
                  <td className="p-4 text-center text-primary font-semibold">{t('pricing.priority247')}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4 text-white">{t('pricing.pricePerLink')}</td>
                  <td className="p-4 text-center text-white font-bold">${pricePerLink.basic.monthly}</td>
                  <td className="p-4 text-center text-primary font-bold">${pricePerLink.pro.monthly}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Basic Plan</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-silver">Bot Protection:</span>
                  <span className="text-green-400">Basic</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver">Telegram Rotativo:</span>
                  <span className="material-symbols-outlined text-silver/30">close</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver">Analytics:</span>
                  <span className="text-white">Standard</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver">Support:</span>
                  <span className="text-white">Email</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-silver font-semibold">Price/link/month:</span>
                  <span className="text-white font-bold text-lg">${pricePerLink.basic.monthly}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border-2 border-primary rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1 rounded-full text-xs font-bold">
                {t('pricing.recommended')}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{t('pricing.proPlan')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-silver">Bot Protection:</span>
                  <span className="text-primary font-bold">Advanced AI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver">Telegram Rotativo:</span>
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver">Analytics:</span>
                  <span className="text-primary font-semibold">Real-time AI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver">Support:</span>
                  <span className="text-primary font-semibold">Priority 24/7</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-silver font-semibold">Price/link/month:</span>
                  <span className="text-primary font-bold text-lg">${pricePerLink.pro.monthly}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 rounded-3xl p-6 sm:p-8 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              {t('pricing.needMore')}
            </h2>
            <p className="text-silver/80 mb-6 sm:mb-8 text-sm sm:text-base">
              Contact our sales team for custom enterprise pricing and dedicated support.
            </p>
            <a
              href="mailto:sales@onlyprogram.com"
              className="inline-block bg-gradient-to-r from-primary to-secondary text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:scale-105 transition-transform text-sm sm:text-base group"
            >
              {t('pricing.contactSales')}
            </a>
          </div>
        </section>
      </main>

      <Footer />

      {/* Custom Styles */}
      <style>{`
        /* Slider customization */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FFD93D;
          cursor: pointer;
          border: 3px solid #0a0a0a;
          box-shadow: 0 0 10px rgba(255, 217, 61, 0.5);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FFD93D;
          cursor: pointer;
          border: 3px solid #0a0a0a;
          box-shadow: 0 0 10px rgba(255, 217, 61, 0.5);
        }

        input[type="range"]:focus {
          outline: none;
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
