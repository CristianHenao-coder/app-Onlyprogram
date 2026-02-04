import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/contexts/ModalContext';
import { validation } from '@/utils/validation';
import { logActions } from '@/services/auditService';
import { retryWithBackoff } from '@/utils/retryHelper';

export default function AdminSettings() {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    avatar_url: ''
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: user.email || '',
            avatar_url: data.avatar_url || ''
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
    
    // Validation
    const nameVal = validation.text(profile.full_name, { required: true, minLength: 2, label: 'Nombre' });
    if (!nameVal.valid) {
      setErrors({ full_name: nameVal.error! });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await retryWithBackoff(async () => {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id);

        if (error) throw error;
      });

      await logActions.cmsUpdate('profile', { email: profile.email });

      showAlert({
        title: "Perfil Actualizado",
        message: "Tu información de perfil se ha guardado correctamente.",
        type: "success"
      });
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Error al Actualizar",
        message: "Ocurrió un error al intentar guardar los cambios.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

   const handleDeleteAccount = async () => {
      const confirmed = await showConfirm({
         title: "Eliminar Cuenta",
         message: "¿Estás seguro de que deseas eliminar tu cuenta de administrador? Esta acción es irreversible y perderás acceso total al panel.",
         type: "confirm",
         confirmText: "Eliminar permanentemente",
         cancelText: "Cancelar"
      });

      if (!confirmed) return;
      
      showAlert({
         title: "Función en Desarrollo",
         message: "La eliminación de cuentas administrativas requiere una purga de logs. Esta función estará disponible en la próxima versión beta.",
         type: "info"
      });
   };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight text-balance">Ajustes de Administrador</h1>
        <p className="text-silver/60 font-medium">Gestiona tu identidad y seguridad en el panel.</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-surface/50 border border-border rounded-2xl w-fit backdrop-blur-md">
        {[
          { id: 'profile', label: 'Mi Perfil', icon: 'person' },
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
                <div className="flex items-center gap-8 pb-8 border-b border-border/50">
                   <div className="relative">
                      <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                         {profile.avatar_url ? (
                           <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                         ) : (
                           <span className="material-symbols-outlined text-5xl text-primary">account_circle</span>
                         )}
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white">{profile.full_name || 'Administrador'}</h3>
                      <p className="text-silver/60 text-sm font-medium">{profile.email}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-silver/40 uppercase tracking-widest px-1">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={profile.full_name}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        className={`w-full bg-background-dark/30 border-2 ${errors.full_name ? 'border-red-500' : 'border-border/50'} rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary transition-all font-bold`}
                      />
                      {errors.full_name && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.full_name}</p>}
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

        {activeTab === 'security' && (
          <div className="bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl space-y-8 animate- slide-up">
             <div>
                <h3 className="text-xl font-black text-white">Seguridad de la Cuenta</h3>
                <p className="text-silver/60 text-sm font-medium">Protege tu acceso administrativo.</p>
             </div>

             <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                         <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                      </div>
                      <div>
                         <p className="text-white font-black">Contraseña</p>
                         <p className="text-silver/60 text-xs text-balance">Cambia tu contraseña si sospechas de algún acceso no autorizado.</p>
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
                         <p className="text-silver/60 text-xs text-balance">Esta acción borrará tu acceso administrativo permanentemente.</p>
                      </div>
                   </div>
                   <button 
                     onClick={handleDeleteAccount}
                     className="w-full md:w-auto bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-3 px-8 rounded-xl hover:bg-red-500/20 transition-all text-sm"
                   >
                      Eliminar Acceso
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
