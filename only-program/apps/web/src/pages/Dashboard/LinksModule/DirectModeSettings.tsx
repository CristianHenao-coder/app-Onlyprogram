import { LinkPage } from "./types";

interface DirectModeSettingsProps {
  currentPage: LinkPage;
  onUpdatePage: (field: string, value: any) => void;
  folders: string[];
}

export const DirectModeSettings: React.FC<DirectModeSettingsProps> = ({
  currentPage,
  onUpdatePage,
  folders,
}) => {
  // const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Main Destination URL (TOP FOCUS) */}
      <div className="p-8 bg-red-500/10 border border-red-500/40 rounded-[2.5rem] shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-10 -mt-10" />
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Configuración del Enlace Directo</h3>
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-[0.2em]">Modo Escudo Activo • Redirección Instantánea</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="bg-black/40 rounded-[1.5rem] p-6 border border-white/5 space-y-4">
             <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-silver/40 uppercase tracking-[0.2em]">
                  URL de Destino Final
                </label>
                <span className="text-[9px] text-red-400 font-black uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">Urgente / Principal</span>
             </div>
             <input
               type="url"
               placeholder="https://onlyfans.com/tu_perfil"
               value={currentPage.directUrl || ""}
               onChange={(e) => onUpdatePage("directUrl", e.target.value)}
               className="w-full bg-[#050505] border-2 border-red-500/20 rounded-2xl px-6 py-4 text-base font-bold text-white focus:outline-none focus:border-red-500 shadow-2xl transition-all placeholder:text-white/5"
             />
             <div className="flex items-start gap-2 text-silver/40 text-[10px] px-1 leading-relaxed">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
                <p>
                  En este modo, tu link no mostrará botones ni apariencia visual. Al hacer clic desde Instagram o Facebook, el escudo se activará y el usuario será <b>redirigido automáticamente</b> al enlace que ingreses arriba.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* 2. Secondary Settings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Name */}
        <div className="p-8 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] group hover:border-white/10 transition-colors">
          <label className="text-[10px] font-black text-silver/40 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">account_circle</span>
            Nombre de la Modelo
          </label>
          <input
            type="text"
            value={currentPage.modelName || ""}
            onChange={(e) => onUpdatePage("modelName", e.target.value)}
            placeholder="Ej: Mia Khalifa (Opcional)"
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/5"
          />
          <p className="text-[9px] text-silver/20 mt-3 font-bold uppercase tracking-widest">Uso interno para buscar tus links fácilmente.</p>
        </div>

        {/* Folder / Project Selector */}
        <div className="p-8 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] group hover:border-white/10 transition-colors">
          <label className="text-[10px] font-black text-silver/40 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">folder_open</span>
            Carpeta o Proyecto
          </label>
          <div className="relative">
            <input
              type="text"
              value={currentPage.folder || ""}
              onChange={(e) => onUpdatePage("folder", e.target.value)}
              placeholder="Ej: Mis Campañas"
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/5"
              list="folder-suggestions-direct"
            />
            <datalist id="folder-suggestions-direct">
              {folders.map((f) => <option key={f} value={f} />)}
            </datalist>
          </div>
        </div>
      </div>
    </div>
  );
};
