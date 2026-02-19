import { useState } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";

type FeatureKey = 'quickLinks' | 'brandDomain' | 'linkShield' | 'trafficControl' | 'segmentation' | 'analytics' | 'warnings';

export default function LinkControlCenter() {
    const { t } = useTranslation() as any;
    const [activeFeature, setActiveFeature] = useState<FeatureKey>('quickLinks');

    const features: { key: FeatureKey; icon: string }[] = [
        { key: 'quickLinks', icon: 'bolt' },
        { key: 'brandDomain', icon: 'dns' },
        { key: 'linkShield', icon: 'shield_lock' },
        { key: 'trafficControl', icon: 'traffic' },
        { key: 'segmentation', icon: 'public' },
        { key: 'analytics', icon: 'monitoring' },
        { key: 'warnings', icon: 'warning' },
    ];

    return (
        <section className="py-24 bg-black relative overflow-hidden" id="features">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
                        {t("linkControlCenter.title")}
                    </h2>
                    <p className="text-silver/60 max-w-2xl mx-auto text-lg leading-relaxed">
                        {t("linkControlCenter.subtitle")}
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column: Navigation Tabs */}
                    <div className="lg:col-span-4 flex flex-col gap-2">
                        {features.map((feature) => {
                            const isActive = activeFeature === feature.key;
                            return (
                                <button
                                    key={feature.key}
                                    onClick={() => setActiveFeature(feature.key)}
                                    className={`group relative p-4 rounded-xl text-left transition-all duration-300 border ${isActive
                                            ? "bg-white/5 border-primary/30 shadow-[0_0_20px_rgba(29,161,242,0.15)]"
                                            : "bg-surface/10 border-transparent hover:bg-white/5 hover:border-white/5"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <div className="relative flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/5 text-silver/50 group-hover:text-white"
                                            }`}>
                                            <span className="material-symbols-outlined">{feature.icon}</span>
                                        </div>
                                        <span className={`font-bold text-lg transition-colors ${isActive ? "text-white" : "text-silver/60 group-hover:text-silver"}`}>
                                            {t(`linkControlCenter.features.${feature.key}.title`)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Column: Content Display */}
                    <div className="lg:col-span-8">
                        <div className="relative h-full min-h-[400px] sm:min-h-[500px] rounded-3xl border border-white/10 bg-surface/20 backdrop-blur-sm overflow-hidden p-8 sm:p-12 flex flex-col justify-center items-start shadow-2xl">
                            {/* Background Grid inside Panel */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeFeature}
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 1.05, y: -10 }}
                                            transition={{ 
                                                type: "spring",
                                                stiffness: 100,
                                                damping: 20,
                                                opacity: { duration: 0.2 }
                                            }}
                                            className="relative z-10 w-full"
                                        >
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                                                    {t("common.live")}
                                                </span>
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                            </div>

                                            <h3 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                                                {t(`linkControlCenter.features.${activeFeature}.title`)}
                                            </h3>

                                            <p className="text-xl sm:text-2xl text-silver/70 leading-relaxed max-w-3xl mb-8">
                                                {t(`linkControlCenter.features.${activeFeature}.desc`)}
                                            </p>

                                            <div className="flex flex-wrap gap-4 items-center">
                                                <a 
                                                    href="/features" 
                                                    className="px-8 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-all flex items-center gap-3 group shadow-[0_0_30px_rgba(29,161,242,0.3)] hover:shadow-primary/50"
                                                >
                                                    <span>{t("nav.features")}</span>
                                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                                                        arrow_forward
                                                    </span>
                                                </a>
                                                <button className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold transition-all backdrop-blur-md">
                                                    {t("common.techSupport")}
                                                </button>
                                            </div>

                                            {/* Technical Detail Decoration */}
                                            <div className="mt-12 pt-8 border-t border-white/5 grid sm:grid-cols-2 gap-8">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined text-sm">terminal</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-primary uppercase mb-1">Response Time</p>
                                                        <p className="text-lg font-mono text-white/60">~ <span className="text-white">45ms</span></p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                                                        <span className="material-symbols-outlined text-sm">verified_user</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-green-500 uppercase mb-1">Encryption</p>
                                                        <p className="text-lg font-mono text-white/60">AES-256-<span className="text-white">GCM</span></p>
                                                    </div>
                                                </div>
                                            </div>

                                        </motion.div>
                                    </AnimatePresence>

                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                                <span className="material-symbols-outlined text-9xl text-white">
                                    {features.find(f => f.key === activeFeature)?.icon}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
