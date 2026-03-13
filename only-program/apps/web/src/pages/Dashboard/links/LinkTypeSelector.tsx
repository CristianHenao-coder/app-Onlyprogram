// ─── LINK TYPE SELECTOR MODAL ────────────────────────────────────────────────
// Full-screen modal for choosing the type of new link to create:
// Direct (Meta Shield), Landing (Solo TikTok), or Pack Dual (both).

import { useTranslation } from "@/contexts/I18nContext";

interface LinkTypeSelectorProps {
  onConfirm: (type: "direct" | "landing" | "both") => void;
  onClose: () => void;
}

export function LinkTypeSelector({ onConfirm, onClose }: LinkTypeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl animate-scale-up overflow-hidden">
        {/* Decorative backgrounds */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 text-center mb-10">
          <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
            {t("dashboard.links.createLinkModalTitle")}
          </h3>
          <p className="text-silver/40 text-sm font-medium">
            {t("dashboard.links.createLinkModalSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Option 1: Direct (Meta Shield) */}
          <button
            onClick={() => onConfirm("direct")}
            className="group relative flex flex-col p-6 rounded-3xl bg-secondary/30 border border-white/5 hover:border-red-500/50 hover:bg-black transition-all text-left overflow-hidden h-full shadow-lg"
          >
            <div className="absolute top-4 right-4 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">
                {t("dashboard.links.directLinkPlatform")}
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-red-500">rocket_launch</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{t("dashboard.links.directLinkTitle")}</h4>
            <p className="text-silver/40 text-xs leading-relaxed mb-4">{t("dashboard.links.directLinkDesc")}</p>
          </button>

          {/* Option 2: Landing (Solo TikTok) */}
          <button
            onClick={() => onConfirm("landing")}
            className="group relative flex flex-col p-6 rounded-3xl bg-secondary/30 border border-white/5 hover:border-blue-500/50 hover:bg-black transition-all text-left overflow-hidden h-full shadow-lg"
          >
            <div className="absolute top-4 right-4 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                {t("dashboard.links.landingPagePlatform")}
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-blue-500">web</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{t("dashboard.links.landingPageTitle")}</h4>
            <p className="text-silver/40 text-xs leading-relaxed mb-4">{t("dashboard.links.landingPageDesc")}</p>
          </button>
        </div>

        {/* Option 3: Pack Dual */}
        <button
          onClick={() => onConfirm("both")}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.01] active:scale-[0.99] transition-all group shadow-[0_0_40px_rgba(147,51,234,0.3)] border-2 border-purple-400/50 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="material-symbols-outlined text-2xl text-white group-hover:rotate-12 transition-transform relative z-10">
            auto_awesome
          </span>
          <span className="font-black text-sm uppercase tracking-widest text-white relative z-10">
            {t("dashboard.links.createBothTitle")}
          </span>
        </button>

        <button
          onClick={onClose}
          className="mt-10 mx-auto block text-[10px] font-bold text-silver/30 uppercase tracking-widest hover:text-white transition-colors"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
