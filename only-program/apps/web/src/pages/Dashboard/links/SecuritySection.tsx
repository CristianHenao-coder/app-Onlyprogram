import React from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage } from "./types";

interface SecuritySectionProps {
  currentPage: LinkPage;
  handleUpdatePage: (field: string, value: any) => void;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  currentPage,
  handleUpdatePage,
}) => {
  const { } = useTranslation();

  return (
    <section className="bg-white/5 border-y border-primary/20 overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.05)] mt-8">
      <div className="p-4 border-b border-primary/10 bg-primary/5 px-4">
        <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-primary">
            shield
          </span>
          Seguridad e Inteligencia Predictiva
        </h3>
      </div>
      <div className="py-6 space-y-8 px-4">
        {/* GEO-BLOCKING */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Geofiltering: Bloqueo de Países</h4>
            <p className="text-[10px] text-silver/40">Bloquea el acceso a este link desde países específicos (ej: auditores, competidores).</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {(currentPage.security_config?.geoblocking || []).map((code: string) => (
              <div key={code} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-black text-red-100 uppercase">{code}</span>
                <button
                  onClick={() => {
                    const current = currentPage.security_config?.geoblocking || [];
                    handleUpdatePage("security_config", {
                      ...currentPage.security_config,
                      geoblocking: current.filter((c: string) => c !== code)
                    });
                  }}
                  className="material-symbols-outlined text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                  close
                </button>
              </div>
            ))}
            {(!currentPage.security_config?.geoblocking || currentPage.security_config.geoblocking.length === 0) && (
              <p className="text-[10px] text-silver/20 italic">No hay países bloqueados. Acceso global permitido.</p>
            )}
          </div>
          <div className="relative">
            <select
              onChange={(e) => {
                if (!e.target.value) return;
                const current = currentPage.security_config?.geoblocking || [];
                if (current.includes(e.target.value)) return;
                handleUpdatePage("security_config", {
                  ...currentPage.security_config,
                  geoblocking: [...current, e.target.value]
                });
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

        {/* DEVICE REDIRECTIONS */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Redirecciones por Dispositivo</h4>
            <p className="text-[10px] text-silver/40">Redirige a URLs diferentes según el dispositivo del visitante.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-silver/40 uppercase pl-1">iOS (iPhone/iPad)</label>
              <input
                type="url"
                placeholder="https://..."
                value={currentPage.security_config?.device_redirections?.ios || ""}
                onChange={(e) => handleUpdatePage("security_config", {
                  ...currentPage.security_config,
                  device_redirections: {
                    ...currentPage.security_config?.device_redirections,
                    ios: e.target.value
                  }
                })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-silver/40 uppercase pl-1">Android</label>
              <input
                type="url"
                placeholder="https://..."
                value={currentPage.security_config?.device_redirections?.android || ""}
                onChange={(e) => handleUpdatePage("security_config", {
                  ...currentPage.security_config,
                  device_redirections: {
                    ...currentPage.security_config?.device_redirections,
                    android: e.target.value
                  }
                })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
