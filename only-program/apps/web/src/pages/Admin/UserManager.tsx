import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useTranslation } from '@/contexts/I18nContext';
import { useModal } from '@/contexts/ModalContext';
import { logActions } from '@/services/auditService';
import { retryWithBackoff } from '@/utils/retryHelper';

 const UserManager = () => {
   const { t } = useTranslation();
   const { showAlert } = useModal();
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');
   
   // Promotion Security State
   const [promotionTarget, setPromotionTarget] = useState<any | null>(null);
   const [verificationCode, setVerificationCode] = useState('');
   const [isVerifying, setIsVerifying] = useState(false);
   const [isSendingCode, setIsSendingCode] = useState(false);
   const [step, setStep] = useState<'none' | 'confirm' | 'verify'>('none');

   const fetchUsers = async () => {
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('profiles')
         .select('*')
         .order('created_at', { ascending: false });

       if (error) throw error;
       setUsers(data || []);
     } catch (err) {
       console.error(err);
     } finally {
       setLoading(false);
     }
   };

   useEffect(() => {
     fetchUsers();
   }, []);

   const toggleSuspension = async (userId: string, currentStatus: boolean) => {
     try {
       await retryWithBackoff(async () => {
         const { error } = await supabase
           .from('profiles')
           .update({ is_suspended: !currentStatus })
           .eq('id', userId);
         
         if (error) throw error;
       });

       await logActions.userSuspend(userId, !currentStatus);
       fetchUsers();
       
       showAlert({
          title: !currentStatus ? "Usuario Suspendido" : "Suspensión Levantada",
          message: `El estado del usuario ha sido actualizado correctamente.`,
          type: "success"
       });
     } catch (err) {
       console.error(err);
       showAlert({
         title: "Error de Sistema",
         message: "No se pudo cambiar el estado de suspensión del usuario.",
         type: "error"
       });
     }
   };

   const handleRequestPromotion = async () => {
     if (!promotionTarget) return;
     setIsSendingCode(true);
     try {
       const { data: { session } } = await supabase.auth.getSession();
       const response = await fetch('http://localhost:3001/api/admin/request-promotion-code', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session?.access_token}`
         },
         body: JSON.stringify({ targetUserId: promotionTarget.id })
       });
       
       if (!response.ok) throw new Error('Error al enviar código');
       
       setStep('verify');
     } catch (err) {
       showAlert({
         title: "Error de Seguridad",
         message: "No se pudo enviar el código de verificación. Revisa tu conexión.",
         type: "error"
       });
       console.error(err);
     } finally {
       setIsSendingCode(false);
     }
   };

   const handleVerifyPromotion = async () => {
     if (!promotionTarget || !verificationCode) return;
     setIsVerifying(true);
     try {
       const { data: { session } } = await supabase.auth.getSession();
       const response = await fetch('http://localhost:3001/api/admin/verify-promotion-code', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session?.access_token}`
         },
         body: JSON.stringify({ 
           code: verificationCode,
           targetUserId: promotionTarget.id 
         })
       });
       
       const result = await response.json();
       if (!response.ok) throw new Error(result.error || 'Error de verificación');
       
       await logActions.userPromote(promotionTarget.id);

       showAlert({
         title: "Usuario Promovido",
         message: "El usuario ha sido elevado al rango de Administrador con éxito.",
         type: "success"
       });
       setStep('none');
       setPromotionTarget(null);
       setVerificationCode('');
       fetchUsers();
     } catch (err: any) {
       showAlert({
         title: "Verificación Fallida",
         message: err.message || "El código introducido es incorrecto o ha expirado.",
         type: "error"
       });
     } finally {
       setIsVerifying(false);
     }
   };

   const filteredUsers = users.filter(u => 
     u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     u.id.toLowerCase().includes(search.toLowerCase())
   );

   if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

   return (
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{t('admin.user.title')}</h1>
           <p className="text-silver/40 text-sm font-medium">{t('admin.user.subtitle')}</p>
         </div>
         <div className="relative group max-w-sm w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-silver/20 group-hover:text-primary transition-colors">search</span>
            <input 
             type="text" 
             placeholder="Buscar por nombre o ID..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-surface/30 border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
            />
         </div>
       </div>

       <div className="bg-surface/30 border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
         <table className="w-full text-left">
           <thead className="bg-white/5 border-b border-border/50">
             <tr>
               <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.user.profile')}</th>
               <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.user.role')}</th>
               <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.user.status')}</th>
               <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">{t('admin.user.actions')}</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-border/20">
             {filteredUsers.map((user) => (
               <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                 <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-xl">person</span>
                        )}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-white">{user.full_name || 'Sin nombre'}</p>
                       <p className="text-[10px] text-silver/40 font-mono truncate max-w-[150px]">{user.id}</p>
                     </div>
                   </div>
                 </td>
                 <td className="px-6 py-5">
                   <div className="flex flex-col gap-1">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-purple-400' : 'text-blue-400'}`}>
                       {user.role}
                     </span>
                     <span className="text-[10px] text-silver font-medium italic">
                       {user.plan_type || 'GRATIS'}
                     </span>
                   </div>
                 </td>
                 <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <span className={`h-2 w-2 rounded-full ${user.is_suspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                       <span className="text-xs font-bold text-silver/60">
                         {user.is_suspended ? t('admin.user.suspended') : t('admin.coupon.active')}
                       </span>
                    </div>
                 </td>
                 <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                        {user.role !== 'admin' && (
                          <button 
                             onClick={() => { setPromotionTarget(user); setStep('confirm'); }}
                             className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white transition-all"
                          >
                             Hacer Admin
                          </button>
                        )}
                       <button 
                         onClick={() => toggleSuspension(user.id, !!user.is_suspended)}
                         className={`
                           px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                           ${user.is_suspended 
                             ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white' 
                             : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}
                         `}
                       >
                          {user.is_suspended ? t('admin.user.unsuspend') : t('admin.user.suspend')}
                       </button>
                    </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>

         {filteredUsers.length === 0 && (
           <div className="p-20 text-center">
             <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">group_off</span>
             <p className="text-silver/40 text-sm font-bold">No se encontraron usuarios.</p>
           </div>
         )}
       </div>

       {/* Security Modal for Promotion */}
       {step !== 'none' && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setStep('none')}></div>
           <div className="bg-surface border border-border/50 rounded-[2.5rem] w-full max-w-md p-8 sm:p-10 relative overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full"></div>
             
             <div className="relative text-center space-y-6">
               <div className="h-16 w-16 bg-purple-500/10 rounded-3xl mx-auto flex items-center justify-center border border-purple-500/20">
                 <span className="material-symbols-outlined text-3xl text-purple-400">shield_person</span>
               </div>

               {step === 'confirm' ? (
                 <>
                   <div>
                     <h3 className="text-xl font-black text-white">Promover a Admin</h3>
                     <p className="text-silver/60 text-sm mt-2">
                        Estás a punto de dar privilegios de administrador a <span className="text-white font-bold">{promotionTarget?.full_name}</span>. 
                        Por seguridad, enviaremos un código a tu correo.
                     </p>
                   </div>
                   <div className="flex flex-col gap-3 pt-4">
                     <button 
                       onClick={handleRequestPromotion}
                       disabled={isSendingCode}
                       className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50"
                     >
                       {isSendingCode ? 'Enviando Código...' : 'Enviar Código a mi Correo'}
                     </button>
                     <button onClick={() => setStep('none')} className="text-silver/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                   </div>
                 </>
               ) : (
                 <>
                   <div>
                     <h3 className="text-xl font-black text-white">Verificación de Correo</h3>
                     <p className="text-silver/60 text-sm mt-2">Introduce el código de 6 dígitos enviado a tu correo.</p>
                   </div>
                   <div className="space-y-4">
                     <input 
                       type="text" 
                       maxLength={6}
                       placeholder="000000"
                       value={verificationCode}
                       onChange={(e) => setVerificationCode(e.target.value)}
                       className="w-full bg-background-dark/50 border-2 border-border/50 rounded-2xl p-5 text-center text-3xl font-black tracking-[0.5em] text-white focus:border-purple-500/50 outline-none transition-all placeholder:text-silver/10"
                     />
                     <button 
                       onClick={handleVerifyPromotion}
                       disabled={isVerifying || verificationCode.length !== 6}
                       className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-green-600/20 disabled:opacity-50"
                     >
                       {isVerifying ? 'Verificando...' : 'Confirmar Promoción'}
                     </button>
                     <button onClick={() => setStep('confirm')} className="text-silver/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Atrás</button>
                   </div>
                 </>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

 export default UserManager;
