import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import PremiumPayments from '@/components/PremiumPayments';
import PaymentSelector from '@/components/PaymentSelector';

export default function Overview() {
  const { user } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('smart_links')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        setLinks(data || []);
      } catch (err) {
        console.error('Error loading links:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  // If no links, show Pricing/Plans and then Payment Methods
  if (links.length === 0) {
    return (
      <div className="space-y-16 max-w-5xl mx-auto pb-20 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Activa tu primer link protegido</h1>
          <p className="text-silver/60 max-w-2xl mx-auto font-medium">
            Selecciona un plan profesional y elige tu método de pago para empezar a generar pasarelas de seguridad.
          </p>
        </div>
        
        {/* Step 1: Plans */}
        <section className="space-y-10">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-black text-white shadow-lg shadow-primary/30">1</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Selecciona tu Plan</h2>
           </div>
           <div className="bg-surface/20 border border-white/5 rounded-[3rem] p-6 md:p-12 backdrop-blur-sm">
              <PremiumPayments />
           </div>
        </section>

        {/* Step 2: Payment Methods */}
        <section className="space-y-10">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-black text-white shadow-lg shadow-primary/30">2</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Método de Pago</h2>
           </div>
           <div className="bg-surface/40 border border-border rounded-[3rem] p-8 md:p-12 shadow-2xl">
              <PaymentSelector />
              
              <div className="mt-12 flex flex-col items-center gap-6">
                 <Link 
                   to="/dashboard/support"
                   className="w-full max-w-md bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-primary/40 transform hover:scale-[1.02] active:scale-95 text-lg uppercase tracking-widest flex items-center justify-center gap-3"
                 >
                    Comprar Links Ahora
                    <span className="material-symbols-outlined font-black">shopping_cart</span>
                 </Link>
                 <p className="text-[11px] text-silver/40 font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">verified_user</span> Transacción 100% Protegida por Only Program
                 </p>
              </div>
           </div>
        </section>
      </div>
    );
  }

  // If there are links, show the list
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Links Protegidos</h1>
          <p className="text-silver/60 text-sm">Gestiona y monitoriza tus pasarelas activas.</p>
        </div>
        <Link 
          to="/dashboard/links/new"
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">add</span>
          Nuevo Link
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <div key={link.id} className="bg-surface/50 border border-border rounded-2xl p-6 hover:border-primary/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary">link</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                link.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {link.status}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors truncate">
               {link.title || 'Link sin título'}
            </h3>
            <p className="text-silver/50 text-sm mb-6 truncate">
               {link.slug}.onlyprogram.com
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
               <div className="flex items-center gap-2 text-silver/40">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span className="text-xs font-medium">0 clics</span>
               </div>
               <Link 
                 to={`/dashboard/links/${link.id}/edit`}
                 className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
               >
                 Editar <span className="material-symbols-outlined text-sm">edit</span>
               </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
