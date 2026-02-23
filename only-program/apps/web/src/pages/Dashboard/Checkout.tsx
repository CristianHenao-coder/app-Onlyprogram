import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentsService } from '@/services/payments.service';
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from '@/services/productPricing.service';
import toast from 'react-hot-toast';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(DEFAULT_PRODUCT_PRICING);
  const [loading, setLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  // Extract linksData from navigation state
  const linksData = location.state?.pendingPurchase?.linksData || [];

  useEffect(() => {
    if (linksData.length === 0) {
      navigate('/dashboard/links');
      return;
    }

    const loadData = async () => {
      try {
        const [pricing, trialStatus] = await Promise.all([
          productPricingService.get(),
          paymentsService.checkFreeTrial()
        ]);
        setPricingCfg(pricing);
        setHasUsedTrial(trialStatus.hasUsedTrial);
      } catch (error) {
        console.error("Error loading checkout data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [linksData, navigate]);

  const handleProductSelect = async (type: 'standard' | 'premium' | 'free-trial') => {
    if (type === 'free-trial') {
      await handleFreeTrial();
      return;
    }

    const amount = type === 'premium' ? pricingCfg.domain.connect : pricingCfg.link.standard * linksData.length;

    navigate('/dashboard/payments', {
      state: {
        pendingPurchase: {
          type: type === 'premium' ? 'link_with_domain' : 'links_bundle',
          linksData: linksData,
          amount: amount
        }
      }
    });
  };

  const handleFreeTrial = async () => {
    const toastId = toast.loading('Activando prueba gratuita...');
    setIsActivating(true);
    try {
      await paymentsService.activateFreeTrial(linksData, '');
      toast.success('¡Links activados correctamente!', { id: toastId });
      localStorage.removeItem('my_links_data');
      navigate('/dashboard/links');
    } catch (error: any) {
      console.error("Error activating trial:", error);
      toast.error(error.message || 'Error al activar la prueba', { id: toastId });
    } finally {
      setIsActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-4">Elige tu Plan de Activación</h1>
        <p className="text-silver/60">Selecciona cómo quieres publicar tus {linksData.length} links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* FREE TRIAL (Keep always visible for testing) */}
        <div className="bg-[#0A0A0A] border border-green-500/20 rounded-[2.5rem] p-8 flex flex-col hover:border-green-500/40 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/20">RECOMENDADO</span>
          </div>
          <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Prueba Gratis</h3>
          <p className="text-silver/50 text-sm mb-6 flex-1">Prueba todas las funciones durante 30 días sin compromiso.</p>
          <div className="text-3xl font-black text-white mb-8">$0.00</div>
          <button
            onClick={() => handleProductSelect('free-trial')}
            disabled={isActivating}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            Probar Ahora
          </button>
        </div>

        {/* STANDARD VITALICIO */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 flex flex-col hover:border-primary/40 transition-all group">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">bolt</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Acceso Vitalicio</h3>
          <p className="text-silver/50 text-sm mb-6 flex-1">Tus links activos para siempre con un solo pago.</p>
          <div className="text-3xl font-black text-white mb-8">${(pricingCfg.link.standard * linksData.length).toFixed(2)}</div>
          <button
            onClick={() => handleProductSelect('standard')}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
          >
            Activar Ahora
          </button>
        </div>

        {/* DOMAIN PREMIUM */}
        <div className="bg-[#0A0A0A] border border-purple-500/20 rounded-[2.5rem] p-8 flex flex-col hover:border-purple-500/40 transition-all group relative">
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">language</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Dominio Pro</h3>
          <p className="text-silver/50 text-sm mb-6 flex-1">Usa tu propio dominio (ej. marcasite.com) para máxima autoridad.</p>
          <div className="text-3xl font-black text-white mb-8">${pricingCfg.domain.connect.toFixed(2)}</div>
          <button
            onClick={() => handleProductSelect('premium')}
            className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
          >
            Configurar Dominio
          </button>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => navigate('/dashboard/links')}
          className="text-silver/40 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
        >
          ← Volver al Editor
        </button>
      </div>
    </div>
  );
}
