import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsService } from "../../services/payments.service";
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

  const [loading, setLoading] = useState(true);
  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(DEFAULT_PRODUCT_PRICING);
  const [currentStep, setCurrentStep] = useState<"cart" | "payment" | "success">("cart");
  const [isSubscription, setIsSubscription] = useState(false);

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
        const [_, pricing] = await Promise.all([
          paymentsService.getHistory(),
          productPricingService.get(),
        ]);
        setPricingCfg(pricing);

        // Check for Wompi redirect status
        const params = new URLSearchParams(location.search);
        if (params.get("status") === "wompi_return") {
          setCurrentStep("success");
          toast.success("¡Pago procesado con éxito!");
          return;
        }

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
  }, [isFromLinks, location.search]);
  // Si aplicaron cupón en checkout, lo iniciamos acá tmbn
  useEffect(() => {
    if (pendingPurchase?.coupon && !appliedCoupon) {
      // Idealmente lo cargaríamos de la db para ver el %. 
      // Por ahora usemos el finalTotal de Checkout si no queremos cargar de nuevo, 
      // pero la forma correcta es recuperar el %.
    }
  }, []);

  // Prices calculation
  const calculatedBaseTotal = linksData.reduce((acc: number, link: any) => {
    let linkPrice = 0;
    
    // Choose base price based on landing mode
    if (link.landingMode === "dual") {
      linkPrice = pricingCfg.link.dual ?? 0;
    } else if (link.landingMode === "direct") {
      linkPrice = pricingCfg.link.instagram ?? 0;
    } else {
      // Default / TikTok template
      linkPrice = pricingCfg.link.tiktok ?? 0;
    }

    // Addons - Check if any button has rotator active
    if (link.buttons?.some((b: any) => b.rotator_active || b.rotatorActive)) {
      linkPrice += pricingCfg.link.telegramAddon ?? 0;
    }
    
    return acc + linkPrice;
  }, 0);


  const baseTotal = pendingPurchase?.baseAmount || (
    isFromLinks
      ? calculatedBaseTotal
      : pendingPurchase?.amount || 0
  );

  const discountAmount = appliedCoupon
    ? baseTotal * (appliedCoupon.discount_percent / 100)
    : 0;

  const finalTotal = appliedCoupon ? baseTotal - discountAmount : (pendingPurchase?.amount || baseTotal);

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

  const handlePaymentSuccess = async (_orderId?: string) => {
    const toastId = toast.loading("Finalizando tu configuración...");
    try {
      localStorage.removeItem("my_links_data");
      toast.success("¡Pedido procesado!", { id: toastId });
      setCurrentStep("success");
    } catch (error) {
      console.error("Error in fulfillment:", error);
      toast.error("Error al finalizar. Contacta a soporte.", { id: toastId });
    }
  };

  const [isProcessingFree, setIsProcessingFree] = useState(false);

  const handleFreeCheckout = async () => {
    setIsProcessingFree(true);
    const tid = toast.loading("Procesando tu orden gratuita...");
    try {
      const res = await paymentsService.checkoutZero(linksData, pendingPurchase?.customDomain);
      if (res.success) {
        localStorage.removeItem("my_links_data");
        toast.success("¡Configuración iniciada!", { id: tid });
        setCurrentStep("success");
      } else {
        throw new Error(res.message || "Error al procesar");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pedido gratuito", { id: tid });
    } finally {
      setIsProcessingFree(false);
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
    <div className="w-full px-6 py-12 pb-32 animate-fade-in">

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left: Links detail */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-[#080808] overflow-hidden shadow-2xl">
                {/* Cart header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">shopping_cart</span>
                  <h2 className="font-black text-white text-sm uppercase tracking-wider">
                    {linksData.length} Link{linksData.length !== 1 ? "s" : ""} a Activar
                  </h2>
                </div>

                {/* Link rows */}
                <div className="divide-y divide-white/5">
                  {linksData.map((link: any, i: number) => {
                    let linkPrice = 0;
                    if (link.landingMode === "dual") linkPrice = pricingCfg.link.dual;
                    else if (link.landingMode === "direct") linkPrice = pricingCfg.link.instagram;
                    else linkPrice = pricingCfg.link.tiktok;

                    if (link.buttons?.some((b: any) => b.rotator_active)) {
                      linkPrice += pricingCfg.link.telegramAddon;
                    }

                    return (
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
                          <p className="text-[11px] text-silver/40 truncate flex gap-2">
                            {link.landingMode === "dual" && <span>Dual</span>}
                            {link.landingMode === "direct" && <span>Directo</span>}
                            {link.buttons?.some((b: any) => b.rotator_active) && <span>+ Rotador</span>}
                          </p>
                        </div>
                        <span className="text-sm font-mono text-white shrink-0">
                          {fmt(linkPrice)}
                        </span>
                      </div>
                    );
                  })}

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
              <div className="rounded-3xl border border-white/10 bg-[#080808] px-8 py-8 shadow-xl">
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
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Ej: DESCUENTO50"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder:text-silver/20 focus:outline-none focus:border-primary/50 transition-all"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      className="w-full py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {couponLoading ? (
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">confirmation_number</span>
                          Aplicar Cupón
                        </>
                      )}
                    </button>
                    {couponError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Subscription Toggle */}
              <div className="rounded-3xl border border-white/10 bg-[#080808] px-8 py-6 shadow-xl">
                <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">autorenew</span>
                  Tipo de Pago
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsSubscription(false)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      !isSubscription 
                        ? 'bg-primary/10 border-primary text-white' 
                        : 'bg-white/5 border-white/10 text-silver/50 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-bold text-sm">Pago Único</span>
                    <span className="text-[10px] uppercase opacity-60">Acceso por 30 días</span>
                  </button>
                  <button
                    onClick={() => setIsSubscription(true)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      isSubscription 
                        ? 'bg-primary/10 border-primary text-white' 
                        : 'bg-white/5 border-white/10 text-silver/50 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-bold text-sm">Suscripción</span>
                    <span className="text-[10px] uppercase opacity-60">Recurrente</span>
                  </button>
                </div>
              </div>

              {/* Order summary card */}
              <div className="rounded-3xl border border-white/10 bg-[#080808] px-8 py-8 space-y-4 shadow-xl">
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
              {finalTotal === 0 ? (
                <button
                  onClick={handleFreeCheckout}
                  disabled={isProcessingFree || linksData.length === 0}
                  className="w-full py-4 rounded-xl bg-emerald-500 text-white font-black text-sm uppercase tracking-wider hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingFree ? (
                    <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  )}
                  Confirmar Pedido Gratis
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep("payment")}
                  disabled={linksData.length === 0}
                  className="w-full py-4 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-wider hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">payment</span>
                  Ir a Pagar — {fmt(finalTotal)}
                </button>
              )}

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
            <button
              onClick={() => isFromLinks ? setCurrentStep("cart") : navigate("/dashboard/links")}
              className="flex items-center gap-2 text-silver/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {isFromLinks ? "Volver al Carrito" : "Volver a Mis Links"}
            </button>
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
                    ? `${linksData.length} Link${linksData.length !== 1 ? "s" : ""} — ${isSubscription ? "Suscripción" : "Pago Único"}`
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
              initialMethod="qr"
              amount={finalTotal}
              onSuccess={handlePaymentSuccess}
              linksData={linksData}
              customDomain={pendingPurchase?.customDomain}
              isSubscription={isSubscription}
            />
          </div>
        </div>
      )}

      {/* ── STEP 3: ÉXITO + REALTIME MODAL ── */}
      {currentStep === "success" && (
        <SuccessFlow 
          linksData={linksData} 
          onClose={() => navigate("/dashboard/links")} 
        />
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

function SuccessFlow({ linksData, onClose }: { linksData: any[], onClose: () => void }) {
  const [activeLinks, setActiveLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initial fetch
      const { data } = await supabase
        .from("smart_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) setActiveLinks(data);
      setLoading(false);

      // Realtime subscription
      const channel = supabase
        .channel(`links-status-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "smart_links",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setActiveLinks(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchAndSubscribe();
  }, []);

  // Filter links from the current purchase (or just show the most recent ones)
  const approvedLinks = activeLinks.filter(l => l.status === "active" || l.status === "approved");

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in">
      <div className="bg-[#080808]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12 text-center space-y-8">
          
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto relative z-10">
              <span className="material-symbols-outlined text-5xl text-emerald-400">task_alt</span>
            </div>
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
              {approvedLinks.length > 0 ? "¡Felicidades!" : "Procesando..."}
            </h1>
            <p className="text-silver/60 text-lg max-w-lg mx-auto leading-relaxed">
              {approvedLinks.length > 0 
                ? "Tus links han sido activados con éxito. Ya puedes verlos en línea."
                : "Estamos asignando tu dominio y configurando tu espacio. Pronto verás tus links activos."}
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid gap-4 mt-8">
            {activeLinks.slice(0, Math.max(linksData.length, 1)).map((link, idx) => (
              <div 
                key={link.id || idx} 
                className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${
                  link.status === "pending" 
                    ? "bg-white/5 border-white/5 opacity-60" 
                    : "bg-emerald-500/10 border-emerald-500/30 scale-[1.02] shadow-lg shadow-emerald-500/5"
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {link.photo ? (
                      <img src={link.photo} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="material-symbols-outlined text-white/20">link</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base leading-tight truncate max-w-[150px] md:max-w-xs">{link.title || link.slug}</h3>
                    <div className="text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 mt-1">
                      {link.status === "pending" ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                          <span className="text-orange-400/80">Asignando dominio...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="text-emerald-400">¡Dominio Activo!</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {link.status !== "pending" && (
                  <a 
                    href={link.custom_domain ? `https://${link.custom_domain}` : `https://onlyprogramlink.com/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 bg-white text-black font-black text-xs rounded-xl hover:bg-emerald-400 hover:text-white transition-all transform active:scale-95 shrink-0"
                  >
                    VER LINK
                  </a>
                )}
              </div>
            ))}
            {loading && activeLinks.length === 0 && (
              <div className="py-4 text-silver/20 italic text-sm">Cargando información...</div>
            )}
          </div>

          <div className="pt-8">
            <button
              onClick={onClose}
              className="text-silver/40 hover:text-white transition-colors text-xs font-black uppercase tracking-[0.2em]"
            >
              Cerrar y volver al panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
