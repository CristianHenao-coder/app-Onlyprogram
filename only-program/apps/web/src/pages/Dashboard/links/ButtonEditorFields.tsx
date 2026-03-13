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
        <div className="space-y-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-indigo-400">
            <span className="material-symbols-outlined text-xl">devices</span>
            <span className="text-sm font-bold tracking-tight">
              Smart Redirect (Device targeting)
            </span>
          </div>
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-silver/30 mt-0.5">
                iOS
              </label>
              <input
                type="url"
                value={selectedButton.deviceRedirects?.ios || ""}
                onChange={(e) =>
                  handleUpdateButton("deviceRedirects", {
                    ...selectedButton.deviceRedirects,
                    ios: e.target.value,
                  })
                }
                className="w-full bg-[#030303] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-silver focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-silver/30 mt-1">
                Android
              </label>
              <input
                type="url"
                value={selectedButton.deviceRedirects?.android || ""}
                onChange={(e) =>
                  handleUpdateButton("deviceRedirects", {
                    ...selectedButton.deviceRedirects,
                    android: e.target.value,
                  })
                }
                className="w-full bg-[#030303] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-silver focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonEditorFields;
