import React, { useState } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage, Folder, getBackgroundStyle } from "./types";
import DraggableLinkCard from "./DraggableLinkCard";
import DroppableFolder from "./DroppableFolder";

interface ButtonsListProps {
  pages: LinkPage[];
  folders: Folder[];
  folderFilter: string | null;
  setFolderFilter: (filter: string | null) => void;
  handleCreateNew: () => void;
  handleOpenFolderModal: (folder?: Folder) => void;
  handleDeleteFolder: (id: string) => void;
  handleDeleteDraftPage: (id: string, name: string) => void;
  openEditor: (id: string) => void;
  DEFAULTS: { PROFILE_IMAGE: string };
  loadLinks?: () => Promise<void>;
  onMoveToFolder?: (linkId: string, folderName: string | null) => void;
}

const ButtonsList: React.FC<ButtonsListProps> = ({
  pages,
  folders,
  folderFilter,
  setFolderFilter,
  handleCreateNew,
  handleOpenFolderModal,
  handleDeleteFolder,
  handleDeleteDraftPage,
  openEditor,
  DEFAULTS,
  loadLinks,
  onMoveToFolder,
}) => {
  const { t } = useTranslation();
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="w-full px-4">
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white">
                {t("dashboard.links.myLinks")}
              </h2>
              <button 
                onClick={() => loadLinks?.()}
                className="p-2 text-silver/20 hover:text-primary transition-colors flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-90"
                title="Sincronizar ahora"
              >
                <span className="material-symbols-outlined text-xl">sync</span>
              </button>
            </div>
            <p className="text-base text-silver/40 mt-1">
              {pages.filter((p) => p.dbStatus).length}{" "}
              {"links activos ◆ "}
              {
                pages.filter((p) => !p.dbStatus && p.status === "draft")
                  .length
              }{" "}
              {t("dashboard.links.creatingDraft")}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-3 px-8 py-4 bg-primary text-white font-bold text-base rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">
              add_circle
            </span>
            <span>{t("dashboard.links.createLink")}</span>
          </button>
        </div>

        {/* FOLDERS EXPLORER GRID */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-silver/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">folder_shared</span>
              Explorador de Carpetas
            </h3>
            <button
              onClick={() => handleOpenFolderModal()}
              className="text-[10px] font-bold text-primary hover:text-white flex items-center gap-1 transition-colors group"
            >
              <span className="material-symbols-outlined text-[14px] group-hover:rotate-90 transition-transform">add</span>
              Crear Carpeta
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* "All Links" pseudo-folder */}
            <button
              onClick={() => setFolderFilter(null)}
              className={`relative group p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left ${!folderFilter ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(29,161,242,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
            >
              <span className={`material-symbols-outlined text-2xl ${!folderFilter ? 'text-primary' : 'text-silver/40'}`}>grid_view</span>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Todos</p>
                <p className="text-[9px] text-silver/40">{pages.length} links</p>
              </div>
            </button>

            {folders.map(f => {
              const count = pages.filter(p => p.folder === f.name).length;
              const isActive = folderFilter === f.name;
              return (
                <DroppableFolder key={f.id} id={f.name} isActive={isActive}>
                  <div className="relative group w-full h-full">
                    <button
                      onClick={() => setFolderFilter(isActive ? null : f.name)}
                      className={`w-full p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left h-full ${isActive ? 'bg-white/10' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      style={{ borderColor: isActive ? f.color : undefined, boxShadow: isActive ? `0 0 20px ${f.color}20` : undefined }}
                    >
                      <span className="material-symbols-outlined text-2xl" style={{ color: f.color }}>
                        {isActive ? 'folder_open' : 'folder'}
                      </span>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider truncate">{f.name}</p>
                        <p className="text-[9px] text-silver/40">{count} links</p>
                      </div>
                    </button>

                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenFolderModal(f); }}
                        className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-silver/60 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                        className="w-6 h-6 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-silver/60 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">delete</span>
                      </button>
                    </div>
                  </div>
                </DroppableFolder>
              );
            })}
          </div>

          {folderFilter && (
            <div className="mt-6 flex items-center justify-between animate-in slide-in-from-left duration-300">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-silver/40 uppercase tracking-widest">Filtrado por:</span>
                <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase flex items-center gap-2">
                  {folderFilter}
                  <button onClick={() => setFolderFilter(null)} className="hover:text-white">
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowAddLinkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black uppercase text-primary hover:bg-primary/20 hover:border-primary/40 transition-all active:scale-95 shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Agregar nuevo link a esta carpeta</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {pages.length === 0 && (
          <div className="mt-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_30px_rgba(29,161,242,0.1)]">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">link_off</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tienes links creados</h3>
            <p className="text-silver/50 max-w-xs mx-auto mb-8">
              Comienza a potenciar tu contenido blindando tus redes hoy mismo.
            </p>
            <button
              onClick={handleCreateNew}
              className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
            >
              Crea tu primer link
            </button>
          </div>
        )}

        {/* Active Links Wrapper */}
        <div className="space-y-12">
          {/* DB Links */}
          {pages.filter((p) => p.dbStatus).length > 0 && (
            <div className="animate-fade-in">
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver/40 mb-4 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                {t("dashboard.links.sentLinks")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages
                  .filter((p) => p.dbStatus && (!folderFilter || p.folder === folderFilter))
                  .map((page) => {
                    const isDirect = page.landingMode === "direct";
                    const isDual = page.landingMode === "dual";
                    const hasPair = pages.some(p => p.modelName === page.modelName && p.modelName && p.id !== page.id);
                    let borderClass = "border-white/[0.06] hover:border-primary/40 hover:shadow-primary/10";
                    let bgTrash = "bg-primary/20 hover:bg-primary/40 border-primary/40 text-primary";
                    let accentColor = "text-primary";
                    let accentBg = "bg-primary/10";
                    let accentBorder = "border-primary/20 hover:border-primary/40";

                    if (hasPair || isDual) {
                      borderClass = "border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.1)]";
                      bgTrash = "bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/40 text-purple-400";
                      accentColor = "text-purple-400";
                      accentBg = "bg-purple-500/10";
                      accentBorder = "border-purple-500/20";
                    } else if (isDirect) {
                      borderClass = "border-red-500/30 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                      bgTrash = "bg-red-500/20 hover:bg-red-500/40 border-red-500/40 text-red-400";
                      accentColor = "text-red-400";
                    }

                    return (
                      <DraggableLinkCard key={page.id} id={page.id} data={{ type: 'link', link: page }}>
                        <div
                          onClick={() => openEditor(page.id)}
                          className={`relative group rounded-[2rem] border bg-[#0A0A0A] overflow-hidden hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer ${borderClass}`}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDraftPage(page.id, page.profileName || page.name); }}
                            className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border ${bgTrash}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                          
                          <div
                            className="h-32 w-full relative"
                            style={getBackgroundStyle(page)}
                          >
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                              <div className="w-16 h-16 rounded-full border-4 border-[#0A0A0A] overflow-hidden bg-gray-800 shadow-xl">
                                {page.profileImage && page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                                  <img src={page.profileImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <span className="material-symbols-outlined text-3xl text-white/40">person</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-10 pb-6 px-6 text-center">
                            <p className="font-black text-base text-white truncate px-2">
                              {page.profileName || page.name}
                            </p>
                            <p className="text-[10px] text-silver/30 mt-1 font-bold uppercase tracking-widest">
                              /{page.slug || page.id.slice(0, 8)}
                            </p>

                            <div className="mt-4 flex items-center justify-center gap-2">
                              {page.status === "active" ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Publicado</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Revisión</span>
                                </div>
                              )}
                            </div>

                            {page.folder && (
                              <div className="mt-3 flex justify-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${accentBg} ${accentBorder} ${accentColor}`}>
                                  <span className="material-symbols-outlined text-[12px]">folder</span>
                                  {page.folder}
                                </span>
                              </div>
                            )}

                            <div className="mt-6">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditor(page.id); }}
                                className={`w-full py-3 rounded-2xl border transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${accentBg} ${accentBorder} ${accentColor} hover:brightness-125`}
                              >
                                <span className="material-symbols-outlined text-sm">settings</span>
                                {t("dashboard.links.config")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </DraggableLinkCard>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Local Drafts */}
          {pages.filter((p) => !p.dbStatus && p.status === "draft").length > 0 && (
            <div className="animate-fade-in delay-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver/40 mb-4 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-yellow-500" />
                {t("dashboard.links.draftsTitle")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages
                  .filter((p) => !p.dbStatus && p.status === "draft" && (!folderFilter || p.folder === folderFilter))
                  .map((page) => {
                    const isDirect = page.landingMode === "direct";
                    const isDual = page.landingMode === "dual";
                    const hasPair = pages.some(p => p.modelName === page.modelName && p.modelName && p.id !== page.id);
                    let borderClass = "border-white/[0.08] hover:border-yellow-500/40 hover:shadow-yellow-500/10";
                    let bgTrash = "bg-primary/20 hover:bg-primary/40 border-primary/40 text-primary";

                    if (hasPair || isDual) {
                      borderClass = "border-purple-500/30 border-dashed hover:border-purple-500/60";
                    } else if (isDirect) {
                      borderClass = "border-red-500/30 border-dashed hover:border-red-500/60";
                    }

                    return (
                      <DraggableLinkCard key={page.id} id={page.id} data={{ type: 'link', link: page }}>
                        <div
                          onClick={() => openEditor(page.id)}
                          className={`relative group rounded-[2rem] border bg-[#0A0A0A] overflow-hidden hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer ${borderClass}`}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDraftPage(page.id, page.name); }}
                            className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border ${bgTrash}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                          
                          <div
                            className="h-32 w-full relative"
                            style={getBackgroundStyle(page)}
                          >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                              <div className="w-16 h-16 rounded-full border-4 border-[#0A0A0A] overflow-hidden bg-gray-800">
                                {page.profileImage && page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                                  <img src={page.profileImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <span className="material-symbols-outlined text-3xl text-white/20">edit_note</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-10 pb-6 px-6 text-center">
                            <p className="font-black text-base text-white/70 truncate">
                              {page.name || t("dashboard.links.untitledLink")}
                            </p>
                            
                            <div className="mt-3 flex items-center justify-center">
                              <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500">Borrador Local</span>
                              </div>
                            </div>

                            {page.folder && (
                              <div className="mt-3 flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-silver/40 uppercase tracking-widest">
                                  <span className="material-symbols-outlined text-[12px]">folder</span>
                                  {page.folder}
                                </span>
                              </div>
                            )}

                            <div className="mt-6">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditor(page.id); }}
                                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-white hover:text-primary transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                {t("dashboard.links.continueEditing")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </DraggableLinkCard>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SELECT LINKS TO ADD TO FOLDER MODAL */}
      {showAddLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddLinkModal(false)} />
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Agregar a "{folderFilter}"</h3>
                  <p className="text-xs text-silver/40 mt-1">Selecciona los links que quieres mover a esta carpeta.</p>
                </div>
                <button onClick={() => setShowAddLinkModal(false)} className="p-2 text-silver/20 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>
             
             <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar space-y-2">
                {pages.filter(p => p.folder !== folderFilter).length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-silver/10 mb-2">link_off</span>
                    <p className="text-silver/40 text-sm">No hay links disponibles para mover.</p>
                  </div>
                ) : (
                  pages.filter(p => p.folder !== folderFilter).map(page => (
                    <button
                      key={page.id}
                      onClick={() => {
                        onMoveToFolder?.(page.id, folderFilter);
                        // We don't close immediately to allow multiple? 
                        // The user request says "muestra los que estan disponibles", usually implies one by one or multi.
                        // Let's keep it open for multi-add maybe, but usually one-by-one is safer.
                      }}
                      className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-4 text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        {page.profileImage && page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                          <img src={page.profileImage} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                             <span className="material-symbols-outlined text-sm text-silver/20">link</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{page.profileName || page.name}</p>
                        <p className="text-[10px] text-silver/40 truncate">/{page.slug || page.id.slice(0,8)}</p>
                      </div>
                      <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                    </button>
                  ))
                )}
             </div>

             <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setShowAddLinkModal(false)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Cerrar
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ButtonsList;
