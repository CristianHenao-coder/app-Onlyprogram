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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1" data-reveal>
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_rgba(29,161,242,0.15)]">
                            <span className="material-symbols-outlined text-4xl">link</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">{t("featuresPage.links.title")}</h2>
                        <p className="text-xl text-silver/60 leading-relaxed mb-8">
                            {t("featuresPage.links.desc")}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-6 mb-10">
                            {[
                                { icon: 'deployed_code', text: 'Rutas Dinámicas' },
                                { icon: 'domain', text: 'Wildcard Domains' },
                                { icon: 'palette', text: 'Custom UI Engine' },
                                { icon: 'lock', text: 'Tokenized Access' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-silver/80">
                                    <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                                    <span className="font-bold">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 relative group" data-reveal>
                        <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
                        <div className="relative rounded-[2rem] border border-white/10 bg-surface/40 backdrop-blur-3xl p-6 overflow-hidden shadow-2xl shadow-primary/20 transform group-hover:scale-[1.02] transition-transform duration-500">
                             {/* Mini Panel Preview */}
                             <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                    </div>
                                    <div className="text-[10px] text-silver/30 font-mono tracking-widest uppercase">Editor de Enlaces v2.0</div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="h-12 bg-white/5 rounded-lg border border-white/5 flex items-center px-4 gap-3 animate-pulse">
                                        <div className="w-8 h-8 rounded-md bg-primary/20" />
                                        <div className="h-3 w-1/2 bg-white/10 rounded" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-20 bg-primary/10 rounded-xl border border-primary/20" />
                                        <div className="h-20 bg-white/5 rounded-xl border border-white/5" />
                                    </div>
                                    <div className="hidden sm:block space-y-2">
                                        <div className="h-2 w-full bg-white/5 rounded" />
                                        <div className="h-2 w-4/5 bg-white/5 rounded" />
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 2. Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-1 relative group" data-reveal>
                         <div className="absolute inset-0 bg-purple-500/20 blur-[120px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
                         <div className="relative rounded-[2rem] border border-white/10 bg-surface/40 backdrop-blur-3xl p-6 overflow-hidden shadow-2xl shadow-purple-500/20 transform group-hover:scale-[1.02] transition-transform duration-500">
                             <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Real-time Traffic Monitor</div>
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-end gap-1 h-32 mb-6">
                                        {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60].map((h, i) => (
                                            <div key={i} className="flex-1 bg-gradient-to-t from-purple-500/50 to-purple-400 rounded-t-sm" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-1 bg-white/10 rounded" />
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                    <div className="order-2" data-reveal>
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                            <span className="material-symbols-outlined text-4xl">analytics</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">{t("featuresPage.analytics.title")}</h2>
                        <p className="text-xl text-silver/60 leading-relaxed mb-8">
                            {t("featuresPage.analytics.desc")}
                        </p>
                         <div className="grid sm:grid-cols-2 gap-6 mb-10">
                            {[
                                { icon: 'location_on', text: 'Geo-Fencing' },
                                { icon: 'devices', text: 'Device Fingerprint' },
                                { icon: 'query_stats', text: 'Conversion Rate' },
                                { icon: 'history', text: 'Behavioral Logs' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-silver/80">
                                    <span className="material-symbols-outlined text-purple-400 text-xl">{item.icon}</span>
                                    <span className="font-bold">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Telegram */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1" data-reveal>
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                            <span className="material-symbols-outlined text-4xl">send</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">{t("featuresPage.telegram.title")}</h2>
                        <p className="text-xl text-silver/60 leading-relaxed mb-8">
                            {t("featuresPage.telegram.desc")}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-6 mb-10">
                            {[
                                { icon: 'autorenew', text: 'Smart Rotation' },
                                { icon: 'verified', text: 'Anti-Ban Engine' },
                                { icon: 'group', text: 'Channel Manager' },
                                { icon: 'api', text: 'Webhooks Integration' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-silver/80">
                                    <span className="material-symbols-outlined text-blue-400 text-xl">{item.icon}</span>
                                    <span className="font-bold">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 relative group" data-reveal>
                        <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
                         <div className="relative rounded-[2rem] border border-white/10 bg-surface/40 backdrop-blur-3xl p-6 overflow-hidden shadow-2xl shadow-blue-500/20 transform group-hover:scale-[1.02] transition-transform duration-500">
                             <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Rotator Configuration</div>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xs text-blue-400">group</span>
                                            </div>
                                            <div className="h-2 w-20 bg-white/20 rounded" />
                                        </div>
                                        <div className="w-8 h-4 bg-blue-500/30 rounded-full" />
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xs text-blue-400">group</span>
                                            </div>
                                            <div className="h-2 w-24 bg-white/20 rounded" />
                                        </div>
                                        <div className="w-8 h-4 bg-white/10 rounded-full" />
                                    </div>
                                </div>
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
