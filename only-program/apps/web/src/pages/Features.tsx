import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/contexts/I18nContext";
import { Link } from "react-router-dom";

export default function Features() {
  const { t } = useTranslation() as any;

  return (
    <div className="bg-background min-h-screen text-white font-sans selection:bg-primary/30 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-24" data-reveal>
                <h1 className="text-4xl sm:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-silver to-white/50">
                    {t("featuresPage.title")}
                </h1>
                <p className="text-xl text-silver/60 max-w-2xl mx-auto">
                    {t("featuresPage.subtitle")}
                </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-32">
                
                {/* 1. Links */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1" data-reveal>
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                            <span className="material-symbols-outlined text-4xl">link</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("featuresPage.links.title")}</h2>
                        <p className="text-lg text-silver/60 leading-relaxed mb-8">
                            {t("featuresPage.links.desc")}
                        </p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-primary">check_circle</span>
                                Links ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-primary">check_circle</span>
                                Dominios personalizados
                            </li>
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-primary">check_circle</span>
                                Estilos visuales únicos
                            </li>
                        </ul>
                    </div>
                    <div className="order-1 lg:order-2 relative" data-reveal>
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-30" />
                        <div className="relative rounded-3xl border border-white/10 bg-surface/40 backdrop-blur-xl p-4 overflow-hidden shadow-2xl shadow-primary/10">
                             {/* Mockup Placeholder - In a real app this would be an image or interactive comp */}
                             <div className="aspect-[4/3] bg-background-dark/50 rounded-xl flex items-center justify-center border border-white/5">
                                <span className="material-symbols-outlined text-6xl text-silver/20">dashboard</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 2. Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="order-1 relative" data-reveal>
                         <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full opacity-30" />
                         <div className="relative rounded-3xl border border-white/10 bg-surface/40 backdrop-blur-xl p-4 overflow-hidden shadow-2xl shadow-purple-500/10">
                             <div className="aspect-[4/3] bg-background-dark/50 rounded-xl flex items-center justify-center border border-white/5">
                                <span className="material-symbols-outlined text-6xl text-silver/20">monitoring</span>
                             </div>
                        </div>
                    </div>
                    <div className="order-2" data-reveal>
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                            <span className="material-symbols-outlined text-4xl">analytics</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("featuresPage.analytics.title")}</h2>
                        <p className="text-lg text-silver/60 leading-relaxed mb-8">
                            {t("featuresPage.analytics.desc")}
                        </p>
                         <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-purple-400">check_circle</span>
                                Datos en tiempo real
                            </li>
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-purple-400">check_circle</span>
                                mapa de calor geográfico
                            </li>
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-purple-400">check_circle</span>
                                Detección de dispositivos
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 3. Telegram */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1" data-reveal>
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                            <span className="material-symbols-outlined text-4xl">send</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("featuresPage.telegram.title")}</h2>
                        <p className="text-lg text-silver/60 leading-relaxed mb-8">
                            {t("featuresPage.telegram.desc")}
                        </p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-blue-400">check_circle</span>
                                Rotación inteligente
                            </li>
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-blue-400">check_circle</span>
                                Prevención de baneos
                            </li>
                            <li className="flex items-center gap-3 text-silver/80">
                                <span className="material-symbols-outlined text-blue-400">check_circle</span>
                                Gestión de múltiples canales
                            </li>
                        </ul>
                    </div>
                    <div className="order-1 lg:order-2 relative" data-reveal>
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full opacity-30" />
                         <div className="relative rounded-3xl border border-white/10 bg-surface/40 backdrop-blur-xl p-4 overflow-hidden shadow-2xl shadow-blue-500/10">
                             <div className="aspect-[4/3] bg-background-dark/50 rounded-xl flex items-center justify-center border border-white/5">
                                <span className="material-symbols-outlined text-6xl text-silver/20">autorenew</span>
                             </div>
                        </div>
                    </div>
                </div>

            </div>

             {/* CTA */}
             <div className="mt-32 text-center" data-reveal>
                <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all bg-primary rounded-xl hover:bg-primary-dark hover:scale-105 shadow-lg shadow-primary/25">
                    {t("featuresPage.cta")}
                    <span className="material-symbols-outlined ml-2">arrow_forward</span>
                </Link>
             </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
