import React from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage } from "./types";

interface ProfileSettingsProps {
  currentPage: LinkPage;
  handleUpdatePage: (field: string, value: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving?: boolean;
  handleSyncButtons?: () => Promise<void>;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  currentPage,
  handleUpdatePage,
  fileInputRef,
  handleImageUpload,
  isSaving,
  handleSyncButtons,
}) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">account_circle</span>
        {t("dashboard.links.profileDetails")}
      </h3>
      <div className="p-8 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 space-y-8">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6 w-full md:w-auto">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white/5 overflow-hidden bg-white/5 shadow-2xl transition-all group-hover:scale-105">
                <img src={currentPage.profileImage} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white rounded-full"
              >
                <span className="material-symbols-outlined">upload</span>
                <span className="text-[10px] font-bold mt-1 uppercase">Cambiar</span>
              </button>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full md:w-auto px-6 py-3 bg-primary/10 border border-primary/20 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              {t("dashboard.links.uploadPhoto")}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Settings Section */}
          <div className="flex-1 w-full space-y-8">
            {/* Template Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-silver/40 uppercase pl-1 tracking-[0.2em]">
                Diseño de Imagen
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleUpdatePage("template", "minimal")}
                  className={`relative group p-4 rounded-3xl border transition-all ${
                    currentPage.template === "minimal"
                      ? "bg-primary/20 border-primary/40 shadow-[0_0_30px_rgba(29,161,242,0.1)]"
                      : "bg-white/[0.02] border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-white/20" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                      Minimalista
                    </span>
                  </div>
                  {currentPage.template === "minimal" && (
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#1da1f2]" />
                  )}
                </button>

                <button
                  onClick={() => handleUpdatePage("template", "full")}
                  className={`relative group p-4 rounded-3xl border transition-all ${
                    currentPage.template === "full"
                      ? "bg-primary/20 border-primary/40 shadow-[0_0_30px_rgba(29,161,242,0.1)]"
                      : "bg-white/[0.02] border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border-2 border-dashed border-white/20 overflow-hidden">
                      <div className="w-full h-full bg-white/10" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                      Imagen Completa
                    </span>
                  </div>
                  {currentPage.template === "full" && (
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#1da1f2]" />
                  )}
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-silver/40 uppercase pl-1 tracking-[0.2em]">
                {t("dashboard.links.visibleName")}
              </label>
              <input
                type="text"
                value={currentPage.profileName}
                onChange={(e) => {
                  handleUpdatePage("profileName", e.target.value);
                  handleUpdatePage("name", e.target.value);
                }}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 transition-all placeholder:text-white/10"
                placeholder="Escribe el nombre visible..."
              />
            </div>
            
            {/* Image Size */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-silver/40 uppercase pl-1 tracking-[0.2em]">
                {t("dashboard.links.imageSize")}
              </label>
              <div className="px-1">
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={currentPage.profileImageSize || 100}
                  onChange={(e) => handleUpdatePage("profileImageSize", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-[9px] font-bold text-silver/30 uppercase tracking-[0.2em]">
                  <span>Pequeño</span>
                  <span>Normal</span>
                  <span>Grande</span>
                </div>
              </div>
            </div>
            {/* Save Button for Active Links */}
            {currentPage.dbStatus && (
              <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                 <button
                   onClick={() => handleSyncButtons?.()}
                   disabled={isSaving}
                   className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                     isSaving 
                       ? "bg-white/5 text-silver/40 cursor-wait" 
                       : "bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-primary/20"
                   }`}
                 >
                   <span className="material-symbols-outlined">
                     {isSaving ? "sync" : "save_as"}
                   </span>
                   <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
                 </button>
                 <p className="text-[10px] text-silver/30 font-bold uppercase tracking-widest text-center max-w-[200px]">
                   Pulsa aquí para sincronizar tus botones y diseño con la red.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileSettings;
