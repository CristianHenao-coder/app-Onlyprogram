// ─── BUTTON EDITOR PANEL ──────────────────────────────────────────────────────
// Full editor for a single button: title, URL, appearance, smart targeting,
// and the Telegram rotator feature.

import type { ButtonLink, FontType, SocialType, LinkPage } from "./types";
import { FONT_MAP } from "./constants";
import { useTranslation } from "@/contexts/I18nContext";
import { useModal } from "@/contexts/ModalContext";
import { useState } from "react";
import toast from "react-hot-toast";

interface ButtonEditorPanelProps {
  selectedButton: ButtonLink;
  currentPage: LinkPage;
  socialPresets: any;
  urlError: string | null;
  setUrlError: (v: string | null) => void;
  onUpdateButton: (field: keyof ButtonLink, value: any) => void;
  onUpdatePage: (field: string, value: any) => void;
  onUpdateRotatorLink: (index: number, val: string) => void;
  onClose: () => void;
}

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export function ButtonEditorPanel({
  selectedButton,
  currentPage,
  socialPresets,
  urlError,
  setUrlError,
  onUpdateButton,
  onUpdatePage,
  onUpdateRotatorLink,
  onClose,
}: ButtonEditorPanelProps) {
  const { t } = useTranslation();
  const { showConfirm } = useModal();

  return (
    <div className="animate-slide-up space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white">
            {socialPresets[selectedButton.type].icon}
          </div>
          <div>
            <h2 className="text-lg font-bold">{t("dashboard.links.editButton", { defaultValue: "Editar Botón" })}</h2>
            <p className="text-[10px] text-silver/40 uppercase font-bold tracking-wider">{selectedButton.type}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
        >
          {t("common.saveAndClose", { defaultValue: "Guardar y Cerrar" })}
        </button>
      </div>

      <div className="space-y-6">
        {/* Title & URL */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
              {t("dashboard.links.title")}
            </label>
            <input
              type="text"
              value={selectedButton.title}
              onChange={(e) => onUpdateButton("title", e.target.value)}
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
                onChange={(e) => { onUpdateButton("url", e.target.value); setUrlError(null); }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (!val) setUrlError("La URL es obligatoria para este botón.");
                  else if (!isValidUrl(val)) setUrlError("Debe ser una URL válida que empiece con https://");
                  else setUrlError(null);
                }}
                className={`flex-1 bg-transparent text-sm font-mono focus:outline-none ${urlError ? "text-red-400" : "text-silver"}`}
                placeholder={socialPresets[selectedButton.type].placeholder || "https://..."}
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

        {/* Appearance */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">palette</span>
            {t("dashboard.links.appearance", { defaultValue: "Apariencia" })}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                {t("dashboard.links.background", { defaultValue: "Fondo" })}
              </label>
              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                <input type="color" value={selectedButton.color}
                  onChange={(e) => onUpdateButton("color", e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent" />
                <span className="text-[10px] font-mono text-silver/50 uppercase">{selectedButton.color}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                {t("dashboard.links.textLabel", { defaultValue: "Texto" })}
              </label>
              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                <input type="color" value={selectedButton.textColor || "#FFFFFF"}
                  onChange={(e) => onUpdateButton("textColor", e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent" />
                <span className="text-[10px] font-mono text-silver/50 uppercase">{selectedButton.textColor || "#FFFFFF"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
              {t("dashboard.links.typography")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["sans", "serif", "mono", "display"] as FontType[]).map((font) => (
                <button key={font} onClick={() => onUpdateButton("font", font)}
                  className={`py-2 px-1 rounded-lg text-xs border transition-all ${selectedButton.font === font ? "bg-primary text-white border-primary" : "bg-black/20 text-silver/60 border-transparent hover:border-white/10"}`}>
                  <span className={FONT_MAP[font]}>Aa</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Targeting */}
        <div className="p-6 bg-gradient-to-b from-[#0e0e10] to-[#0a0a0b] border border-white/10 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-xl text-indigo-400">auto_awesome</span>
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-white/90">Smart Targeting</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] text-silver/30 font-bold uppercase tracking-widest">IA de Detección Activa</span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-[9px] font-black text-silver/40 uppercase tracking-tighter">Segmentación Inteligente</span>
            </div>
          </div>
          <p className="text-[11px] text-silver/40 leading-relaxed font-medium">
            Cuando alguien haga clic en tu botón de{" "}
            <span className="text-white font-bold">"{selectedButton.title}"</span>, nuestra IA detectará si su teléfono es una joya
            o algo más sencillo para enviarlos al link correcto.
          </p>
          <div className="grid grid-cols-1 gap-4 relative z-10">
            {/* High-End */}
            <div className="relative p-5 bg-black/40 border border-amber-500/10 rounded-[1.5rem] hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-amber-500">diamond</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">💎 Si su teléfono es una joya (Gama Alta)</span>
                  <span className="text-[8px] text-silver/30 font-bold uppercase">Los que tienen el último iPhone o Samsung Ultra</span>
                </div>
              </div>
              <input type="url" placeholder="Link para los clientes VIP..."
                value={selectedButton.deviceRedirects?.ios || ""}
                onChange={(e) => {
                  const current = selectedButton.deviceRedirects || { ios: "", android: "" };
                  onUpdateButton("deviceRedirects", { ...current, ios: e.target.value });
                }}
                className="w-full bg-[#030303] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-silver focus:outline-none focus:border-amber-500/40 transition-all font-mono placeholder:text-silver/20 shadow-inner"
              />
            </div>
            {/* Standard */}
            <div className="relative p-5 bg-black/40 border border-white/5 rounded-[1.5rem] hover:border-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-silver/50">smartphone</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-silver/60">📱 Si es un teléfono normal (Gama Estándar)</span>
                  <span className="text-[8px] text-silver/30 font-bold uppercase">Teléfonos sencillos o modelos antiguos</span>
                </div>
              </div>
              <input type="url" placeholder="Link para el resto de la gente..."
                value={selectedButton.deviceRedirects?.android || ""}
                onChange={(e) => {
                  const current = selectedButton.deviceRedirects || { ios: "", android: "" };
                  onUpdateButton("deviceRedirects", { ...current, android: e.target.value });
                }}
                className="w-full bg-[#030303] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-silver focus:outline-none focus:border-white/20 transition-all font-mono placeholder:text-silver/20 shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Telegram Rotator */}
        {selectedButton.type === "telegram" && (
          <div className="p-5 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-blue-500/20 rounded-2xl">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <span className="material-symbols-outlined">sync</span>
                  <span className="text-sm font-bold">{t("dashboard.links.activateRotator")}</span>
                </div>
                <p className="text-[10px] text-silver/50 max-w-[250px]">{t("dashboard.links.rotatorDesc")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedButton.rotatorActive || false}
                  onChange={async (e) => {
                    const isActivating = e.target.checked;
                    if (!isActivating && selectedButton.rotatorActive) {
                      const confirmed = await showConfirm({
                        title: t("dashboard.links.deactivateRotatorConfirmTitle", { defaultValue: "¿Desactivar Telegram Rotativo?" }),
                        message: t("dashboard.links.deactivateRotatorConfirmMsg", { defaultValue: "Al desactivar el rotador, se eliminarán las URLs 2-5. Solo se mantendrá la primera URL." }),
                        confirmText: t("common.yesDeactivate", { defaultValue: "Sí, Desactivar" }),
                        cancelText: t("common.cancel", { defaultValue: "Cancelar" }),
                      });
                      if (confirmed) {
                        onUpdateButton("rotatorLinks", [selectedButton.rotatorLinks?.[0] || "", "", "", "", ""]);
                        onUpdateButton("rotatorActive", false);
                        toast.success(t("dashboard.links.rotatorDeactivatedSuccess", { defaultValue: "Rotador desactivado. URLs 2-5 eliminadas." }));
                      }
                    } else {
                      onUpdateButton("rotatorActive", isActivating);
                      if (isActivating) {
                        toast.success(t("dashboard.links.rotatorActivatedSuccess", { defaultValue: "Telegram Rotativo activado. Ahora puedes agregar hasta 5 URLs." }));
                      }
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {selectedButton.rotatorActive && (
              <div className="space-y-3 animate-fade-in pl-1">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-blue-500/50 w-4 text-center">{idx + 1}</span>
                    <input
                      type="text"
                      placeholder={`Link alternativo #${idx + 1}`}
                      value={selectedButton.rotatorLinks?.[idx] || ""}
                      onChange={(e) => onUpdateRotatorLink(idx, e.target.value)}
                      className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none placeholder:text-silver/20"
                    />
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest block mb-1.5">Capacidad máx. por link</label>
                    <input type="number" min={1} placeholder="2000"
                      value={currentPage.telegramMaxCapacity || ""}
                      onChange={(e) => onUpdatePage("telegramMaxCapacity", Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none" />
                    <p className="text-[8px] text-silver/30 mt-1">Clicks antes de pasar al siguiente link</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest block mb-1.5">Rotar cada N clicks</label>
                    <input type="number" min={1} placeholder="1"
                      value={currentPage.telegramRotationLimit || ""}
                      onChange={(e) => onUpdatePage("telegramRotationLimit", Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none" />
                    <p className="text-[8px] text-silver/30 mt-1">1 = round robin puro (recomendado)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
