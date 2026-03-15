import React from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { ButtonLink, SocialType } from "./types";

interface ButtonEditorFieldsProps {
  selectedButton: ButtonLink;
  setSelectedButtonId: (id: string | null) => void;
  handleUpdateButton: (field: string, value: any) => void;
  urlError: string | null;
  setUrlError: (error: string | null) => void;
  isValidUrl: (url: string) => boolean;
  SOCIAL_PRESETS: Record<SocialType, any>;
}

const ButtonEditorFields: React.FC<ButtonEditorFieldsProps> = ({
  selectedButton,
  setSelectedButtonId,
  handleUpdateButton,
  urlError,
  setUrlError,
  isValidUrl,
  SOCIAL_PRESETS,
}) => {
  const { t } = useTranslation();

  return (
    <div className="animate-slide-up space-y-8">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white">
            {SOCIAL_PRESETS[selectedButton.type].icon}
          </div>
          <div>
            <h2 className="text-lg font-bold">{t("dashboard.links.editButton")}</h2>
            <p className="text-[10px] text-silver/40 uppercase font-bold tracking-wider">
              {selectedButton.type}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSelectedButtonId(null)}
          className="p-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
        >
          {t("common.saveAndClose")}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
              {t("dashboard.links.title")}
            </label>
            <input
              type="text"
              value={selectedButton.title}
              onChange={(e) => handleUpdateButton("title", e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
              {t("dashboard.links.mainUrl")}
            </label>
            <div className="flex items-center bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="material-symbols-outlined text-silver/20 mr-2 text-lg">link</span>
              <input
                type="text"
                value={selectedButton.url}
                onChange={(e) => {
                  handleUpdateButton("url", e.target.value);
                  setUrlError(null);
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (!val) setUrlError("La URL es obligatoria.");
                  else if (!isValidUrl(val)) setUrlError("URL no válida.");
                  else setUrlError(null);
                }}
                className={`flex-1 bg-transparent text-sm font-mono focus:outline-none ${
                  urlError ? "text-red-400" : "text-silver"
                }`}
                placeholder={SOCIAL_PRESETS[selectedButton.type].placeholder || "https://..."}
              />
            </div>
            {urlError && (
              <p className="text-xs text-red-400 font-medium flex items-center gap-1 mt-1 ml-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {urlError}
              </p>
            )}
          </div>
        </div>

        {/* APPEARANCE */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">palette</span>
            {t("dashboard.links.appearance")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                {t("dashboard.links.background")}
              </label>
              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                <input
                  type="color"
                  value={selectedButton.color}
                  onChange={(e) => handleUpdateButton("color", e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <span className="text-[10px] font-mono text-silver/50 uppercase">
                  {selectedButton.color}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                {t("dashboard.links.textLabel")}
              </label>
              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                <input
                  type="color"
                  value={selectedButton.textColor || "#FFFFFF"}
                  onChange={(e) => handleUpdateButton("textColor", e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <span className="text-[10px] font-mono text-silver/50 uppercase">
                  {selectedButton.textColor || "#FFFFFF"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TARGETING */}
        <div className="space-y-5 pt-8 border-t border-white/5 mb-8">
          <div className="flex items-center justify-between bg-black/40 rounded-3xl p-4 sm:p-5 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <span className="material-symbols-outlined text-2xl text-indigo-400">auto_awesome</span>
              </div>
              <div>
                <h3 className="text-[17px] font-black tracking-tight text-white/95">Smart Targeting</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-silver/50 tracking-widest uppercase">IA DE DETECCIÓN ACTIVA</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex border border-white/5 bg-white/5 px-4 py-1.5 rounded-full">
              <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">Segmentación Inteligente</span>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-silver/50 font-medium px-1 mb-6">
            Cuando alguien haga clic en tu botón {selectedButton.title ? `de "${selectedButton.title}"` : ""}, nuestra IA detectará si su teléfono es una joya o algo más sencillo para enviarlos al link correcto.
          </p>

          <div className="space-y-4">
            {/* GAMA ALTA */}
            <div className="bg-[#0c0c0c] border border-amber-500/10 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none rounded-full"></div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px] text-amber-500 shadow-amber-500/20 drop-shadow-md text-amber-500">diamond</span>
                </div>
                <div>
                  <h4 className="text-[12px] font-black tracking-wide text-amber-500 uppercase">
                    💎 Si su teléfono es una joya (Gama Alta)
                  </h4>
                  <p className="text-[9px] font-bold tracking-widest text-silver/40 uppercase mt-0.5">
                    Los que tienen el último iPhone o Samsung Ultra
                  </p>
                </div>
              </div>
              
              <input
                type="url"
                value={selectedButton.deviceRedirects?.ios || ""}
                onChange={(e) =>
                  handleUpdateButton("deviceRedirects", {
                    ...selectedButton.deviceRedirects,
                    ios: e.target.value,
                  })
                }
                placeholder="Link para los clientes VIP..."
                className="w-full bg-[#050505] border border-white/5 hover:border-amber-500/20 transition-colors rounded-xl px-4 py-4 text-[13px] font-mono text-silver focus:outline-none focus:border-amber-500/40"
              />
            </div>

            {/* GAMA ESTANDAR */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center opacity-80">
                  <span className="material-symbols-outlined text-[20px] text-silver/70">smartphone</span>
                </div>
                <div>
                  <h4 className="text-[12px] font-black tracking-wide text-silver/80 uppercase">
                    📱 Si es un teléfono normal (Gama Estándar)
                  </h4>
                  <p className="text-[9px] font-bold tracking-widest text-silver/40 uppercase mt-0.5">
                    Teléfonos sencillos o modelos antiguos
                  </p>
                </div>
              </div>
              
              <input
                type="url"
                value={selectedButton.deviceRedirects?.android || ""}
                onChange={(e) =>
                  handleUpdateButton("deviceRedirects", {
                    ...selectedButton.deviceRedirects,
                    android: e.target.value,
                  })
                }
                placeholder="Link para el resto de la gente..."
                className="w-full bg-[#050505] border border-white/5 hover:border-white/10 transition-colors rounded-xl px-4 py-4 text-[13px] font-mono text-silver focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonEditorFields;
