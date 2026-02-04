import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/contexts/ModalContext';
import PaymentSelector from '@/components/PaymentSelector';

export default function Settings() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'security'>('profile');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    country: '',
    bio: '',
    telegram: ''
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: user.email || '',
            country: data.country || '',
            bio: data.bio || '',
            telegram: data.telegram_handle || ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          country: profile.country,
          bio: profile.bio,
          telegram_handle: profile.telegram,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
      showAlert({
        title: "Perfil Guardado",
        message: "Tu información personal se ha actualizado correctamente.",
        type: "success"
      });
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Error de Guardado",
        message: "No pudimos actualizar tu perfil. Verifica tu conexión.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Configuración</h1>
          <p className="text-silver/60 font-medium">Gestiona tu cuenta, pagos y preferencias de seguridad.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-surface/50 border border-border rounded-2xl w-full md:w-fit backdrop-blur-md">
        {[
          { id: 'profile', label: 'Mi Perfil', icon: 'person' },
          { id: 'billing', label: 'Pagos y Facturación', icon: 'payments' },
          { id: 'security', label: 'Seguridad', icon: 'security' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'text-silver/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'profile' && (
          <div className="bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
             
             <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-border/50">
                   <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                         <span className="material-symbols-outlined text-5xl text-primary">account_circle</span>
                      </div>
                      <button type="button" className="absolute -bottom-2 -right-2 p-2 bg-white text-black rounded-lg shadow-xl hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined text-sm font-bold">edit</span>
                      </button>
                   </div>
                   <div className="text-center md:text-left">
                      <h3 className="text-xl font-black text-white">{profile.full_name || 'Nuevo Usuario'}</h3>
                      <p className="text-silver/60 text-sm font-medium">{profile.email}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-silver/40 uppercase tracking-widest px-1">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={profile.full_name}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        className="w-full bg-background-dark/30 border-2 border-border/50 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-bold"
                        placeholder="Tu nombre real"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-silver/40 uppercase tracking-widest px-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={profile.email}
                        readOnly
                        className="w-full bg-background-dark/10 border-2 border-border/20 rounded-xl px-5 py-3.5 text-silver/30 cursor-not-allowed font-bold"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-silver/40 uppercase tracking-widest px-1">País</label>
                      <input 
                        type="text" 
                        value={profile.country}
                        onChange={(e) => setProfile({...profile, country: e.target.value})}
                        className="w-full bg-background-dark/30 border-2 border-border/50 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-bold"
                        placeholder="España, México, etc."
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-silver/40 uppercase tracking-widest px-1">Usuario de Telegram</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-bold">@</span>
                        <input 
                          type="text" 
                          value={profile.telegram}
                          onChange={(e) => setProfile({...profile, telegram: e.target.value})}
                          className="w-full bg-background-dark/30 border-2 border-border/50 rounded-xl pl-10 pr-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-bold"
                          placeholder="usuario_tg"
                        />
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-black text-silver/40 uppercase tracking-widest px-1">Biografía / Notas</label>
                   <textarea 
                     value={profile.bio}
                     onChange={(e) => setProfile({...profile, bio: e.target.value})}
                     className="w-full bg-background-dark/30 border-2 border-border/50 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-bold h-32 resize-none"
                     placeholder="Cuéntanos un poco sobre ti..."
                   />
                </div>

                <div className="flex justify-end pt-4">
                   <button 
                     type="submit"
                     disabled={saving}
                     className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black px-10 py-4 rounded-xl transition-all shadow-xl shadow-primary/20 transform active:scale-95"
                   >
                     {saving ? 'Guardando...' : 'Actualizar Perfil'}
                   </button>
                </div>
             </form>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-8 animate-slide-up">
             {/* Payment Methods Selection */}
             <div className="bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl space-y-8">
                <div>
                   <h3 className="text-xl font-black text-white">Métodos de Pago</h3>
                   <p className="text-silver/60 text-sm font-medium">Selecciona cómo quieres pagar tus suscripciones y dominios.</p>
                </div>

                <PaymentSelector initialMethod={paymentMethod} onSelect={setPaymentMethod} />
             </div>

             {/* Billing History */}

             {/* Billing History */}
             <div className="bg-surface/30 border border-border rounded-[2.5rem] p-8 md:p-10 space-y-6">
                <h3 className="text-xl font-black text-white">Historial de Pagos</h3>
                <div className="text-center py-10">
                   <span className="material-symbols-outlined text-silver/10 text-6xl mb-4">receipt_long</span>
                   <p className="text-silver/40 font-bold uppercase tracking-widest text-xs">No hay transacciones recientes</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl space-y-8 animate-slide-up">
             <div>
                <h3 className="text-xl font-black text-white">Seguridad de la Cuenta</h3>
                <p className="text-silver/60 text-sm font-medium">Protege tu acceso y datos personales.</p>
             </div>

             <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                         <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                      </div>
                      <div>
                         <p className="text-white font-black">Contraseña</p>
                         <p className="text-silver/60 text-xs">Actualiza tu contraseña regularmente para mayor seguridad.</p>
                      </div>
                   </div>
                   <button className="w-full md:w-auto bg-surface border border-border text-white font-bold py-3 px-8 rounded-xl hover:bg-white/5 transition-all text-sm">
                      Cambiar Contraseña
                   </button>
                </div>

                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                         <span className="material-symbols-outlined text-red-500 text-2xl">no_accounts</span>
                      </div>
                      <div>
                         <p className="text-white font-black">Eliminar Cuenta</p>
                         <p className="text-silver/60 text-xs text-balance">Esta acción es irreversible. Se borrarán todos tus links y datos.</p>
                      </div>
                   </div>
                   <button className="w-full md:w-auto bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-3 px-8 rounded-xl hover:bg-red-500/20 transition-all text-sm">
                      Eliminar permanentemente
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
