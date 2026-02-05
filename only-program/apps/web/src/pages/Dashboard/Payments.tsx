import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { paymentsService, Payment } from "../../services/payments.service";
import PaymentSelector from "@/components/PaymentSelector";

export default function Payments() {
  const location = useLocation();
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
          Configura tu método de pago para activar tu suscripción mensual.
        </p>
      </div>

      {/* Subscription Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-yellow-500">info</span>
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-black text-yellow-500 uppercase tracking-wide">Pago Mensual Recurrente</h3>
          <p className="text-xs text-silver/70 leading-relaxed">
            Este es un servicio de <strong>suscripción mensual</strong>. Te recomendamos usar <strong>tarjeta de crédito</strong> para débito automático.
            Si eliges otro método, deberás realizar el pago manualmente cada mes. <span className="text-yellow-500 font-bold">El servicio se suspenderá si no se recibe el pago a tiempo.</span>
          </p>
        </div>
      </div>

      {/* Saved Payment Method Section */}
      {hasSavedMethod && !useNewMethod && (
        <div className="bg-surface/40 border border-border rounded-3xl p-8 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Método Guardado</h2>
            <span className="text-[10px] font-black bg-green-500/20 text-green-500 border border-green-500/20 px-3 py-1 rounded-full uppercase">Verificado</span>
          </div>

          <div className="bg-background-dark/50 border border-border/50 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">credit_card</span>
              </div>
              <div>
                <p className="text-white font-bold">Tarjeta de Crédito</p>
                <p className="text-silver/60 text-sm font-mono">•••• •••• •••• 1234</p>
              </div>
            </div>
            <button
              onClick={() => setUseNewMethod(true)}
              className="text-primary hover:text-primary/80 text-sm font-bold transition-all"
            >
              Cambiar método
            </button>
          </div>

          <button
            type="button"
            className="w-full bg-white text-black font-black px-8 py-4 rounded-xl hover:bg-silver transition-all shadow-xl shadow-white/5 active:scale-95 uppercase tracking-widest"
          >
            Usar este método y continuar
          </button>
        </div>
      )}

      {/* Order Summary Section */}
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
              <span>{location.state.pendingPurchase.quantity} Links Adicionales</span>
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

      {/* New Payment Method Section */}
      {(!hasSavedMethod || useNewMethod) && (
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
            amount={location.state?.pendingPurchase?.amount || 10} // Pass dynamic amount
          />
        </div>
      )}

      {/* Payment Methods Footer - Decorative */}
      <div className="bg-surface/20 border border-white/5 rounded-2xl p-8">
        <h3 className="text-center text-xs font-black text-silver/40 uppercase tracking-widest mb-6">Métodos de Pago Aceptados</h3>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {/* Crypto */}
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-2xl">currency_bitcoin</span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">Crypto</span>
          </div>

          {/* PayPal */}
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-[#0070ba]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0070ba] text-2xl">account_balance_wallet</span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">PayPal</span>
          </div>

          {/* Mastercard */}
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-2xl">credit_card</span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">Mastercard</span>
          </div>

          {/* Visa */}
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-2xl">credit_card</span>
            </div>
            <span className="text-[10px] font-bold text-silver/60 uppercase">Visa</span>
          </div>
        </div>
      </div>

      {/* Transaction History (if exists) */}
      {payments.length > 0 && (
        <div className="bg-[#161616] rounded-lg border border-[#2A2A2A] overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-[#2A2A2A]">
            <h2 className="font-semibold text-gray-200">Historial de Transacciones</h2>
          </div>

          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A] text-gray-400 text-sm">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Método</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {payments.map((payment) => (
                <tr key={payment.id} className="text-gray-300 hover:bg-[#1A1A1A]">
                  <td className="p-4">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {payment.tx_reference ? `Ref: ${payment.tx_reference.substring(0, 8)}...` : "Pago de Suscripción"}
                  </td>
                  <td className="p-4 capitalize">{payment.provider}</td>
                  <td className="p-4 font-mono">
                    {payment.amount} {payment.currency}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${payment.status === 'completed'
                      ? 'bg-green-900/30 text-green-400 border border-green-900'
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-900'
                      }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
