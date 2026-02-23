import { useState, useEffect, useRef, useCallback } from 'react';
import WompiCreditCardForm from './WompiCreditCardForm';
import { paymentsService } from '@/services/payments.service';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';

interface PaymentSelectorProps {
  onSelect?: (method: 'card' | 'paypal' | 'crypto') => void;
  initialMethod?: 'card' | 'paypal' | 'crypto';
  amount?: number;
  onSuccess?: () => void;
  linksData?: any[];
  customDomain?: string;
}

// Criptos curadas con label e ícono emoji para mostrar en el selector
const POPULAR_CURRENCIES: { id: string; label: string; icon: string }[] = [
  { id: 'usdttrc20', label: 'USDT TRC20', icon: '💚' },
  { id: 'usdterc20', label: 'USDT ERC20', icon: '🔵' },
  { id: 'btc',       label: 'Bitcoin',    icon: '🟠' },
  { id: 'eth',       label: 'Ethereum',   icon: '🔷' },
  { id: 'sol',       label: 'Solana',     icon: '🟣' },
  { id: 'bnbbsc',    label: 'BNB',        icon: '🟡' },
  { id: 'trx',       label: 'TRON',       icon: '🔴' },
  { id: 'ltc',       label: 'Litecoin',   icon: '⚪' },
  { id: 'doge',      label: 'Dogecoin',   icon: '🐶' },
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

const COMPLETED_STATUSES: PaymentStatus[] = ['finished', 'confirmed'];
const FAILED_STATUSES: PaymentStatus[] = ['failed', 'refunded', 'expired'];

function formatCurrency(id: string): string {
  return POPULAR_CURRENCIES.find(c => c.id === id)?.label || id.toUpperCase();
}

function formatIcon(id: string): string {
  return POPULAR_CURRENCIES.find(c => c.id === id)?.icon || '🪙';
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
  initialMethod = 'card',
  amount,
  onSuccess,
  linksData,
  customDomain
}: PaymentSelectorProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>(initialMethod);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // ─── FREE TRIAL STATE ─────────────────────────────────────
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);

  // ─── CRYPTO / NOWPAYMENTS STATE ───────────────────────────
  const [selectedCrypto, setSelectedCrypto] = useState<string>('usdttrc20');
  const [cryptoStep, setCryptoStep] = useState<'select' | 'paying' | 'done' | 'failed'>('select');
  const [cryptoInfo, setCryptoInfo] = useState<CryptoPaymentInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('waiting');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── CLEANUP polling on unmount ──────────────────────────
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // ─── POLLING: check payment status every 10s ─────────────
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

  const handleActivateFreeTrial = async () => {
    if (isActivatingTrial || trialUsed) return;
    setIsActivatingTrial(true);
    try {
      await paymentsService.activateFreeTrial(linksData, customDomain);
      setTrialUsed(true);
      setPaymentSuccess(true);
      if (onSuccess) onSuccess();
      toast.success('¡Prueba gratuita activada! Revisa tu email para ver la factura.', { duration: 6000 });
    } catch (error: any) {
      const isAlreadyUsed = error.message?.includes('Ya utilizaste');
      if (isAlreadyUsed) {
        setTrialUsed(true);
        toast.error('Ya usaste tu prueba gratuita anteriormente.');
      } else {
        toast.error(error.message || 'Error al activar la prueba gratuita.');
      }
    } finally {
      setIsActivatingTrial(false);
    }
  };

  const handleSelect = (method: 'card' | 'paypal' | 'crypto') => {
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

  // ─── SUCCESS SCREEN ───────────────────────────────────────
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
    waiting:       'Esperando pago...',
    confirming:    'Confirmando transacción...',
    confirmed:     'Confirmado',
    sending:       'Procesando...',
    partially_paid:'Pago parcial recibido',
    finished:      '¡Completado!',
    failed:        'Fallido',
    refunded:      'Reembolsado',
    expired:       'Expirado',
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="absolute -top-4 right-0 text-[9px] text-silver/20 font-mono">v3.0-NP</div>

      {/* ── FREE TRIAL BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-teal-950/60 to-emerald-950/60 p-6 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
              <span className="material-symbols-outlined text-3xl text-white">card_giftcard</span>
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-white">Prueba Gratuita</span>
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">GRATIS · 3 DÍAS</span>
                <span className="rounded-full bg-zinc-700/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">Solo una vez</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Activa la versión completa del sistema por 3 días. Incluye links activos, dominio personalizado y analíticas. Solo necesitas apuntar el DNS de tu dominio a nuestro servidor.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isActivatingTrial || trialUsed}
            onClick={handleActivateFreeTrial}
            className={`flex-shrink-0 flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
              trialUsed
                ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95'
            }`}
          >
            {isActivatingTrial ? (
              <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Activando...</>
            ) : trialUsed ? (
              <><span className="material-symbols-outlined text-lg">check_circle</span> Ya activada</>
            ) : (
              <><span className="material-symbols-outlined text-lg">rocket_launch</span> Activar gratis</>
            )}
          </button>
        </div>
      </div>

      {/* ── METHOD TABS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'card',   label: 'Tarjeta de Crédito', icon: 'credit_card',            color: 'bg-blue-500' },
          { id: 'paypal', label: 'PayPal',              icon: 'account_balance_wallet', color: 'bg-yellow-500' },
          { id: 'crypto', label: 'Criptomonedas',       icon: 'currency_bitcoin',       color: 'bg-orange-500' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleSelect(m.id as any)}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${
              paymentMethod === m.id
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

        {/* WOMPI */}
        {paymentMethod === 'card' && (
          <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between w-full mb-6">
              <h4 className="text-lg font-black text-white px-1">Pagar con Tarjeta</h4>
              <span className="text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full uppercase">Seguro</span>
            </div>
            <WompiCreditCardForm
              amount={amount || 0}
              email={user?.email || ''}
              onSuccess={() => {
                setPaymentSuccess(true);
                if (onSuccess) onSuccess();
                if (onSelect) onSelect('card');
              }}
              linksData={linksData}
              customDomain={customDomain}
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
            <div className="w-full bg-black/20 p-8 rounded-2xl border border-white/5 flex flex-col items-center gap-6">
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
                    const toastId = toast.loading('Conectando con PayPal...');
                    try {
                      const order = await paymentsService.createPayPalOrder(amount || 0, undefined, linksData, customDomain);
                      const approvalLink = order.links?.find((l: any) => l.rel === 'approve')?.href;
                      if (approvalLink) window.location.href = approvalLink;
                      else throw new Error('No se pudo obtener el enlace de pago');
                    } catch (error: any) {
                      toast.error('Error al conectar con PayPal', { id: toastId });
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

        {/* ── CRYPTO / NOWPAYMENTS ── */}
        {paymentMethod === 'crypto' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-white px-1">Pagar con Criptomonedas</h4>
              <span className="text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full uppercase">
                Automático
              </span>
            </div>

            {/* STEP 1: Seleccionar cripto y confirmar */}
            {cryptoStep === 'select' && (
              <div className="space-y-6">
                <p className="text-silver/60 text-sm">
                  Selecciona la criptomoneda con la que deseas pagar. Se generará una dirección única para tu transacción.
                </p>

                {/* Grid de criptos */}
                <div className="grid grid-cols-3 gap-3">
                  {POPULAR_CURRENCIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCrypto(c.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        selectedCrypto === c.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border/40 bg-background-dark/20 hover:border-border'
                      }`}
                    >
                      <span className="text-2xl">{c.icon}</span>
                      <span className={`text-[10px] font-black text-center leading-tight ${
                        selectedCrypto === c.id ? 'text-orange-400' : 'text-silver/50'
                      }`}>
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Resumen del pago */}
                <div className="bg-black/20 rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-silver/50 text-xs uppercase tracking-widest font-bold">Monto a pagar</p>
                    <p className="text-white text-xl font-black mt-1">${amount?.toFixed(2)} USD</p>
                  </div>
                  <div className="text-right">
                    <p className="text-silver/50 text-xs uppercase tracking-widest font-bold">Moneda elegida</p>
                    <p className="text-orange-400 text-xl font-black mt-1">
                      {formatIcon(selectedCrypto)} {formatCurrency(selectedCrypto)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCreateCryptoPayment}
                  disabled={isCreatingPayment}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
                >
                  {isCreatingPayment ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                      Generando dirección...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">generate</span>
                      Generar dirección de pago
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: Mostrar dirección y esperar pago */}
            {cryptoStep === 'paying' && cryptoInfo && (
              <div className="space-y-6">
                {/* Status bar */}
                <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                  <span className="text-orange-300 text-sm font-bold">
                    {statusLabels[paymentStatus] || paymentStatus}
                  </span>
                  <CountdownTimer expiresAt={cryptoInfo.expiration_estimate_date} />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* QR Column */}
                  <div className="flex flex-col items-center justify-center space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                    <div className="bg-white p-3 rounded-xl">
                      <QRCodeSVG
                        value={cryptoInfo.pay_address}
                        size={175}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-silver/40 uppercase tracking-widest text-center">
                      Escanear con tu wallet
                    </span>
                  </div>

                  {/* Details Column */}
                  <div className="space-y-5">
                    {/* Monto exacto */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">
                        Enviar exactamente
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-background-dark/50 rounded-xl border border-orange-500/30 font-mono text-orange-300 font-black text-lg flex items-center">
                          {cryptoInfo.pay_amount} <span className="text-orange-500/70 ml-1 text-sm font-bold">{cryptoInfo.pay_currency.toUpperCase()}</span>
                        </div>
                        <button
                          onClick={handleCopyAmount}
                          className="bg-surface hover:bg-surface-light border border-white/10 text-white p-3 rounded-xl transition-all"
                          title="Copiar monto"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {copied === 'amount' ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                      <p className="text-[10px] text-red-400 pl-1 font-bold">⚠️ Envía el monto exacto o el pago puede no confirmarse</p>
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">
                        Dirección de destino
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-background-dark/50 rounded-xl border border-border/50 font-mono text-xs text-silver/80 break-all flex items-center">
                          {cryptoInfo.pay_address}
                        </div>
                        <button
                          onClick={handleCopyAddress}
                          className="bg-surface hover:bg-surface-light border border-white/10 text-white p-3 rounded-xl transition-all"
                          title="Copiar dirección"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {copied === 'address' ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Red / Moneda */}
                    <div className="flex items-center gap-2 p-3 bg-background-dark/50 rounded-xl border border-border/50">
                      <span className="text-xl">{formatIcon(selectedCrypto)}</span>
                      <div>
                        <p className="text-white font-bold text-sm">{formatCurrency(selectedCrypto)}</p>
                        <p className="text-silver/50 text-[10px]">Red: {cryptoInfo.pay_currency.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pulsing waiting indicator */}
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="flex items-center gap-3 text-silver/50 text-sm">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    Detectando pago automáticamente — no cierres esta ventana
                  </div>
                  <button
                    onClick={handleResetCrypto}
                    className="text-[10px] text-silver/30 hover:text-silver/60 transition-all underline"
                  >
                    Cancelar y elegir otra moneda
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Failed / Expired */}
            {cryptoStep === 'failed' && (
              <div className="text-center py-8 space-y-4">
                <span className="material-symbols-outlined text-5xl text-red-400">error</span>
                <p className="text-white font-bold">El pago no pudo completarse</p>
                <p className="text-silver/50 text-sm">Estado: {paymentStatus}</p>
                <button
                  onClick={handleResetCrypto}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-border/50">
        <div className="text-silver/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
          SSL 256-bit Secure Connection
        </div>
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
