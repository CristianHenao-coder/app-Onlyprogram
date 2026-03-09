import { useEffect, useMemo, useState } from 'react';
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from '@/services/productPricing.service';
import { useTranslation } from '@/contexts/I18nContext';
import Snackbar from '@/components/Snackbar';

const toNumber = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function ProductPricing() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState<ProductPricingConfig>(DEFAULT_PRODUCT_PRICING);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const cfg = await productPricingService.get();
        if (mounted) setForm(cfg);
      } catch (e: any) {
        if (mounted) setError(e?.message || t('admin.pricing.loadError'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currencyLabel = useMemo(() => {
    const c = (form.currency || 'USD').toUpperCase();
    if (c === 'COP') return 'COP';
    return 'USD';
  }, [form.currency]);

  const onSave = async () => {
    setError(null);
    setOk(null);

    // Validaciones simples
    if (form.link.base <= 0) return setError("El precio base debe ser mayor a 0");
    if (form.link.telegramAddon < 0) return setError("El precio del add-on no puede ser negativo");
    if (form.link.instagramAddon < 0) return setError("El precio del add-on no puede ser negativo");

    try {
      setSaving(true);
      await productPricingService.save(form);
      setOk(t('admin.pricing.saveSuccess'));
    } catch (e: any) {
      setError(e?.message || t('admin.pricing.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Configuración de Precios</h1>
          <p className="text-sm text-white/70 mt-1">
            Revisa y actualiza los precios oficiales de la plataforma ({currencyLabel}). Se reflejarán instantáneamente.
          </p>
        </div>

        <button
          onClick={onSave}
          disabled={loading || saving}
          className="px-6 py-2.5 rounded-xl bg-primary text-black font-bold hover:bg-primary-light disabled:opacity-60 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      <div className="max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary text-3xl">request_quote</span>
            <div>
              <h2 className="text-lg font-bold text-white">Esquema de Precios</h2>
              <p className="text-sm text-white/50">Valores en {currencyLabel}.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Moneda */}
            <div className="md:col-span-3">
              <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Moneda de visualización</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="w-full md:w-1/3 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                <option value="USD">Dólares (USD)</option>
                <option value="COP">Pesos Colombianos (COP)</option>
              </select>
            </div>

            {/* Base Link */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-1 block">Precio 1 Link</label>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                <span className="pl-4 text-white/50 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.link.base}
                  onChange={(e) => setForm((p) => ({ ...p, link: { ...p.link, base: toNumber(e.target.value) } }))}
                  className="w-full px-2 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
              </div>
            </div>

            {/* Telegram Addon */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-1 block">+ Telegram Rotativo</label>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                <span className="pl-4 text-white/50 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.link.telegramAddon}
                  onChange={(e) => setForm((p) => ({ ...p, link: { ...p.link, telegramAddon: toNumber(e.target.value) } }))}
                  className="w-full px-2 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
              </div>
            </div>

            {/* Instagram Addon */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-1 block">+ Instagram</label>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                <span className="pl-4 text-white/50 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.link.instagramAddon}
                  onChange={(e) => setForm((p) => ({ ...p, link: { ...p.link, instagramAddon: toNumber(e.target.value) } }))}
                  className="w-full px-2 py-3 bg-transparent text-white focus:outline-none font-black text-lg"
                />
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-xs text-white/30 flex items-start gap-2 max-w-xl">
            <span className="material-symbols-outlined text-[14px]">info</span>
            <p>
              Estos precios se aplican al calcular el total de los links de tus clientes y en los add-ons que seleccionen al finalizar su pago (Checkout). Los dominios ya no son cobrados separadamente en esta interfaz.
            </p>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-white/70">{t('common.loading')}</div>}

      {error && (
        <Snackbar
          isOpen={!!error}
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}

      {ok && (
        <Snackbar
          isOpen={!!ok}
          message={ok}
          type="success"
          onClose={() => setOk(null)}
        />
      )}
    </div>
  );
}
