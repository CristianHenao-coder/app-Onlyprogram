import React from 'react';
import { Folder, LinkPage } from './types';
import DroppableFolder from './DroppableFolder';

interface FolderSidebarProps {
  folders: Folder[];
  pages: LinkPage[];
  folderFilter: string | null;
  setFolderFilter: (name: string | null) => void;
  handleCreateFolder: () => void;
  setEditingFolder: (folder: Folder) => void;
  setShowFolderModal: (show: boolean) => void;
  t: any;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  pages,
  folderFilter,
  setFolderFilter,
  handleCreateFolder,
  setEditingFolder,
  setShowFolderModal,
  t
}) => {
  return (
    <div className="w-64 border-l border-white/5 bg-[#080808] hidden lg:flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-black uppercase tracking-widest text-silver/60 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">folder_open</span>
          {t("dashboard.links.folders") || "Carpetas"}
        </h3>
        <button
          onClick={handleCreateFolder}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-silver hover:text-white transition-all pointer-events-auto"
          title={t("dashboard.links.createFolder") || "Crear Carpeta"}
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pointer-events-auto">
        <DroppableFolder id="folder-root" isActive={folderFilter === null}>
          <button
            onClick={() => setFolderFilter(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              folderFilter === null 
                ? "bg-white/10 text-white shadow-lg" 
                : "bg-white/5 text-silver/60 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-silver/40">grid_view</span>
            <span className="text-sm font-bold flex-1 text-left">{t("dashboard.links.allLinks") || "Todos los Links"}</span>
          </button>
        </DroppableFolder>

        {folders.map(f => (
          <DroppableFolder key={f.id} id={`folder-${f.id}`} isActive={folderFilter === f.name}>
            <div className="relative group">
              <button
                onClick={() => setFolderFilter(f.name)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  folderFilter === f.name 
                    ? "bg-white/10 text-white shadow-lg" 
                    : "bg-white/5 text-silver/60 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                <span className="text-sm font-bold flex-1 text-left truncate">{f.name}</span>
                <span className="text-[10px] font-black bg-black/40 px-2 py-0.5 rounded-full text-silver/40">
                  {pages.filter(p => p.folder === f.name).length}
                </span>
              </button>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#151515] p-1 rounded-lg border border-white/10">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setEditingFolder(f); 
                    setShowFolderModal(true); 
                  }} 
                  className="p-1 text-silver/40 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
              </div>
            </div>
          </DroppableFolder>
        ))}
        
        {folders.length === 0 && (
          <div className="mt-8 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-silver/30">move_to_inbox</span>
            </div>
            <p className="text-[10px] text-silver/40 uppercase tracking-widest font-bold">
              {t("dashboard.links.dragLinksHere") || "Arrastra links aquí para organizarlos"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
