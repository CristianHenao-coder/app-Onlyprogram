import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsService, Payment } from "../../services/payments.service";
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from "@/services/productPricing.service";
import { supabase } from "../../services/supabase";
import PaymentSelector from "@/components/PaymentSelector";
import toast from "react-hot-toast";

interface CouponResult {
  code: string;
  discount_percent: number;
}

export default function Payments() {
  const location = useLocation();
  const navigate = useNavigate();
  const [_, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(DEFAULT_PRODUCT_PRICING);
  const [currentStep, setCurrentStep] = useState<"cart" | "payment" | "success">("cart");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");

  const pendingPurchase = location.state?.pendingPurchase || null;
  const linksData: any[] = pendingPurchase?.linksData || [];
  const isFromLinks = linksData.length > 0 && pendingPurchase?.type === "links_bundle";

  useEffect(() => {
    const load = async () => {
      try {
        const [data, pricing] = await Promise.all([
          paymentsService.getHistory(),
          productPricingService.get(),
        ]);
        setPayments(data.payments || []);
        setPricingCfg(pricing);

        // If coming from links editor, show cart step first
        if (isFromLinks) {
          setCurrentStep("cart");
        } else {
          setCurrentStep("payment");
        }
      } catch (error) {
        console.error("Error loading payments:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isFromLinks]);

  // Prices
  const baseTotal = isFromLinks
    ? pricingCfg.link.standard * linksData.length
    : pendingPurchase?.amount || 0;

  const discountAmount = appliedCoupon
    ? baseTotal * (appliedCoupon.discount_percent / 100)
    : 0;

  const finalTotal = baseTotal - discountAmount;

  // Coupon validation
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("code, discount_percent, is_active, expires_at")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setCouponError("Cupón no válido o inactivo.");
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError("Este cupón ha expirado.");
        return;
      }
      setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
      toast.success(`¡Cupón aplicado! ${data.discount_percent}% de descuento`);
    } catch {
      setCouponError("Error al validar el cupón.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handlePaymentSuccess = async (_data?: any) => {
    const toastId = toast.loading("Finalizando tu configuración...");
    try {
      localStorage.removeItem("my_links_data");
      toast.success("¡Links activados correctamente!", { id: toastId });
      setCurrentStep("success");
    } catch (error) {
      console.error("Error in fulfillment:", error);
      toast.error("Error al finalizar. Contacta a soporte.", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20 animate-fade-in">

      {/* ── STEP 1: CART + COUPON ── */}
      {currentStep === "cart" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate("/dashboard/links")}
              className="flex items-center gap-2 text-silver/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver
            </button>
          </div>

          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Resumen del Pedido</h1>
            <p className="text-silver/40 text-sm mt-1">Revisa tu pedido y aplica un cupón antes de pagar.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Links detail */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#080808] overflow-hidden">
                {/* Cart header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">shopping_cart</span>
                  <h2 className="font-black text-white text-sm uppercase tracking-wider">
                    {linksData.length} Link{linksData.length !== 1 ? "s" : ""} a Activar
                  </h2>
                </div>

                {/* Link rows */}
                <div className="divide-y divide-white/5">
                  {linksData.map((link: any, i: number) => (
                    <div key={link.id || i} className="flex items-center gap-4 px-6 py-4">
                      {/* Thumbnail */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: link.theme?.backgroundStart || "#111" }}
                      >
                        {link.profileImage && link.profileImage !== "" ? (
                          <img src={link.profileImage} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-white/40 text-base">link</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                          {link.name || `Link ${i + 1}`}
                        </p>
                        <p className="text-xs text-silver/40 truncate">
                          {link.buttons?.length || 0} botón{link.buttons?.length !== 1 ? "es" : ""}
                        </p>
                      </div>
                      <span className="text-sm font-mono text-white shrink-0">
                        {fmt(pricingCfg.link.standard)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] space-y-2">
                  <div className="flex justify-between text-sm text-silver/40">
                    <span>Subtotal</span>
                    <span className="font-mono">{fmt(baseTotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Cupón <span className="font-mono font-bold">{appliedCoupon.code}</span> (-{appliedCoupon.discount_percent}%)</span>
                      <span className="font-mono">-{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white border-t border-white/5 pt-2 mt-1">
                    <span>Total a Pagar</span>
                    <span className={appliedCoupon ? "text-green-400" : "text-white"}>
                      {fmt(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Coupon + CTA */}
            <div className="space-y-4">
              {/* Coupon box */}
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
                    <button onClick={removeCoupon} className="text-silver/30 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
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
                        ) : "Aplicar"}
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

              {/* Order summary card */}
              <div className="rounded-2xl border border-white/10 bg-[#080808] px-6 py-5 space-y-2">
                <div className="flex justify-between text-xs text-silver/40">
                  <span>{linksData.length} link{linksData.length !== 1 ? "s" : ""}</span>
                  <span className="font-mono">{fmt(baseTotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>Descuento</span>
                    <span className="font-mono">-{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-white border-t border-white/5 pt-2 text-sm">
                  <span>Total</span>
                  <span className={appliedCoupon ? "text-green-400" : ""}>{fmt(finalTotal)}</span>
                </div>
              </div>

              {/* Proceed button */}
              <button
                onClick={() => setCurrentStep("payment")}
                className="w-full py-4 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-wider hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">payment</span>
                Ir a Pagar — {fmt(finalTotal)}
              </button>

              <p className="text-[10px] text-silver/20 text-center">🔒 Pago seguro procesado por Wompi</p>
            </div>

          </div>
        </div>
      )}

      {/* ── STEP 2: WIDGET DE PAGO ── */}
      {currentStep === "payment" && (
        <div className="space-y-8">
          {/* Header */}
          <div>
            {isFromLinks && (
              <button
                onClick={() => setCurrentStep("cart")}
                className="flex items-center gap-2 text-silver/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Volver al Carrito
              </button>
            )}
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Registra tu Pago</h1>
            <p className="text-silver/60 mt-1">Completa tu proceso para activar tus servicios.</p>
          </div>

          {/* Order summary mini */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <div>
                <p className="font-bold text-white text-sm">
                  {isFromLinks
                    ? `${linksData.length} Link${linksData.length !== 1 ? "s" : ""} — Acceso Vitalicio`
                    : "Compra"}
                </p>
                {appliedCoupon && (
                  <p className="text-xs text-green-400">Cupón {appliedCoupon.code} aplicado ({appliedCoupon.discount_percent}% off)</p>
                )}
              </div>
            </div>
            <div className="text-right">
              {appliedCoupon && (
                <p className="text-xs text-silver/30 line-through">{fmt(baseTotal)}</p>
              )}
              <p className="text-2xl font-black text-white">{fmt(finalTotal)}</p>
            </div>
          </div>

          {/* Payment widget */}
          <div className="bg-surface/40 border border-border rounded-3xl p-8 md:p-12 shadow-2xl">
            <PaymentSelector
              onSelect={() => { }}
              initialMethod="card"
              amount={finalTotal}
              onSuccess={handlePaymentSuccess}
              linksData={linksData}
              customDomain={pendingPurchase?.customDomain}
            />
          </div>
        </div>
      )}

      {/* ── STEP 3: ÉXITO ── */}
      {currentStep === "success" && (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl text-emerald-400">check_circle</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">¡Pago Exitoso!</h1>
            <p className="text-silver/60 text-lg leading-relaxed">
              Tus links han sido activados. Ya puedes compartirlos con el mundo.
            </p>
          </div>
          <div className="pt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/links")}
              className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-silver transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Ir a mis Links
            </button>
          </div>
        </div>
      )}

      {/* Decorative Footer (only on payment step) */}
      {currentStep === "payment" && (
        <div className="mt-10 bg-surface/20 border border-white/5 rounded-2xl p-8">
          <h3 className="text-center text-xs font-black text-silver/40 uppercase tracking-widest mb-6">
            Métodos de Pago Aceptados
          </h3>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: "currency_bitcoin", color: "text-orange-500", bg: "bg-orange-500/20", label: "Crypto" },
              { icon: "account_balance_wallet", color: "text-[#0070ba]", bg: "bg-[#0070ba]/20", label: "PayPal" },
              { icon: "credit_card", color: "text-red-500", bg: "bg-red-500/20", label: "Mastercard" },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
                <div className={`h-12 w-12 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${m.color} text-2xl`}>{m.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-silver/60 uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
