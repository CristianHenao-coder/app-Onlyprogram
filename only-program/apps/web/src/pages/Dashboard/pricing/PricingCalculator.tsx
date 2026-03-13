import React from "react";

interface PricingCalculatorProps {
  linkCount: number;
  setLinkCount: (count: number) => void;
  linkType: 'meta' | 'tiktok' | 'dual';
  setLinkType: (type: 'meta' | 'tiktok' | 'dual') => void;
  basePrice: number;
  totalPrice: number;
  currentDiscount: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponLoading: boolean;
  appliedCoupon: { code: string; discount_percent: number } | null;
  couponError: string;
  handleApplyCoupon: () => void;
  removeCoupon: () => void;
  onNavigateLinks: () => void;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  linkCount,
  setLinkCount,
  linkType,
  setLinkType,
  basePrice,
  totalPrice,
  currentDiscount,
  couponCode,
  setCouponCode,
  couponLoading,
  appliedCoupon,
  couponError,
  handleApplyCoupon,
  removeCoupon,
  onNavigateLinks,
}) => {
  return (
    <>
      {/* USO DE CUPONES */}
      <div className="mb-12 p-6 rounded-[2rem] bg-[#0A0A0A] border border-white/5 flex flex-col md:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/30 shadow-[0_0_20px_rgba(147,51,234,0.4)] animate-bounce" style={{animationDuration: '2.5s', animationTimingFunction: 'cubic-bezier(0.28,0.84,0.42,1)'}}>
          <span className="material-symbols-outlined text-3xl drop-shadow-[0_0_8px_rgba(147,51,234,0.9)]">local_activity</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Pagos Transparentes y Cupones</h3>
          <p className="text-sm text-silver/60 leading-relaxed max-w-2xl">
            Al renovar o adquirir tu suscripción mensual, incluyendo el <strong className="text-white">Sistema Dual </strong>, si tienes un <strong>Cupón de Descuento</strong>, el porcentaje aplicará directamente sobre la suma total de tu compra. ¡Consigue tus pro-links todavía más baratos!
          </p>
        </div>
      </div>

      {/* CALCULADORA Y PLANES BASE */}
      <div className="space-y-6 bg-gradient-to-br from-[#0A0A12] to-[#080810] p-6 lg:p-10 rounded-[2rem] border border-blue-500/10 shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/6 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-silver/40">Calculadora</span>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">Compra individual o <br className="hidden md:block"/> masiva</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-end sm:items-center gap-3">
            
            {appliedCoupon ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-500/10 border border-green-500/20 shrink-0">
                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                <span className="text-sm font-bold text-green-400">{appliedCoupon.code} <span className="text-xs opacity-70">(-{appliedCoupon.discount_percent}%)</span></span>
                <button onClick={removeCoupon} className="ml-1 text-green-400 hover:text-green-300">
                  <span className="material-symbols-outlined text-sm pt-1">close</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-end relative shrink-0">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Código del cupón"
                    className="w-36 sm:w-44 px-4 py-2.5 rounded-xl border border-white/10 bg-[#0F1414] text-xs font-mono text-white placeholder:text-silver/30 focus:outline-none focus:border-primary/50"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || couponLoading}
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {couponLoading ? (
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">check</span>
                    )}
                  </button>
                </div>
                {couponError && <span className="text-[10px] text-red-400 absolute -bottom-5 right-0">{couponError}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 pt-6">
          {/* SELECTOR DE TIPO DE SERVICIO */}
          <p className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-3">Tipo de servicio</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setLinkType('meta')}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                linkType === 'meta'
                  ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${linkType === 'meta' ? 'text-blue-400' : 'text-silver/40'}`}>public</span>
                <span className={`text-xs font-black uppercase tracking-wide ${linkType === 'meta' ? 'text-blue-300' : 'text-silver/50'}`}>Meta</span>
              </div>
              <span className={`text-xl font-black leading-none ${linkType === 'meta' ? 'text-white' : 'text-silver/60'}`}>
                $59<span className="text-[11px] font-bold opacity-60">/mes</span>
              </span>
              <span className={`text-[10px] font-semibold ${linkType === 'meta' ? 'text-blue-400/70' : 'text-silver/30'}`}>Instagram &amp; Facebook</span>
            </button>

            <button
              onClick={() => setLinkType('tiktok')}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                linkType === 'tiktok'
                  ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${linkType === 'tiktok' ? 'text-rose-400' : 'text-silver/40'}`}>smart_display</span>
                <span className={`text-xs font-black uppercase tracking-wide ${linkType === 'tiktok' ? 'text-rose-300' : 'text-silver/50'}`}>TikTok</span>
              </div>
              <span className={`text-xl font-black leading-none ${linkType === 'tiktok' ? 'text-white' : 'text-silver/60'}`}>
                $69<span className="text-[11px] font-bold opacity-60">/mes</span>
              </span>
              <span className={`text-[10px] font-semibold ${linkType === 'tiktok' ? 'text-rose-400/70' : 'text-silver/30'}`}>Landing VIP TikTok</span>
            </button>

            <button
              onClick={() => setLinkType('dual')}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                linkType === 'dual'
                  ? 'bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(147,51,234,0.15)]'
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${linkType === 'dual' ? 'text-primary' : 'text-silver/40'}`}>alt_route</span>
                <span className={`text-xs font-black uppercase tracking-wide ${linkType === 'dual' ? 'text-purple-300' : 'text-silver/50'}`}>Dual</span>
                {linkType === 'dual' && <span className="text-[8px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">⭐ Top</span>}
              </div>
              <span className={`text-xl font-black leading-none ${linkType === 'dual' ? 'text-white' : 'text-silver/60'}`}>
                $83<span className="text-[11px] font-bold opacity-60">/mes</span>
              </span>
              <span className={`text-[10px] font-semibold ${linkType === 'dual' ? 'text-primary/70' : 'text-silver/30'}`}>Meta + TikTok incluidos</span>
            </button>
          </div>

          <div className="flex justify-between text-sm mb-3">
            <span className="text-silver/60">Cantidad de links</span>
            <span className="font-bold text-white text-lg">{linkCount}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={linkCount} 
            onChange={(e) => setLinkCount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 relative z-10">
          <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount < 5 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(1)}>
            <span className="text-base font-black text-white mb-1">1 por link</span>
            <span className={`text-lg font-black ${linkCount < 5 ? 'text-primary' : 'text-silver/70'}`}>${basePrice}<span className="text-xs font-bold opacity-60">/mes</span></span>
            <span className={`text-[11px] font-semibold mt-0.5 ${linkCount < 5 ? 'text-primary/70' : 'text-silver/40'}`}>Precio base</span>
          </div>
          <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount >= 5 && linkCount < 10 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(5)}>
            <span className="text-base font-black text-white mb-1">5 links</span>
            <span className={`text-lg font-black ${linkCount >= 5 && linkCount < 10 ? 'text-primary' : 'text-silver/70'}`}>${(basePrice * 5 * 0.95).toFixed(0)}<span className="text-xs font-bold opacity-60">/mes</span></span>
            <span className={`text-[11px] font-semibold mt-0.5 ${linkCount >= 5 && linkCount < 10 ? 'text-primary/70' : 'text-silver/40'}`}>-5% dto.</span>
          </div>
          <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount >= 10 && linkCount < 20 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(10)}>
            <span className="text-base font-black text-white mb-1">10 links</span>
            <span className={`text-lg font-black ${linkCount >= 10 && linkCount < 20 ? 'text-primary' : 'text-silver/70'}`}>${(basePrice * 10 * 0.88).toFixed(0)}<span className="text-xs font-bold opacity-60">/mes</span></span>
            <span className={`text-[11px] font-semibold mt-0.5 ${linkCount >= 10 && linkCount < 20 ? 'text-primary/70' : 'text-silver/40'}`}>-12% dto.</span>
          </div>
          <div className={`p-4 rounded-2xl border transition-all flex flex-col items-start justify-center text-left cursor-pointer ${linkCount >= 20 ? 'bg-primary/10 border-primary/30' : 'bg-[#050505] border-white/5 hover:border-white/10'}`} onClick={() => setLinkCount(20)}>
            <span className="text-base font-black text-white mb-1">20 links</span>
            <span className={`text-lg font-black ${linkCount >= 20 ? 'text-primary' : 'text-silver/70'}`}>${(basePrice * 20 * 0.75).toFixed(0)}<span className="text-xs font-bold opacity-60">/mes</span></span>
            <span className={`text-[11px] font-semibold mt-0.5 ${linkCount >= 20 ? 'text-primary/70' : 'text-silver/40'}`}>-25% dto.</span>
          </div>
        </div>

        <div className="pt-6 relative z-10 flex flex-col sm:flex-row justify-between items-center bg-[#050505] border border-white/5 p-6 rounded-2xl mt-4">
          <div className="w-full sm:w-auto text-center sm:text-left mb-4 sm:mb-0">
            <p className="text-silver/50 text-xs font-bold uppercase tracking-wider mb-1">Costo Estimado Mensual</p>
            <div className="flex items-end justify-center sm:justify-start gap-3">
               <span className="text-4xl font-black text-white">${totalPrice.toFixed(0)} <span className="text-lg text-silver/40 font-bold">USD</span></span>
               {currentDiscount > 0 && (
                 <span className="text-sm text-silver/50 line-through mb-1">${(basePrice * linkCount).toFixed(0)}</span>
               )}
            </div>
          </div>
          <button 
              onClick={onNavigateLinks}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black text-sm font-black hover:bg-silver transition-all uppercase tracking-widest shadow-xl shadow-white/10"
          >
            Comenzar Ahora
          </button>
        </div>
      </div>
    </>
  );
};

export default PricingCalculator;
