import { useEffect, useMemo, useState } from 'react';
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from '@/services/productPricing.service';
import Snackbar from '@/components/Snackbar';

const toNumber = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function ProductPricing() {
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
        if (mounted) setError(e?.message || 'No se pudo cargar la configuración de precios.');
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

    // validaciones simples
    if (form.link.standard <= 0) return setError('El precio del link estándar debe ser mayor a 0.');
    if (form.link.rotator <= 0) return setError('El precio del link rotador debe ser mayor a 0.');
    if (form.domain.connect <= 0) return setError('El precio de conectar dominio debe ser mayor a 0.');
    if (form.domain.buy <= 0) return setError('El precio de comprar dominio debe ser mayor a 0.');

    try {
      setSaving(true);
      await productPricingService.save(form);
      setOk('Precios guardados.');
    } catch (e: any) {
      setError(e?.message || 'No se pudieron guardar los precios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Precios de productos</h1>
          <p className="text-sm text-white/70 mt-1">
            Estos precios se usan tanto en el landing (página de precios) como en el cálculo de compra dentro del panel del usuario.
          </p>
        </div>

        <button
          onClick={onSave}
          disabled={loading || saving}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Link pricing */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-medium">Links</h2>
          <p className="text-sm text-white/60 mt-1">Precios para creación de links y extras.</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-white/70">Moneda (USD/COP)</label>
              <input
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10"
                placeholder="USD"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-white/70">Link estándar ({currencyLabel})</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.link.standard}
                  onChange={(e) => setForm((p) => ({ ...p, link: { ...p.link, standard: toNumber(e.target.value) } }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Link rotador ({currencyLabel})</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.link.rotator}
                  onChange={(e) => setForm((p) => ({ ...p, link: { ...p.link, rotator: toNumber(e.target.value) } }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Extra Telegram ({currencyLabel})</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.link.telegramAddon}
                  onChange={(e) => setForm((p) => ({ ...p, link: { ...p.link, telegramAddon: toNumber(e.target.value) } }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10"
                />
              </div>
            </div>

            <div className="text-xs text-white/55">
              Nota: En el usuario, el total se calcula como: <span className="text-white/80">precio del tipo de link</span> + <span className="text-white/80">extra Telegram</span> (si aplica).
            </div>
          </div>
        </div>

        {/* Domain pricing */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-medium">Dominios</h2>
          <p className="text-sm text-white/60 mt-1">Precios para la compra/activación de dominios.</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/70">Conectar dominio ({currencyLabel})</label>
              <input
                type="number"
                step="0.01"
                value={form.domain.connect}
                onChange={(e) => setForm((p) => ({ ...p, domain: { ...p.domain, connect: toNumber(e.target.value) } }))}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Comprar dominio ({currencyLabel})</label>
              <input
                type="number"
                step="0.01"
                value={form.domain.buy}
                onChange={(e) => setForm((p) => ({ ...p, domain: { ...p.domain, buy: toNumber(e.target.value) } }))}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10"
              />
            </div>
          </div>

          <div className="mt-4 text-xs text-white/55">
            Nota: En el flujo de dominios, el total normalmente es: <span className="text-white/80">setup</span> + <span className="text-white/80">mensualidad</span> (si se cobra el primer mes por adelantado).
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-white/70">Cargando…</div>}

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
