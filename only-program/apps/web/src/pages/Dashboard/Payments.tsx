import { useEffect, useState } from "react";
import { paymentsService, Payment } from "../../services/payments.service";
import PremiumPayments from "@/components/PremiumPayments";
import PaymentSelector from "@/components/PaymentSelector";

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('paypal');

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

  // Show full onboarding flow if no payment history
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="p-6 space-y-16 max-w-6xl mx-auto pb-20 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Activa tu Suscripción</h1>
          <p className="text-silver/60 max-w-2xl mx-auto font-medium">
            Selecciona un plan profesional y elige tu método de pago para empezar a usar Only Program.
          </p>
        </div>

        {/* Step 1: Plans */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-black text-white shadow-lg shadow-primary/30">1</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Selecciona tu Plan</h2>
          </div>
          <div className="bg-surface/20 border border-white/5 rounded-[3rem] p-6 md:p-12 backdrop-blur-sm">
            <PremiumPayments />
          </div>
        </section>

        {/* Step 2: Payment Methods */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-black text-white shadow-lg shadow-primary/30">2</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Método de Pago</h2>
          </div>
          <div className="bg-surface/40 border border-border rounded-[3rem] p-8 md:p-12 shadow-2xl">
            <PaymentSelector onSelect={handlePaymentMethodSelect} initialMethod={selectedPaymentMethod} />
          </div>
        </section>
      </div>
    );
  }

  // If there are payments, show compact payment section + history
  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Pagos y Facturación</h1>
          <p className="text-silver/60 text-sm">Gestiona tus métodos de pago y revisa tu historial de transacciones</p>
        </div>
      </div>

      {/* Compact Payment Method Selection */}
      <div className="bg-surface/40 border border-border rounded-3xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">Realizar Nuevo Pago</h2>
        <PaymentSelector onSelect={handlePaymentMethodSelect} initialMethod={selectedPaymentMethod} />
      </div>

      {/* Transaction History */}
      <div className="bg-[#161616] rounded-lg border border-[#2A2A2A] overflow-hidden">
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
    </div>
  );
}
