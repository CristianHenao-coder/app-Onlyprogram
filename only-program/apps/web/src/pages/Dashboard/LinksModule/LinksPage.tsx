import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DndContext,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { useTranslation } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/contexts/ModalContext";
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from "@/services/productPricing.service";
import { useLinks } from "@/hooks/useLinks";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import FolderModal from "./FolderModal";
import LinksList from "./components/LinksList";
import LinkEditor from "./LinkEditor";
import PreviewPane from "./PreviewPane";
import {
  LinkPage,
  Folder,
  SocialType,
  ButtonLink,
  getDefaults,
} from "./types";

import instagramLogo from "@/assets/animations/instagram.png";
import tiktokLogo from "@/assets/animations/tik-tok.png";
import onlyfansLogo from "@/assets/of.png";

// Icons Components
const Icons = {
  Instagram: () => <img src={instagramLogo} alt="Instagram" className="w-full h-full object-contain" />,
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-blue-500">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14-2.857 0-4.643 1.743-4.643 4.96v2.54H7.5v4h2.5v11h4v-11z" />
    </svg>
  ),
  TikTok: () => <img src={tiktokLogo} alt="TikTok" className="w-full h-full object-contain" />,
  Telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.441z" />
    </svg>
  ),
  OnlyFans: () => <img src={onlyfansLogo} alt="OnlyFans" className="w-full h-full object-contain" />,
  Custom: () => <span className="material-symbols-outlined text-xl">link</span>,
};

