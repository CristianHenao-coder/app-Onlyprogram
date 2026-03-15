// ─── PAGE CONFIG PANEL ──────────────────────────────────────────────────────
// Handles all page-level settings: profile photo, name, background theme,
// security shields (Meta/TikTok), geo-blocking, direct URL, and landing mode.

import { useRef } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import type { LinkPage } from "./types";

interface PageConfigPanelProps {
  currentPage: LinkPage;
  folders: string[];
  onUpdatePage: (field: string, value: any) => void;
}

export function PageConfigPanel({ currentPage, folders, onUpdatePage }: PageConfigPanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdatePage("profileImage", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isDirect = (currentPage.landingMode as string) === "direct";
  const isDual = currentPage.landingMode === "dual";
  const isTikTokOnly = (currentPage.landingMode as string) === "circle";

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <h2 className="text-xl font-bold">
          {t("dashboard.links.pageConfigTitle", { defaultValue: "Configuración de la Página" })}
        </h2>
      </div>

      <div className="space-y-8">
        {/* ── MAIN SECTION ── */}
        <section className={`rounded-2xl overflow-hidden transition-all duration-500 ${
          isDual
            ? "bg-purple-900/10 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]"
            : "bg-white/5 border border-white/10"
        }`}>

          {/* SECURITY SHIELDS - Solo TikTok only */}
          {isTikTokOnly && (
            <div className="p-6 bg-black/20 border-b border-white/5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-base text-orange-500">verified_user</span>
                Seguridad y Protección Avanzada
                <span className="text-[8px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30 font-black">PRO</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Meta Shield */}
                <div className={`p-4 rounded-2xl border transition-all ${currentPage.metaShield ? "bg-orange-500/5 border-orange-500/30" : "bg-white/5 border-white/5 opacity-60"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-orange-400">
                      <span className="material-symbols-outlined text-lg">shield</span>
                      <span className="text-xs font-bold">Escudo Meta</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentPage.metaShield || false}
                        onChange={(e) => onUpdatePage("metaShield", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  <p className="text-[10px] text-silver/40 leading-relaxed">
                    Protección anti-baneo para Instagram y Facebook con sistema de cloaking.
                  </p>
                </div>
                {/* TikTok Shield - hidden for circle (Solo TikTok) since it's always integrated */}
                {/* (intentionally hidden for isTikTokOnly, shown for dual/other modes in other panels) */}
              </div>
            </div>
          )}

          {/* Section Header */}
          <div className={`p-4 border-b transition-all duration-500 ${
            isDual ? "border-purple-500/20 bg-gradient-to-r from-purple-500/20 to-transparent" : "border-white/5 bg-white/[0.02]"
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDual ? "text-white" : ""}`}>
              <span className={`material-symbols-outlined ${isDual ? "text-purple-400" : "text-silver/40"}`}>
                {isDirect ? "settings" : "person"}
              </span>
              {isDirect ? "Configuración del Enlace Directo" : t("dashboard.links.profileIdentity")}
              {isDual && (
                <span className="ml-auto text-[9px] font-black bg-white/10 text-silver px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">Premium Dual</span>
              )}
            </h3>
          </div>

          <div className="p-6">
            {/* Folder */}
            <div className="mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-silver/40 uppercase pl-1">
                  {t("dashboard.links.folderProject")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-silver/20 text-lg">folder</span>
                  <input
                    type="text"
                    value={currentPage.folder || ""}
                    onChange={(e) => onUpdatePage("folder", e.target.value)}
                    placeholder={t("dashboard.links.folderPlaceholder")}
                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary placeholder:text-silver/20"
                    list="folder-suggestions"
                  />
                  <datalist id="folder-suggestions">
                    {folders.map((f) => <option key={f} value={f} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Landing Mode Selector (hidden for Direct mode) */}
            {!isDirect && (
              <div className="mb-6 flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">{t("dashboard.links.landingMode")}</span>
                  <span className="text-[10px] text-silver/40">{t("dashboard.links.landingModeDesc")}</span>
                </div>
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => {
                      onUpdatePage("template", "minimal");
                      onUpdatePage("profileImageSize", 100);
                      const isSpecial = ["dual", "direct", "circle", "tiktok"].includes(currentPage.landingMode || "");
                      if (!isSpecial) onUpdatePage("landingMode", "circle");
                    }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                      currentPage.template === "minimal" || (currentPage.landingMode === "circle" && currentPage.template !== "full")
                        ? "bg-white text-black shadow-lg" : "text-silver/60 hover:text-white"
                    }`}
                  >
                    Diseño Minimal
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePage("template", "full");
                      onUpdatePage("profileImageSize", 100);
                      onUpdatePage("theme.backgroundType", "blur");
                      const isSpecial = ["dual", "direct", "circle", "tiktok"].includes(currentPage.landingMode || "");
                      if (!isSpecial) onUpdatePage("landingMode", "full");
                    }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                      currentPage.template === "full" ? "bg-primary text-white shadow-lg" : "text-silver/60 hover:text-white"
                    }`}
                  >
                    Diseño Full
                  </button>
                </div>
              </div>
            )}

            {/* Direct Mode */}
            {isDirect ? (
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl animate-fade-in text-center">
                {/* Model name */}
                <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl text-left max-w-lg mx-auto">
                  <label className="text-[10px] font-bold text-silver/40 uppercase pl-1 block mb-2">
                    {t("dashboard.links.modelNameLabel")}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-silver/20 text-lg">person</span>
                    <input
                      type="text"
                      value={currentPage.modelName || ""}
                      onChange={(e) => onUpdatePage("modelName", e.target.value)}
                      placeholder={t("dashboard.links.modelNamePlaceholder")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary placeholder:text-silver/20 transition-all"
                    />
                  </div>
                </div>
                <span className="material-symbols-outlined text-4xl text-red-500 mb-4 block animate-bounce-subtle">rocket_launch</span>
                <h3 className="text-lg font-bold text-white mb-2">Modo Escudo Directo Activado</h3>
                <p className="text-sm text-silver/60 mb-6 max-w-md mx-auto">
                  En este modo, al hacer clic desde Instagram o Facebook, el escudo se activará y el usuario será{" "}
                  <b>redirigido automáticamente</b> al enlace que ingreses abajo.
                </p>
                <div className="space-y-2 max-w-lg mx-auto text-left">
                  <label className="text-[10px] font-bold text-red-400 uppercase pl-1">
                    URL de Destino Final (OnlyFans / Telegram, etc.)
                  </label>
                  <input
                    type="url"
                    placeholder="https://onlyfans.com/tu_perfil"
                    value={currentPage.directUrl || ""}
                    onChange={(e) => onUpdatePage("directUrl", e.target.value)}
                    className="w-full bg-[#050505] border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all placeholder:text-silver/20"
                  />
                </div>
                {/* Smart Targeting for Direct Mode */}
                <div className="mt-8 pt-8 border-t border-red-500/10 max-w-lg mx-auto text-left">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-sm text-red-400">query_stats</span>
                    Smart Targeting (Opcional)
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver/40 uppercase pl-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px] text-yellow-500">diamond</span>
                        Link para Teléfono Moderno (Gama Alta)
                      </label>
                      <input
                        type="url"
                        placeholder="https://onlyfans.com/link_para_gama_alta"
                        value={currentPage.security_config?.device_redirections?.ios || ""}
                        onChange={(e) => {
                          const c = currentPage.security_config || {};
                          onUpdatePage("security_config", { ...c, device_redirections: { ...(c.device_redirections || {}), ios: e.target.value } });
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-silver focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-silver/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-silver/40 uppercase pl-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">smartphone</span>
                        Link para Teléfono Básico
                      </label>
                      <input
                        type="url"
                        placeholder="https://onlyfans.com/link_para_gama_basica"
                        value={currentPage.security_config?.device_redirections?.desktop || ""}
                        onChange={(e) => {
                          const c = currentPage.security_config || {};
                          onUpdatePage("security_config", { ...c, device_redirections: { ...(c.device_redirections || {}), android: e.target.value, desktop: e.target.value } });
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-silver focus:outline-none focus:border-white/20 transition-all placeholder:text-silver/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Landing / Dual modes */
              <div className="space-y-8">
                {/* Dual Mode: direct URL input */}
                {isDual && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/40 mb-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
                    <div className="flex items-center gap-2 text-white mb-4 relative z-10">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      </div>
                      <span className="text-xs font-black uppercase tracking-tighter">Enlace Directo (IG/FB)</span>
                      <span className="ml-auto text-[8px] text-silver/40 border border-white/10 px-1.5 py-0.5 rounded">MODO DIRECTO ACTIVADO</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-silver/40 uppercase pl-1">
                        URL para tráfico de Instagram / Facebook
                      </label>
                      <input
                        type="url"
                        placeholder="https://onlyfans.com/tu_perfil"
                        value={currentPage.directUrl || ""}
                        onChange={(e) => onUpdatePage("directUrl", e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-silver/20"
                      />
                      <p className="text-[10px] text-silver/30 pl-1">Esta URL se usará cuando el sistema detecte que el usuario viene de Instagram o Facebook.</p>
                    </div>
                  </div>
                )}

                {/* Profile Photo & Name */}
                <div className="flex gap-6 items-start">
                  <div className="space-y-3 shrink-0">
                    <div
                      className="group relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 hover:border-primary transition-colors"
                      style={{ backgroundColor: currentPage.theme.backgroundStart }}
                    >
                      <img src={currentPage.profileImage} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-white text-sm mb-1">upload</span>
                        <span className="text-[8px] text-white font-bold uppercase">{t("common.change")}</span>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept="image/*"
                      />
                    </div>
                    <div className="space-y-1 w-24">
                      <label className="text-[8px] font-bold text-silver/40 uppercase block text-center">
                        {t("dashboard.links.size")} ({currentPage.profileImageSize || 100}px)
                      </label>
                      <input
                        type="range" min="50" max="150"
                        value={currentPage.profileImageSize || 100}
                        onChange={(e) => onUpdatePage("profileImageSize", parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-silver/40 uppercase pl-1">{t("dashboard.links.visibleName")}</label>
                      <input
                        type="text"
                        value={currentPage.profileName}
                        onChange={(e) => { onUpdatePage("profileName", e.target.value); onUpdatePage("name", e.target.value); }}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Background */}
                {!isDirect && (
                  <div className="pt-6 mt-6 border-t border-white/5">
                    <label className="text-[10px] font-bold text-silver/40 uppercase mb-3 block">
                      {t("dashboard.links.pageBackground")}
                    </label>
                    <div className="flex gap-4 mb-4">
                      {currentPage.landingMode === "full" ? (
                        <div className="flex items-center gap-3">
                          <div className="flex bg-[#0B0B0B] border border-border p-1 rounded-xl w-fit opacity-40 pointer-events-none select-none">
                            <button disabled className="px-6 py-2 text-[10px] font-bold rounded-lg text-silver/30 cursor-not-allowed">{t("dashboard.links.solid")}</button>
                            <button disabled className="px-6 py-2 text-[10px] font-bold rounded-lg text-silver/30 cursor-not-allowed">{t("dashboard.links.gradient")}</button>
                            <button disabled className="px-6 py-2 text-[10px] font-bold rounded-lg bg-primary/80 text-white shadow-lg rounded-lg cursor-not-allowed">{t("dashboard.links.blurPhoto")}</button>
                          </div>
                          <span className="text-[10px] text-primary/80 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">lock</span>
                            Blur obligatorio en modo Full
                          </span>
                        </div>
                      ) : (
                        <div className="flex bg-[#0B0B0B] border border-border p-1 rounded-xl w-fit">
                          {(["solid", "gradient", "blur"] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => onUpdatePage("theme.backgroundType", type)}
                              className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === type ? "bg-white/10 border border-white/10 text-white" : "text-silver/40 hover:text-white"}`}
                            >
                              {type === "solid" ? t("dashboard.links.solid") : type === "gradient" ? t("dashboard.links.gradient") : t("dashboard.links.blurPhoto")}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {currentPage.theme.backgroundType === "solid" && (
                      <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                        <input type="color" value={currentPage.theme.backgroundStart}
                          onChange={(e) => onUpdatePage("theme.backgroundStart", e.target.value)}
                          className="h-10 w-10 rounded-lg cursor-pointer border-none bg-transparent" />
                        <span className="text-xs font-mono text-silver/50 uppercase">{currentPage.theme.backgroundStart}</span>
                      </div>
                    )}
                    {currentPage.theme.backgroundType === "gradient" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                          <p className="text-[9px] text-silver/30 font-bold uppercase mb-2">Inicio</p>
                          <input type="color" value={currentPage.theme.backgroundStart}
                            onChange={(e) => onUpdatePage("theme.backgroundStart", e.target.value)}
                            className="h-10 w-full rounded-lg cursor-pointer border-none bg-transparent" />
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                          <p className="text-[9px] text-silver/30 font-bold uppercase mb-2">Fin</p>
                          <input type="color" value={currentPage.theme.backgroundEnd}
                            onChange={(e) => onUpdatePage("theme.backgroundEnd", e.target.value)}
                            className="h-10 w-full rounded-lg cursor-pointer border-none bg-transparent" />
                        </div>
                      </div>
                    )}
                    {currentPage.theme.backgroundType === "blur" && (
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <span className="material-symbols-outlined text-silver/40">blur_on</span>
                        <p className="text-[10px] text-silver/50">{t("dashboard.links.blurPhotoDesc")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── SECURITY & INTELLIGENCE SECTION ── */}
        <section className="bg-white/5 border border-primary/20 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.05)] mt-8">
          <div className="p-4 border-b border-primary/10 bg-primary/5">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-primary">shield</span>
              Seguridad e Inteligencia Predictiva
            </h3>
          </div>
          <div className="p-6 space-y-8">
            {/* Geo-blocking */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white mb-1">Geofiltering: Bloqueo de Países</h4>
                <p className="text-[10px] text-silver/40">Bloquea el acceso a este link desde países específicos.</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {(currentPage.security_config?.geoblocking || []).map((code: string) => (
                  <div key={code} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-black text-red-100 uppercase">{code}</span>
                    <button
                      onClick={() => {
                        const current = currentPage.security_config?.geoblocking || [];
                        onUpdatePage("security_config", { ...currentPage.security_config, geoblocking: current.filter((c: string) => c !== code) });
                      }}
                      className="material-symbols-outlined text-sm text-red-500 hover:text-red-400 transition-colors"
                    >close</button>
                  </div>
                ))}
                {(!currentPage.security_config?.geoblocking || currentPage.security_config.geoblocking.length === 0) && (
                  <p className="text-[10px] text-silver/20 italic">No hay países bloqueados. Acceso global permitido.</p>
                )}
              </div>
              <select
                onChange={(e) => {
                  if (!e.target.value) return;
                  const current = currentPage.security_config?.geoblocking || [];
                  if (current.includes(e.target.value)) return;
                  onUpdatePage("security_config", { ...currentPage.security_config, geoblocking: [...current, e.target.value] });
                  e.target.value = "";
                }}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-silver focus:outline-none focus:border-red-500/50"
              >
                <option value="">+ Añadir país a la lista negra (ISO)...</option>
                <option value="US">US - Estados Unidos</option>
                <option value="CO">CO - Colombia</option>
                <option value="ES">ES - España</option>
                <option value="MX">MX - México</option>
                <option value="AR">AR - Argentina</option>
                <option value="BR">BR - Brasil</option>
                <option value="CL">CL - Chile</option>
                <option value="PE">PE - Perú</option>
                <option value="VE">VE - Venezuela</option>
                <option value="RU">RU - Rusia</option>
                <option value="CN">CN - China</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
