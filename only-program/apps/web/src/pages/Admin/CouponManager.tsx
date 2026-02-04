import { useEffect, useState, FormEvent } from 'react';
import { cmsService } from '@/services/cmsService';

const CouponManager = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_percent: 50,
    is_active: true,
    expires_at: ''
  });

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
    if (!newCoupon.code) return;
    
    setSaving(true);
    try {
      await cmsService.saveCoupon({
        ...newCoupon,
        code: newCoupon.code.toUpperCase().trim()
      });
      setNewCoupon({ code: '', discount_percent: 50, is_active: true, expires_at: '' });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert('Error creating coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await cmsService.deleteCoupon(id);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Coupon Management</h1>
        <p className="text-silver/40 text-sm font-medium">Create and manage discount codes for your users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Creator Form */}
         <div className="bg-surface/30 border border-border/50 p-8 rounded-3xl h-fit sticky top-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
               <span className="material-symbols-outlined text-primary">add_circle</span>
               New Coupon
            </h2>
             <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black text-silver/40 uppercase tracking-widest mb-2">Coupon Code</label>
                   <input 
                    type="text" 
                    placeholder="e.g. SUMMER50" 
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    className="w-full bg-background-dark border border-border/50 rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all font-mono"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-silver/40 uppercase tracking-widest mb-2">Discount %</label>
                   <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={newCoupon.discount_percent}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: parseInt(e.target.value) })}
                    className="w-full bg-background-dark border border-border/50 rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all"
                   />
                </div>
                <button 
                  disabled={saving || !newCoupon.code}
                  className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
                >
                  {saving ? 'Creating...' : 'Create Coupon'}
                </button>
             </form>
         </div>

         {/* Coupons List */}
         <div className="lg:col-span-2 space-y-4">
            <h2 className="text-silver/40 text-[10px] font-black uppercase tracking-widest px-4">Active & Inactive Coupons</h2>
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
                       <p className="text-[10px] text-silver/40 font-medium">Created: {new Date(coupon.created_at).toLocaleDateString()}</p>
                       <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${coupon.is_active ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' : 'bg-silver/20'}`}></span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-silver/60">
                             {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                       </div>
                    </div>
                 </div>
               ))}

               {coupons.length === 0 && (
                 <div className="col-span-full py-16 text-center bg-white/5 rounded-3xl border border-dashed border-border/50">
                    <span className="material-symbols-outlined text-4xl text-silver/10 mb-2">confirmation_number</span>
                    <p className="text-silver/40 text-sm font-bold">No coupons found. Create your first one!</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default CouponManager;
