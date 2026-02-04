import { useEffect, useState } from "react";
import { paymentsService, Payment } from "../../services/payments.service";

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

  const handlePayPalPayment = async () => {
    try {
      setProcessing(true);
      // Ejemplo: Pago de $10
      const order = await paymentsService.createPayPalOrder(10.00);

      // Encontrar el link de aprobación
      const approveLink = order.links?.find((l: any) => l.rel === "approve");

      if (approveLink) {
        // En un flujo real, redirigirías al usuario o abrirías un popup
        window.open(approveLink.href, "_blank");

        // Simulación: Preguntar por el Order ID para capturar (en producción esto se hace en una página de retorno)
        const orderId = prompt("Por favor completa el pago en la nueva ventana y pega aquí el Order ID (token) de la URL:");
        if (orderId) {
          await paymentsService.capturePayPalOrder(orderId);
          alert("Pago completado con éxito!");
          loadPayments();
        }
      } else {
        console.error("Respuesta de PayPal incompleta:", order);
        alert("Error: No se recibió el link de aprobación de PayPal. Revisa la consola.");
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      alert(`Error al procesar el pago: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCryptoPayment = async () => {
    try {
      setProcessing(true);
      const order = await paymentsService.createCryptoOrder(10.00);

      if (order.internalOrderId) {
        alert(`Orden Crypto creada! ID: ${order.internalOrderId}. Redirigiendo a pasarela...`);
        // Aquí redirigirías a la URL de pago de RedotPay si la tuvieras en la respuesta
        console.log("Crypto Order:", order);
      } else {
        console.error("Respuesta de Crypto incompleta:", order);
        alert("Error: No se recibió el ID de la orden. Revisa la consola.");
      }
    } catch (error: any) {
      console.error("Crypto payment failed:", error);
      alert(`Error al crear orden crypto: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Pagos y Facturación</h1>
        <div className="space-x-4">
          <button
            onClick={handlePayPalPayment}
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {processing ? "Procesando..." : "Pagar con PayPal ($10)"}
          </button>
          <button
            onClick={handleCryptoPayment}
            disabled={processing}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {processing ? "Procesando..." : "Pagar con Crypto ($10)"}
          </button>
        </div>
      </div>

      <div className="bg-[#161616] rounded-lg border border-[#2A2A2A] overflow-hidden">
        <div className="p-4 border-b border-[#2A2A2A]">
          <h2 className="font-semibold text-gray-200">Historial de Transacciones</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay transacciones registradas</div>
        ) : (
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
                    <span className={`px-2 py-1 rounded text-xs ${
                      payment.status === 'completed'
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
        )}
      </div>
    </div>
  );
}
