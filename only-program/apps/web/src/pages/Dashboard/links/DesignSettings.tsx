import React from "react";
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

  return (
    <section className="space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">palette</span>
        {t("dashboard.links.designTemplate")}
      </h3>
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 space-y-8">
        <div className="flex gap-4">
          <button
            onClick={() => handleUpdatePage("theme.backgroundType", "solid")}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPage.theme.backgroundType === "solid"
                ? "bg-primary text-white"
                : "bg-white/5 text-silver/40"
            }`}
          >
            {t("dashboard.links.solid")}
          </button>
          <button
            onClick={() => handleUpdatePage("theme.backgroundType", "gradient")}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              currentPage.theme.backgroundType === "gradient"
                ? "bg-primary text-white"
                : "bg-white/5 text-silver/40"
            }`}
          >
            {t("dashboard.links.gradient")}
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
