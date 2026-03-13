import React, { useEffect } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage } from "./types";

interface DesignSettingsProps {
  currentPage: LinkPage;
  handleUpdatePage: (field: string, value: any) => void;
}

const DesignSettings: React.FC<DesignSettingsProps> = ({
  currentPage,
  handleUpdatePage,
}) => {
  const { t } = useTranslation();

  // Forzar Blur si la plantilla es retrato (Imagen Completa)
  useEffect(() => {
    if (currentPage.template === "full" && currentPage.theme.backgroundType !== "blur") {
      handleUpdatePage("theme.backgroundType", "blur");
    }
  }, [currentPage.template, currentPage.theme.backgroundType, handleUpdatePage]);

  const isPortrait = currentPage.template === "full";

  return (
    <section className="space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">palette</span>
        {t("dashboard.links.designTemplate")}
      </h3>
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 space-y-8">
        <div className="flex gap-4">
          <button
            disabled={isPortrait}
            onClick={() => handleUpdatePage("theme.backgroundType", "solid")}
            title={isPortrait ? "No disponible con Imagen Completa" : ""}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              isPortrait
                ? "opacity-30 cursor-not-allowed bg-white/5 text-silver/40"
                : currentPage.theme.backgroundType === "solid"
                ? "bg-primary text-white"
                : "bg-white/5 text-silver/40 hover:bg-white/10"
            }`}
          >
            {t("dashboard.links.solid", { defaultValue: "Sólido" })}
          </button>
          <button
            disabled={isPortrait}
            onClick={() => handleUpdatePage("theme.backgroundType", "gradient")}
            title={isPortrait ? "No disponible con Imagen Completa" : ""}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              isPortrait
                ? "opacity-30 cursor-not-allowed bg-white/5 text-silver/40"
                : currentPage.theme.backgroundType === "gradient"
                ? "bg-primary text-white"
                : "bg-white/5 text-silver/40 hover:bg-white/10"
            }`}
          >
            {t("dashboard.links.gradient", { defaultValue: "Degradado" })}
          </button>
          <button
            onClick={() => handleUpdatePage("theme.backgroundType", "blur")}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPage.theme.backgroundType === "blur"
                ? "bg-primary text-white"
                : "bg-white/5 text-silver/40"
            }`}
          >
            Blur
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-silver/40 uppercase">
              {t("dashboard.links.startColor")}
            </label>
            <input
              type="color"
              value={currentPage.theme.backgroundStart}
              onChange={(e) => handleUpdatePage("theme.backgroundStart", e.target.value)}
              className="w-full h-12 rounded-xl bg-black/40 border-none cursor-pointer"
            />
          </div>
          {currentPage.theme.backgroundType === "gradient" && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-silver/40 uppercase">
                {t("dashboard.links.endColor")}
              </label>
              <input
                type="color"
                value={currentPage.theme.backgroundEnd}
                onChange={(e) => handleUpdatePage("theme.backgroundEnd", e.target.value)}
                className="w-full h-12 rounded-xl bg-black/40 border-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DesignSettings;
