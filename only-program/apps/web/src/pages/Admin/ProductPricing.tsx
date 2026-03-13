import { useEffect, useMemo, useState } from 'react';
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from '@/services/productPricing.service';
import { useTranslation } from '@/contexts/I18nContext';
import Snackbar from '@/components/Snackbar';

const toNumber = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// Extended pricing config that adds discount fields
interface ExtendedPricingConfig extends ProductPricingConfig {
  globalDiscount?: number;      // global % discount shown on pricing page (0 = none)
  affiliateDiscount?: number;   // affiliate program standard discount
  bulkDiscount2?: number;       // discount % for 2+ links
  bulkDiscount5?: number;       // discount % for 5+ links
  bulkDiscount10?: number;      // discount % for 10+ links
}


function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
      <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
      <div>
        <h2 className="text-base font-black text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function ProductPricing() {
  const { t } = useTranslation();
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [error, setError]      = useState<string | null>(null);
  const [ok, setOk]            = useState<string | null>(null);
  const [form, setForm]        = useState<ExtendedPricingConfig>({
    ...DEFAULT_PRODUCT_PRICING,
    globalDiscount: 0,
    affiliateDiscount: 33,
    bulkDiscount2: 5,
    bulkDiscount5: 10,
    bulkDiscount10: 15,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const cfg = await productPricingService.get() as ExtendedPricingConfig;
        if (mounted) setForm({
          ...cfg,
          globalDiscount: (cfg as any).globalDiscount ?? 0,
          affiliateDiscount: (cfg as any).affiliateDiscount ?? 33,
          bulkDiscount2: (cfg as any).bulkDiscount2 ?? 5,
          bulkDiscount5: (cfg as any).bulkDiscount5 ?? 10,
          bulkDiscount10: (cfg as any).bulkDiscount10 ?? 15,
        });
      } catch (e: any) {
        if (mounted) setError(e?.message || t('admin.pricing.loadError'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const currencyLabel = useMemo(() => {
    return (form.currency || 'USD').toUpperCase() === 'COP' ? 'COP' : 'USD';
  }, [form.currency]);

  const onSave = async () => {
    setError(null);
    setOk(null);
    if (form.link.tiktok <= 0) return setError('El precio de TikTok debe ser mayor a 0');
    if (form.link.instagram <= 0) return setError('El precio de Instagram debe ser mayor a 0');
    if (form.link.dual <= 0) return setError('El precio Dual debe ser mayor a 0');
    if (form.link.telegramAddon < 0) return setError('El add-on Telegram no puede ser negativo');

    try {
      setSaving(true);
      await productPricingService.save(form as ProductPricingConfig);
      setOk(t('admin.pricing.saveSuccess'));
    } catch (e: any) {
      setError(e?.message || t('admin.pricing.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof ExtendedPricingConfig, val: any) =>
    setForm(p => ({ ...p, [key]: val }));

  const setLink = (key: keyof ProductPricingConfig['link'], val: number) =>
    setForm(p => ({ ...p, link: { ...p.link, [key]: val } }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Configuración de Precios</h1>
          <p className="text-silver/40 text-sm mt-1">
            Gestiona todos los precios, descuentos y ofertas de la plataforma. Los cambios son instantáneos.
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={loading || saving}
          className="shrink-0 px-6 py-3 rounded-xl bg-primary text-white font-black hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-sm"
        >
          {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? 'Guardando...' : (
            <>
              <span className="material-symbols-outlined text-base">save</span>
              Guardar Todo
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ── CARD 1: Precios base ───────────────── */}
        <div className="bg-[#080808] border border-white/5 rounded-3xl p-6 md:p-8">
          <SectionTitle
            icon="request_quote"
            title="Precios Base de Productos"
            subtitle={`Valores en ${currencyLabel}. Aplican a cada link/servicio adquirido.`}
          />

          {/* Currency */}
          <div className="mb-6">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Moneda</label>
            <select
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
              className="w-full md:w-1/2 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary/50 outline-none"
            >
              <option value="USD">Dólares (USD)</option>
              <option value="COP">Pesos Colombianos (COP)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TikTok */}
            <div className="bg-[#060606] border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Landing TikTok</p>
              </div>
              <p className="text-[10px] text-white/25 mb-3">Link en bio modo circular / minimalista</p>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-blue-500/50 transition-all">
                <span className="pl-4 text-white/40 font-mono text-sm">$</span>
                <input
                  type="number" step="0.01" min={0}
                  value={form.link.tiktok}
                  onChange={e => setLink('tiktok', toNumber(e.target.value))}
                  className="w-full px-2 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
              </div>
            </div>

            {/* Instagram */}
            <div className="bg-[#060606] border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Instagram & Facebook</p>
              </div>
              <p className="text-[10px] text-white/25 mb-3">Modo directo Meta Shield</p>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-red-500/50 transition-all">
                <span className="pl-4 text-white/40 font-mono text-sm">$</span>
                <input
                  type="number" step="0.01" min={0}
                  value={form.link.instagram}
                  onChange={e => setLink('instagram', toNumber(e.target.value))}
                  className="w-full px-2 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
              </div>
            </div>

            {/* Dual */}
            <div className="bg-[#060606] border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Pack Dual</p>
              </div>
              <p className="text-[10px] text-white/25 mb-3">TikTok + Instagram en un solo pack</p>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-purple-500/50 transition-all">
                <span className="pl-4 text-white/40 font-mono text-sm">$</span>
                <input
                  type="number" step="0.01" min={0}
                  value={form.link.dual}
                  onChange={e => setLink('dual', toNumber(e.target.value))}
                  className="w-full px-2 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
              </div>
            </div>

            {/* Telegram addon */}
            <div className="bg-[#060606] border border-cyan-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">+ Telegram Rotativo</p>
              </div>
              <p className="text-[10px] text-white/25 mb-3">Add-on disponible sobre cualquier producto</p>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-cyan-500/50 transition-all">
                <span className="pl-4 text-white/40 font-mono text-sm">$</span>
                <input
                  type="number" step="0.01" min={0}
                  value={form.link.telegramAddon}
                  onChange={e => setLink('telegramAddon', toNumber(e.target.value))}
                  className="w-full px-2 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
              </div>
            </div>
          </div>

          {/* Price preview */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-3">Resumen de precios</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-white/60">TikTok: <strong className="text-blue-400">${form.link.tiktok}</strong></span>
              <span className="text-white/60">TikTok + Telegram: <strong className="text-cyan-400">${(form.link.tiktok + form.link.telegramAddon).toFixed(2)}</strong></span>
              <span className="text-white/60">Instagram: <strong className="text-red-400">${form.link.instagram}</strong></span>
              <span className="text-white/60">Instagram + Telegram: <strong className="text-cyan-400">${(form.link.instagram + form.link.telegramAddon).toFixed(2)}</strong></span>
              <span className="text-white/60">Pack Dual: <strong className="text-purple-400">${form.link.dual}</strong></span>
              <span className="text-white/60">Dual + Telegram: <strong className="text-cyan-400">${(form.link.dual + form.link.telegramAddon).toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Descuentos ───────────────── */}
        <div className="bg-[#080808] border border-white/5 rounded-3xl p-6 md:p-8">
          <SectionTitle
            icon="percent"
            title="Descuentos y Promociones"
            subtitle="Controla todos los descuentos que aplican en la plataforma."
          />

          <div className="space-y-4">
            {/* Global promo discount */}
            <div className="p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-yellow-400 text-base">local_offer</span>
                <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">Descuento Global de Promoción</p>
              </div>
              <p className="text-xs text-white/40 mb-3">Se muestra en la página de precios públicos como una oferta especial. Pon 0 para desactivarlo.</p>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-yellow-500/50 transition-all w-36">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.globalDiscount ?? 0}
                  onChange={e => set('globalDiscount', toNumber(e.target.value))}
                  className="w-full px-4 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
                <span className="pr-4 text-white/40 font-black">%</span>
              </div>
            </div>

            {/* Affiliate standard discount */}
            <div className="p-4 rounded-2xl border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-violet-400 text-base">handshake</span>
                <p className="text-xs font-black text-violet-400 uppercase tracking-widest">Descuento Estándar de Referidos</p>
              </div>
              <p className="text-xs text-white/40 mb-3">Descuento que reciben los clientes cuando usan el cupón de un afiliado.</p>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-violet-500/50 transition-all w-36">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.affiliateDiscount ?? 33}
                  onChange={e => set('affiliateDiscount', toNumber(e.target.value))}
                  className="w-full px-4 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
                <span className="pr-4 text-white/40 font-black">%</span>
              </div>
            </div>

            {/* Bulk discounts */}
            <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-green-400 text-base">layers</span>
                <p className="text-xs font-black text-green-400 uppercase tracking-widest">Descuentos por Volumen</p>
              </div>
              <p className="text-xs text-white/40 mb-3">Descuentos escalonados según la cantidad de links comprados.</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '2+ Links', key: 'bulkDiscount2' as const, val: form.bulkDiscount2 },
                  { label: '5+ Links', key: 'bulkDiscount5' as const, val: form.bulkDiscount5 },
                  { label: '10+ Links', key: 'bulkDiscount10' as const, val: form.bulkDiscount10 },
                ].map(({ label, key, val }) => (
                  <div key={key}>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{label}</p>
                    <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-green-500/50 transition-all">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={val ?? 0}
                        onChange={e => set(key, toNumber(e.target.value))}
                        className="w-full px-3 py-2.5 bg-transparent text-white focus:outline-none font-black"
                      />
                      <span className="pr-3 text-white/30 font-black text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-2 text-xs text-white/20 max-w-2xl">
        <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">info</span>
        <p>
          Los precios se aplican en tiempo real sobre los links de los usuarios durante el checkout.
          Los descuentos de volumen se aplican automáticamente según la cantidad seleccionada.
          El descuento de referidos solo aplica cuando se usa un cupón válido de un afiliado registrado.
        </p>
      </div>

      {loading && <div className="text-sm text-white/40">{t('common.loading')}</div>}

      {error && (
        <Snackbar isOpen={!!error} message={error} type="error" onClose={() => setError(null)} />
      )}
      {ok && (
        <Snackbar isOpen={!!ok} message={ok} type="success" onClose={() => setOk(null)} />
      )}
    </div>
  );
}
