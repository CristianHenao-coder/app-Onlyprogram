import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { LinkPage, Folder, getBackgroundStyle } from './types';

interface DraggableLinkCardProps {
  page: LinkPage;
  folders: Folder[];
  t: any;
  openEditor: (id: string) => void;
  handleDeleteDraftPage: (id: string, name: string) => void;
  setInactiveAlertPageId: (id: string) => void;
  hasPair?: boolean;
}

const DraggableLinkCard: React.FC<DraggableLinkCardProps> = ({
  page,
  folders,
  t,
  openEditor,
  handleDeleteDraftPage,
  setInactiveAlertPageId,
  hasPair = false
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: page.id,
    data: {
      type: 'link',
      page
    }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const isDirect = page.landingMode === "direct";
  const isDual = page.landingMode === "dual";

  let borderClass = "border-white/[0.06] hover:border-primary/40 hover:shadow-primary/10";
  let bgTrash = "bg-primary/20 hover:bg-primary/40 border-primary/40 text-primary";
  let accentColor = "text-primary";
  let accentBg = "bg-primary/10";
  let accentBorder = "border-primary/20 hover:border-primary/40";

  if (hasPair || isDual) {
    borderClass = "border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]";
    bgTrash = "bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/40 text-purple-400";
    accentColor = "text-purple-400";
    accentBg = "bg-purple-500/10";
    accentBorder = "border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.1)]";
  } else if (isDirect) {
    borderClass = "border-red-500/30 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]";
    bgTrash = "bg-red-500/20 hover:bg-red-500/40 border-red-500/40 text-red-400";
    accentColor = "text-red-400";
  } else {
    borderClass = "border-blue-500/30 hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]";
    bgTrash = "bg-blue-500/20 hover:bg-blue-500/40 border-red-500/40 text-blue-400";
    accentColor = "text-blue-400";
  }

  const defaultProfileImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative ${isDragging ? 'opacity-50 scale-95 z-50' : ''} transition-all duration-200 h-full`}
    >
      <div
        onClick={() => openEditor(page.id)}
        className={`relative group rounded-2xl border bg-white/[0.02] overflow-hidden hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full ${borderClass}`}
      >
        {/* Delete button - top left */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteDraftPage(page.id, page.profileName || page.name); }}
          title="Eliminar link"
          className={`absolute top-2 left-2 z-20 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border ${bgTrash}`}
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>

        {/* Mini preview background */}
        <div
          className="h-28 w-full relative"
          style={getBackgroundStyle(page)}
        >
          <div className="absolute inset-0 bg-black/30" />
          {/* Profile image */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden bg-gray-800">
              {page.profileImage && page.profileImage !== defaultProfileImage ? (
                <img src={page.profileImage} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <span className="material-symbols-outlined text-2xl text-white/40">person</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card content */}
        <div className="pt-9 pb-4 px-4 text-center">
          <p className="font-bold text-sm text-white truncate">
            {page.profileName || page.name}
          </p>
          <p className="text-[10px] text-silver/40 mt-0.5">
            /{page.slug || page.id.slice(0, 8)}
          </p>

          {/* Status / Domain badge */}
          <div className="mt-2 flex items-center justify-center gap-1.5 h-6">
            {page.dbStatus === "pending" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-orange-400">
                  {t("dashboard.links.inReview")}
                </span>
              </>
            ) : page.dbStatus === "active" ? (
              page.customDomain ? (
                <a
                  href={`https://${page.customDomain.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 hover:bg-green-500/20 hover:scale-105 active:scale-95 transition-all group shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                >
                  {page.customDomain}
                  <span className="material-symbols-outlined text-[12px] opacity-70 group-hover:opacity-100 transition-opacity">open_in_new</span>
                </a>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-green-500">
                    {t("dashboard.links.activeBadge")}
                  </span>
                </>
              )
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-yellow-500">
                  {t("dashboard.links.creatingDraft")}
                </span>
              </>
            )}
          </div>

          {/* Folder badge */}
          {page.folder && folders.find(f => f.name === page.folder) && (
            <div className="mt-2 flex justify-center">
              <span 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold`}
                style={{ 
                  color: folders.find(f => f.name === page.folder)?.color, 
                  borderColor: `${folders.find(f => f.name === page.folder)?.color}40`,
                  backgroundColor: `${folders.find(f => f.name === page.folder)?.color}10`
                }}
              >
                <span className="material-symbols-outlined text-[10px]">folder</span>
                {page.folder}
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-2 flex gap-1.5 px-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); openEditor(page.id); }}
              className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-tight ${accentBg} ${accentBorder} ${accentColor} text-white`}
            >
              <span className="material-symbols-outlined text-[12px]">settings</span>
              {t("dashboard.links.config") || "Ajustes"}
            </button>
            {page.slug && (
              page.status === 'active' ? (
                <a
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[12px]">visibility</span>
                </a>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInactiveAlertPageId(page.id);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableLinkCard;

