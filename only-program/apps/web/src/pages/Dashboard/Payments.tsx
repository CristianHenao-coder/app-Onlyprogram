import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsService, Payment } from "../../services/payments.service";
import { supabase } from "../../services/supabase";
import PaymentSelector from "@/components/PaymentSelector";
import toast from "react-hot-toast";

export default function Payments() {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
  const [useNewMethod, setUseNewMethod] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await paymentsService.getHistory();
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: 'card' | 'paypal' | 'crypto') => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentSuccess = async () => {
    const pendingPurchase = location.state?.pendingPurchase;
    if (!pendingPurchase) return;

    const toastId = toast.loading("Finalizando tu configuración...");
    try {
      if (pendingPurchase.type === 'domains_bundle') {
        const { items, domainsInput } = pendingPurchase;

        for (const [linkId, action] of Object.entries(items)) {
          if (action === 'connect' && domainsInput[linkId]) {
            const domain = domainsInput[linkId];
            console.log(`Fulfilling connection of ${domain} to link ${linkId}`);

            // Clear domain from any other link
            await supabase.from('smart_links').update({ custom_domain: null }).eq('custom_domain', domain);

            // Assign to current link
            const { error } = await supabase
              .from('smart_links')
              .update({
                custom_domain: domain,
                status: 'active',
                is_active: true
              })
              .eq('id', linkId);

            if (error) throw error;
          }
        }
        toast.success("¡Configuración de dominios completada!", { id: toastId });
      } else if (pendingPurchase.type === 'extra_links') {
        // Cleanup localStorage drafts
        localStorage.removeItem('my_links_data');
        toast.success("¡Links activados correctamente!", { id: toastId });
      }

      // Delay before redirecting to dashboard to let the user see the success
      setTimeout(() => {
        navigate('/dashboard/home');
      }, 2000);

    } catch (error) {
      console.error("Error in fulfillment:", error);
      toast.error("Error al vincular el dominio. Contacta a soporte.", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  const hasSavedMethod = payments.length > 0;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto pb-20 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Registra tu Pago</h1>
        <p className="text-silver/60 max-w-2xl mx-auto font-medium">
          Completa tu proceso para activar tus servicios exclusivos.
        </p>
      </div>

      {/* Order Summary Section */}
      {hasSavedMethod && <p className="text-xs text-silver/40 text-center uppercase tracking-widest -mb-4">Información de tu suscripción activa</p>}
      {location.state?.pendingPurchase && (
        <div className="bg-surface/40 border border-border rounded-3xl p-8 mb-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-9xl text-primary">shopping_cart</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Resumen de Compra
          </h2>

          <div className="space-y-4 max-w-lg relative z-10">
            <div className="flex justify-between items-center text-silver">
              <span>{location.state.pendingPurchase.type === 'domains_bundle' ? 'Conexión de Dominios' : 'Links Adicionales'}</span>
              <span className="font-mono">${location.state.pendingPurchase.amount.toFixed(2)}</span>
            </div>

            {location.state.pendingPurchase.discountApplied && (
              <div className="flex justify-between items-center text-green-400 text-sm">
                <span>Descuento ({location.state.pendingPurchase.discountApplied.code})</span>
                <span className="font-mono">-${location.state.pendingPurchase.discountApplied.amount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
              <span className="text-xl font-bold text-white">Total a Pagar</span>
              <span className="text-3xl font-black text-primary">${location.state.pendingPurchase.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Section */}
      <div className="bg-surface/40 border border-border rounded-3xl p-8 md:p-12 shadow-2xl animate-fade-in">
        {useNewMethod && (
          <button
            onClick={() => setUseNewMethod(false)}
            className="mb-6 text-silver/60 hover:text-white text-sm font-bold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al método guardado
          </button>
        )}

        <PaymentSelector
          onSelect={handlePaymentMethodSelect}
          initialMethod={selectedPaymentMethod}
          amount={location.state?.pendingPurchase?.amount || 10}
          onSuccess={handlePaymentSuccess}
          linksData={location.state?.pendingPurchase?.linksData}
          customDomain={location.state?.pendingPurchase?.customDomain}
        />
      </div>

      {/* Decorative Footer */}
      <div className="bg-surface/20 border border-white/5 rounded-2xl p-8">
        <h3 className="text-center text-xs font-black text-silver/40 uppercase tracking-widest mb-6">Métodos de Pago Aceptados</h3>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-2xl">currency_bitcoin</span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">Crypto</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-[#0070ba]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0070ba] text-2xl">account_balance_wallet</span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">PayPal</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-2xl">credit_card</span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">Mastercard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