const LinksPage: React.FC = () => {
  const { t } = useTranslation();
  const DEFAULTS = getDefaults(t);
  const { user } = useAuth();
  const { showConfirm } = useModal();
  const [_searchParams] = useSearchParams();

  const {
    pages,
    setPages,
    currentPage,
    selectedPageId,
    setSelectedPageId,
    initialLoad,
    isSaving,
    loadLinks,
    handleUpdatePage,
    handleSyncButtons,
    handleDeletePage,
    handleMoveToFolder,
    handleDragEnd,
    isValidUrl,
    navigate,
  } = useLinks(user, t);

  const SOCIAL_PRESETS = useMemo(() => ({
    instagram: {
      title: "Instagram",
      color: "#FFFFFF",
      textColor: "#000000",
      icon: <Icons.Instagram />,
      placeholder: t("dashboard.links.instagramPlaceholder"),
    },
    tiktok: {
      title: "TikTok",
      color: "#000000",
      textColor: "#FFFFFF",
      icon: <Icons.TikTok />,
      placeholder: t("dashboard.links.tiktokPlaceholder"),
    },
    telegram: {
      title: "Telegram",
      color: "#0088cc",
      textColor: "#FFFFFF",
      icon: <Icons.Telegram />,
      placeholder: t("dashboard.links.telegramPlaceholder"),
    },
    onlyfans: {
      title: t("home.preview.linksDemo.vipAccess"),
      color: "#00AFF0",
      textColor: "#FFFFFF",
      icon: <Icons.OnlyFans />,
      placeholder: t("dashboard.links.onlyfansPlaceholder"),
    },
    custom: {
      title: t("dashboard.links.editButton"),
      color: "#333333",
      textColor: "#FFFFFF",
      icon: <Icons.Custom />,
      placeholder: "https://...",
    },
  }), [t]);

  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(
    DEFAULT_PRODUCT_PRICING,
  );

  useEffect(() => {
    let mounted = true;
    productPricingService
      .get()
      .then((cfg: ProductPricingConfig) => {
        if (mounted) setPricingCfg(cfg);
      })
      .catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);

  const ROTATOR_SURCHARGE = pricingCfg.link.telegramAddon;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 8,
      } 
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- UI STATE ---
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [showButtonCreator, setShowButtonCreator] = useState(false);
  const [view, setView] = useState<"list" | "editor">("list");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [_inactiveAlertPageId, _setInactiveAlertPageId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState<{ show: boolean, folder?: Folder }>({ show: false });
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showLinkTypeSelector, setShowLinkTypeSelector] = useState(false);

  // Folders logic
  const [extraFolders, setExtraFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem("link_folders_v2");
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("link_folders_v2", JSON.stringify(extraFolders));
  }, [extraFolders]);

  const FOLDER_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#71717a"];

  const folders = useMemo(() => Array.from(
    new Map<string, Folder>([
      ...pages.filter(p => p.folder).map(p => {
        const name = p.folder as string;
        const existing = extraFolders.find(f => f.name === name);
        return [name, existing || { id: name, name: name, color: FOLDER_COLORS[0] }] as [string, Folder];
      }),
      ...extraFolders.map(f => [f.name, f] as [string, Folder])
    ]).values()
  ), [pages, extraFolders]);

  // Derived
  const allActivePages = pages.filter((p) => p.status === "active");
  const allDraftPages = pages.filter((p) => p.status === "draft");

  // Handlers
  const handleCreateNew = () => {
    setShowLinkTypeSelector(true);
  };

  const confirmCreation = (type: "direct" | "landing" | "both") => {
    setShowLinkTypeSelector(false);

    if (type === "both") {
      const now = Date.now();
      const page1: LinkPage = {
        ...DEFAULTS.PAGE,
        id: `page${now}`,
        status: "draft",
        name: `Pack Dual ${allDraftPages.length + 1}`,
        landingMode: "dual",
        directUrl: "",
        buttons: [],
        theme: {
          ...DEFAULTS.PAGE.theme,
          pageBorderColor: "#C9CCD1",
          backgroundType: "blur",
          backgroundStart: "#111111",
        }
      };

      setPages((prev) => [page1, ...prev]);
      setSelectedPageId(page1.id);
      setView("editor");
      toast.success("¡Flujo Dual creado!", { icon: "🚀" });
      return;
    }

    const newId = `page${Date.now()}`;
    const newPage: LinkPage = {
      ...DEFAULTS.PAGE,
      id: newId,
      status: "draft",
      name:
        type === "direct"
          ? `Directo ${allDraftPages.length + 1}`
          : `Landing ${allDraftPages.length + 1}`,
      landingMode: type === "direct" ? "direct" : "circle",
      directUrl: "",
    };

    setPages((prev) => [newPage, ...prev]);
    setSelectedPageId(newId);
    setView("editor");
    toast.success(t("dashboard.links.designStartedToast"));
  };

  const openEditor = (id: string) => {
    setSelectedPageId(id);
    setView("editor");
  };

  const handleCreateButton = (type: SocialType) => {
    const newBtn: ButtonLink = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title: SOCIAL_PRESETS[type].title,
      url: "",
      color: SOCIAL_PRESETS[type].color,
      textColor: SOCIAL_PRESETS[type].textColor,
      isActive: true,
      font: "sans",
      borderRadius: 12,
      opacity: 100,
    };
    handleUpdatePage("buttons", [...(currentPage.buttons || []), newBtn]);
    setSelectedButtonId(newBtn.id);
    setShowButtonCreator(false);
  };

  const handleDeleteButton = async (id: string) => {
    const confirmed = await showConfirm({
      title: "¿Eliminar botón?",
      message: "Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      type: "info"
    });
    if (!confirmed) return;
    handleUpdatePage("buttons", currentPage.buttons.filter(b => b.id !== id));
    if (selectedButtonId === id) setSelectedButtonId(null);
  };

  const handleUpdateButton = (field: string, value: any) => {
    const updatedButtons = currentPage.buttons.map(b => {
      if (b.id === selectedButtonId) return { ...b, [field]: value };
      return b;
    });
    handleUpdatePage("buttons", updatedButtons);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdatePage("profileImage", reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFolder = (name: string, color: string, id?: string) => {
    if (id) {
      setExtraFolders(prev => prev.map(f => f.id === id ? { ...f, name, color } : f));
    } else {
      setExtraFolders([...extraFolders, { id: Math.random().toString(36).substring(2, 9), name, color }]);
    }
    setShowFolderModal({ show: false });
  };

  const handleDeleteFolder = async (id: string) => {
    const f = extraFolders.find(f => f.id === id);
    if (!f) return;
    const confirmed = await showConfirm({
      title: "¿Eliminar carpeta?",
      message: `Se eliminará la carpeta "${f.name}". Los links dentro de ella no se borrarán.`,
      confirmText: "Eliminar",
      type: "info"
    });
    if (!confirmed) return;
    setExtraFolders(prev => prev.filter(f => f.id !== id));
    setPages(prev => prev.map(p => p.folder === f.name ? { ...p, folder: undefined } : p));
  };

  const handleUpdateRotatorLink = (buttonId: string, index: number, _field: string, value: string) => {
      const updatedButtons = currentPage.buttons.map(b => {
          if (b.id === buttonId) {
              const currentLinks = b.rotatorLinks ? [...b.rotatorLinks] : ["", "", "", "", ""];
              currentLinks[index] = value;
              return { ...b, rotatorLinks: currentLinks };
          }
          return b;
      });
      handleUpdatePage("buttons", updatedButtons);
  };

  const handleNextStep = () => {
    if (allDraftPages.length === 0) return;

    if (currentPage.status === "draft") {
      if ((currentPage.landingMode as string) === "direct") {
        if (!currentPage.directUrl || !currentPage.directUrl.trim()) {
          toast.error(`${currentPage.name} no tiene URL de destino.`, { duration: 5000 });
          return;
        }
        if (!isValidUrl(currentPage.directUrl.trim())) {
          toast.error(`URL de destino no válida.`, { duration: 4000 });
          return;
        }
      } else {
        if (!currentPage.buttons || currentPage.buttons.length === 0) {
          toast.error(`${currentPage.name} no tiene ningún botón.`, { duration: 5000 });
          return;
        }
        for (const btn of currentPage.buttons) {
          if (!btn.url || !btn.url.trim()) {
            toast.error(`El botón "${btn.title}" no tiene URL.`, { duration: 4000 });
            return;
          }
          if (!isValidUrl(btn.url.trim())) {
            toast.error(`La URL del botón "${btn.title}" no es válida.`, { duration: 4000 });
            return;
          }
        }
      }
    }

    const validDrafts = allDraftPages.filter((page: any) => {
      if (page.landingMode === "direct") return page.directUrl && page.directUrl.trim() && isValidUrl(page.directUrl.trim());
      const hasButtons = page.buttons && page.buttons.length > 0;
      const allUrlsValid = page.buttons.every((btn: any) => btn.url && btn.url.trim() && isValidUrl(btn.url.trim()));
      return hasButtons && allUrlsValid;
    });

    if (validDrafts.length === 0) return;

    try {
      localStorage.setItem("my_links_data_backup", JSON.stringify({ timestamp: Date.now(), linksData: validDrafts }));
    } catch (e) {
      console.warn("Could not save backup");
    }

    const hasMetaShield = validDrafts.some((p: any) => p.landingMode === "direct" || p.buttons?.some((b: any) => b.metaShield));
    const hasRotator = validDrafts.some((p: any) => p.buttons?.some((b: any) => b.rotatorActive));

    navigate("/dashboard/payments", {
      state: {
        pendingPurchase: {
          type: "links_bundle",
          linksData: validDrafts,
          amount: null,
          hasInstagram: hasMetaShield,
          hasRotator: hasRotator,
        },
      },
    });
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[100vh] bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={(e) => handleDragEnd(e, view)}>
        <div className="h-full flex flex-col bg-[#050505] text-white font-sans overflow-hidden">
        <Toaster position="top-center" toastOptions={{ style: { background: "#111", color: "#fff", borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' } }} />

        {showFolderModal.show && (
            <FolderModal
            folder={showFolderModal.folder}
            onSave={handleSaveFolder}
            onClose={() => setShowFolderModal({ show: false })}
            />
        )}

        <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050505] z-30 shrink-0">
            <div className="flex items-center gap-4">
              {/* Empty placeholder to keep layout balance or for future use */}
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {view === "editor" && (
                <button
                  onClick={() => setShowMobilePreview(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  <span>Vista Previa</span>
                </button>
              )}
            </div>
        </header>

        {/* MOBILE PREVIEW MODAL */}
        {showMobilePreview && (
          <div className="fixed inset-0 z-[100] bg-black lg:hidden flex flex-col animate-in fade-in zoom-in duration-300">
             <div className="flex-1 overflow-hidden relative">
                <PreviewPane 
                    currentPage={currentPage}
                    selectedButtonId={selectedButtonId}
                    setSelectedButtonId={setSelectedButtonId}
                    setShowButtonCreator={setShowButtonCreator}
                    handleNextStep={handleNextStep}
                    onClose={() => setShowMobilePreview(false)}
                    isMobileModal
                />
             </div>
          </div>
        )}

        {view === "list" ? (
            <LinksList
            pages={pages}
            folders={folders}
            folderFilter={folderFilter}
            setFolderFilter={setFolderFilter}
            handleCreateNew={handleCreateNew}
            handleOpenFolderModal={(f: Folder | undefined) => setShowFolderModal({ show: true, folder: f })}
            handleDeleteFolder={handleDeleteFolder}
            handleDeletePage={handleDeletePage}
            openEditor={openEditor}
            DEFAULTS={DEFAULTS}
            loadLinks={loadLinks}
            onMoveToFolder={handleMoveToFolder}
            setInactiveAlertPageId={_setInactiveAlertPageId}
            />
        ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
              <LinkEditor
                  currentPage={currentPage}
                  selectedPageId={selectedPageId}
                  setSelectedPageId={setSelectedPageId}
                  allActivePages={allActivePages}
                  allDraftPages={allDraftPages}
                  scrollContainerRef={scrollContainerRef}
                  showLeftArrow={false}
                  showRightArrow={false}
                  scrollLeft={() => {}}
                  scrollRight={() => {}}
                  handleCreateNew={handleCreateNew}
                  sidebarCollapsed={sidebarCollapsed}
                  setSidebarCollapsed={setSidebarCollapsed}
                  view={view}
                  setView={setView}
                  folderFilter={folderFilter}
                  showButtonCreator={showButtonCreator}
                  setShowButtonCreator={setShowButtonCreator}
                  selectedButtonId={selectedButtonId}
                  setSelectedButtonId={setSelectedButtonId}
                  sensors={sensors}
                  handleDragEnd={(e) => handleDragEnd(e, view)}
                  handleDeleteButton={handleDeleteButton}
                  handleCreateButton={handleCreateButton}
                  handleUpdateButton={handleUpdateButton}
                  handleUpdatePage={handleUpdatePage}
                  handleNextStep={handleNextStep}
                  handleDeletePage={handleDeletePage}
                  ROTATOR_SURCHARGE={ROTATOR_SURCHARGE}
                  SOCIAL_PRESETS={SOCIAL_PRESETS}
                  DEFAULTS={DEFAULTS}
                  urlError={urlError}
                  setUrlError={setUrlError}
                  isValidUrl={isValidUrl}
                  fileInputRef={fileInputRef}
                  handleImageUpload={handleImageUpload}
                  handleUpdateRotatorLink={handleUpdateRotatorLink}
                  pages={pages}
                  Icons={Icons}
                  isSaving={isSaving}
                  handleSyncButtons={handleSyncButtons}
                  onBack={() => setView("list")}
              />
              <PreviewPane 
                  currentPage={currentPage}
                  selectedButtonId={selectedButtonId}
                  setSelectedButtonId={setSelectedButtonId}
                  setShowButtonCreator={setShowButtonCreator}
                  handleNextStep={handleNextStep}
              />
              </div>
            </div>
        )}
        </div>

      {/* SELECTOR DE TIPO DE LINK */}
      {showLinkTypeSelector && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setShowLinkTypeSelector(false)}
          />
          
          <div className="relative w-full max-w-xl bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl animate-scale-up overflow-hidden">
            <button 
              onClick={() => setShowLinkTypeSelector(false)}
              className="absolute top-6 right-6 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-silver/60 hover:text-white transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="text-center mb-8 px-12">
              <h3 className="text-2xl font-black text-white mb-1 leading-tight">
                {t("dashboard.links.createLinkModalTitle", { defaultValue: "Nuevo Link" })}
              </h3>
              <p className="text-[10px] text-silver/40 font-bold uppercase tracking-widest">
                {t("dashboard.links.createLinkModalSubtitle", { defaultValue: "Selecciona el tipo de flujo" })}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => confirmCreation("direct")}
                className="group relative flex flex-col p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/40 hover:bg-red-500/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-red-500">rocket_launch</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Escudo Directo</h4>
                  <span className="text-[8px] font-black py-0.5 px-1.5 rounded border border-red-500/30 text-red-400 bg-red-500/5">META</span>
                </div>
                <p className="text-silver/40 text-[10px] leading-relaxed">
                  Redireccionamiento inmediato antidetect. Especializado para Instagram y Facebook.
                </p>
              </button>

              <button
                onClick={() => confirmCreation("landing")}
                className="group relative flex flex-col p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-blue-500">web</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Landing Page</h4>
                  <span className="text-[8px] font-black py-0.5 px-1.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/5">TIKTOK</span>
                </div>
                <p className="text-silver/40 text-[10px] leading-relaxed">
                  Perfil interactivo con múltiples botones y diseños. Optimizado para TikTok.
                </p>
              </button>
            </div>

            <button
              onClick={() => confirmCreation("both")}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.99] transition-all group border border-white/10 shadow-lg shadow-purple-500/10"
            >
              <span className="material-symbols-outlined text-xl text-white group-hover:rotate-12 transition-transform">auto_awesome</span>
              <span className="font-black text-[11px] uppercase tracking-widest text-white">
                Crear Pack Dual (Meta + TikTok)
              </span>
            </button>
          </div>
        </div>
      )}
    </DndContext>
  );
};

export default LinksPage;
