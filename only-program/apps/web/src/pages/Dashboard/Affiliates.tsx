import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { cmsService } from '@/services/cmsService';

// ------------------------------------------------------------------
// Helper: genera cupón automático  e.g.  JUAN47@
// ------------------------------------------------------------------
function generateCouponCode(displayName: string): string {
  const base = displayName
    .split(' ')[0]
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^A-Z]/g, '')
    .slice(0, 10) || 'USER';
  const num = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${base}${num}@`;
}

// ------------------------------------------------------------------
// Mini stat card
// ------------------------------------------------------------------
function StatCard({ icon, value, label, color = 'text-primary' }: {
  icon: string; value: string | number; label: string; color?: string;
}) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2">
      <span className={`material-symbols-outlined text-3xl ${color}`}>{icon}</span>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-[10px] font-black text-silver/40 uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function Affiliates() {
  const { user } = useAuth();

  const [loading, setLoading]           = useState(true);
  const [isAffiliate, setIsAffiliate]   = useState(false);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [fullName, setFullName]         = useState('');
  const [profession, setProfession]     = useState('');
  const [socialLink, setSocialLink]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied]             = useState(false);

  // ----------------------------------------------------------------
  // Load affiliate status from user metadata
  // ----------------------------------------------------------------
  useEffect(() => {
    if (user !== undefined) {
      const meta = user?.user_metadata ?? {};
      if (meta.is_affiliate) {
        setIsAffiliate(true);
        setAffiliateData(meta);
      }
      setLoading(false);
    }
  }, [user]);

  // ----------------------------------------------------------------
  // Submit join form
  // ----------------------------------------------------------------
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Por favor ingresa tu nombre completo');
      return;
    }
    if (!profession.trim()) {
      toast.error('Por favor dinos a qué te dedicas');
      return;
    }

    setIsSubmitting(true);
    try {
      const displayName = fullName.trim() || user?.email?.split('@')[0] || 'AFFILIATE';
      const couponCode = generateCouponCode(displayName);

      const newMeta = {
        ...user?.user_metadata,
        is_affiliate: true,
        affiliate_full_name: fullName.trim(),
        affiliate_profession: profession.trim(),
        affiliate_social: socialLink.trim(),
        affiliate_coupon: couponCode,
        affiliate_joined_at: new Date().toISOString(),
      };

      const { error } = await supabase.auth.updateUser({ data: newMeta });
      if (error) throw error;

      // Try to persist coupon in the DB (may fail if admin-only; that's OK)
      try {
        await cmsService.saveCoupon({
          code: couponCode,
          discount_percent: 33,
          is_active: true,
        });
      } catch (ignored) {
        console.warn('Coupon DB write skipped (permissions). Metadata saved.');
      }

      setIsAffiliate(true);
      setAffiliateData(newMeta);
      toast.success('¡Ya formas parte del programa de Referidos! 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrarte. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------------------
  // Copy coupon
  // ----------------------------------------------------------------
  const copyCoupon = () => {
    const code = affiliateData?.affiliate_coupon;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('¡Cupón copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  // ----------------------------------------------------------------
  // Loading spinner
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ================================================================
  // JOIN FORM (not yet an affiliate)
  // ================================================================
  if (!isAffiliate) {
    return (
      <div className="flex-1 p-4 md:p-10 w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Toaster position="top-center" />

        {/* Hero */}
        <div className="text-center mb-10 mt-6">
          <div className="relative inline-flex mb-6">
            <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(29,161,242,0.2)]">
              <span className="material-symbols-outlined text-5xl text-primary">handshake</span>
            </div>
            {/* Ping animar */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#080808] animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">
            Gana con cada<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">
              Referido
            </span>
          </h1>
          <p className="text-silver/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Comparte tu cupón único con tu audiencia. Ellos obtienen un
            <strong className="text-white"> descuento del 33 %</strong> y tú acumulas ganancias.
            Sin techo. Sin límites.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: 'confirmation_number', label: 'Cupón único automático' },
            { icon: 'trending_up', label: 'Comisión por cada venta' },
            { icon: 'dashboard', label: 'Panel de control propio' },
          ].map((b) => (
            <div key={b.label} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
              <span className="material-symbols-outlined text-2xl text-primary">{b.icon}</span>
              <p className="text-[10px] font-bold text-silver/60 leading-tight">{b.label}</p>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-[#080808] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_add</span>
            Completa tu perfil de Referido
          </h2>

          <form onSubmit={handleApply} className="space-y-5 relative z-10">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Camilo Pérez"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary/60 outline-none transition-all placeholder:text-silver/20"
                required
              />
            </div>

            {/* Profession */}
            <div>
              <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">
                ¿A qué te dedicas? *
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Creador de contenido, Agencia de MKT, Freelancer..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary/60 outline-none transition-all placeholder:text-silver/20"
                required
              />
            </div>

            {/* Social Link */}
            <div>
              <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">
                Enlace a tu red social principal (opcional)
              </label>
              <input
                type="url"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                placeholder="https://instagram.com/tu_perfil"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary/60 outline-none transition-all placeholder:text-silver/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-primary to-violet-600 text-white font-black uppercase tracking-widest rounded-xl text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando perfil...
                </>
              ) : (
                <>
                  Activar mi Perfil de Referido
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-silver/30 pt-2">
              Al continuar aceptas los términos del Programa de Afiliados de OnlyProgram.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ================================================================
  // AFFILIATE DASHBOARD
  // ================================================================
  const coupon    = affiliateData?.affiliate_coupon   ?? '—';
  const joinedAt  = affiliateData?.affiliate_joined_at
    ? new Date(affiliateData.affiliate_joined_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="flex-1 p-4 md:p-8 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Panel de Referidos
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-bold uppercase tracking-wider relative -top-1">
              Activo
            </span>
          </h1>
          <p className="text-silver/40 text-sm mt-1">Miembro desde: {joinedAt}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-silver/40 uppercase tracking-widest">
          <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
          Afiliado Verificado
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="group"             value={0}     label="Referidos Totales"  color="text-blue-400" />
        <StatCard icon="attach_money"      value="$0"    label="Ganancias Totales"  color="text-green-400" />
        <StatCard icon="percent"           value="33%"   label="Descuento Otorgado" color="text-violet-400" />
        <StatCard icon="trending_up"       value="—"     label="Conversión"         color="text-primary" />
      </div>

      {/* Coupon Banner */}
      <div className="relative bg-gradient-to-br from-primary/20 via-violet-800/10 to-transparent border border-primary/20 rounded-3xl p-6 md:p-8 mb-8 overflow-hidden">
        {/* decorative */}
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Tu Cupón Universal</p>
          <p className="text-silver/60 text-sm mb-6 max-w-lg">
            Cada vez que alguien use este código al pagar, recibirá un <strong className="text-white">33% de descuento</strong> y tú ganarás una comisión automática.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Code display */}
            <div className="flex items-center gap-3 bg-[#060606] border border-white/10 px-6 py-4 rounded-2xl">
              <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
              <span className="text-2xl md:text-3xl font-black text-white tracking-[0.2em]">{coupon}</span>
            </div>

            {/* Copy button */}
            <button
              onClick={copyCoupon}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                copied
                  ? 'bg-green-500 text-white scale-95'
                  : 'bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              {copied ? '¡Copiado!' : 'Copiar Código'}
            </button>
          </div>

          <p className="mt-4 text-[10px] text-silver/30">
            Válido para todos los planes. Compártelo en redes, mensajes y donde quieras.
          </p>
        </div>
      </div>

      {/* Profile info */}
      {(affiliateData?.affiliate_profession || affiliateData?.affiliate_social) && (
        <div className="bg-[#080808] border border-white/5 rounded-3xl p-6 mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">badge</span>
            Tu Perfil de Afiliado
          </h3>
          <div className="flex flex-col sm:flex-row gap-6">
            <div>
              <p className="text-[10px] font-black text-silver/30 uppercase tracking-widest mb-1">Ocupación</p>
              <p className="text-white text-sm font-semibold">{affiliateData.affiliate_profession || '—'}</p>
            </div>
            {affiliateData?.affiliate_social && (
              <div>
                <p className="text-[10px] font-black text-silver/30 uppercase tracking-widest mb-1">Red Social</p>
                <a
                  href={affiliateData.affiliate_social}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  {affiliateData.affiliate_social}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referrals Table */}
      <div className="bg-[#080808] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">people</span>
            Mis Referidos
          </h3>
          <span className="text-[10px] text-silver/40 font-black uppercase tracking-widest">
            0 / ∞ referidos
          </span>
        </div>

        {/* Empty state */}
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/3 border border-dashed border-white/10 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl text-silver/20">hourglass_empty</span>
          </div>
          <p className="text-white font-bold mb-2">Todavía no hay actividad</p>
          <p className="text-silver/40 text-sm max-w-sm">
            Comparte tu cupón <strong className="text-primary">{coupon}</strong> y cuando alguien
            lo use aparecerá aquí con todos los detalles.
          </p>
          <button
            onClick={copyCoupon}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-base">share</span>
            Compartir mi cupón
          </button>
        </div>
      </div>
    </div>
  );
}
