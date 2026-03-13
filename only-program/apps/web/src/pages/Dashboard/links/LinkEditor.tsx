import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage, SocialType } from "./types";
import { SortableButton } from "./SortableButton";
import SecuritySection from "./SecuritySection";
import DesktopFooter from "./DesktopFooter";
import MobileNextButton from "./MobileNextButton";
import ProfileSettings from "./ProfileSettings";
import DesignSettings from "./DesignSettings";
import ButtonEditorFields from "./ButtonEditorFields";

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
  setView: (view: "list" | "editor") => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
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
  setView,
  sidebarCollapsed,
  setSidebarCollapsed,
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
}) => {
  const { t } = useTranslation();

  const selectedButton = currentPage?.buttons?.find(
    (b) => b.id === selectedButtonId,
  );

  return (
    <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden order-2 lg:order-first transition-all">
      {/* TOP BAR: Page Switcher */}
      <div className="h-20 border-b border-white/5 bg-[#080808] flex items-center relative z-20 shrink-0">
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
          <button
            onClick={() => setView("list")}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all text-silver/40 hover:text-primary shrink-0 group"
            title={t("dashboard.links.linksListBack") || "Mis Links"}
          >
            <span className="material-symbols-outlined text-xl group-active:scale-90 transition-transform">
              arrow_back
            </span>
            <span className="text-[7px] font-bold uppercase tracking-tighter">
              Volver
            </span>
          </button>

          <div className="h-8 w-px bg-white/10 shrink-0 mx-2"></div>
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
        {/* LEFT PANEL: BUTTONS LIST */}
        <div className={`border-r border-white/5 flex flex-col bg-[#070707] shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-full sm:w-64 lg:w-80"}`}>
          <div className="border-b border-white/5 relative z-10 bg-[#070707] flex flex-col">
            <div className={`py-2 md:py-3 flex items-center ${sidebarCollapsed ? "px-0 justify-center" : "px-4 justify-between"}`}>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 touch-manipulation shadow-lg ${
                  sidebarCollapsed 
                    ? "bg-primary text-white shadow-primary/20 scale-110" 
                    : "bg-white/5 border border-white/10 text-primary hover:bg-primary/10 hover:border-primary/30"
                }`}
                title={sidebarCollapsed ? t("dashboard.links.expandMenu") : t("dashboard.links.collapseMenu")}
              >
                <span className="material-symbols-outlined text-2xl font-bold">
                  {sidebarCollapsed ? "menu_open" : "menu"}
                </span>
              </button>

              {sidebarCollapsed && folderFilter && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30" title={t("dashboard.links.filteredBy", { folder: folderFilter })}>
                  <span className="material-symbols-outlined text-sm">folder</span>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {(currentPage.landingMode as string) !== "direct" && (
                  <>
                    <button
                      onClick={() => { setSelectedButtonId(null); setShowButtonCreator(false); }}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 touch-manipulation"
                    >
                      <span className="material-symbols-outlined text-xl">settings</span>
                      <span>{t("dashboard.links.editProfile")}</span>
                    </button>
                    <button
                      onClick={() => setShowButtonCreator(true)}
                      className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
                    >
                      <span className="material-symbols-outlined text-xl">add_circle</span>
                      <span>{t("dashboard.links.addButton")}</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {sidebarCollapsed && (currentPage.landingMode as string) !== "direct" && (
              <div className="px-0 pb-3 flex flex-col items-center gap-3">
                <button
                  onClick={() => { setSelectedButtonId(null); setShowButtonCreator(false); }}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
                  title={t("dashboard.links.editProfile")}
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </button>
                <button
                  onClick={() => setShowButtonCreator(true)}
                  className="w-9 h-9 rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                  title={t("dashboard.links.addButton")}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 relative z-0">
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
                          onClick={() => { setSelectedButtonId(btn.id); setShowButtonCreator(false); }}
                          collapsed={sidebarCollapsed}
                          rotatorSurcharge={ROTATOR_SURCHARGE}
                          socialPresets={SOCIAL_PRESETS}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteButton(btn.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-silver/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {currentPage.buttons.length === 0 && !showButtonCreator && (
                      <div className={`text-center py-10 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center ${sidebarCollapsed ? "px-1" : "px-4"}`}>
                        <span className={`material-symbols-outlined text-silver/20 mb-2 ${sidebarCollapsed ? "text-xl" : "text-3xl"}`}>touch_app</span>
                        {!sidebarCollapsed && <p className="text-xs text-silver/40">{t("dashboard.links.emptyLinkMsg")}</p>}
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
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        {/* MAIN EDITOR AREA */}
        <div className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-700 ${currentPage.landingMode === 'dual' ? 'bg-[#080808] border-x border-purple-500/30 shadow-[inset_0_0_50px_rgba(168,85,247,0.05)]' : 'bg-[#050505]'}`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 md:p-6 lg:p-12 pb-40">
            <div className="max-w-full mx-auto space-y-16">
              {/* STATUS INDICATORS */}
              {(pages.some(p => p.modelName === currentPage.modelName && p.modelName && p.id !== currentPage.id) || currentPage.landingMode === 'dual') && (
                <div className="mb-12 p-8 rounded-[3rem] bg-purple-600/5 border-none relative overflow-hidden group animate-in slide-in-from-top-4 duration-700">
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/40 shrink-0">
                      <span className="material-symbols-outlined text-white text-2xl animate-bounce">auto_awesome</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                        Conectividad Dual Activada
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest font-black">PRO</span>
                      </h3>
                      <p className="text-sm text-silver/60 leading-relaxed">
                        Estás usando nuestro <span className="text-white font-bold">sistema híbrido inteligente</span>: 
                        Tu landing page está optimizada para <span className="text-blue-400 font-bold">TikTok</span>, mientras que el sistema <span className="text-red-400 font-bold">Directo de Instagram/FB</span> ya está integrado. 
                        <br /><br />
                        <span className="text-[11px] font-bold text-purple-400">Puedes usar tu link final en cualquier red social y el sistema detectará automáticamente la mejor experiencia para el usuario.</span>
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
                  <ProfileSettings
                    currentPage={currentPage}
                    handleUpdatePage={handleUpdatePage}
                    fileInputRef={fileInputRef}
                    handleImageUpload={handleImageUpload}
                    isSaving={isSaving}
                    handleSyncButtons={handleSyncButtons}
                  />

                  <DesignSettings
                    currentPage={currentPage}
                    handleUpdatePage={handleUpdatePage}
                  />

                  <SecuritySection
                    currentPage={currentPage}
                    handleUpdatePage={handleUpdatePage}
                  />
                </div>
              )}
            </div>
          </div>
          <MobileNextButton
            currentPage={currentPage}
            handleNextStep={handleNextStep}
          />
        </div>
      </div>
    </div>
  );
};

export default LinkEditor;
