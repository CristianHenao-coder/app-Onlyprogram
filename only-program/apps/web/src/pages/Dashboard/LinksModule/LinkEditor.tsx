import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage, SocialType } from "./types";
import { SortableButton } from "./SortableButton";
import SecuritySection from "./SecuritySection";
import DesktopFooter from "./DesktopFooter";
import ProfileSettings from "./ProfileSettings";
import DesignSettings from "./DesignSettings";
import ButtonEditorFields from "./ButtonEditorFields";
import { DirectModeSettings } from "./DirectModeSettings";
interface LinkEditorProps {
  currentPage: LinkPage;
  selectedPageId: string;
  setSelectedPageId: (id: string) => void;
  allActivePages: LinkPage[];
  allDraftPages: LinkPage[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  showLeftArrow: boolean;
  showRightArrow: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
  handleCreateNew: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  view: "list" | "editor";
  setView: (v: "list" | "editor") => void;
  folderFilter: string | null;
  showButtonCreator: boolean;
  setShowButtonCreator: (show: boolean) => void;
  selectedButtonId: string | null;
  setSelectedButtonId: (id: string | null) => void;
  sensors: any;
  handleDragEnd: (event: any) => void;
  handleDeleteButton: (id: string) => void;
  handleCreateButton: (type: SocialType) => void;
  handleUpdateButton: (field: string, value: any) => void;
  handleUpdatePage: (field: string, value: any) => void;
  handleNextStep: () => void;
  ROTATOR_SURCHARGE: number;
  SOCIAL_PRESETS: any;
  DEFAULTS: any;
  urlError: string | null;
  setUrlError: (error: string | null) => void;
  isValidUrl: (url: string) => boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateRotatorLink?: (buttonId: string, index: number, field: string, value: string) => void;
  pages: LinkPage[];
  Icons: any;
  isSaving?: boolean;
  handleSyncButtons?: () => Promise<void>;
  handleDeletePage: (id: string, name: string) => Promise<void>;
  onBack?: () => void;
}

const LinkEditor: React.FC<LinkEditorProps> = ({
  currentPage,
  selectedPageId,
  setSelectedPageId,
  allActivePages,
  allDraftPages,
  scrollContainerRef,
  showLeftArrow,
  showRightArrow,
  scrollLeft,
  scrollRight,
  handleCreateNew,
  sidebarCollapsed,
  setSidebarCollapsed,
  view: _view,
  setView: _setView,
  folderFilter,
  showButtonCreator,
  setShowButtonCreator,
  selectedButtonId,
  setSelectedButtonId,
  sensors,
  handleDragEnd,
  handleDeleteButton,
  handleCreateButton,
  handleUpdateButton,
  handleUpdatePage,
  handleNextStep,
  ROTATOR_SURCHARGE,
  SOCIAL_PRESETS,
  DEFAULTS,
  urlError,
  setUrlError,
  isValidUrl,
  fileInputRef,
  handleImageUpload,
  handleUpdateRotatorLink: _handleUpdateRotatorLink,
  pages,
  Icons,
  isSaving,
  handleSyncButtons,
  handleDeletePage,
  onBack,
}) => {
  const { t } = useTranslation();

  const selectedButton = currentPage?.buttons?.find(
    (b) => b.id === selectedButtonId,
  );

  return (
    <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden order-2 lg:order-first transition-all">
      {/* TOP BAR: Page Switcher */}
      <div className="h-20 border-b border-white/5 bg-[#080808] flex items-center relative z-20 shrink-0">
        {onBack && (
          <div className="pl-4 lg:pl-6 pr-2 border-r border-white/5 h-full flex items-center">
             <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-silver/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center active:scale-90"
                title={t("dashboard.links.linksListBack") || "Volver"}
              >
                <span className="material-symbols-outlined">arrow_back</span>
             </button>
          </div>
        )}
        
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#080808] via-[#080808]/90 to-transparent z-30 flex items-center justify-start pl-2 hover:pl-1 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
              <span className="material-symbols-outlined text-white text-lg group-hover:text-primary">
                chevron_left
              </span>
            </div>
          </button>
        )}

