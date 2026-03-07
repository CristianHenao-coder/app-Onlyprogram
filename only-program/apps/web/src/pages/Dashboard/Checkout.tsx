import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentsService } from '@/services/payments.service';
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from '@/services/productPricing.service';
import { supabase } from '@/services/supabase';
import toast from 'react-hot-toast';

interface CouponResult {
  code: string;
  discount_percent: number;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(DEFAULT_PRODUCT_PRICING);
  const [loading, setLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState('');

  // Selected plan
  const [selectedPlan, setSelectedPlan] = useState<'free-trial' | 'standard' | 'premium' | null>(null);

  // Extract linksData from navigation state, fall back to localStorage
  const linksDataFromState = location.state?.pendingPurchase?.linksData || [];
  const linksData = linksDataFromState.length > 0
    ? linksDataFromState
    : (() => { try { return JSON.parse(localStorage.getItem('my_links_data') || '[]'); } catch { return []; } })();

  useEffect(() => {
    if (linksData.length === 0) {
      navigate('/dashboard/links');
      return;
    }
    const loadData = async () => {
      try {
        const pricing = await productPricingService.get();
        setPricingCfg(pricing);
      } catch (error) {
        console.error('Error loading checkout data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [linksData.length, navigate]);

  // Price calculations
  const baseStandard = pricingCfg.link.standard * linksData.length;
  const basePremium = pricingCfg.domain.connect;

  const applyDiscount = (base: number) => {
    if (!appliedCoupon) return base;
    return base * (1 - appliedCoupon.discount_percent / 100);
  };

  const priceStandard = applyDiscount(baseStandard);
  const pricePremium = applyDiscount(basePremium);

  // Coupon validation
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('code, discount_percent, is_active, expires_at')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setCouponError('Cupón no válido o inactivo.');
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('Este cupón ha expirado.');
        return;
      }

      setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
      toast.success(`¡Cupón aplicado! ${data.discount_percent}% de descuento`);
    } catch {
      setCouponError('Error al validar el cupón. Intenta nuevamente.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleProductSelect = async (type: 'standard' | 'premium' | 'free-trial') => {
    if (type === 'free-trial') {
      await handleFreeTrial();
      return;
    }
    const amount = type === 'premium' ? pricePremium : priceStandard;
    navigate('/dashboard/payments', {
      state: {
        pendingPurchase: {
          type: type === 'premium' ? 'link_with_domain' : 'links_bundle',
          linksData,
          amount,
          coupon: appliedCoupon?.code || null,
        }
      }
    });
  };

  const handleFreeTrial = async () => {
    const toastId = toast.loading('Activando prueba gratuita...');
    setIsActivating(true);
    try {
      await paymentsService.activateFreeTrial(linksData, '');
      toast.success('¡Links activados correctamente!', { id: toastId });
      localStorage.removeItem('my_links_data');
      navigate('/dashboard/links');
    } catch (error: any) {
      toast.error(error.message || 'Error al activar la prueba', { id: toastId });
    } finally {
      setIsActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 animate-fade-in">

      {/* Header */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/dashboard/links')}
          className="flex items-center gap-2 text-silver/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver al Editor
        </button>
        <h1 className="text-3xl font-black text-white tracking-tight">Resumen del Pedido</h1>
        <p className="text-silver/40 text-sm mt-1">Elige cómo quieres activar tus landing pages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: Plans */}
        <div className="lg:col-span-2 space-y-4">

          {/* FREE TRIAL */}
          <div
            onClick={() => setSelectedPlan('free-trial')}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all group ${selectedPlan === 'free-trial'
                ? 'border-green-500/60 bg-green-500/5 shadow-lg shadow-green-500/10'
                : 'border-white/10 bg-white/[0.02] hover:border-green-500/30'
              }`}
          >
            <div className="absolute top-4 right-4">
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                RECOMENDADO
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-green-400">auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-white text-lg">Prueba Gratuita</h3>
                <p className="text-sm text-silver/40 mt-0.5">30 días sin costo. Sin tarjeta requerida.</p>
                <div className="mt-3 text-2xl font-black text-green-400">$0.00</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 transition-all ${selectedPlan === 'free-trial' ? 'border-green-500 bg-green-500' : 'border-white/20'
                }`}>
                {selectedPlan === 'free-trial' && (
                  <span className="material-symbols-outlined text-white text-sm flex items-center justify-center h-full">check</span>
                )}
              </div>
            </div>
          </div>

          {/* STANDARD */}
          <div
            onClick={() => setSelectedPlan('standard')}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all ${selectedPlan === 'standard'
                ? 'border-primary/60 bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-white/10 bg-white/[0.02] hover:border-primary/30'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-primary">bolt</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-white text-lg">Acceso Vitalicio</h3>
                <p className="text-sm text-silver/40 mt-0.5">Un solo pago, activo para siempre.</p>
                <div className="mt-3 flex items-baseline gap-2">
                  {appliedCoupon && (
                    <span className="text-sm text-silver/30 line-through">{fmt(baseStandard)}</span>
                  )}
                  <span className="text-2xl font-black text-white">{fmt(priceStandard)}</span>
                  <span className="text-xs text-silver/40">
                    × {linksData.length} link{linksData.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 transition-all ${selectedPlan === 'standard' ? 'border-primary bg-primary' : 'border-white/20'
                }`}>
                {selectedPlan === 'standard' && (
                  <span className="material-symbols-outlined text-white text-sm flex items-center justify-center h-full">check</span>
                )}
              </div>
            </div>
          </div>

          {/* PREMIUM */}
          <div
            onClick={() => setSelectedPlan('premium')}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all ${selectedPlan === 'premium'
                ? 'border-purple-500/60 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                : 'border-white/10 bg-white/[0.02] hover:border-purple-500/30'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-purple-400">language</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-white text-lg">Dominio Pro</h3>
                <p className="text-sm text-silver/40 mt-0.5">Usa tu propio dominio personalizado.</p>
                <div className="mt-3 flex items-baseline gap-2">
                  {appliedCoupon && (
                    <span className="text-sm text-silver/30 line-through">{fmt(basePremium)}</span>
                  )}
                  <span className="text-2xl font-black text-white">{fmt(pricePremium)}</span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 transition-all ${selectedPlan === 'premium' ? 'border-purple-500 bg-purple-500' : 'border-white/20'
                }`}>
                {selectedPlan === 'premium' && (
                  <span className="material-symbols-outlined text-white text-sm flex items-center justify-center h-full">check</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="space-y-4">

          {/* Cart Summary */}
          <div className="rounded-2xl border border-white/10 bg-[#080808] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">shopping_cart</span>
                Carrito
              </h2>
            </div>

            <div className="px-6 py-4 space-y-3">
              {/* Links in cart */}
              {linksData.map((link: any, i: number) => (
                <div key={link.id || i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-sm text-primary">link</span>
                  </div>
                  <p className="text-sm text-white font-bold truncate flex-1">{link.name || `Link ${i + 1}`}</p>
                  <span className="text-xs text-silver/40 font-mono shrink-0">
                    {selectedPlan === 'premium' ? '' : fmt(pricingCfg.link.standard)}
                  </span>
                </div>
              ))}

              <div className="border-t border-white/5 pt-3 mt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-silver/40">
                  <span>Subtotal ({linksData.length} link{linksData.length !== 1 ? 's' : ''})</span>
                  <span>{selectedPlan === 'premium' ? fmt(basePremium) : fmt(baseStandard)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>Descuento ({appliedCoupon.code} · -{appliedCoupon.discount_percent}%)</span>
                    <span>-{fmt((selectedPlan === 'premium' ? basePremium : baseStandard) * appliedCoupon.discount_percent / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-1 border-t border-white/5">
                  <span>Total</span>
                  <span className={appliedCoupon ? 'text-green-400' : 'text-white'}>
                    {selectedPlan === 'free-trial' ? '$0.00' :
                      selectedPlan === 'premium' ? fmt(pricePremium) :
                        selectedPlan === 'standard' ? fmt(priceStandard) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="rounded-2xl border border-white/10 bg-[#080808] px-6 py-5">
            <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">confirmation_number</span>
              Cupón de Descuento
            </label>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                  <span className="text-sm font-black text-green-400">{appliedCoupon.code}</span>
                  <span className="text-xs text-green-400/60">-{appliedCoupon.discount_percent}%</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-silver/30 hover:text-red-400 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Ej: DESCUENTO50"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder:text-silver/20 focus:outline-none focus:border-primary/50 transition-all"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || couponLoading}
                    className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {couponLoading ? (
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    ) : (
                      'Aplicar'
                    )}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {couponError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <button
            onClick={() => selectedPlan && handleProductSelect(selectedPlan)}
            disabled={!selectedPlan || isActivating}
            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!selectedPlan
                ? 'bg-white/5 text-silver/30 cursor-not-allowed border border-white/10'
                : selectedPlan === 'free-trial'
                  ? 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95'
                  : selectedPlan === 'premium'
                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
              }`}
          >
            {isActivating ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Procesando...
              </>
            ) : !selectedPlan ? (
              'Selecciona un plan'
            ) : selectedPlan === 'free-trial' ? (
              <>
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                Probar Gratis
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">payment</span>
                Pagar {selectedPlan === 'premium' ? fmt(pricePremium) : fmt(priceStandard)}
              </>
            )}
          </button>

          <p className="text-[10px] text-silver/20 text-center">
            🔒 Pago seguro procesado por Wompi
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {isActivating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 text-center px-8">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-green-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-green-400">auto_awesome</span>
              </div>
            </div>
            <div>
              <h3 className="text-white font-black text-xl mb-1">Activando tu prueba gratuita</h3>
              <p className="text-silver/50 text-sm">Esto puede tomar unos segundos...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
