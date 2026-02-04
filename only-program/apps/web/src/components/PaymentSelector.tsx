import { useState } from 'react';

interface PaymentSelectorProps {
  onSelect?: (method: 'card' | 'paypal' | 'crypto') => void;
  initialMethod?: 'card' | 'paypal' | 'crypto';
}

export default function PaymentSelector({ onSelect, initialMethod = 'card' }: PaymentSelectorProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>(initialMethod);

  const handleSelect = (method: 'card' | 'paypal' | 'crypto') => {
    setPaymentMethod(method);
    if (onSelect) onSelect(method);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'card', label: 'Tarjeta de Crédito', icon: 'credit_card', color: 'bg-blue-500' },
          { id: 'paypal', label: 'PayPal Account', icon: 'account_balance_wallet', color: 'bg-yellow-500' },
          { id: 'crypto', label: 'Crypto Wallet', icon: 'currency_bitcoin', color: 'bg-orange-500' }
        ].map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => handleSelect(method.id as any)}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${
              paymentMethod === method.id 
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

      <div className="mt-8 p-8 bg-background-dark/30 border border-border/50 rounded-3xl">
        {paymentMethod === 'card' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-white px-1">Datos de Tarjeta</h4>
              <div className="flex gap-2">
                <div className="h-6 w-10 bg-white/10 rounded border border-white/5"></div>
                <div className="h-6 w-10 bg-white/10 rounded border border-white/5"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Número de Tarjeta</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-silver/40">credit_card</span>
                  <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-background-dark/50 border border-border/50 rounded-xl pl-12 pr-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Vencimiento</label>
                  <input type="text" placeholder="MM / YY" className="w-full bg-background-dark/50 border border-border/50 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">CVC</label>
                  <input type="password" placeholder="***" className="w-full bg-background-dark/50 border border-border/50 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-mono" />
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'paypal' && (
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div className="h-20 w-20 rounded-full bg-[#0070ba]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-[#0070ba]">payments</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">Paga con una cuenta de PayPal</h4>
              <p className="text-silver/60 text-sm max-w-xs mx-auto">Rapidez y seguridad en tu transacción digital.</p>
            </div>
            <button type="button" className="bg-[#0070ba] hover:bg-[#005ea6] text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-[#0070ba]/20 transition-all active:scale-95">
              Conectar PayPal
            </button>
          </div>
        )}

        {paymentMethod === 'crypto' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-white px-1">Pago Decentralizado</h4>
              <span className="text-[10px] font-black bg-orange-500/20 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full uppercase">Soportado</span>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-4">
                <span className="material-symbols-outlined text-orange-500">warning</span>
                <p className="text-[10px] text-silver/60 leading-relaxed font-bold">
                  Solo ingresa tu <strong>Dirección Pública (Wallet Address)</strong>. <br />
                  <span className="text-orange-500 font-black">NUNCA</span> compartas tu frase semilla.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-silver/40 uppercase tracking-widest pl-1">Tu Billetera (Public ID)</label>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  className="w-full bg-background-dark/50 border border-border/50 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-mono text-xs" 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-border/50">
        <div className="text-silver/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">enhanced_encryption</span> SSL 256-bit Secure Connection
        </div>
        <button type="button" className="bg-white text-black font-black px-8 py-3.5 rounded-xl hover:bg-silver transition-all shadow-xl shadow-white/5 active:scale-95 text-xs lg:text-sm uppercase tracking-widest">
          Confirmar y Pagar
        </button>
      </div>
    </div>
  );
}
