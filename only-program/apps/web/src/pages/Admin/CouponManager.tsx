import { useEffect, useState, FormEvent } from 'react';
import { cmsService } from '@/services/cmsService';
import { useTranslation } from '@/contexts/I18nContext';
import { useModal } from '@/contexts/ModalContext';
import { validation } from '@/utils/validation';
import { logActions } from '@/services/auditService';
import { useUndoable, createUndoableAction } from '@/hooks/useUndoable';
import Snackbar from '@/components/Snackbar';

 const CouponManager = () => {
   const { t } = useTranslation();
   const { showAlert, showConfirm } = useModal();
   const [coupons, setCoupons] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [undoAction, setUndoAction] = useState<any>(null);
   const [newCoupon, setNewCoupon] = useState({
     code: '',
     discount_percent: 50,
     is_active: true,
     expires_at: ''
   });

   const { addAction, undo } = useUndoable();

   const fetchCoupons = async () => {
     setLoading(true);
     try {
       const data = await cmsService.getCoupons();
       setCoupons(data || []);
     } catch (err) {
       console.error(err);
     } finally {
       setLoading(false);
     }
   };

   useEffect(() => {
     fetchCoupons();
   }, []);

   const handleCreateCoupon = async (e: FormEvent) => {
     e.preventDefault();
     
     // Validation
     const codeVal = validation.couponCode(newCoupon.code);
     const percentVal = validation.percentage(newCoupon.discount_percent);
     
     const formErrors: Record<string, string> = {};
     if (!codeVal.valid) formErrors.code = codeVal.error!;
     if (!percentVal.valid) formErrors.discount_percent = percentVal.error!;
     
     if (Object.keys(formErrors).length > 0) {
       setErrors(formErrors);
       return;
     }
     
     setSaving(true);
     setErrors({});
     try {
       const code = newCoupon.code.toUpperCase().trim();
       
       // Prepare data for Supabase - ensure types are correct
       // Empty string for expires_at usually causes 400 Bad Request if types are strict
       const couponData = {
         code,
         discount_percent: Number(newCoupon.discount_percent),
         is_active: newCoupon.is_active,
         expires_at: newCoupon.expires_at || null
       };

       await cmsService.saveCoupon(couponData);
       await logActions.couponCreate(code, { discount: newCoupon.discount_percent });
       
       setNewCoupon({ code: '', discount_percent: 50, is_active: true, expires_at: '' });
       fetchCoupons();
       
       showAlert({
          title: "¡Cupón Creado!",
          message: `El cupón ${code} ha sido activado con éxito.`,
          type: "success"
       });
     } catch (err) {
       console.error(err);
       showAlert({
         title: "Error al Crear",
         message: "No se pudo generar el cupón. Inténtalo de nuevo más tarde.",
         type: "error"
       });
     } finally {
       setSaving(false);
     }
   };

    const handleDelete = async (id: string) => {
       const coupon = coupons.find(c => c.id === id);
       if (!coupon) return;

       const confirmed = await showConfirm({
          title: "Eliminar Cupón",
          message: `¿Estás seguro de que quieres eliminar el cupón ${coupon.code} permanentemente?`,
          type: "warning",
          confirmText: "Eliminar",
          cancelText: "Cancelar"
       });

       if (!confirmed) return;

       try {
          await cmsService.deleteCoupon(id);
          await logActions.couponDelete(coupon.code);
          
          const action = createUndoableAction(
            'DELETE_COUPON',
            `Cupón ${coupon.code} eliminado`,
            coupon,
            async (data) => {
              // Restore coupon
              await cmsService.saveCoupon({
                code: data.code,
                discount_percent: data.discount_percent,
                is_active: data.is_active,
                expires_at: data.expires_at || null
              });
              await logActions.couponCreate(data.code, { action: 'undo_delete' });
              fetchCoupons();
            },
            async (data) => {
              await cmsService.deleteCoupon(data.id);
              await logActions.couponDelete(data.code, { action: 'redo_delete' });
              fetchCoupons();
            }
          );
          
          addAction(action);
          setUndoAction(action);
          fetchCoupons();
       } catch (err) {
          console.error(err);
          showAlert({
             title: "Error de Sistema",
             message: "No se pudo eliminar el cupón.",
             type: "error"
          });
       }
    };

   if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

   return (
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div>
         <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{t('admin.coupon.title')}</h1>
         <p className="text-silver/40 text-sm font-medium">{t('admin.coupon.subtitle')}</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creator Form */}
          <div className="bg-surface/30 border border-border/50 p-8 rounded-3xl h-fit sticky top-8 shadow-2xl">
             <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                {t('admin.coupon.new')}
             </h2>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-silver/40 uppercase tracking-widest mb-2">{t('admin.coupon.code')}</label>
                    <input 
                     type="text" 
                     placeholder="e.g. SUMMER50" 
                     value={newCoupon.code}
                     onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                     className={`w-full bg-background-dark border ${errors.code ? 'border-red-500' : 'border-border/50'} rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all font-mono`}
                    />
                    {errors.code && <p className="text-[10px] text-red-500 font-bold mt-2">{errors.code}</p>}
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-silver/40 uppercase tracking-widest mb-2">{t('admin.coupon.discount')}</label>
                    <input 
                     type="number" 
                     min="1" 
                     max="100"
                     value={newCoupon.discount_percent}
                     onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: parseInt(e.target.value) })}
                     className={`w-full bg-background-dark border ${errors.discount_percent ? 'border-red-500' : 'border-border/50'} rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all`}
                    />
                    {errors.discount_percent && <p className="text-[10px] text-red-500 font-bold mt-2">{errors.discount_percent}</p>}
                 </div>
                 <button 
                   disabled={saving || !newCoupon.code}
                   className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
                 >
                   {saving ? t('admin.coupon.creating') : t('admin.coupon.create')}
                 </button>
              </form>
          </div>

          {/* Coupons List */}
          <div className="lg:col-span-2 space-y-4">
             <h2 className="text-silver/40 text-[10px] font-black uppercase tracking-widest px-4">Cupones Activos e Inactivos</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="bg-surface/30 border border-border/50 p-6 rounded-2xl group relative overflow-hidden">
                     <div className={`absolute top-0 right-0 h-1 w-full ${coupon.is_active ? 'bg-primary' : 'bg-silver/20'}`}></div>
                     
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-xl font-black text-white tracking-widest mb-1 italic">
                              {coupon.code}
                           </p>
                           <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-tighter rounded border border-primary/20">
                              -{coupon.discount_percent}% OFF
                           </span>
                        </div>
                        <button 
                         onClick={() => handleDelete(coupon.id)}
                         className="h-8 w-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                     </div>

                     <div className="mt-6 flex items-center justify-between">
                        <p className="text-[10px] text-silver/40 font-medium">Creado: {new Date(coupon.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-1.5">
                           <span className={`h-1.5 w-1.5 rounded-full ${coupon.is_active ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' : 'bg-silver/20'}`}></span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-silver/60">
                              {coupon.is_active ? t('admin.coupon.active') : t('admin.coupon.inactive')}
                           </span>
                        </div>
                     </div>
                  </div>
                ))}

                {coupons.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-white/5 rounded-3xl border border-dashed border-border/50">
                     <span className="material-symbols-outlined text-4xl text-silver/10 mb-2">confirmation_number</span>
                     <p className="text-silver/40 text-sm font-bold">No se encontraron cupones.</p>
                  </div>
                )}
             </div>
          </div>
       </div>

       {undoAction && (
         <Snackbar 
           message={undoAction.description}
           isOpen={!!undoAction}
           onClose={() => setUndoAction(null)}
           action={{
             label: 'Deshacer',
             onClick: undo
           }}
           type="info"
         />
       )}
     </div>
   );
 };

 export default CouponManager;
