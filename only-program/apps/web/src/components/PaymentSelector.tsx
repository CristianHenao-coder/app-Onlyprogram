import { useState } from 'react';
import StripePaymentForm from './StripePaymentForm';
import { paymentsService } from '@/services/payments.service';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentSelectorProps {
  onSelect?: (method: 'card' | 'paypal' | 'crypto') => void;
  initialMethod?: 'card' | 'paypal' | 'crypto';
  amount?: number; // Add amount prop
}

export default function PaymentSelector({ onSelect, initialMethod = 'card', amount = 10 }: PaymentSelectorProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>(initialMethod);

  // Crypto State
  const [txHash, setTxHash] = useState("");
  const [isSubmittingCrypto, setIsSubmittingCrypto] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletAddress = import.meta.env.VITE_CRYPTO_WALLET_ADDRESS || "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Default placeholder if env not set

  const handleSelect = (method: 'card' | 'paypal' | 'crypto') => {
    setPaymentMethod(method);
    if (onSelect) onSelect(method);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success("Dirección copiada al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCryptoSubmit = async () => {
    if (!txHash) return toast.error("Por favor ingresa el hash de la transacción");
    // if (!senderWallet) return toast.error("Por favor ingresa tu dirección de billetera"); // Optional validation

    setIsSubmittingCrypto(true);
    try {
      await paymentsService.submitManualCryptoPayment({
        amount,
        currency: "USDT",
        transactionHash: txHash,
        walletUsed: senderWallet // Passing the sender wallet
      });
      toast.success("Pago registrado correctamente. Verificaremos tu transacción pronto.", { duration: 5000 });
      setTxHash("");
      setSenderWallet("");
      if (onSelect) onSelect('crypto'); // Refresh or something
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingCrypto(false);
    }
  };

  const [senderWallet, setSenderWallet] = useState("");

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Version Indicator for Debugging */}
      <div className="absolute -top-4 right-0 text-[9px] text-silver/20 font-mono">v2.1-LIVE</div>

      {/* Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'card', label: 'Tarjeta de Crédito', icon: 'credit_card', color: 'bg-blue-500' },
          { id: 'paypal', label: 'PayPal', icon: 'account_balance_wallet', color: 'bg-yellow-500' },
          { id: 'crypto', label: 'Crypto Manual', icon: 'currency_bitcoin', color: 'bg-orange-500' }
        ].map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => handleSelect(method.id as any)}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${paymentMethod === method.id
              ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10'
              : 'bg-background-dark/20 border-border/50 hover:border-silver/30'
              }`}
          >
            <div className={`h-14 w-14 rounded-2xl ${method.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-white text-3xl">{method.icon}</span>
            </div>
            <span className={`text-sm font-black ${paymentMethod === method.id ? 'text-white' : 'text-silver/40'}`}>
              {method.label}
            </span>
          </button>
        ))}
      </div>

      {/* Payment Content */}
      <div className="mt-8 p-8 bg-background-dark/30 border border-border/50 rounded-3xl min-h-[300px]">

        {/* STRIPE */}
        {paymentMethod === 'card' && (
          <div className="animate-fade-in">
            <h4 className="text-lg font-black text-white px-1 mb-6">Pagar con Tarjeta</h4>
            <StripePaymentForm
              amount={amount}
              onSuccess={(details) => {
                toast.success("¡Pago con tarjeta exitoso!", { duration: 5000 });
                console.log("Stripe Success:", details);
              }}
            />
          </div>
        )}

        {/* PAYPAL */}
        {paymentMethod === 'paypal' && (
          <div className="flex flex-col items-center space-y-6 animate-fade-in w-full">
            <div className="flex items-center justify-between w-full mb-2">
              <h4 className="text-lg font-black text-white px-1">Pagar con PayPal</h4>
              <span className="text-[10px] font-black bg-[#0070ba]/20 text-[#0070ba] border border-[#0070ba]/20 px-3 py-1 rounded-full uppercase">Instantáneo</span>
            </div>

            <div className="w-full bg-black/20 p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-6">
              <div className="text-center space-y-2 mb-2">
                <div className="h-16 w-16 mx-auto bg-[#0070ba]/10 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#0070ba] text-4xl">account_balance_wallet</span>
                </div>
                <p className="text-silver/60 text-sm font-medium max-w-xs mx-auto">
                  Serás redirigido a PayPal para completar tu pago de forma segura.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <button
                  onClick={async () => {
                    const toastId = toast.loading("Conectando con PayPal...");
                    try {
                      const order = await paymentsService.createPayPalOrder(amount);
                      // Find approval link
                      const approvalLink = order.links?.find((link: any) => link.rel === 'approve')?.href;
                      if (approvalLink) {
                        window.location.href = approvalLink;
                      } else {
                        throw new Error("No se pudo obtener el enlace de pago");
                      }
                    } catch (error: any) {
                      console.error("PayPal Error:", error);
                      toast.error("Error al conectar con PayPal", { id: toastId });
                    }
                  }}
                  className="w-full bg-[#0070ba] hover:bg-[#003087] text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-wider text-sm"
                >
                  <span className="material-symbols-outlined">output</span>
                  Pagar con PayPal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CRYPTO MANUAL */}
        {paymentMethod === 'crypto' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-white px-1">Pago Manual (Cripto)</h4>
              <span className="text-[10px] font-black bg-orange-500/20 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full uppercase">Verificación Manual</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code Column */}
              <div className="flex flex-col items-center justify-center space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG
                    value={walletAddress}
                    size={180}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <span className="text-[10px] font-bold text-silver/40 uppercase tracking-widest text-center">
                  Escanear para pagar
                </span>
              </div>

              {/* Details Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Red / Método</label>
                  <div className="flex items-center gap-2 p-3 bg-background-dark/50 rounded-xl border border-border/50">
                    <span className="material-symbols-outlined text-green-500">link</span>
                    <span className="text-sm font-bold text-white">USDT (Tether) - <span className="text-orange-500 font-black">TRC20</span></span>
                  </div>
                  <p className="text-[10px] text-red-400 pl-1 font-bold">⚠️ Envía SOLO por la red TRC20 (Tron)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Dirección de Destino</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-background-dark/50 rounded-xl border border-border/50 font-mono text-xs text-silver/80 break-all flex items-center">
                      {walletAddress}
                    </div>
                    <button
                      onClick={handleCopyAddress}
                      className="bg-surface hover:bg-surface-light border border-white/10 text-white p-3 rounded-xl transition-all"
                      title="Copiar dirección"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Tu Billetera (Opcional)</label>
                  <input
                    type="text"
                    value={senderWallet}
                    onChange={(e) => setSenderWallet(e.target.value)}
                    placeholder="Ej: TExxxxxxxxx..."
                    className="w-full bg-background-dark/50 border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all font-mono text-sm"
                  />
                  <p className="text-[10px] text-silver/40 pl-1">Para identificar tu pago más rápido.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Confirmar Hash (TXID)</label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Pegar TXID aquí..."
                    className="w-full bg-background-dark/50 border border-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleCryptoSubmit}
                disabled={isSubmittingCrypto || !txHash}
                className="w-full bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg shadow-orange-500/20"
              >
                {isSubmittingCrypto ? 'Verificando...' : 'Confirmar Pago Enviado'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-border/50">
        <div className="text-silver/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">enhanced_encryption</span> SSL 256-bit Secure Connection
        </div>
      </div>
    </div>
  );
}


