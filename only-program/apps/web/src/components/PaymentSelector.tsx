import { useState, useEffect, useRef, useCallback } from 'react';
import { paymentsService } from '@/services/payments.service';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/services/supabase';
import WompiCreditCardForm, { WompiPaymentData } from './WompiCreditCardForm';

interface PaymentSelectorProps {
  onSelect?: (method: 'qr' | 'paypal' | 'crypto') => void;
  initialMethod?: 'qr' | 'paypal' | 'crypto';
  amount?: number;
  onSuccess?: () => void;
  linksData?: any[];
  customDomain?: string;
  isSubscription?: boolean;
  paypalPlanId?: string;
}

// Stablecoins aceptadas
const POPULAR_CURRENCIES: { id: string; label: string }[] = [
  { id: 'usdttrc20', label: 'Tether (USDT) TRC20' },
  { id: 'usdterc20', label: 'Tether (USDT) ERC20' },
  { id: 'usdcerc20', label: 'USD Coin (USDC)' },
  { id: 'dai', label: 'DAI' },
  { id: 'usdeerc20', label: 'Ethena USD (USDe)' },
  { id: 'busd', label: 'Binance USD (BUSD)' },
];

type PaymentStatus = 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';

interface CryptoPaymentInfo {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  expiration_estimate_date?: string;
  order_id: string;
}

interface WompiQRData {
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  publicKey: string;
  paymentLink: string;
}

const COMPLETED_STATUSES: PaymentStatus[] = ['finished', 'confirmed'];
const FAILED_STATUSES: PaymentStatus[] = ['failed', 'refunded', 'expired'];

function formatCurrency(id: string): string {
  return POPULAR_CURRENCIES.find(c => c.id === id)?.label || id.toUpperCase();
}

function CountdownTimer({ expiresAt }: { expiresAt?: string }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const isUrgent = remaining < 300;

  return (
    <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-orange-400'}`}>
      ⏱ {mins}:{secs}
    </span>
  );
}

