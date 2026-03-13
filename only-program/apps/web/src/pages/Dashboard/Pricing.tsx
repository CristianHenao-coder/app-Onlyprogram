import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/services/supabase";
import toast from "react-hot-toast";

import PricingHeader from "./pricing/PricingHeader";
import FeatureCard from "./pricing/FeatureCard";
import DualSystemSection from "./pricing/DualSystemSection";
import PricingCalculator from "./pricing/PricingCalculator";

export default function DashboardPricing() {
  const navigate = useNavigate();
  const [linkCount, setLinkCount] = useState<number>(1);
  const [dualTab, setDualTab] = useState<'dual' | 'meta' | 'tiktok'>('dual');
  const [linkType, setLinkType] = useState<'meta' | 'tiktok' | 'dual'>('dual');

  const SERVICE_PRICES = { meta: 59, tiktok: 69, dual: 83 } as const;
  const basePrice = SERVICE_PRICES[linkType];

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount_percent: number} | null>(null);
  const [couponError, setCouponError] = useState('');

  const getDiscount = (count: number) => {
    if (count >= 20) return 0.25;
    if (count >= 10) return 0.12;
    if (count >= 5) return 0.05;
    return 0;
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('code, discount_percent, is_active, expires_at')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setCouponError('Cupón no válido o inactivo.');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('Este cupón ha expirado.');
        return;
      }

      setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
      toast.success(`¡Cupón de ${data.discount_percent}% aplicado!`);
    } catch {
      setCouponError('Error al validar el cupón.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const currentDiscount = getDiscount(linkCount);
  let totalPrice = (basePrice * linkCount) * (1 - currentDiscount);
  
  if (appliedCoupon) {
    totalPrice = totalPrice * (1 - appliedCoupon.discount_percent / 100);
  }

  const navigateToLinks = () => navigate('/dashboard/links');

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar lg:p-4 pb-32">
      <div className="max-w-5xl mx-auto space-y-12">
        <PricingHeader />

        {/* CONCEPTOS CLAVE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon="security" 
            title="Escudo Cloaking & Antidetección" 
            color="text-blue-500"
            bg="bg-blue-500/10"
            border="border-blue-500/20"
            desc="Ocultamos la URL real a los algoritmos de revisión (bots). Cuando un revisor entra, ve un sitio 'limpio', pero tus usuarios reales ven tu contenido."
          />
          <FeatureCard 
            icon="smart_toy" 
            title="Detención de Bots" 
            color="text-red-500"
            bg="bg-red-500/10"
            border="border-red-500/20"
            desc="Bloqueamos automáticamente crawlers, bots espías y software malicioso que intentan rastrear o banear tus enlaces de redes sociales."
          />
          <FeatureCard 
            icon="travel_explore" 
            title="Geofilter Avanzado" 
            color="text-green-500"
            bg="bg-green-500/10"
            border="border-green-500/20"
            desc="Elige qué países pueden ver tu enlace y cuáles no. Bloquea regiones enteras para proteger tu identidad y evitar denuncias irrelevantes."
          />
          <FeatureCard 
            icon="rotate_right" 
            title="Rotador de Tráfico Inteligente" 
            color="text-orange-500"
            bg="bg-orange-500/10"
            border="border-orange-500/20"
            desc="Distribuye automáticamente a tus visitantes entre múltiples URLs. Ideal para agencias que manejan varios perfiles o grupos de Telegram sin saturar un solo enlace."
          />
          <FeatureCard 
            icon="language" 
            title="Dominios Personalizados Seguros" 
            color="text-purple-500"
            bg="bg-purple-500/10"
            border="border-purple-500/20"
            desc="Mejora la confianza del usuario y aumenta enormemente tus clics. Conecta tus propios dominios web y nosotros los aseguramos y blindamos automáticamente."
          />
          <FeatureCard 
            icon="support_agent" 
            title="Atención Personalizada y Garantía" 
            color="text-teal-500"
            bg="bg-teal-500/10"
            border="border-teal-500/20"
            desc="Te ofrecemos garantía total. Aunque es extremadamente raro que un dominio falle en nuestra plataforma, si llega a suceder te aseguramos un reemplazo inmediato y un servicio excelente en todo momento."
          />
        </div>

        <DualSystemSection 
          dualTab={dualTab}
          setDualTab={setDualTab}
          onNavigateLinks={navigateToLinks}
        />

        <PricingCalculator 
          linkCount={linkCount}
          setLinkCount={setLinkCount}
          linkType={linkType}
          setLinkType={setLinkType}
          basePrice={basePrice}
          totalPrice={totalPrice}
          currentDiscount={currentDiscount}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponLoading={couponLoading}
          appliedCoupon={appliedCoupon}
          couponError={couponError}
          handleApplyCoupon={handleApplyCoupon}
          removeCoupon={removeCoupon}
          onNavigateLinks={navigateToLinks}
        />
      </div>
    </div>
  );
}
