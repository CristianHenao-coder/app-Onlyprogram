import React from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  useSensors, 
  useSensor, 
  PointerSensor, 
  KeyboardSensor 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { LinkPage, Folder } from './types';
import LinkCard from './components/LinkCard';
import { FolderSidebar } from './FolderSidebar';

interface LinkListViewProps {
  pages: LinkPage[];
  folders: Folder[];
  folderFilter: string | null;
  setFolderFilter: (name: string | null) => void;
  handleCreateNew: () => void;
  handleDeleteDraftPage: (id: string, name: string) => void;
  setInactiveAlertPageId: (id: string) => void;
  openEditor: (id: string) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleCreateFolder: () => void;
  setEditingFolder: (folder: Folder) => void;
  setShowFolderModal: (show: boolean) => void;
  t: any;
}

export const LinkListView: React.FC<LinkListViewProps> = ({
  pages,
  folders,
  folderFilter,
  setFolderFilter,
  handleCreateNew,
  handleDeleteDraftPage,
  setInactiveAlertPageId,
  openEditor,
  handleDragEnd,
  handleCreateFolder,
  setEditingFolder,
  setShowFolderModal,
  t
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex overflow-hidden">
        {/* Main List Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth" id="list-scroll-area">
          <div className="max-w-5xl mx-auto">
            {/* Header + Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">
                  {t("dashboard.links.myLinks")}
                </h2>
                <p className="text-sm text-silver/40 mt-1">
                  {pages.filter((p) => p.dbStatus).length}{" "}
                  {t("dashboard.links.activeLinksBadge") || "links activos ◆ "}{" "}
                  {
                    pages.filter((p) => !p.dbStatus && p.status === "draft")
                      .length
                  }{" "}
                  {t("dashboard.links.creatingDraft")}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>{t("dashboard.links.createLink")}</span>
            </button>
          </div>

          {/* Empty State */}
          {pages.length === 0 && (
            <div className="mt-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_30px_rgba(29,161,242,0.1)]">
                <span className="material-symbols-outlined text-4xl text-primary animate-pulse">link_off</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t("dashboard.links.emptyStateTitle") || "No tienes links creados"}</h3>
              <p className="text-silver/50 max-w-xs mx-auto mb-8">
                {t("dashboard.links.emptyStateMsg") || "Comienza a potenciar tu contenido blindando tus redes hoy mismo."}
              </p>
              <button
                onClick={handleCreateNew}
                className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
              >
                {t("dashboard.links.createFirstLink") || "Crea tu primer link"}
              </button>
            </div>
          )}

          {/* DB Links (activos + pendientes) */}
          {pages.filter((p) => p.dbStatus).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver/40 mb-4">
                {t("dashboard.links.sentLinks")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages
                  .filter((p) => p.dbStatus && (folderFilter === null || p.folder === folderFilter))
                  .map((page) => {
                    const hasPair = pages.some(p => p.modelName === page.modelName && p.modelName && p.id !== page.id);
                    return (
                      <LinkCard 
                        key={page.id} 
                        page={page} 
                        folders={folders} 
                        t={t} 
                        openEditor={openEditor} 
                        handleDeleteDraftPage={handleDeleteDraftPage} 
                        setInactiveAlertPageId={setInactiveAlertPageId} 
                        hasPair={hasPair}
                      />
                    );
                  })}
              </div>
            </div>
          )}

          {/* Local Drafts */}
          {pages.filter((p) => !p.dbStatus && p.status === "draft").length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-silver/40 mb-4">
                {t("dashboard.links.draftsTitle")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages
                  .filter((p) => !p.dbStatus && p.status === "draft" && (folderFilter === null || p.folder === folderFilter))
                  .map((page) => {
                    const hasPair = pages.some(p => p.modelName === page.modelName && p.modelName && p.id !== page.id);
                    return (
                      <LinkCard 
                        key={page.id} 
                        page={page} 
                        folders={folders} 
                        t={t} 
                        openEditor={openEditor} 
                        handleDeleteDraftPage={handleDeleteDraftPage} 
                        setInactiveAlertPageId={setInactiveAlertPageId} 
                        hasPair={hasPair}
                      />
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <FolderSidebar 
          folders={folders} 
          pages={pages} 
          folderFilter={folderFilter} 
          setFolderFilter={setFolderFilter} 
          handleCreateFolder={handleCreateFolder} 
          setEditingFolder={setEditingFolder} 
          setShowFolderModal={setShowFolderModal} 
          t={t} 
        />
      </div>
    </DndContext>
  );
};