export default function PaymentSelector({
  onSelect,
  initialMethod = 'qr',
  amount,
  onSuccess,
  linksData,
  customDomain,
  isSubscription = false,
  paypalPlanId = import.meta.env.VITE_PAYPAL_PLAN_ID || '' // can fallback to an env variable
}: PaymentSelectorProps) {
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'paypal' | 'crypto'>(initialMethod);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // ─── WOMPI QR STATE ──────────────────────────────────────────
  const [wompiData, setWompiData] = useState<WompiQRData | null>(null);
  const [wompiLoading, setWompiLoading] = useState(false);
  const [wompiError, setWompiError] = useState<string | null>(null);

  // ─── CRYPTO / NOWPAYMENTS STATE ──────────────────────────────
  const [selectedCrypto, setSelectedCrypto] = useState<string>('usdttrc20');
  const [cryptoStep, setCryptoStep] = useState<'select' | 'paying' | 'done' | 'failed'>('select');
  const [cryptoInfo, setCryptoInfo] = useState<CryptoPaymentInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('waiting');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── CLEANUP polling on unmount ──────────────────────────────
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // ─── CARGAR QR WOMPI cuando se selecciona ese método ─────────
  useEffect(() => {
    if (paymentMethod !== 'qr') return;
    if (!amount || amount <= 0) return;

    setWompiLoading(true);
    setWompiError(null);
    setWompiData(null);

    paymentsService.getWompiSignature(amount, 'COP', linksData, customDomain)
      .then((data) => setWompiData(data))
      .catch(() => setWompiError('No se pudo generar el QR de pago. Intenta de nuevo.'))
      .finally(() => setWompiLoading(false));
  }, [paymentMethod, amount, linksData, customDomain]);

  // Construir URL de checkout de Wompi usando el Link de Pago (VPOS)
  const wompiCheckoutUrl = wompiData
    ? `${wompiData.paymentLink}?` +
      `amount-in-cents=${wompiData.amountInCents}` +
      `&reference=${encodeURIComponent(wompiData.reference)}` +
      `&signature:integrity=${encodeURIComponent(wompiData.signature)}` +
      `&redirect-url=${encodeURIComponent(window.location.origin + '/dashboard/payments?status=wompi_return')}`
    : '';





  // ─── USER DATA STATE ──────────────────────────────────────────
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // ─── POLLING: check payment status every 10s ─────────────────
  const startPolling = useCallback((paymentId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const status = await paymentsService.getNowPaymentStatus(paymentId);
        const s = status.payment_status as PaymentStatus;
        setPaymentStatus(s);
        if (COMPLETED_STATUSES.includes(s)) {
          clearInterval(pollingRef.current!);
          setCryptoStep('done');
          setPaymentSuccess(true);
          if (onSuccess) onSuccess();
          toast.success('¡Pago confirmado! Tus links han sido activados.', { duration: 6000 });
        } else if (FAILED_STATUSES.includes(s)) {
          clearInterval(pollingRef.current!);
          setCryptoStep('failed');
          toast.error(`Pago ${s}. Intenta de nuevo.`);
        }
      } catch { /* silently ignore poll errors */ }
    }, 10_000);
  }, [onSuccess]);

  const handleWompiSubscription = async ({ token, acceptanceToken, email, amount }: WompiPaymentData) => {
    return paymentsService.createWompiSubscription({
      amount,
      email,
      token,
      acceptanceToken,
      linksData,
      customDomain,
      frequency: 'monthly' // Default for now
    });
  };

  const handleSelect = (method: 'qr' | 'paypal' | 'crypto') => {
    setPaymentMethod(method);
    if (onSelect) onSelect(method);
  };

  const handleCreateCryptoPayment = async () => {
    if (!amount) return toast.error('No se especificó el monto.');
    setIsCreatingPayment(true);
    try {
      const data = await paymentsService.createNowPayment(amount, selectedCrypto, linksData, customDomain);
      setCryptoInfo(data);
      setPaymentStatus('waiting');
      setCryptoStep('paying');
      startPolling(data.payment_id);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el pago.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCopyAddress = () => {
    if (!cryptoInfo?.pay_address) return;
    navigator.clipboard.writeText(cryptoInfo.pay_address);
    setCopied('address');
    toast.success('Dirección copiada');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAmount = () => {
    if (!cryptoInfo?.pay_amount) return;
    navigator.clipboard.writeText(String(cryptoInfo.pay_amount));
    setCopied('amount');
    toast.success('Monto copiado');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleResetCrypto = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCryptoStep('select');
    setCryptoInfo(null);
    setPaymentStatus('waiting');
  };

  // ─── SUCCESS SCREEN ──────────────────────────────────────────
  if (paymentSuccess) {
    return (
      <div className="bg-background-dark/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-green-400">check_circle</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">¡Pago Exitoso!</h3>
        <p className="text-silver mb-8">
          Tus links han sido activados correctamente. Ya puedes comenzar a compartir tu perfil.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard/home'}
          className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-silver transition-all"
        >
          Ir al Dashboard
        </button>
      </div>
    );
  }

  const statusLabels: Record<PaymentStatus, string> = {
    waiting: 'Esperando pago...',
    confirming: 'Confirmando transacción...',
    confirmed: 'Confirmado',
    sending: 'Procesando...',
    partially_paid: 'Pago parcial recibido',
    finished: '¡Completado!',
    failed: 'Fallido',
    refunded: 'Reembolsado',
    expired: 'Expirado',
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="absolute -top-4 right-0 text-[9px] text-silver/20 font-mono">v4.0-QR</div>

      {/* ── METHOD TABS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            id: 'qr', 
            label: isSubscription ? 'Tarjeta Crédito' : 'Pago QR (COP)', 
            icon: isSubscription ? 'credit_card' : 'qr_code_2', 
            color: 'bg-red-500' 
          },
          { id: 'paypal', label: 'PayPal', icon: 'account_balance_wallet', color: 'bg-yellow-500' },
          { id: 'crypto', label: 'Criptomonedas', icon: 'currency_bitcoin', color: 'bg-orange-500' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleSelect(m.id as any)}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${paymentMethod === m.id
              ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10'
              : 'bg-background-dark/20 border-border/50 hover:border-silver/30'
              }`}
          >
            <div className={`h-14 w-14 rounded-2xl ${m.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-white text-3xl">{m.icon}</span>
            </div>
            <span className={`text-sm font-black ${paymentMethod === m.id ? 'text-white' : 'text-silver/40'}`}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── PAYMENT CONTENT ── */}
      <div className="mt-8 p-8 bg-background-dark/30 border border-border/50 rounded-3xl min-h-[300px]">

        {(!amount || amount <= 0) ? (
          <div className="flex flex-col items-center justify-center py-14 gap-5 text-center animate-fade-in px-4">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(0,123,255,0.15)]">
              <span className="material-symbols-outlined text-5xl text-primary/80">shopping_cart_checkout</span>
            </div>
            <h3 className="text-white font-black text-2xl uppercase tracking-tight">Acción Requerida</h3>
            <p className="text-silver/60 text-sm max-w-md leading-relaxed mt-1">
              Para habilitar los métodos de pago y proceder con la transacción, es indispensable que agregues al menos un servicio o factura. <br className="hidden md:block" />Actualmente tu saldo a pagar es <strong className="text-white bg-white/10 px-2 pl-2.5 py-1 rounded-md ml-1 font-mono tracking-wide">$0.00</strong>
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard/links'}
              className="mt-6 px-8 py-4 bg-white hover:bg-silver text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Completar mi pedido
            </button>
          </div>
        ) : (
          <>
            {/* ── WOMPI (QR or Card) ── */}
            {paymentMethod === 'qr' && (
              <div className="animate-fade-in space-y-6">
                {isSubscription ? (
                   <div className="space-y-6">
                      <div className="flex items-center justify-between mx-1">
                        <h4 className="text-lg font-black text-white">Suscripción con Tarjeta</h4>
                        <span className="text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1 rounded-full uppercase">
                           Cobro automático mensual
                        </span>
                      </div>
                      
                      <WompiCreditCardForm 
                        amount={amount}
                        email={userEmail}
                        onSuccess={() => {
                          setPaymentSuccess(true);
                          if (onSuccess) onSuccess();
                        }}
                        onProcessPayment={handleWompiSubscription}
                        linksData={linksData}
                        customDomain={customDomain}
                      />
                   </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mx-1">
                      <h4 className="text-lg font-black text-white">Pagar con QR Wompi</h4>
                      <span className="text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1 rounded-full uppercase">
                        Nequi · PSE · Tarjeta
                      </span>
                    </div>

                    {/* Monto en USD */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                      <span className="material-symbols-outlined text-red-400 text-xl">payments</span>
                      <div>
                        <p className="text-silver/40 text-[10px] uppercase tracking-widest font-bold">Total a pagar</p>
                        <p className="text-white text-2xl font-black mt-0.5">${amount.toFixed(2)} USD</p>
                      </div>
                    </div>

                    {/* Estado de carga */}
                    {wompiLoading && (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <span className="material-symbols-outlined animate-spin text-4xl text-red-400">progress_activity</span>
                        <p className="text-silver/50 text-sm font-bold">Generando QR de pago...</p>
                      </div>
                    )}

                    {/* Error */}
                    {wompiError && !wompiLoading && (
                      <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                        <p className="text-red-300 text-sm font-bold">{wompiError}</p>
                        <button
                          onClick={() => {
                            setWompiError(null);
                            setWompiLoading(true);
                            paymentsService.getWompiSignature(amount, 'COP')
                              .then(setWompiData)
                              .catch(() => setWompiError('No se pudo generar el QR. Intenta de nuevo.'))
                              .finally(() => setWompiLoading(false));
                          }}
                          className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/30 transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">refresh</span>
                          Reintentar
                        </button>
                      </div>
                    )}

                    {/* QR listo */}
                    {wompiData && !wompiLoading && (
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* QR Visual */}
                        <div className="flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-2xl shadow-xl shadow-red-500/10 relative">
                            <QRCodeSVG
                              value={wompiCheckoutUrl}
                              size={200}
                              level="M"
                              includeMargin={false}
                            />
                            {/* Wompi logo overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-white rounded-lg p-1 shadow-sm">
                                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                  <span className="material-symbols-outlined text-white text-sm">qr_code_2</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-silver/40 font-bold uppercase tracking-widest text-center">
                            Escanea con tu celular
                          </p>
                        </div>

                        {/* Info */}
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                              <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
                              <span className="text-xs text-silver/70 font-bold">Nequi</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                              <span className="material-symbols-outlined text-blue-400 text-base">check_circle</span>
                              <span className="text-xs text-silver/70 font-bold">PSE — Transferencia bancaria</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                              <span className="material-symbols-outlined text-purple-400 text-base">check_circle</span>
                              <span className="text-xs text-silver/70 font-bold">Tarjeta Crédito / Débito</span>
                            </div>
                          </div>

                          <a
                            href={wompiCheckoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-600 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-red-500/20 uppercase tracking-wider"
                          >
                            <span className="material-symbols-outlined text-base">open_in_new</span>
                            Abrir en navegador
                          </a>

                          <div className="flex items-center justify-between pt-1">
                            <p className="text-[10px] text-silver/25 leading-relaxed">
                              Si el QR no funciona, genera uno nuevo
                            </p>
                            <button
                              onClick={() => {
                                if (!amount || amount <= 0) return;
                                setWompiData(null);
                                setWompiError(null);
                                setWompiLoading(true);
                                paymentsService.getWompiSignature(amount, 'COP')
                                  .then(setWompiData)
                                  .catch(() => setWompiError('No se pudo regenerar el QR. Intenta de nuevo.'))
                                  .finally(() => setWompiLoading(false));
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-black text-silver/40 hover:text-red-400 transition-all border border-white/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg"
                            >
                              <span className="material-symbols-outlined text-sm">refresh</span>
                              Nuevo QR
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

        {/* ── PAYPAL ── */}
        {paymentMethod === 'paypal' && (
          <div className="flex flex-col items-center space-y-8 animate-fade-in w-full pb-4">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-xl font-black text-white">Pagar con PayPal</h4>
              <span className="text-[10px] font-black bg-[#0070ba]/20 text-[#0070ba] border border-[#0070ba]/20 px-3 py-1 rounded-full uppercase tracking-tighter">Instantáneo</span>
            </div>

            <div className="flex flex-col items-center gap-8 w-full">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto bg-[#0070ba]/10 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#0070ba] text-4xl">account_balance_wallet</span>
                </div>
                <p className="text-silver/50 text-sm max-w-xs mx-auto leading-relaxed">
                  Completa tu {isSubscription ? "suscripción" : "pago"} de forma segura en PayPal.
                </p>
              </div>
              
              {isSubscription && !paypalPlanId && (
                 <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-3 rounded-xl w-full max-w-sm text-xs text-center font-bold">
                   Falta el ID del Plan de PayPal para la suscripción recurrente.
                 </div>
              )}

              <button
                onClick={async () => {
                  const toastId = toast.loading('Conectando con PayPal...');
                  try {
                    let orderOrSub: any;
                    if (isSubscription && paypalPlanId) {
                       orderOrSub = await paymentsService.createPayPalSubscription(paypalPlanId, linksData, customDomain);
                    } else {
                       orderOrSub = await paymentsService.createPayPalOrder(amount || 0, undefined, linksData, customDomain);
                    }
                    
                    toast.dismiss(toastId);
                    const approvalLink = orderOrSub.links?.find((l: any) => l.rel === 'approve')?.href;
                    if (approvalLink) {
                      window.location.href = approvalLink;
                    } else {
                      throw new Error('No se pudo obtener el enlace de pago de PayPal.');
                    }
                  } catch (error: any) {
                    const msg = error?.response?.data?.error || error?.message || 'Error al conectar con PayPal';
                    const isConfig = msg.toLowerCase().includes('credencial') || msg.toLowerCase().includes('not configured');
                    toast.error(
                      isConfig
                        ? 'PayPal no está configurado. Usa otra forma de pago por ahora.'
                        : msg,
                      { id: toastId, duration: 5000 }
                    );
                  }
                }}
                disabled={!amount || amount <= 0 || (isSubscription && !paypalPlanId)}
                className="w-full max-w-sm bg-[#0070ba] hover:bg-[#003087] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-wider text-sm hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined">output</span>
                {isSubscription ? "Pagar Suscripción" : "Pagar con PayPal"}
              </button>
            </div>
          </div>
        )}

        {/* ── CRYPTO / NOWPAYMENTS ── */}
        {paymentMethod === 'crypto' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-white px-1">Pagar con Criptomonedas</h4>
              <span className="text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full uppercase">
                Automático
              </span>
            </div>

            {cryptoStep === 'select' && (
              <div className="space-y-6">
                <p className="text-silver/60 text-sm">
                  Selecciona la criptomoneda con la que deseas pagar. Se generará una dirección única para tu transacción.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {POPULAR_CURRENCIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCrypto(c.id)}
                      className={`flex items-center justify-center p-3 rounded-2xl border-2 transition-all ${selectedCrypto === c.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-border/40 bg-background-dark/20 hover:border-border'
                        }`}
                    >
                      <span className={`text-xs font-black text-center leading-tight ${selectedCrypto === c.id ? 'text-orange-400' : 'text-silver/50'}`}>
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="bg-black/20 rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-silver/50 text-xs uppercase tracking-widest font-bold">Monto a pagar</p>
                    <p className="text-white text-xl font-black mt-1">${amount?.toFixed(2)} USD</p>
                  </div>
                  <div className="text-right">
                    <p className="text-silver/50 text-xs uppercase tracking-widest font-bold">Moneda elegida</p>
                    <p className="text-orange-400 text-xl font-black mt-1">{formatCurrency(selectedCrypto)}</p>
                  </div>
                </div>

                <button
                  onClick={handleCreateCryptoPayment}
                  disabled={isCreatingPayment || !amount || amount <= 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
                >
                  {isCreatingPayment ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                      Generando dirección...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">bolt</span>
                      Generar dirección de pago
                    </>
                  )}
                </button>
              </div>
            )}

            {cryptoStep === 'paying' && cryptoInfo && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                  <span className="text-orange-300 text-sm font-bold">
                    {statusLabels[paymentStatus] || paymentStatus}
                  </span>
                  <CountdownTimer expiresAt={cryptoInfo.expiration_estimate_date} />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center justify-center space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                    <div className="bg-white p-3 rounded-xl">
                      <QRCodeSVG value={cryptoInfo.pay_address} size={175} level="M" includeMargin={false} />
                    </div>
                    <span className="text-[10px] font-bold text-silver/40 uppercase tracking-widest text-center">
                      Escanear con tu wallet
                    </span>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Enviar exactamente</label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-background-dark/50 rounded-xl border border-orange-500/30 font-mono text-orange-300 font-black text-lg flex items-center">
                          {cryptoInfo.pay_amount} <span className="text-orange-500/70 ml-1 text-sm font-bold">{cryptoInfo.pay_currency.toUpperCase()}</span>
                        </div>
                        <button onClick={handleCopyAmount} className="bg-surface hover:bg-surface-light border border-white/10 text-white p-3 rounded-xl transition-all" title="Copiar monto">
                          <span className="material-symbols-outlined text-lg">{copied === 'amount' ? 'check' : 'content_copy'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-red-400 pl-1 font-bold">⚠️ Envía el monto exacto o el pago puede no confirmarse</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Dirección de destino</label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-background-dark/50 rounded-xl border border-border/50 font-mono text-xs text-silver/80 break-all flex items-center">
                          {cryptoInfo.pay_address}
                        </div>
                        <button onClick={handleCopyAddress} className="bg-surface hover:bg-surface-light border border-white/10 text-white p-3 rounded-xl transition-all" title="Copiar dirección">
                          <span className="material-symbols-outlined text-lg">{copied === 'address' ? 'check' : 'content_copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-background-dark/50 rounded-xl border border-border/50">
                      <div>
                        <p className="text-white font-bold text-sm">{formatCurrency(selectedCrypto)}</p>
                        <p className="text-silver/50 text-[10px]">Red: {cryptoInfo.pay_currency.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="flex items-center gap-3 text-silver/50 text-sm">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    Detectando pago automáticamente — no cierres esta ventana
                  </div>
                  <button onClick={handleResetCrypto} className="text-[10px] text-silver/30 hover:text-silver/60 transition-all underline">
                    Cancelar y elegir otra moneda
                  </button>
                </div>
              </div>
            )}

            {cryptoStep === 'failed' && (
              <div className="text-center py-8 space-y-4">
                <span className="material-symbols-outlined text-5xl text-red-400">error</span>
                <p className="text-white font-bold">El pago no pudo completarse</p>
                <p className="text-silver/50 text-sm">Estado: {paymentStatus}</p>
                <button onClick={handleResetCrypto} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-border/50">
        <div className="text-silver/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
          SSL 256-bit Secure Connection
        </div>
        {paymentMethod === 'qr' && (
          <div className="text-silver/30 text-[10px] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">verified</span>
            Powered by Wompi
          </div>
        )}
        {paymentMethod === 'crypto' && (
          <div className="text-silver/30 text-[10px] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">verified</span>
            Powered by NOWPayments
          </div>
        )}
      </div>
    </div>
  );
}
