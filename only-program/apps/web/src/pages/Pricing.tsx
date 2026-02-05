import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from '@/contexts/I18nContext';

function formatUSD(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function Pricing() {
  const { t } = useTranslation();

  const [qty, setQty] = useState(1);
  const [withTelegram, setWithTelegram] = useState(false);

  const basePrice = withTelegram ? 94.99 : 74.99;

  const discount = useMemo(() => {
    if (qty >= 20) return 0.25;
    if (qty >= 10) return 0.12;
    if (qty >= 5) return 0.05;
    return 0;
  }, [qty]);

  const perLink = basePrice * (1 - discount);
  const total = perLink * qty;

  const discountLabel = discount === 0 ? t('pricingPage.discount') : `-${Math.round(discount * 100)}%`;

  const tiers = [
    { n: 1, label: `1 ${t('pricingPage.calculator.perLink')}`, d: 0 },
    { n: 5, label: `5 links`, d: 0.05 },
    { n: 10, label: `10 links`, d: 0.12 },
    { n: 20, label: `20 links`, d: 0.25 },
  ];

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

            <div className="mt-12 grid lg:grid-cols-12 gap-8 items-start">
              {/* Calculator */}
              <div data-reveal className="lg:col-span-7 rounded-3xl border border-border bg-surface/40 p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -inset-16 blur-3xl" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(29,161,242,.22) 0%, transparent 60%)' }} />
                <div className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-silver/40 font-bold">{t('pricingPage.calculator.title')}</p>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{t('pricingPage.calculator.subtitle')}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWithTelegram((v) => !v)}
                      className={`px-4 py-2 rounded-xl border transition-all font-semibold text-sm ${withTelegram ? 'border-primary/60 bg-primary/10 text-white' : 'border-border bg-background-dark/40 text-silver/70 hover:text-white'}`}
                    >
                      <span className="material-symbols-outlined align-middle text-base mr-2">{withTelegram ? 'verified' : 'bolt'}</span>
                      {withTelegram ? t('pricingPage.calculator.withTelegram') : t('pricingPage.calculator.noTelegram')}
                    </button>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-silver/70">{t('pricingPage.calculator.qtyLabel')}</p>
                      <p className="text-white font-bold">{qty}</p>
                    </div>
                    <input
                      className="mt-3 w-full accent-[#1DA1F2]"
                      type="range"
                      min={1}
                      max={20}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {tiers.map((tier) => {
                        const active = qty >= tier.n && (tier.n === 20 ? qty >= 20 : qty >= tier.n);
                        return (
                          <div
                            key={tier.n}
                            className={`rounded-2xl border p-4 transition-all ${active ? 'border-primary/50 bg-primary/10' : 'border-border bg-background-dark/40'}`}
                          >
                            <p className="text-white font-bold">{tier.label}</p>
                            <p className={`text-sm mt-1 ${active ? 'text-primary' : 'text-silver/50'}`}>
                              {tier.d === 0 ? t('pricingPage.calculator.base') : `-${Math.round(tier.d * 100)}%`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-border bg-background-dark/40 p-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-silver/40 font-bold">{t('pricingPage.calculator.totalMonthly')}</p>
                        <p className="text-3xl font-extrabold text-white mt-2">{formatUSD(total)}</p>
                        <p className="text-sm text-silver/55 mt-2">
                          {formatUSD(perLink)} {t('pricingPage.calculator.perLink')} · <span className="text-white">{discountLabel}</span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Link
                          to="/register"
                          data-magnetic="0.12"
                          className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 text-center"
                        >
                          {t('auth.createAccount')}
                        </Link>

                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-xs text-silver/55 leading-relaxed">
                    <p>• {t('pricingPage.calculator.notes.0')}</p>
                    <p>• {t('pricingPage.calculator.notes.1')}</p>
                    <p>• {t('pricingPage.calculator.notes.2')}</p>
                  </div>
                </div>
              </div>

              {/* Plan summary */}
              <div data-reveal data-delay="2" className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl border border-border bg-surface/40 p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold">{t('pricingPage.includes.title')}</p>
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                  </div>
                  <ul className="mt-5 space-y-3 text-sm text-silver/65">
                    <li className="flex gap-2"><span className="material-symbols-outlined text-primary text-base">check</span>{t('pricingPage.includes.items.0')}</li>
                    <li className="flex gap-2"><span className="material-symbols-outlined text-primary text-base">check</span>{t('pricingPage.includes.items.1')}</li>
                    <li className="flex gap-2"><span className="material-symbols-outlined text-primary text-base">check</span>{t('pricingPage.includes.items.2')}</li>
                    <li className="flex gap-2"><span className="material-symbols-outlined text-primary text-base">check</span>{t('pricingPage.includes.items.3')}</li>
                  </ul>
                  <div className="mt-6">
                    <a
                      href="#faq"
                      className="block w-full py-3 rounded-xl border border-border bg-surface/30 text-white font-bold hover:border-primary/50 transition-all text-center text-sm"
                    >
                      {t('pricingPage.calculator.viewDetails')}
                    </a>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-surface/40 p-6">
                  <p className="text-white font-bold">
                    {withTelegram ? t('pricingPage.telegramOrb.title') : t('pricingPage.telegramOrb.titleSolo')}
                  </p>
                  <p className="text-sm text-silver/60 mt-2">
                    {withTelegram ? t('pricingPage.telegramOrb.desc') : t('pricingPage.telegramOrb.descSolo')}
                  </p>
                  <div className="mt-4 rounded-2xl border border-border bg-background-dark/40 p-4">
                    <p className="text-xs text-silver/50">{t('pricingPage.telegramOrb.priceLabel')}</p>
                    <p className="text-xl font-extrabold text-white mt-1">{formatUSD(withTelegram ? 94.99 : 74.99)}</p>
                    <p className="text-xs text-silver/55 mt-2">{t('pricingPage.telegramOrb.billing')}</p>
                  </div>
                </div>
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

            <div className="mt-14 text-center" data-reveal data-delay="3">
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