        <div
          className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth px-4 h-full"
          ref={scrollContainerRef}
        >
          {allActivePages.map((page) => {
            const isDirect = page.landingMode === "direct";
            const isDual = page.landingMode === "dual";
            const isSelected = selectedPageId === page.id;
            const hasPair = pages.some(p => p.modelName === page.modelName && p.modelName && p.id !== page.id);
            
            let buttonClass = "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10";
            if (isSelected) {
              if (hasPair || isDual) {
                buttonClass = "bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]";
              } else if (isDirect) {
                buttonClass = "bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
              } else {
                buttonClass = "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]";
              }
            }

            return (
              <button
                key={page.id}
                onClick={() => {
                  setSelectedPageId(page.id);
                  setSelectedButtonId(null);
                }}
                className={`relative group flex items-center gap-3 pr-4 pl-1 py-1 rounded-full transition-all border ${buttonClass}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                  {page.profileImage && page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                    <img src={page.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                  )}
                </div>
                <div className="text-left min-w-[60px]">
                  <p className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-silver/60"}`}>
                    {page.modelName || page.name}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] text-green-500 font-black uppercase tracking-wider">
                      {t("dashboard.links.activeBadge")}
                    </span>
                  </span>
                </div>
                {isSelected && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 ${(hasPair || isDual) ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : (isDirect ? 'bg-red-500' : 'bg-blue-500')} rounded-full border-2 border-[#080808]`}></div>
                )}
              </button>
            );
          })}

          {allDraftPages.length > 0 && <div className="h-8 w-px bg-white/10 shrink-0 mx-2"></div>}
          {allDraftPages.map((page) => {
            const isDirect = page.landingMode === "direct";
            const isDual = page.landingMode === "dual";
            const isSelected = selectedPageId === page.id;
            const hasPair = pages.some(p => p.modelName === page.modelName && p.modelName && p.id !== page.id);
            let buttonClass = "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10";
            if (isSelected) {
              if (hasPair || isDual) {
                buttonClass = "bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]";
              } else if (isDirect) {
                buttonClass = "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]";
              } else {
                buttonClass = "bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]";
              }
            }

            return (
              <button
                key={page.id}
                onClick={() => {
                  setSelectedPageId(page.id);
                  setSelectedButtonId(null);
                }}
                className={`relative group flex items-center gap-3 pr-4 pl-1 py-1 rounded-full transition-all border ${buttonClass}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                  {page.profileImage && page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                    <img src={page.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </div>
                  )}
                </div>
                <div className="text-left min-w-[60px]">
                  <p className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-silver/60"}`}>
                    {page.modelName || page.name}
                  </p>
                  {page.dbStatus ? (
                    <span className="inline-flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      <span className="text-[9px] text-orange-400 font-black uppercase tracking-wider">
                        {t("dashboard.links.inReview")}
                      </span>
                    </span>
                  ) : (
                    <p className={`text-[9px] font-black uppercase tracking-wider ${(isDual || hasPair) ? 'text-purple-400' : 'text-yellow-500'}`}>
                      {t("dashboard.links.creatingDraft")}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 ${(hasPair || isDual) ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : (isDirect ? 'bg-red-500' : 'bg-blue-500')} rounded-full border-2 border-[#080808]`}></div>
                )}
              </button>
            );
          })}

          <button
            onClick={handleCreateNew}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-primary shrink-0 group ml-2"
            title={t("dashboard.links.createLink") || "Crear Link"}
          >
            <span className="material-symbols-outlined text-xl group-active:scale-90 transition-transform">add</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">Crear</span>
          </button>
        </div>

        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#080808] via-[#080808]/90 to-transparent z-30 flex items-center justify-end pr-2 hover:pr-1 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
              <span className="material-symbols-outlined text-white text-lg group-hover:text-primary">chevron_right</span>
            </div>
          </button>
        )}

        {currentPage && (
          <div className="pr-6 pl-4 flex items-center shrink-0 border-l border-white/10 h-full hidden md:flex">
             {(() => {
                const isDirect = currentPage.landingMode === "direct";
                const isDual = currentPage.landingMode === "dual";
                const hasPair = pages.some(p => p.modelName === currentPage.modelName && p.modelName && p.id !== currentPage.id);
                
                if (hasPair || isDual) {
                  return (
                    <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl border bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4"><Icons.Instagram /></div>
                        <span className="text-purple-400 font-bold text-[10px]">+</span>
                        <div className="w-4 h-4"><Icons.Facebook /></div>
                        <span className="text-purple-400 font-bold text-[10px]">+</span>
                        <div className="w-4 h-4"><Icons.TikTok /></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[6px] font-black uppercase tracking-[0.2em] text-silver/40 leading-none mb-0.5 whitespace-nowrap">Conexión Dual</span>
                        <span className="text-[9px] font-black text-white uppercase tracking-wider leading-none whitespace-nowrap">
                          {folderFilter ? `📂 ${folderFilter}` : 'Instagram + TikTok'}
                        </span>
                      </div>
                    </div>
                  )
                }

                if (isDirect) {
                  return (
                    <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl border bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                      <div className="flex items-center gap-0.5">
                        <div className="w-4 h-4"><Icons.Instagram /></div>
                        <span className="text-red-500/50 font-black text-[8px]">+</span>
                        <div className="w-4 h-4"><Icons.Facebook /></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[6px] font-black uppercase tracking-[0.2em] text-silver/40 leading-none mb-0.5 whitespace-nowrap">Conexión</span>
                        <span className="text-[9px] font-black text-white uppercase tracking-wider leading-none whitespace-nowrap">Instagram & FB</span>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl border bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <div className="w-5 h-5 flex-shrink-0"><Icons.TikTok /></div>
                    <div className="flex flex-col">
                      <span className="text-[6px] font-black uppercase tracking-[0.2em] text-silver/40 leading-none mb-0.5 whitespace-nowrap">Conexión</span>
                      <span className="text-[9px] font-black text-white uppercase tracking-wider leading-none whitespace-nowrap">TikTok Link</span>
                    </div>
                  </div>
                )
             })()}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: BUTTONS LIST & ADDER */}
        <div
          className={`h-full overflow-hidden border-r border-white/5 flex flex-col bg-[#070707] shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-16 md:w-20" : "w-full sm:w-64 lg:w-80"}`}
        >
          {/* SIDEBAR HEADER & FOLDERS */}
          <div className="border-b border-white/5 relative z-10 bg-[#070707] flex flex-col">
            <div className="p-3 md:p-4 flex items-center justify-between">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-white/5 rounded-lg transition-all shrink-0 touch-manipulation"
                title={
                  sidebarCollapsed
                    ? t("dashboard.links.expandMenu", {
                      defaultValue: "Expandir men",
                    })
                    : t("dashboard.links.collapseMenu", {
                      defaultValue: "Colapsar men",
                    })
                }
              >
                <span className="material-symbols-outlined text-white text-xl">
                  menu
                </span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 relative z-0">
            {!sidebarCollapsed && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {/* EDIT PROFILE BUTTON */}
                <button
                  onClick={() => {
                    setSelectedButtonId(null);
                    setShowButtonCreator(false);
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  <span className="material-symbols-outlined text-xl">settings</span>
                  <span>Editar Perfil</span>
                </button>

                {/* ADD BUTTON */}
                <button
                  onClick={() => setShowButtonCreator(true)}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  <span className="material-symbols-outlined text-xl">add_circle</span>
                  <span>{t("dashboard.links.addButton")}</span>
                </button>
              </div>
            )}

            {sidebarCollapsed && (
              <div className="px-2 pb-3 flex flex-col items-center gap-3">
                <button
                  onClick={() => { setSelectedButtonId(null); setShowButtonCreator(false); }}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
                  title="Editar Perfil"
                >
                  <span className="material-symbols-outlined text-xl">settings</span>
                </button>
                <button
                  onClick={() => setShowButtonCreator(true)}
                  className="w-10 h-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                  title={t("dashboard.links.addButton")}
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
              </div>
            )}

            {(currentPage.landingMode as string) === "direct" ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-2xl">rocket_launch</span>
                </div>
                {!sidebarCollapsed && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Modo Directo Activo</p>
                    <p className="text-[10px] text-silver/40 leading-relaxed">No se requieren botones para este tipo de enlace.</p>
                  </div>
                )}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentPage.buttons} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {currentPage.buttons.map((btn) => (
                      <div key={btn.id} className="relative group">
                        <SortableButton
                          btn={btn}
                          isSelected={selectedButtonId === btn.id}
                          onClick={() => {
                            setSelectedButtonId(btn.id);
                            setShowButtonCreator(false);
                          }}
                          onDelete={() => handleDeleteButton(btn.id)}
                          collapsed={sidebarCollapsed}
                          rotatorSurcharge={ROTATOR_SURCHARGE}
                          socialPresets={SOCIAL_PRESETS}
                        />
                      </div>
                    ))}
                    {currentPage.buttons.length === 0 && !showButtonCreator && (
                      <div className={`text-center ${sidebarCollapsed ? "py-4 px-2" : "py-10 px-4"} border-2 border-dashed border-white/5 rounded-xl`}>
                        <span className="material-symbols-outlined text-3xl text-silver/20 mb-2">touch_app</span>
                        {!sidebarCollapsed && (
                          <p className="text-xs text-silver/40">
                            {t("dashboard.links.emptyLinkMsg", {
                              defaultValue: "Tu link está vacío. ¡Añade tu primer botón!",
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <DesktopFooter
            currentPage={currentPage}
            handleDeletePage={handleDeletePage}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* MAIN EDITOR AREA */}
        <div className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-700 ${currentPage.landingMode === 'dual' ? 'bg-[#080808] border-x border-purple-500/30 shadow-[inset_0_0_50px_rgba(168,85,247,0.05)]' : 'bg-[#050505]'}`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 md:p-6 lg:p-12 pb-40">
            <div className="max-w-full mx-auto space-y-16">
              {/* STATUS INDICATORS */}
              {(pages.some(p => p.modelName === currentPage.modelName && p.modelName && p.id !== currentPage.id) || currentPage.landingMode === 'dual') && (
                <div className="mb-8 p-6 rounded-3xl bg-purple-600/5 border border-purple-500/10 relative overflow-hidden group">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
                      <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-white tracking-tight">Dual Activado</h3>
                        <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-widest font-black">PRO</span>
                      </div>
                      <p className="text-[11px] text-silver/40 leading-snug">
                        Sistema híbrido: <span className="text-blue-400 font-bold">TikTok</span> optimizado + <span className="text-red-400 font-bold">Meta</span> auto-integrado. El enlace detecta el dispositivo automáticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BUTTON CREATOR */}
              {showButtonCreator && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setShowButtonCreator(false)} className="p-2 hover:bg-white/10 rounded-full text-silver/50 hover:text-white transition-colors">
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-xl font-bold text-white max-w-2xl">{t("dashboard.links.addButton")}</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(Object.keys(SOCIAL_PRESETS) as SocialType[]).map((key) => (
                      <button key={key} onClick={() => handleCreateButton(key)} className="aspect-square rounded-2xl bg-[#0A0A0A] border border-white/10 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-white/5 hover:-translate-y-1 transition-all group p-4">
                        <div className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">{SOCIAL_PRESETS[key].icon}</div>
                        <span className="text-xs font-bold text-silver/60 group-hover:text-white capitalize">{SOCIAL_PRESETS[key].title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BUTTON EDITOR */}
              {selectedButton && !showButtonCreator && (
                <ButtonEditorFields
                  selectedButton={selectedButton}
                  setSelectedButtonId={setSelectedButtonId}
                  handleUpdateButton={handleUpdateButton}
                  urlError={urlError}
                  setUrlError={setUrlError}
                  isValidUrl={isValidUrl}
                  SOCIAL_PRESETS={SOCIAL_PRESETS}
                />
              )}

              {/* GENERAL PAGE SETTINGS */}
              {!selectedButton && !showButtonCreator && (
                <div className="animate-fade-in space-y-12">
                  {currentPage.landingMode === "direct" ? (
                    <DirectModeSettings
                      currentPage={currentPage}
                      onUpdatePage={handleUpdatePage}
                      folders={Array.from(new Set(pages.map(p => p.folder).filter(Boolean) as string[]))}
                    />
                  ) : (
                    <>
                      <ProfileSettings
                        currentPage={currentPage}
                        handleUpdatePage={handleUpdatePage}
                        fileInputRef={fileInputRef}
                        handleImageUpload={handleImageUpload}
                        isSaving={isSaving}
                        handleSyncButtons={handleSyncButtons}
                      />

                      {/* Dual Mode: direct URL input */}
                      {currentPage.landingMode === "dual" && (
                        <div className="p-8 bg-purple-600/5 border border-purple-500/20 rounded-[2.5rem] shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-10 -mt-10" />
                           <div className="flex items-center gap-3 text-white mb-6 relative z-10">
                              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                              </div>
                              <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">Enlace Directo Secundario</h3>
                                <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Para tráfico de Instagram / Facebook</p>
                              </div>
                           </div>
                           <div className="space-y-4 relative z-10">
                              <input
                                type="url"
                                placeholder="https://onlyfans.com/tu_perfil"
                                value={currentPage.directUrl || ""}
                                onChange={(e) => handleUpdatePage("directUrl", e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-white/5"
                              />
                              <p className="text-[10px] text-silver/30 px-1 leading-relaxed">
                                Esta URL se usará automáticamente cuando el sistema detecte que el usuario viene de <b>Instagram o Facebook</b>.
                              </p>
                           </div>
                        </div>
                      )}

                      <DesignSettings
                        currentPage={currentPage}
                        handleUpdatePage={handleUpdatePage}
                      />
                    </>
                  )}

                  <SecuritySection
                    currentPage={currentPage}
                    handleUpdatePage={handleUpdatePage}
                  />
                </div>
              )}

              {/* CENTERED NEXT STEP BUTTON (Mobile Only) */}
              {currentPage.status === "draft" && (
                <div className="pt-12 pb-20 flex justify-center border-t border-white/5 mt-16 lg:hidden">
                  <button
                    onClick={handleNextStep}
                    className="w-full max-w-sm py-4 px-8 rounded-2xl bg-[#1DA1F2] text-white font-black text-sm shadow-[0_20px_40px_rgba(29,161,242,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                  >
                    <span className="uppercase tracking-widest">{t("dashboard.links.nextStep") || "Siguiente paso"}</span>
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkEditor;
