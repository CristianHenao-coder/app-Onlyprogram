import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useModal } from "@/contexts/ModalContext";
import { useTranslation } from "@/contexts/I18nContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/hooks/useAuth";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { linksService } from "@/services/links.service";

import {
  productPricingService,
  DEFAULT_PRODUCT_PRICING,
  type ProductPricingConfig,
} from "@/services/productPricing.service";

// Import Social Media Logos
import instagramLogo from "@/assets/animations/instagram.png";
import tiktokLogo from "@/assets/animations/tik-tok.png";

// Types
type TemplateType = "minimal" | "split" | "full";
type SocialType = "instagram" | "tiktok" | "telegram" | "onlyfans" | "custom";
type FontType = "sans" | "serif" | "mono" | "display";
type PageStatus = "active" | "draft";
type BackgroundType = "solid" | "gradient" | "blur";

// Social types that MUST be unique per page (except for custom which can be multiple)
const UNIQUE_SOCIAL_TYPES: SocialType[] = [
  "instagram",
  "tiktok",
  "telegram",
  "onlyfans",
];

/**
 * Utility to deduplicate buttons by type for specific social networks.
 * Keeps only the first occurrence of each unique social type.
 */
const cleanButtons = (buttons: any[]): ButtonLink[] => {
  const seenTypes = new Set<SocialType>();
  return buttons
    .filter((btn) => {
      if (UNIQUE_SOCIAL_TYPES.includes(btn.type)) {
        if (seenTypes.has(btn.type)) return false;
        seenTypes.add(btn.type);
      }
      return true;
    })
    .map((btn) => ({
      id: btn.id,
      type: btn.type,
      title: btn.title,
      subtitle: btn.subtitle || "",
      url: btn.url || "",
      color: btn.color,
      textColor: btn.textColor || btn.text_color,
      font: btn.font || "sans",
      borderRadius: btn.borderRadius ?? btn.border_radius ?? 12,
      opacity: btn.opacity ?? 100,
      isActive: btn.isActive ?? btn.is_active ?? true,
      metaShield: btn.metaShield ?? btn.meta_shield ?? false,
      rotatorActive: btn.rotatorActive ?? btn.rotator_active ?? false,
      rotatorLinks: btn.rotatorLinks || btn.rotator_links || ["", "", "", "", ""],
      deviceRedirects: btn.deviceRedirects || btn.device_redirects || { ios: "", android: "" },
    }));
};

interface ButtonLink {
  id: string;
  type: SocialType;
  title: string;
  subtitle?: string;
  url: string;
  color: string;
  textColor: string;
  font: FontType;
  borderRadius: number;
  opacity: number;
  isActive: boolean;
  // Rotator Features
  rotatorActive?: boolean;
  rotatorLinks?: string[]; // Up to 5
  // Shield Features
  metaShield?: boolean;
  // Device Redirection
  deviceRedirects?: {
    ios: string;
    android: string;
  };
}

interface LinkPage {
  id: string;
  status: PageStatus;
  name: string;
  profileName: string;
  profileImage: string;
  profileImageSize?: number; // 0-100 scale
  template: TemplateType;
  landingMode?: "circle" | "full" | "direct" | "dual";
  security_config?: {
    geoblocking?: string[];
    device_redirections?: {
      ios?: string;
      android?: string;
      desktop?: string;
    };
  };
  directUrl?: string;
  theme: {
    pageBorderColor: string;
    overlayOpacity: number; // 0-100
    backgroundType: BackgroundType;
    backgroundStart: string;
    backgroundEnd: string;
  };
  buttons: ButtonLink[];
  folder?: string;
  customDomain?: string;
  domainStatus?: "none" | "pending" | "active" | "failed";
  domainNotes?: string;
  slug?: string;
  dbStatus?: string; // Real status from DB (pending, active, etc.)
  telegramMaxCapacity?: number; // Max clicks per rotator link before rotating
  telegramRotationLimit?: number; // Rotate every N clicks (1 = round robin)
  modelName?: string; // Internal name for domain identification
}

export type PageData = LinkPage;

// Icons Components
const Icons = {
  Instagram: () => (
    <img
      src={instagramLogo}
      alt="Instagram"
      className="w-full h-full object-contain"
    />
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-blue-500">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14-2.85 0-4.643 1.743-4.643 4.96v2.54H7.5v4h2.5v11h4v-11z" />
    </svg>
  ),
  TikTok: () => (
    <img
      src={tiktokLogo}
      alt="TikTok"
      className="w-full h-full object-contain"
    />
  ),
  Telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.441z" />
    </svg>
  ),
  OnlyFans: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M16.48 2.02c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-11.5 5.5c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-7.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5z" />
    </svg>
  ),
  Custom: () => <span className="material-symbols-outlined text-xl">link</span>,
};

// Social Configs
const getSocialPresets = (t: any) => ({
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
    icon: <Icons.TikTok />,
    placeholder: t("dashboard.links.tiktokPlaceholder"),
  },
  telegram: {
    title: "Telegram",
    color: "#0088cc",
    icon: <Icons.Telegram />,
    placeholder: t("dashboard.links.telegramPlaceholder"),
  },
  onlyfans: {
    title: t("home.preview.linksDemo.vipAccess"),
    color: "#00AFF0",
    icon: <Icons.OnlyFans />,
    placeholder: t("dashboard.links.onlyfansPlaceholder"),
  },
  custom: {
    title: t("dashboard.links.editButton"),
    color: "#333333",
    icon: <Icons.Custom />,
    placeholder: "https://...",
  },
});

const getDefaults = (t: any) => ({
  PROFILE_IMAGE:
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  PAGE: {
    id: "",
    status: "draft" as PageStatus,
    name: t("dashboard.links.untitledLink"),
    profileName: t("dashboard.links.profileName"),
    profileImage:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    profileImageSize: 100,
    template: "minimal" as TemplateType,
    landingMode: "circle" as const,
    directUrl: "",
    modelName: "",
    theme: {
      pageBorderColor: "#333333",
      overlayOpacity: 40,
      backgroundType: "solid" as BackgroundType,
      backgroundStart: "#000000",
      backgroundEnd: "#1a1a1a",
    },
    buttons: [],
    domainStatus: "none" as const,
  },
});

// Font Classes Mapping
const FONT_MAP: Record<FontType, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  display: "font-sans tracking-widest",
};

// --- DND COMPONENT ---
function SortableButton({
  btn,
  isSelected,
  onClick,
  collapsed = false,
  rotatorSurcharge,
  socialPresets,
}: {
  btn: ButtonLink;
  isSelected: boolean;
  onClick: () => void;
  collapsed?: boolean;
  rotatorSurcharge: number;
  socialPresets: any;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: btn.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all relative group touch-none ${collapsed
        ? "flex items-center justify-center"
        : "flex items-center gap-3"
        } ${isSelected ? "bg-white/5 border-primary shadow-lg" : "bg-transparent border-transparent hover:bg-white/[0.02]"}`}
      title={collapsed ? btn.title : undefined} // Show title on hover only when collapsed
    >
      <div
        className={`rounded-lg flex items-center justify-center shrink-0 ${collapsed ? "h-10 w-10" : "h-8 w-8"}`}
        style={{ backgroundColor: btn.color }}
      >
        <div className={`text-white ${collapsed ? "w-6 h-6" : "w-4 h-4"}`}>
          {socialPresets[btn.type].icon}
        </div>
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-silver/60"}`}
          >
            {btn.title}
          </p>
          {btn.type === "telegram" && btn.rotatorActive && (
            <p className="text-[9px] text-green-500 font-bold uppercase tracking-wide mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">
                sync
              </span>{" "}
              {t("dashboard.links.rotatorActiveLabel", {
                amount: rotatorSurcharge,
              })}
            </p>
          )}
        </div>
      )}

      {/* Rotator indicator badge (only when collapsed) */}
      {collapsed && btn.type === "telegram" && btn.rotatorActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050505] flex items-center justify-center">
          <span className="material-symbols-outlined text-[10px] text-black">
            sync
          </span>
        </div>
      )}
    </div>
  );
}

// Utility to get background style
const getBackgroundStyle = (page: LinkPage) => {
  if (page.theme.backgroundType === "solid") {
    return { background: page.theme.backgroundStart };
  } else if (page.theme.backgroundType === "blur") {
    return {
      backgroundImage: `url(${page.profileImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {
    background: `linear-gradient(to bottom right, ${page.theme.backgroundStart}, ${page.theme.backgroundEnd})`,
  };
};

export default function Links() {
  const { t } = useTranslation();
  const DEFAULTS = getDefaults(t);
  const SOCIAL_PRESETS = getSocialPresets(t);
  const { showConfirm } = useModal();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(
    DEFAULT_PRODUCT_PRICING,
  );

  useEffect(() => {
    let mounted = true;
    productPricingService
      .get()
      .then((cfg) => {
        if (mounted) setPricingCfg(cfg);
      })
      .catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);
  const ROTATOR_SURCHARGE = pricingCfg.link.telegramAddon;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { user } = useAuth();

  // --- STATE ---
  const [pages, setPages] = useState<LinkPage[]>(() => {
    try {
      // Check if we have saved data
      const saved = localStorage.getItem("my_links_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Deduplicate by ID just in case
          const uniqueMap = new Map();
          parsed.forEach((p: any) => {
            if (p.id) uniqueMap.set(p.id, p);
          });

          return Array.from(uniqueMap.values()).map((p: any) => ({
            ...p,
            status: "draft" as PageStatus, // FORCE DRAFT FOR MIGRATION
            buttons: cleanButtons(p.buttons || []),
            theme: {
              ...p.theme,
              backgroundType: p.theme?.backgroundType || "solid",
              backgroundStart:
                p.theme?.backgroundStart ||
                (p.theme?.background && !p.theme.background.includes("gradient")
                  ? p.theme.background
                  : "#000000"),
              backgroundEnd: p.theme?.backgroundEnd || "#1a1a1a",
            },
          }));
        }
      }
    } catch (e) {
      console.error("Error parsing local links", e);
      localStorage.removeItem("my_links_data");
    }

    return [];
  });

  const [selectedPageId, setSelectedPageId] = useState<string>(
    pages[0]?.id || "page1",
  );
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [showButtonCreator, setShowButtonCreator] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "domain">(
    "profile",
  );


  const [urlError, setUrlError] = useState<string | null>(null);
  const [inactiveAlertPageId, setInactiveAlertPageId] = useState<string | null>(null);

  // Validates a URL string
  const isValidUrl = (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Deep linking: select page from URL ?id=...
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && idParam !== selectedPageId) {
      // Check if it exists in current pages
      const exists = pages.some((p) => p.id === idParam);
      if (exists) {
        setSelectedPageId(idParam);
      }
    }
  }, [searchParams, pages, selectedPageId]);

  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Derived
  const currentPage = pages.find((p) => p.id === selectedPageId) || pages[0];


  const selectedButton = currentPage?.buttons?.find(
    (b) => b.id === selectedButtonId,
  );

  // Split Pages logic moved to derived state below

  // Folder Management State
  const [showFolders, setShowFolders] = useState(false);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);

  // Extra folders created manually (persist in localStorage)
  const [extraFolders, setExtraFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("link_folders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // All folders = derived from links + manually created ones
  const folders = Array.from(
    new Set([
      ...pages.map((p) => p.folder).filter(Boolean),
      ...extraFolders,
    ]),
  ) as string[];



  // All pages for the EDITOR tab strip (always show all, regardless of folder filter)
  const allActivePages = pages.filter((p) => p.status === "active");
  const allDraftPages = pages.filter((p) => p.status === "draft");

  // Sidebar Collapse State - Auto-collapse on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Auto-collapse on mobile/tablet screens
    return window.innerWidth < 1024;
  });

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "page" | "button";
    id?: string;
    name?: string;
  } | null>(null);

  // Horizontal Scroll State for Link Navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // --- NEW CREATE FLOW STATE ---
  const [showLinkTypeSelector, setShowLinkTypeSelector] = useState(false);

  // Delete a draft link from state + localStorage
  const handleDeleteDraftPage = async (pageId: string, pageName: string) => {
    const confirmed = await showConfirm({
      title: "¿Eliminar este link?",
      message: `"${pageName || 'Link sin nombre'}" se eliminará de tus borradores. Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      type: "info",
    });
    if (!confirmed) return;

    if (user?.id) {
       try {
         const pageToDelete = pages.find(p => p.id === pageId);
         if (pageToDelete?.profileImage && pageToDelete.profileImage.includes('supabase.co')) {
             const { storageService } = await import('@/services/storageService');
             await storageService.deleteImage(pageToDelete.profileImage);
         }
         await supabase.from("smart_links").delete().eq("id", pageId).eq("user_id", user.id);
       } catch (e) {
         console.error("Error deleting pending draft from DB:", e);
       }
    }

    setPages((prev) => {
      const updated = prev.filter((p) => p.id !== pageId);
      try {
        const drafts = updated.filter((p) => !p.dbStatus && p.status === "draft");
        localStorage.setItem("my_links_data", JSON.stringify(drafts));
      } catch { }
      return updated;
    });
    if (selectedPageId === pageId) setSelectedPageId("");
    toast.success("Borrador eliminado", { icon: "🗑️" });
  };

  const handleCreateFolder = () => {
    const name = window.prompt(t("dashboard.links.newFolderPrompt"));
    if (name && name.trim()) {
      const cleanName = name.trim();
      if (folders.includes(cleanName)) {
        toast.error("Ya existe una carpeta con ese nombre");
        return;
      }
      // Persist the new folder name independently
      const updated = [...extraFolders, cleanName];
      setExtraFolders(updated);
      try {
        localStorage.setItem("link_folders", JSON.stringify(updated));
      } catch { }

      // Auto-assign to the currently edited page
      setPages((prev) =>
        prev.map((p) =>
          p.id === selectedPageId ? { ...p, folder: cleanName } : p
        )
      );

      setFolderFilter(cleanName);
      setShowFolders(true);
      toast.success(t("dashboard.links.folderCreated", { name: cleanName }));
    }
  };



  // Delete a folder (removes from extraFolders and clears from all pages)
  const handleDeleteFolder = (folderName: string) => {
    if (!window.confirm(`¿Eliminar la carpeta "${folderName}"? Los links quedarán sin carpeta.`)) return;
    const updatedFolders = extraFolders.filter((f) => f !== folderName);
    setExtraFolders(updatedFolders);
    try { localStorage.setItem("link_folders", JSON.stringify(updatedFolders)); } catch { }
    // Clear folder from all pages and persist to localStorage
    setPages((prev) => {
      const updated = prev.map((p) => (p.folder === folderName ? { ...p, folder: "" } : p));
      try {
        const drafts = updated.filter((p) => p.status === "draft");
        if (drafts.length > 0) localStorage.setItem("my_links_data", JSON.stringify(drafts));
      } catch { }
      return updated;
    });
    if (folderFilter === folderName) setFolderFilter(null);
    toast.success(`Carpeta "${folderName}" eliminada`);
  };

  // Rename a folder
  const handleRenameFolder = (oldName: string) => {
    const newName = window.prompt("Nuevo nombre de carpeta:", oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const clean = newName.trim();
    if (folders.includes(clean)) { toast.error("Ya existe una carpeta con ese nombre"); return; }
    const updatedFolders = extraFolders.map((f) => (f === oldName ? clean : f));
    setExtraFolders(updatedFolders);
    try { localStorage.setItem("link_folders", JSON.stringify(updatedFolders)); } catch { }
    // Rename in all pages and persist
    setPages((prev) => {
      const updated = prev.map((p) => (p.folder === oldName ? { ...p, folder: clean } : p));
      try {
        const drafts = updated.filter((p) => p.status === "draft");
        if (drafts.length > 0) localStorage.setItem("my_links_data", JSON.stringify(drafts));
      } catch { }
      return updated;
    });
    if (folderFilter === oldName) setFolderFilter(clean);
    toast.success(`Carpeta renombrada a "${clean}"`);
  };


  // --- SUPABASE INTEGRATION ---

  // 1. Fetch Links from DB
  useEffect(() => {
    if (!user?.id) return;

    const fetchLinks = async () => {
      try {
        // Fetch ALL user links (active + pending) so user can see them
        const { data, error } = await supabase
          .from("smart_links")
          .select(
            `
            *,
            smart_link_buttons (*)
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Map DB links (active AND pending)
        const dbPages: LinkPage[] =
          data && data.length > 0
            ? data
              .map((link) => ({
                id: link.id,
                // Map DB statuses: active/is_active=true ? 'active', everything else ? 'draft'
                status: (link.is_active === true
                  ? "active"
                  : "draft") as PageStatus,
                name:
                  link.config?.name ||
                  link.config?.profile?.name ||
                  link.slug,
                profileName: link.config?.profile?.title || link.title || "",
                profileImage:
                  link.config?.profile?.image ||
                  link.photo ||
                  DEFAULTS.PROFILE_IMAGE,
                profileImageSize: link.config?.profileImageSize || 50,
                folder: link.config?.folder || "",
                template:
                  (link.config?.template as TemplateType) || "minimal",
                landingMode:
                  (link.config?.landingMode as "circle" | "full") || "circle",
                theme: {
                  pageBorderColor:
                    link.config?.theme?.pageBorderColor || "#333333",
                  overlayOpacity: link.config?.theme?.overlayOpacity || 40,
                  backgroundType:
                    link.config?.theme?.backgroundType || "solid",
                  backgroundStart:
                    link.config?.theme?.backgroundStart || "#000000",
                  backgroundEnd:
                    link.config?.theme?.backgroundEnd || "#1a1a1a",
                },
                customDomain: link.custom_domain,
                domainStatus: (link.domain_status as any) || "none",
                domainNotes: link.domain_notes || "",
                slug: link.slug,
                // Store pending status to show badge in UI
                dbStatus: link.status || "pending",
                // Telegram Rotator capacity settings
                telegramMaxCapacity: link.telegram_max_capacity || undefined,
                telegramRotationLimit: link.telegram_rotation_limit || undefined,
                buttons: cleanButtons(link.smart_link_buttons || []),
              }))
            : [];

        // Get drafts from localStorage
        const localDrafts: LinkPage[] = (() => {
          try {
            const saved = localStorage.getItem("my_links_data");
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                return parsed.map((p: any) => ({
                  ...p,
                  buttons: cleanButtons(p.buttons || []),
                  status: "draft" as PageStatus, // Todos los de localStorage son drafts
                }));
              }
            }
          } catch (e) {
            console.error("Error reading localStorage drafts:", e);
          }
          return [];
        })();

        // Merge and Deduplicate: DB active links + localStorage drafts
        const pagesMap = new Map<string, LinkPage>();

        // 1. Add DB links (priority)
        dbPages.forEach((p) => pagesMap.set(p.id, p));

        // 2. Add local drafts only if they don't already exist in DB (by ID only)
        // NOTE: We removed name-based deduplication because it was too aggressive
        // and incorrectly removed valid local drafts that happened to share a name with a DB link.
        const staleDraftIds: string[] = [];
        localDrafts.forEach((p) => {
          const isDuplicateById = pagesMap.has(p.id);

          if (!isDuplicateById) {
            pagesMap.set(p.id, p);
          } else {
            staleDraftIds.push(p.id);
          }
        });

        // 3. Cleanup stale drafts from localStorage
        if (staleDraftIds.length > 0) {
          try {
            const updatedLocalDrafts = localDrafts.filter(
              (p) => !staleDraftIds.includes(p.id),
            );
            localStorage.setItem(
              "my_links_data",
              JSON.stringify(updatedLocalDrafts),
            );
            console.log(
              `Deduplicated ${staleDraftIds.length} stale drafts from localStorage`,
            );
          } catch (e) {
            console.error("Error cleaning up stale drafts:", e);
          }
        }

        const allPages = Array.from(pagesMap.values());

        // Removed force default creation logic to allow empty links state
        setPages(allPages);
        if (allPages.length > 0) {
          const exists = allPages.find((p) => p.id === selectedPageId);
          if (!exists) setSelectedPageId(allPages[0].id);
        }
      } catch (error) {
        console.error("Error fetching links:", error);
        toast.error(t("dashboard.links.errorLoading"));
      } finally {
        setInitialLoad(false);
      }
    };

    fetchLinks();
  }, [user?.id]);

  // --- REAL-TIME ACTIVATION NOTIFICATION ---
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`activation-notif-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "smart_links",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Detect status change to active
          if (
            (oldRecord.status === "pending" || oldRecord.status === "draft") &&
            newRecord.status === "active"
          ) {
            const linkName = newRecord.title || newRecord.profile_name || "Tu link";
            
            toast.success(`¡Tu link "${linkName}" ha sido activado exitosamente!`, {
              duration: 30000,
              icon: "🚀",
              style: {
                background: "#22c55e",
                color: "#fff",
                fontWeight: "bold",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.2)"
              },
            });

            // Trigger fetchLinks if it was defined in a way we can call it, 
            // but since it's local to the other effect, we just rely on state 
            // management or we could re-trigger the other effect if we added 
            // a 'refreshCount' state. For now, the user can refresh or 
            // wait for the next periodic sync if any. 
            // Pro-tip: adding a manual refresh trigger is better.
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 2. Sync to DB (Debounced + Visibility Change)
  useEffect(() => {
    if (initialLoad) return;
    if (!user) return;

    const syncToDb = async () => {
      setIsSaving(true);
      try {
        // SAFETY: Always backup ALL current pages to localStorage
        // This ensures that even if DB sync fails, the user's local work isn't lost.
        try {
          localStorage.setItem("my_links_data", JSON.stringify(pages));
        } catch (e) {
          console.error("Error backing up to localStorage:", e);
        }

        const currentPageToSave = pages.find((p) => p.id === selectedPageId);
        if (!currentPageToSave) return;

        const isDraft =
          currentPageToSave.status === "draft" && !currentPageToSave.dbStatus;

        if (isDraft) {
          // Drafts are already backed up above
          return;
        } else {
          // ACTIVE LINK: Save to Supabase
          const updates = {
            title: currentPageToSave.profileName,
            photo: currentPageToSave.profileImage,
            // Only set is_active=true if already active; don't force-activate pending links
            ...(currentPageToSave.status === "active"
              ? { is_active: true }
              : {}),
            custom_domain: currentPageToSave.customDomain,
            domain_status: currentPageToSave.domainStatus,
            domain_notes: currentPageToSave.domainNotes,
            config: {
              template: currentPageToSave.template,
              theme: currentPageToSave.theme,
              name: currentPageToSave.name,
              folder: currentPageToSave.folder,
              landingMode: currentPageToSave.landingMode,
              profileImageSize: currentPageToSave.profileImageSize,
              modelName: currentPageToSave.modelName,
            },
            // Telegram Rotator capacity persisted as dedicated columns
            ...(currentPageToSave.telegramMaxCapacity !== undefined
              ? { telegram_max_capacity: currentPageToSave.telegramMaxCapacity }
              : {}),
            ...(currentPageToSave.telegramRotationLimit !== undefined
              ? { telegram_rotation_limit: currentPageToSave.telegramRotationLimit }
              : {}),
          };

          const { error } = await supabase
            .from("smart_links")
            .update(updates)
            .eq("id", currentPageToSave.id);

          if (error) throw error;

          // SPECIAL: Sync buttons to the dedicated table
          await linksService.updateButtons(
            currentPageToSave.id,
            currentPageToSave.buttons,
          );
        }
      } catch (err) {
        console.error("Error saving link:", err);
      } finally {
        setIsSaving(false);
      }
    };

    const timer = setTimeout(syncToDb, 500);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        syncToDb();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Auto-save on navigation (component unmount)
      syncToDb();
    };
  }, [pages, user, selectedPageId, initialLoad]);

  // Migration: Update old Instagram button colors to white
  useEffect(() => {
    const needsMigration = pages.some((page) =>
      page.buttons.some(
        (btn) =>
          btn.type === "instagram" &&
          (btn.color === "#E1306C" || btn.color === "#8B5CF6"),
      ),
    );

    if (needsMigration) {
      setPages((prevPages) =>
        prevPages.map((page) => ({
          ...page,
          buttons: page.buttons.map((btn) =>
            btn.type === "instagram" &&
              (btn.color === "#E1306C" || btn.color === "#8B5CF6")
              ? { ...btn, color: "#FFFFFF" }
              : btn,
          ),
        })),
      );
    }
  }, []);

  // Keyboard support for confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteConfirm && e.key === "Escape") {
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteConfirm]);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10,
    );
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [pages]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  // --- HANDLERS ---
  const handleAddPage = () => {
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
        modelName: `Pack ${allDraftPages.length + 1}`,
        landingMode: "dual",
        directUrl: "",
        buttons: [],
        theme: {
          ...DEFAULTS.PAGE.theme,
          pageBorderColor: "#C9CCD1", // Silver premium
          backgroundType: "blur",
          backgroundStart: "#111111",
        }
      };

      setPages((prev) => [...prev, page1]);
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

    setPages((prev) => [...prev, newPage]);
    setSelectedPageId(newId);
    setView("editor");
    toast.success(t("dashboard.links.designStartedToast"));
  };

  const handleUpdatePage = (field: string, value: any) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== selectedPageId) return p;

        if (field === "theme.pageBorderColor")
          return { ...p, theme: { ...p.theme, pageBorderColor: value } };
        if (field === "theme.overlayOpacity")
          return { ...p, theme: { ...p.theme, overlayOpacity: value } };
        if (field === "theme.backgroundType")
          return { ...p, theme: { ...p.theme, backgroundType: value } };
        if (field === "theme.backgroundStart")
          return { ...p, theme: { ...p.theme, backgroundStart: value } };
        if (field === "theme.backgroundEnd")
          return { ...p, theme: { ...p.theme, backgroundEnd: value } };

        return { ...p, [field]: value };
      }),
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdatePage("profileImage", reader.result as string);
        toast.success(t("dashboard.links.imageUpdatedToast"));
      };
      reader.readAsDataURL(file);
    }
  };

  // DnD Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== selectedPageId) return p;
          const oldIndex = p.buttons.findIndex((b) => b.id === active.id);
          const newIndex = p.buttons.findIndex((b) => b.id === over?.id);
          return { ...p, buttons: arrayMove(p.buttons, oldIndex, newIndex) };
        }),
      );
    }
  };

  // Button CRUD
  const handleCreateButton = (type: SocialType) => {
    // Check if button type already exists
    const existingButton = currentPage.buttons.find((btn) => btn.type === type);

    if (existingButton) {
      toast.error(
        t("dashboard.links.duplicateButtonError", {
          type: SOCIAL_PRESETS[type].title,
        }),
      );
      return;
    }

    const config = SOCIAL_PRESETS[type];
    const newButton: ButtonLink = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title: type === "custom" ? t("dashboard.links.createLink") : config.title,
      subtitle: "",
      url: "",
      color: config.color,
      textColor: (config as any).textColor || "#FFFFFF",
      font: "sans",
      borderRadius: 12,
      opacity: 100,
      isActive: true,
      rotatorActive: false,
      rotatorLinks: ["", "", "", "", ""],
      metaShield: type === "tiktok" ? true : false,
    };
    setPages((prev) =>
      prev.map((p) =>
        p.id === selectedPageId
          ? { ...p, buttons: [...p.buttons, newButton] }
          : p,
      ),
    );
    setSelectedButtonId(newButton.id);
    // Removed auto-close: setShowButtonCreator(false);
    toast.success(t("dashboard.links.buttonAddedToast"));
  };

  const handleDeleteButton = async (id: string) => {
    const confirmed = await showConfirm({
      title: t("dashboard.links.deleteButtonConfirmTitle"),
      message: t("dashboard.links.deleteButtonConfirmMsg"),
      confirmText: t("dashboard.links.deleteButtonConfirmBtn"),
      // cancelText: 'Cancelar', // Removed to simplify
      type: "info", // Changed from warning to info/default for blue style
    });

    if (confirmed) {
      setPages((prev) =>
        prev.map((p) =>
          p.id === selectedPageId
            ? { ...p, buttons: p.buttons.filter((b) => b.id !== id) }
            : p,
        ),
      );
      if (selectedButtonId === id) setSelectedButtonId(null);
      toast(t("dashboard.links.buttonDeletedToast"), { icon: "???" });
    }
  };

  const handleUpdateButton = (field: keyof ButtonLink, value: any) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === selectedPageId
          ? {
            ...p,
            buttons: p.buttons.map((b) =>
              b.id === selectedButtonId ? { ...b, [field]: value } : b,
            ),
          }
          : p,
      ),
    );
  };

  // Rotator Handler
  const handleUpdateRotatorLink = (index: number, val: string) => {
    if (!selectedButton) return;
    const currentLinks = selectedButton.rotatorLinks
      ? [...selectedButton.rotatorLinks]
      : ["", "", "", "", ""];
    currentLinks[index] = val;
    handleUpdateButton("rotatorLinks", currentLinks);
  };

  // --- VIEW STATE: 'list' = Mis Links, 'editor' = Builder ---
  const [view, setView] = useState<"list" | "editor">("list");

  const openEditor = (pageId?: string) => {
    if (pageId) setSelectedPageId(pageId);
    setView("editor");
  };

  const handleCreateNew = () => {
    setShowLinkTypeSelector(true);
  };

  // GUARD: Prevents crash while loading
  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[100vh] bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white font-sans overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{ style: { background: "#333", color: "#fff" } }}
      />

      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050505] z-30 shrink-0">
        <div className="flex items-center gap-4">
          {view === "editor" && (
            <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-700 mr-4 pr-4 border-r border-white/10 h-10">
               {/* Empty placeholder or removed badge container */}
            </div>
          )}

          {view === "editor" && (
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-2 text-silver/50 hover:text-white transition-colors text-sm font-bold mr-2"
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              <span className="hidden sm:inline">
                {t("dashboard.links.linksListBack") || "Mis Links"}
              </span>
            </button>
          )}
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">
              {view === "editor" ? "edit" : "layers"}
            </span>
          </div>
          <div className="flex items-center gap-3">
             <h1 className="text-sm font-black uppercase tracking-widest text-white">
               {view === "editor"
                 ? currentPage?.modelName || currentPage?.name || t("dashboard.links.editorTitle")
                 : t("dashboard.links.managerTitle")}
             </h1>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {view === "editor" && (
            <span className="text-[10px] uppercase font-bold text-silver/30 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${isSaving ? "bg-yellow-500" : "bg-green-500"} animate-pulse`}
              ></span>
              {isSaving ? t("common.verifying") : t("dashboard.links.autosave")}
            </span>
          )}
        </div>
      </header>

      {/* --- VISTA LISTA --- */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Stats + CTA */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white">
                  {t("dashboard.links.myLinks")}
                </h2>
                <p className="text-sm text-silver/40 mt-1">
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
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">
                  add_circle
                </span>
                <span>{t("dashboard.links.createLink")}</span>
              </button>
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

            {/* DB Links (activos + pendientes) */}
            {pages.filter((p) => p.dbStatus).length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-silver/40 mb-4">
                  {t("dashboard.links.sentLinks")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages
                    .filter((p) => p.dbStatus)
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
                        bgTrash = "bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/40 text-blue-400";
                        accentColor = "text-blue-400";
                      }

                      return (
                      <div
                        key={page.id}
                        onClick={() => openEditor(page.id)}
                        className={`relative group rounded-2xl border bg-white/[0.02] overflow-hidden hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${borderClass}`}
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
                              {page.profileImage &&
                                page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                                <img
                                  src={page.profileImage}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                  <span className="material-symbols-outlined text-2xl text-white/40">
                                    person
                                  </span>
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
                          {page.folder && (
                            <div className="mt-2 flex justify-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${accentBg} ${accentBorder} ${accentColor}`}>
                                <span className="material-symbols-outlined text-[10px]">folder</span>
                                {page.folder}
                              </span>
                            </div>
                          )}

                          {/* Buttons */}
                          <div className="mt-3 flex gap-2">
                             <button
                              onClick={(e) => { e.stopPropagation(); openEditor(page.id); }}
                              className={`flex-1 py-2 rounded-xl border transition-all flex items-center justify-center gap-1 text-xs font-bold ${accentBg} ${accentBorder} ${accentColor}`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                edit
                              </span>
                              {t("dashboard.links.config")}
                            </button>
                            {page.slug && (
                              page.status === 'active' ? (
                                <a
                                  href={`/${page.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    open_in_new
                                  </span>
                                </a>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInactiveAlertPageId(page.id);
                                  }}
                                  className="py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-xs font-bold text-orange-400 transition-all flex items-center justify-center"
                                  title="Link no activo"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    lock
                                  </span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Local Drafts */}
            {pages.filter((p) => !p.dbStatus && p.status === "draft").length >
              0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-silver/40 mb-4">
                    {t("dashboard.links.draftsTitle")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages
                      .filter((p) => !p.dbStatus && p.status === "draft")
                      .map((page) => {
                        const isDirect = page.landingMode === "direct";
                        const isDual = page.landingMode === "dual";
                        const hasPair = pages.some(p => p.modelName === page.modelName && p.modelName && p.id !== page.id);
                        let borderClass = "border-white/[0.08] hover:border-yellow-500/40 hover:shadow-yellow-500/10";
                        let bgTrash = "bg-primary/20 hover:bg-primary/40 border-primary/40 text-primary";
                        
                        if (hasPair || isDual) {
                          borderClass = "border-purple-500/30 border-dashed hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]";
                          bgTrash = "bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/40 text-purple-400";
                        } else if (isDirect) {
                          borderClass = "border-red-500/30 border-dashed hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]";
                          bgTrash = "bg-red-500/20 hover:bg-red-500/40 border-red-500/40 text-red-400";
                        } else {
                          borderClass = "border-blue-500/30 border-dashed hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]";
                          bgTrash = "bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/40 text-blue-400";
                        }

                        return (
                        <div
                          key={page.id}
                          onClick={() => openEditor(page.id)}
                          className={`relative group rounded-2xl border bg-white/[0.01] overflow-hidden hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${borderClass}`}
                        >
                          {/* Delete button - top left */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDraftPage(page.id, page.name); }}
                            title="Eliminar borrador"
                            className={`absolute top-2 left-2 z-20 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg border ${bgTrash}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                          <div
                            className="h-28 w-full relative"
                            style={getBackgroundStyle(page)}
                          >
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                              <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden bg-gray-800">
                                {page.profileImage &&
                                  page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                                  <img
                                    src={page.profileImage}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <span className="material-symbols-outlined text-2xl text-white/20">
                                      edit
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-9 pb-4 px-4 text-center">
                            <p className="font-bold text-sm text-white/70 truncate">
                              {page.name || t("dashboard.links.untitledLink")}
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-yellow-500">
                                {t("dashboard.links.creatingDraft")}
                              </span>
                            </div>
                            {/* Folder badge (read-only in list view — assign inside editor) */}
                            {page.folder && (
                              <div className="mt-2 flex justify-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-bold text-yellow-400">
                                  <span className="material-symbols-outlined text-[10px]">folder</span>
                                  {page.folder}
                                </span>
                              </div>
                            )}
                            <div className="mt-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditor(page.id); }}
                                className="w-full py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-xs font-bold text-yellow-400 transition-all flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  edit
                                </span>
                                {t("dashboard.links.continueEditing")}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


          </div>
        </div>
      )}

      {/* --- VISTA EDITOR --- */}
      {view === "editor" && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* COL 1: Editor & Config (Main Area) */}
          <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden order-2 lg:order-first transition-all">
            {/* TOP BAR: Page Switcher (Horizontal) with Scroll Arrows */}
            <div className="h-20 border-b border-white/5 bg-[#080808] flex items-center relative z-20 shrink-0">
              {/* Left Arrow */}
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
                  onClick={handleAddPage}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full border border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all text-silver/40 hover:text-primary shrink-0 group"
                >
                  <span className="material-symbols-outlined text-xl group-active:scale-90 transition-transform">
                    add
                  </span>
                  <span className="text-[7px] font-bold uppercase tracking-tighter">
                    {t("common.create", { defaultValue: "Crear" })}
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
                      {page.profileImage &&
                        page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                        <img
                          src={page.profileImage}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">
                            person
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-[60px]">
                      <p
                        className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-silver/60"}`}
                      >
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

                {/* Drafts */}
                {allDraftPages.length > 0 && (
                  <div className="h-8 w-px bg-white/10 shrink-0 mx-2"></div>
                )}
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
                      {page.profileImage &&
                        page.profileImage !== DEFAULTS.PROFILE_IMAGE ? (
                        <img
                          src={page.profileImage}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-[60px]">
                      <p
                        className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-silver/60"}`}
                      >
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
              </div>

              {/* Right Arrow */}
              {showRightArrow && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#080808] via-[#080808]/90 to-transparent z-30 flex items-center justify-end pr-2 hover:pr-1 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-white text-lg group-hover:text-primary">
                      chevron_right
                    </span>
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
                                Instagram + TikTok
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
                className={`border-r border-white/5 flex flex-col bg-[#070707] shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-16 md:w-20" : "w-full sm:w-64 lg:w-80"}`}
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
                            defaultValue: "Expandir men�",
                          })
                          : t("dashboard.links.collapseMenu", {
                            defaultValue: "Colapsar men�",
                          })
                      }
                    >
                      <span className="material-symbols-outlined text-white text-xl">
                        menu
                      </span>
                    </button>

                    {/* Folders Filter Indicator (Collapsed Mode) */}
                    {sidebarCollapsed && folderFilter && (
                      <div
                        className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30"
                        title={t("dashboard.links.filteredBy", {
                          defaultValue: "Filtrado por: {{folder}}",
                          folder: folderFilter,
                        })}
                      >
                        <span className="material-symbols-outlined text-sm">
                          folder
                        </span>
                      </div>
                    )}
                  </div>

                  {/* EXPANDED MENU ACTIONS */}
                  {!sidebarCollapsed && (
                    <div className="px-4 pb-4 space-y-3 animate-fade-in">
                      {/* FOLDERS SECTION */}
                      <div className="border border-white/5 rounded-xl bg-white/[0.02] overflow-hidden transition-all">
                        <button
                          onClick={() => setShowFolders(!showFolders)}
                          className="w-full flex items-center justify-between p-3 text-xs font-bold text-silver/60 hover:text-white hover:bg-white/5 text-left transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`material-symbols-outlined text-base ${currentPage.folder ? "text-primary" : ""}`}
                            >
                              {currentPage.folder ? "folder_open" : "folder"}
                            </span>
                            <span
                              className={currentPage.folder ? "text-primary" : ""}
                            >
                              {currentPage.folder ||
                                t("dashboard.links.myFolders", {
                                  defaultValue: "Mis Carpetas",
                                })}
                            </span>
                          </div>
                          <span
                            className={`material-symbols-outlined text-sm transition-transform duration-300 ${showFolders ? "rotate-180" : ""}`}
                          >
                            expand_more
                          </span>
                        </button>

                        {(showFolders || currentPage.folder) && (
                          <div
                            className={`space-y-1 overflow-hidden transition-all ${showFolders ? "max-h-64 p-2 pt-0 opacity-100" : "max-h-0 opacity-0"}`}
                          >
                            <button
                              onClick={handleCreateFolder}
                              className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">
                                add
                              </span>
                              <span>
                                {t("dashboard.links.createFolder", {
                                  defaultValue: "Crear carpeta",
                                })}
                              </span>
                            </button>

                            <button
                              onClick={() => handleUpdatePage("folder", "")}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors ${!currentPage.folder ? "bg-white/10 text-white" : "text-silver/40 hover:text-white hover:bg-white/5"}`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                grid_view
                              </span>
                              <span>
                                Sin Carpeta
                              </span>
                            </button>

                            {folders.map((f) => (
                              <div
                                key={f}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-colors group ${f === currentPage.folder ? "bg-primary/20 text-primary border border-primary/20" : "text-silver/40 hover:text-white hover:bg-white/5"}`}
                              >
                                {/* Click on name to select folder for current link */}
                                <button
                                  onClick={() => {
                                    const next = f === currentPage.folder ? "" : f;
                                    handleUpdatePage("folder", next);
                                    if (next) toast.success(`Asignado a la carpeta "${next}"`);
                                    else toast.success(`Carpeta removida`);
                                  }}
                                  className="flex items-center gap-2 truncate flex-1 text-left"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {f === currentPage.folder ? "folder_open" : "folder"}
                                  </span>
                                  <span className="truncate max-w-[90px]">{f}</span>
                                  {f === currentPage.folder && (
                                    <span className="material-symbols-outlined text-xs">check</span>
                                  )}
                                </button>
                                {/* Edit + Delete icons */}
                                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRenameFolder(f); }}
                                    className="p-1 rounded hover:bg-white/10 text-silver/40 hover:text-white transition-colors"
                                    title="Renombrar carpeta"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }}
                                    className="p-1 rounded hover:bg-red-500/10 text-silver/40 hover:text-red-400 transition-colors"
                                    title="Eliminar carpeta"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ACTIONS: Only show if NOT in Direct Mode */}
                      {(currentPage.landingMode as string) !== "direct" && (
                        <>
                          {/* EDIT PROFILE BUTTON */}
                          <button
                            onClick={() => {
                              setSelectedButtonId(null);
                              setShowButtonCreator(false);
                            }}
                            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 touch-manipulation"
                          >
                            <span className="material-symbols-outlined text-xl">
                              settings
                            </span>
                            <span>{t("dashboard.links.editProfile", { defaultValue: "Editar Perfil" })}</span>
                          </button>

                          {/* ADD BUTTON */}
                          <button
                            onClick={() => setShowButtonCreator(true)}
                            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
                          >
                            <span className="material-symbols-outlined text-xl">
                              add_circle
                            </span>
                            <span>{t("dashboard.links.addButton")}</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* COLLAPSED ACTIONS: Only show if NOT in Direct Mode */}
                  {sidebarCollapsed && (currentPage.landingMode as string) !== "direct" && (
                    <div className="px-2 pb-3 flex flex-col items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedButtonId(null);
                          setShowButtonCreator(false);
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
                        title={t("dashboard.links.editProfile", { defaultValue: "Editar Perfil" })}
                      >
                        <span className="material-symbols-outlined text-xl">
                          settings
                        </span>
                      </button>
                      <button
                        onClick={() => setShowButtonCreator(true)}
                        className="w-10 h-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                        title={t("dashboard.links.addButton")}
                      >
                        <span className="material-symbols-outlined text-xl">
                          add
                        </span>
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
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={currentPage.buttons}
                        strategy={verticalListSortingStrategy}
                      >
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
                                collapsed={sidebarCollapsed}
                                rotatorSurcharge={ROTATOR_SURCHARGE}
                                socialPresets={SOCIAL_PRESETS}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteButton(btn.id);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-silver/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  delete
                                </span>
                              </button>
                            </div>
                          ))}
                          {currentPage.buttons.length === 0 &&
                            !showButtonCreator && (
                              <div className="text-center py-10 px-4 border-2 border-dashed border-white/5 rounded-xl">
                                <span className="material-symbols-outlined text-3xl text-silver/20 mb-2">
                                  touch_app
                                </span>
                                <p className="text-xs text-silver/40">
                                  {t("dashboard.links.emptyLinkMsg", {
                                    defaultValue:
                                      "Tu link está vacío. ¡Añade tu primer botón!",
                                  })}
                                </p>
                              </div>
                            )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                {/* STICKY BOTTOM ACTIONS */}
                <div className="p-4 border-t border-white/5 bg-[#050505]">
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: "page",
                        name: currentPage.name,
                      });
                      setShowDeleteConfirm(true);
                    }}
                    className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/10 bg-white/5 transition-all ${sidebarCollapsed ? "flex-col" : ""}`}
                    title={sidebarCollapsed ? "Borrar Link" : undefined}
                  >
                    <span
                      className={`material-symbols-outlined ${sidebarCollapsed ? "text-lg" : "text-sm"}`}
                    >
                      delete
                    </span>
                    {!sidebarCollapsed &&
                      t("dashboard.links.deleteLink", {
                        defaultValue: "Borrar Link",
                      })}
                  </button>
                </div>
              </div>

              {/* MAIN EDITOR AREA */}
              <div className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-700 ${currentPage.landingMode === 'dual' ? 'bg-[#080808] border-x border-purple-500/30 shadow-[inset_0_0_50px_rgba(168,85,247,0.05)]' : 'bg-[#050505]'}`}>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 pb-32">
                  <div className="max-w-2xl mx-auto">
                    {/* ANUNCIO FLUJO DUAL */}
                    {(pages.some(p => p.modelName === currentPage.modelName && p.modelName && p.id !== currentPage.id) || currentPage.landingMode === 'dual') && (
                      <div className="mb-8 p-6 rounded-[2rem] bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-transparent border border-purple-500/30 relative overflow-hidden group animate-in slide-in-from-top-4 duration-700">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all duration-1000" />
                        
                        <div className="flex items-start gap-5 relative z-10">
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
                          <button
                            onClick={() => setShowButtonCreator(false)}
                            className="p-2 hover:bg-white/10 rounded-full text-silver/50 hover:text-white transition-colors"
                          >
                            <span className="material-symbols-outlined">
                              arrow_back
                            </span>
                          </button>
                          <h2 className="text-xl font-bold text-white max-w-2xl">
                            {t("dashboard.links.addButton")}
                          </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {(Object.keys(SOCIAL_PRESETS) as SocialType[]).map(
                            (key) => (
                              <button
                                key={key}
                                onClick={() => handleCreateButton(key)}
                                className="aspect-square rounded-2xl bg-[#0A0A0A] border border-white/10 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-white/5 hover:-translate-y-1 transition-all group p-4"
                              >
                                <div className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                                  {SOCIAL_PRESETS[key].icon}
                                </div>
                                <span className="text-xs font-bold text-silver/60 group-hover:text-white capitalize">
                                  {SOCIAL_PRESETS[key].title}
                                </span>
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* BUTTON EDITOR */}
                    {selectedButton && !showButtonCreator && (
                      <div className="animate-slide-up space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white">
                              {SOCIAL_PRESETS[selectedButton.type].icon}
                            </div>
                            <div>
                              <h2 className="text-lg font-bold">
                                {t("dashboard.links.editButton", {
                                  defaultValue: "Editar Bot�n",
                                })}
                              </h2>
                              <p className="text-[10px] text-silver/40 uppercase font-bold tracking-wider">
                                {selectedButton.type}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedButtonId(null)}
                            className="p-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
                          >
                            {t("common.saveAndClose", {
                              defaultValue: "Guardar y Cerrar",
                            })}
                          </button>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                                {t("dashboard.links.title")}
                              </label>
                              <input
                                type="text"
                                value={selectedButton.title}
                                onChange={(e) =>
                                  handleUpdateButton("title", e.target.value)
                                }
                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                                {t("dashboard.links.mainUrl")}
                              </label>
                              <div className="flex items-center bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus-within:border-primary/50">
                                <span className="material-symbols-outlined text-silver/20 mr-2 text-lg">
                                  link
                                </span>
                                <input
                                  type="text"
                                  value={selectedButton.url}
                                  onChange={(e) => {
                                    handleUpdateButton("url", e.target.value);
                                    setUrlError(null);
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (!val) {
                                      setUrlError('La URL es obligatoria para este botón.');
                                    } else if (!isValidUrl(val)) {
                                      setUrlError('Debe ser una URL válida que empiece con https://');
                                    } else {
                                      setUrlError(null);
                                    }
                                  }}
                                  className={`flex-1 bg-transparent text-sm font-mono focus:outline-none ${urlError ? 'text-red-400' : 'text-silver'
                                    }`}
                                  placeholder={
                                    SOCIAL_PRESETS[selectedButton.type]
                                      .placeholder || "https://..."
                                  }
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

                          {/* APPEARANCE CONTROLS */}
                          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">
                                palette
                              </span>
                              {t("dashboard.links.appearance", {
                                defaultValue: "Apariencia",
                              })}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                                  {t("dashboard.links.background", {
                                    defaultValue: "Fondo",
                                  })}
                                </label>
                                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                                  <input
                                    type="color"
                                    value={selectedButton.color}
                                    onChange={(e) =>
                                      handleUpdateButton(
                                        "color",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                                  />
                                  <span className="text-[10px] font-mono text-silver/50 uppercase">
                                    {selectedButton.color}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                                  {t("dashboard.links.textLabel", {
                                    defaultValue: "Texto",
                                  })}
                                </label>
                                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                                  <input
                                    type="color"
                                    value={
                                      selectedButton.textColor || "#FFFFFF"
                                    }
                                    onChange={(e) =>
                                      handleUpdateButton(
                                        "textColor",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                                  />
                                  <span className="text-[10px] font-mono text-silver/50 uppercase">
                                    {selectedButton.textColor || "#FFFFFF"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                                {t("dashboard.links.typography")}
                              </label>
                              <div className="grid grid-cols-4 gap-2">
                                {(
                                  [
                                    "sans",
                                    "serif",
                                    "mono",
                                    "display",
                                  ] as FontType[]
                                ).map((font) => (
                                  <button
                                    key={font}
                                    onClick={() =>
                                      handleUpdateButton("font", font)
                                    }
                                    className={`py-2 px-1 rounded-lg text-xs border transition-all ${selectedButton.font === font ? "bg-primary text-white border-primary" : "bg-black/20 text-silver/60 border-transparent hover:border-white/10"}`}
                                  >
                                    <span className={FONT_MAP[font]}>Aa</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* SMART REDIRECT (iOS/Android URLs) */}
                          <div className="p-6 bg-[#0a0a0b] border border-white/5 rounded-2xl space-y-6">
                            <div className="flex items-center gap-2 text-indigo-400">
                              <span className="material-symbols-outlined text-xl">
                                devices
                              </span>
                              <span className="text-sm font-bold tracking-tight">
                                Smart Redirect (Device targeting)
                              </span>
                            </div>

                            <p className="text-[10px] text-silver/40 leading-relaxed font-medium">
                              Opcional: Define links específicos para sistemas operativos. Si un campo queda vacío, se usará el link principal normal del botón.
                            </p>

                            <div className="space-y-5">
                              {/* Apple Link */}
                              <div className="space-y-3">
                                <label className="flex items-center gap-2 text-silver/60">
                                  <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                  </svg>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-silver/30 mt-0.5">LINK PARA IOS (IPHONE/IPAD)</span>
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://onlyfans.com/perfil_ios"
                                  value={selectedButton.deviceRedirects?.ios || ""}
                                  onChange={(e) => {
                                    const current = selectedButton.deviceRedirects || { ios: "", android: "" };
                                    handleUpdateButton("deviceRedirects", { ...current, ios: e.target.value });
                                  }}
                                  className="w-full bg-[#030303] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-silver focus:outline-none focus:border-white/20 transition-all font-mono shadow-inner placeholder:text-silver/20"
                                />
                              </div>

                              {/* Android Link */}
                              <div className="space-y-3">
                                <label className="flex items-center gap-2 text-silver/40">
                                  <span className="material-symbols-outlined text-xl">android</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-silver/30 mt-1">LINK PARA ANDROID</span>
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://onlyfans.com/perfil_android"
                                  value={selectedButton.deviceRedirects?.android || ""}
                                  onChange={(e) => {
                                    const current = selectedButton.deviceRedirects || { ios: "", android: "" };
                                    handleUpdateButton("deviceRedirects", { ...current, android: e.target.value });
                                  }}
                                  className="w-full bg-[#030303] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-silver focus:outline-none focus:border-white/20 transition-all font-mono shadow-inner placeholder:text-silver/20"
                                />
                              </div>
                            </div>
                          </div>


                          {/* META / TIKTOK SHIELD */}
                          {(selectedButton.type === "instagram" || selectedButton.type === "tiktok") && (
                            <div className="p-5 bg-gradient-to-br from-orange-500/5 to-red-600/5 border border-orange-500/20 rounded-2xl">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <div className="flex items-center gap-2 text-orange-400 mb-1">
                                    <span className="material-symbols-outlined">
                                      security
                                    </span>
                                    <span className="text-sm font-bold">
                                      {selectedButton.type === "instagram" ? "Escudo Meta" : "Escudo TikTok"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-silver/50 max-w-[250px]">
                                    {selectedButton.type === "tiktok"
                                      ? "Protección activa por defecto. Tu link está seguro de la moderación de TikTok mediante cloaking."
                                      : "Protege tu link de la moderación de Meta (Instagram/Facebook). Activa el sistema de cloaking anti-rastreo."}
                                  </p>
                                </div>
                                {selectedButton.type !== "tiktok" && (
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={(selectedButton as any).metaShield || false}
                                      onChange={(e) =>
                                        handleUpdateButton("metaShield", e.target.checked)
                                      }
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                  </label>
                                )}
                              </div>
                              {((selectedButton as any).metaShield || selectedButton.type === "tiktok") && (
                                <div className="mt-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-start gap-2 animate-fade-in">
                                  <span className="material-symbols-outlined text-orange-400 text-sm mt-0.5">info</span>
                                  <p className="text-[10px] text-orange-300/80">
                                    {selectedButton.type === "tiktok"
                                      ? "Al ser un link de TikTok, el escudo está activado permanentemente para tu seguridad."
                                      : "Cuando un visitante que viene de Instagram haga clic, verá instrucciones para abrir el link en el navegador externo, protegiendo tu link de detección."}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* TELEGRAM ROTATOR */}

                          {selectedButton.type === "telegram" && (
                            <div className="p-5 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-blue-500/20 rounded-2xl">
                              <div className="flex justify-between items-start gap-4 mb-4">
                                <div>
                                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                                    <span className="material-symbols-outlined">
                                      sync
                                    </span>
                                    <span className="text-sm font-bold">
                                      {t("dashboard.links.activateRotator")}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-silver/50 max-w-[250px]">
                                    {t("dashboard.links.rotatorDesc")}
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={
                                      selectedButton.rotatorActive || false
                                    }
                                    onChange={async (e) => {
                                      const isActivating = e.target.checked;

                                      if (
                                        !isActivating &&
                                        selectedButton.rotatorActive
                                      ) {
                                        // Deactivating rotator - show confirmation
                                        const confirmed = await showConfirm({
                                          title: t(
                                            "dashboard.links.deactivateRotatorConfirmTitle",
                                            {
                                              defaultValue:
                                                "�Desactivar Telegram Rotativo?",
                                            },
                                          ),
                                          message: t(
                                            "dashboard.links.deactivateRotatorConfirmMsg",
                                            {
                                              defaultValue:
                                                "Al desactivar el rotador, se eliminar�n las URLs 2-5. Solo se mantendr� la primera URL.",
                                            },
                                          ),
                                          confirmText: t(
                                            "common.yesDeactivate",
                                            { defaultValue: "S�, Desactivar" },
                                          ),
                                          cancelText: t("common.cancel", {
                                            defaultValue: "Cancelar",
                                          }),
                                        });

                                        if (confirmed) {
                                          // Keep only first URL, clear the rest
                                          const firstUrl =
                                            selectedButton.rotatorLinks?.[0] ||
                                            "";
                                          handleUpdateButton("rotatorLinks", [
                                            firstUrl,
                                            "",
                                            "",
                                            "",
                                            "",
                                          ]);
                                          handleUpdateButton(
                                            "rotatorActive",
                                            false,
                                          );
                                          toast.success(
                                            t(
                                              "dashboard.links.rotatorDeactivatedSuccess",
                                              {
                                                defaultValue:
                                                  "Rotador desactivado. URLs 2-5 eliminadas.",
                                              },
                                            ),
                                          );
                                        }
                                      } else {
                                        // Activating rotator
                                        handleUpdateButton(
                                          "rotatorActive",
                                          isActivating,
                                        );
                                        if (isActivating) {
                                          toast.success(
                                            t(
                                              "dashboard.links.rotatorActivatedSuccess",
                                              {
                                                defaultValue:
                                                  "Telegram Rotativo activado. Ahora puedes agregar hasta 5 URLs.",
                                              },
                                            ),
                                          );
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
                                    <div
                                      key={idx}
                                      className="flex items-center gap-3"
                                    >
                                      <span className="text-[10px] font-mono text-blue-500/50 w-4 text-center">
                                        {idx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        placeholder={`Link alternativo #${idx + 1}`}
                                        value={
                                          selectedButton.rotatorLinks?.[idx] ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleUpdateRotatorLink(
                                            idx,
                                            e.target.value,
                                          )
                                        }
                                        className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none placeholder:text-silver/20"
                                      />
                                    </div>
                                  ))}

                                  {/* Configuración de capacidad — portado de Marketing-CL */}
                                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest block mb-1.5">
                                        Capacidad máx. por link
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        placeholder="2000"
                                        value={currentPage.telegramMaxCapacity || ""}
                                        onChange={(e) =>
                                          handleUpdatePage("telegramMaxCapacity", Number(e.target.value))
                                        }
                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
                                      />
                                      <p className="text-[8px] text-silver/30 mt-1">Clicks antes de pasar al siguiente link</p>
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest block mb-1.5">
                                        Rotar cada N clicks
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        placeholder="1"
                                        value={currentPage.telegramRotationLimit || ""}
                                        onChange={(e) =>
                                          handleUpdatePage("telegramRotationLimit", Number(e.target.value))
                                        }
                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
                                      />
                                      <p className="text-[8px] text-silver/30 mt-1">1 = round robin puro (recomendado)</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PAGE CONFIGURATION (When no button is selected) */}
                    {!selectedButtonId && !showButtonCreator && (
                      <div className="animate-fade-in space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                          <h2 className="text-xl font-bold">
                            {t("dashboard.links.pageConfigTitle", {
                              defaultValue: "Configuraci�n de la P�gina",
                            })}
                          </h2>

                          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 hidden">
                            <button
                              onClick={() => setSettingsTab("profile")}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${settingsTab === "profile" ? "bg-primary text-white shadow-lg" : "text-silver/40 hover:text-white"}`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                person
                              </span>
                              {t("dashboard.links.profileTab")}
                            </button>
                            <button
                              onClick={() => setSettingsTab("domain")}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${settingsTab === "domain" ? "bg-primary text-white shadow-lg" : "text-silver/40 hover:text-white"}`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                language
                              </span>
                              {t("dashboard.links.domainTab")}
                            </button>
                          </div>
                        </div>

                        {true && (
                          <div className="space-y-8 animate-fade-in">
                            <section className={`rounded-2xl overflow-hidden transition-all duration-500 ${currentPage.landingMode === 'dual' ? 'bg-purple-900/10 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'bg-white/5 border border-white/10'}`}>
                              <div className={`p-4 border-b transition-all duration-500 ${currentPage.landingMode === 'dual' ? 'border-purple-500/20 bg-gradient-to-r from-purple-500/20 to-transparent' : 'border-white/5 bg-white/[0.02]'}`}>
                                <h3 className={`text-sm font-bold flex items-center gap-2 ${currentPage.landingMode === 'dual' ? 'text-white' : ''}`}>
                                  <span className={`material-symbols-outlined ${currentPage.landingMode === 'dual' ? 'text-purple-400' : 'text-silver/40'}`}>
                                    {(currentPage.landingMode as string) === "direct" ? "settings" : "person"}
                                  </span>
                                  {(currentPage.landingMode as string) === "direct"
                                    ? "Configuración del Enlace Directo"
                                    : t("dashboard.links.profileIdentity")}
                                  {currentPage.landingMode === 'dual' && (
                                    <span className="ml-auto text-[9px] font-black bg-white/10 text-silver px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">Premium Dual</span>
                                  )}
                                </h3>
                              </div>
                              <div className="p-6">
                                <div className="mb-6">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-silver/40 uppercase pl-1">
                                      {t("dashboard.links.folderProject")}
                                    </label>
                                    <div className="relative">
                                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-silver/20 text-lg">
                                        folder
                                      </span>
                                      <input
                                        type="text"
                                        value={currentPage.folder || ""}
                                        onChange={(e) =>
                                          handleUpdatePage(
                                            "folder",
                                            e.target.value,
                                          )
                                        }
                                        placeholder={t(
                                          "dashboard.links.folderPlaceholder",
                                        )}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary placeholder:text-silver/20"
                                        list="folder-suggestions"
                                      />
                                      <datalist id="folder-suggestions">
                                        {folders.map((f) => (
                                          <option key={f} value={f} />
                                        ))}
                                      </datalist>
                                    </div>
                                  </div>
                                </div>

                                {/* LANDING MODE SELECTOR: Hide if already in Direct Mode to avoid confusion */}
                                {(currentPage.landingMode as string) !== "direct" && (
                                  <div className="mb-6 flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                      <span className="text-xs font-bold text-white block">
                                        {t("dashboard.links.landingMode")}
                                      </span>
                                      <span className="text-[10px] text-silver/40">
                                        {t("dashboard.links.landingModeDesc")}
                                      </span>
                                    </div>
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                                      <button
                                        onClick={() => {
                                          handleUpdatePage("template", "minimal");
                                          handleUpdatePage("landingMode", "circle");
                                          handleUpdatePage("profileImageSize", 100);
                                        }}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${currentPage.template === "minimal" || currentPage.landingMode === "circle" ? "bg-white text-black shadow-lg" : "text-silver/60 hover:text-white"}`}
                                      >
                                        {t("dashboard.links.minimalist")}
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleUpdatePage("template", "full");
                                          handleUpdatePage("landingMode", "full");
                                          handleUpdatePage("profileImageSize", 100);
                                          handleUpdatePage("theme.backgroundType", "blur");
                                        }}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${currentPage.template === "full" || currentPage.landingMode === "full" ? "bg-primary text-white shadow-lg" : "text-silver/60 hover:text-white"}`}
                                      >
                                        {t("dashboard.links.fullMode")}
                                      </button>
                                      {/* Only show 'Direct' option if the link is ALREADY in direct mode. 
                                          Otherwise, users should stay within Landing Page types. */}
                                      {(currentPage.landingMode as string) === "direct" && (
                                        <button
                                          onClick={() => {
                                            handleUpdatePage("landingMode", "direct");
                                          }}
                                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${(currentPage.landingMode as string) === "direct" ? "bg-red-500 text-white shadow-lg" : "text-silver/60 hover:text-white"}`}
                                        >
                                          <span className="material-symbols-outlined text-[10px]">bolt</span>
                                          Directo
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {(currentPage.landingMode as string) === "direct" ? (
                                  <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl animate-fade-in text-center">
                                    {/* Model Name Input (Internal) */}
                                    <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl text-left max-w-lg mx-auto">
                                      <label className="text-[10px] font-bold text-silver/40 uppercase pl-1 block mb-2">
                                        {t("dashboard.links.modelNameLabel")}
                                      </label>
                                      <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-silver/20 text-lg">
                                          person
                                        </span>
                                        <input
                                          type="text"
                                          value={currentPage.modelName || ""}
                                          onChange={(e) =>
                                            handleUpdatePage(
                                              "modelName",
                                              e.target.value,
                                            )
                                          }
                                          placeholder={t("dashboard.links.modelNamePlaceholder")}
                                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary placeholder:text-silver/20 transition-all"
                                        />
                                      </div>
                                    </div>

                                    <span className="material-symbols-outlined text-4xl text-red-500 mb-4 block animate-bounce-subtle">
                                      rocket_launch
                                    </span>
                                    <h3 className="text-lg font-bold text-white mb-2">Modo Escudo Directo Activado</h3>
                                    <p className="text-sm text-silver/60 mb-6 max-w-md mx-auto">
                                      En este modo, tu link no mostrará botones ni apariencia visual. Al hacer clic desde Instagram o Facebook, el escudo se activará y el usuario será <b>redirigido automáticamente</b> al enlace que ingreses abajo.
                                    </p>
                                    <div className="space-y-2 max-w-lg mx-auto text-left">
                                      <label className="text-[10px] font-bold text-red-400 uppercase pl-1">
                                        URL de Destino Final (OnlyFans / Telegram, etc.)
                                      </label>
                                      <input
                                        type="url"
                                        placeholder="https://onlyfans.com/tu_perfil"
                                        value={currentPage.directUrl || ""}
                                        onChange={(e) => handleUpdatePage("directUrl", e.target.value)}
                                        className="w-full bg-[#050505] border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all placeholder:text-silver/20"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-8">
                                    {currentPage.landingMode === "dual" && (
                                      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/40 mb-6 shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
                                        <div className="flex items-center gap-2 text-white mb-4 relative z-10">
                                          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                          </div>
                                          <span className="text-xs font-black uppercase tracking-tighter">Enlace Directo (IG/FB)</span>
                                          <span className="ml-auto text-[8px] text-silver/40 border border-white/10 px-1.5 py-0.5 rounded">MODO DIRECTO ACTIVADO</span>
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-[9px] font-black text-silver/40 uppercase pl-1">
                                            URL para tráfico de Instagram / Facebook
                                          </label>
                                          <input
                                            type="url"
                                            placeholder="https://onlyfans.com/tu_perfil"
                                            value={currentPage.directUrl || ""}
                                            onChange={(e) => handleUpdatePage("directUrl", e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-silver/20"
                                          />
                                          <p className="text-[10px] text-silver/30 pl-1">Esta URL se usará cuando el sistema detecte que el usuario viene de Instagram o Facebook (Modo Directo).</p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex gap-6 items-start">
                                      <div className="space-y-3 shrink-0">
                                        <div
                                          className="group relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 hover:border-primary transition-colors"
                                          style={{
                                            backgroundColor:
                                              currentPage.theme.backgroundType ===
                                                "solid"
                                                ? currentPage.theme.backgroundStart
                                                : currentPage.theme.backgroundStart,
                                          }}
                                        >
                                          <img
                                            src={currentPage.profileImage}
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                            <span className="material-symbols-outlined text-white text-sm mb-1">
                                              upload
                                            </span>
                                            <span className="text-[8px] text-white font-bold uppercase">
                                              {t("common.change")}
                                            </span>
                                          </div>
                                          <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            accept="image/*"
                                          />
                                        </div>
                                        <div className="space-y-1 w-24">
                                          <label className="text-[8px] font-bold text-silver/40 uppercase block text-center">
                                            {t("dashboard.links.size")} (
                                            {currentPage.profileImageSize || 100}px)
                                          </label>
                                          <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={
                                              currentPage.profileImageSize || 100
                                            }
                                            onChange={(e) =>
                                              handleUpdatePage(
                                                "profileImageSize",
                                                parseInt(e.target.value),
                                              )
                                            }
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex-1 space-y-4">
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold text-silver/40 uppercase pl-1">
                                            {t("dashboard.links.visibleName")}
                                          </label>
                                          <input
                                            type="text"
                                            value={currentPage.profileName}
                                            onChange={(e) => {
                                              handleUpdatePage(
                                                "profileName",
                                                e.target.value,
                                              );
                                              handleUpdatePage(
                                                "name",
                                                e.target.value,
                                              );
                                            }}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {(currentPage.landingMode as string) !== "direct" && (
                                  <div className="pt-6 mt-6 border-t border-white/5">
                                    <label className="text-[10px] font-bold text-silver/40 uppercase mb-3 block">
                                      {t("dashboard.links.pageBackground")}
                                    </label>
                                    <div className="flex gap-4 mb-4">
                                      {/* When Full mode is active, Solid and Gradient are locked */}
                                      {currentPage.landingMode === "full" ? (
                                        <div className="flex items-center gap-3">
                                          <div className="flex bg-[#0B0B0B] border border-border p-1 rounded-xl w-fit opacity-40 pointer-events-none select-none" title="Solo disponible en modo Minimalista">
                                            <button disabled className="px-6 py-2 text-[10px] font-bold rounded-lg text-silver/30 cursor-not-allowed">
                                              {t("dashboard.links.solid")}
                                            </button>
                                            <button disabled className="px-6 py-2 text-[10px] font-bold rounded-lg text-silver/30 cursor-not-allowed">
                                              {t("dashboard.links.gradient")}
                                            </button>
                                            <button disabled className="px-6 py-2 text-[10px] font-bold rounded-lg bg-primary/80 text-white shadow-lg rounded-lg cursor-not-allowed">
                                              {t("dashboard.links.blurPhoto")}
                                            </button>
                                          </div>
                                          <span className="text-[10px] text-primary/80 font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">lock</span>
                                            Blur obligatorio en modo Full
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex bg-[#0B0B0B] border border-border p-1 rounded-xl w-fit">
                                          <button
                                            onClick={() =>
                                              handleUpdatePage(
                                                "theme.backgroundType",
                                                "solid",
                                              )
                                            }
                                            className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === "solid" ? "bg-white/10 border border-white/10 text-white" : "text-silver/40 hover:text-white"}`}
                                          >
                                            {t("dashboard.links.solid")}
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleUpdatePage(
                                                "theme.backgroundType",
                                                "gradient",
                                              )
                                            }
                                            className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === "gradient" ? "bg-white/10 border border-white/10 text-white" : "text-silver/40 hover:text-white"}`}
                                          >
                                            {t("dashboard.links.gradient")}
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleUpdatePage(
                                                "theme.backgroundType",
                                                "blur",
                                              )
                                            }
                                            className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === "blur" ? "bg-white/10 border border-white/10 text-white" : "text-silver/40 hover:text-white"}`}
                                          >
                                            {t("dashboard.links.blurPhoto")}
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {currentPage.theme.backgroundType ===
                                      "solid" ? (
                                      <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <input
                                          type="color"
                                          value={currentPage.theme.backgroundStart}
                                          onChange={(e) =>
                                            handleUpdatePage(
                                              "theme.backgroundStart",
                                              e.target.value,
                                            )
                                          }
                                          className="h-10 w-10 rounded-lg cursor-pointer border-none bg-transparent"
                                        />
                                        <span className="text-xs font-mono text-silver/50 uppercase">
                                          {currentPage.theme.backgroundStart}
                                        </span>
                                      </div>
                                    ) : currentPage.theme.backgroundType ===
                                      "gradient" ? (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                          <p className="text-[9px] text-silver/30 font-bold uppercase mb-2">
                                            Inicio
                                          </p>
                                          <input
                                            type="color"
                                            value={
                                              currentPage.theme.backgroundStart
                                            }
                                            onChange={(e) =>
                                              handleUpdatePage(
                                                "theme.backgroundStart",
                                                e.target.value,
                                              )
                                            }
                                            className="h-10 w-full rounded-lg cursor-pointer border-none bg-transparent"
                                          />
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                          <p className="text-[9px] text-silver/30 font-bold uppercase mb-2">
                                            Fin
                                          </p>
                                          <input
                                            type="color"
                                            value={currentPage.theme.backgroundEnd}
                                            onChange={(e) =>
                                              handleUpdatePage(
                                                "theme.backgroundEnd",
                                                e.target.value,
                                              )
                                            }
                                            className="h-10 w-full rounded-lg cursor-pointer border-none bg-transparent"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-silver/40">
                                          blur_on
                                        </span>
                                        <p className="text-[10px] text-silver/50">
                                          {t("dashboard.links.blurPhotoDesc")}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </section>

                            {/* SECCIÓN DE SEGURIDAD E INTELIGENCIA (PREMIUM) */}
                            <section className="bg-white/5 border border-primary/20 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.05)] mt-8">
                              <div className="p-4 border-b border-primary/10 bg-primary/5">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                                  <span className="material-symbols-outlined text-primary">
                                    shield
                                  </span>
                                  Seguridad e Inteligencia Predictiva
                                </h3>
                              </div>
                              <div className="p-6 space-y-8">

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

                              </div>
                            </section>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COL 2: PREVIEW (Desktop Only) */}
          <div className="hidden lg:flex w-[400px] bg-[#020202] border-l border-white/5 flex-col items-center justify-center relative p-4 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] shrink-0 lg:order-last gap-8">
            <div
              className="relative w-[320px] aspect-[9/19] bg-black rounded-[3rem] border-[6px] border-[#333] shadow-2xl overflow-hidden flex flex-col z-10 cursor-pointer transition-colors hover:border-[#444]"
              onClick={() => {
                setSelectedButtonId(null);
                setShowButtonCreator(false);
              }}
            >
              {(currentPage.landingMode as string) === "direct" ? (
                <div className="flex-1 bg-[#050505] flex flex-col items-center justify-center px-6 text-center z-20 relative">
                  <span className="material-symbols-outlined text-6xl text-red-500 mb-6 animate-[bounce_2s_infinite]">rocket_launch</span>
                  <h3 className="text-white font-bold text-lg mb-2">Escudo Directo</h3>
                  <p className="text-silver/60 text-xs mb-8 leading-relaxed">El usuario no verá un perfil público ni botones, el sistema intentará abrir la app destino de manera instantánea.</p>
                  <div className="w-full bg-black/40 border border-red-500/20 rounded-xl p-3 text-left shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-wider block mb-1">Destino Final</span>
                    <p className="text-white text-xs truncate opacity-80">{currentPage.directUrl || "Configura el link a la izquierda..."}</p>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col ${currentPage.template === "full" ? "" : "transition-all duration-500"}`}
                  style={{
                    background: getBackgroundStyle(currentPage).background,
                    backgroundImage:
                      getBackgroundStyle(currentPage).backgroundImage,
                    backgroundSize:
                      getBackgroundStyle(currentPage).backgroundSize,
                    backgroundPosition:
                      getBackgroundStyle(currentPage).backgroundPosition,
                  }}
                >
                  {currentPage.theme.backgroundType === "blur" && (
                    <div className="absolute inset-0 z-0 backdrop-blur-3xl bg-black/40 pointer-events-none"></div>
                  )}
                  {currentPage.template === "full" && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                      <div
                        className="relative transition-all duration-300 shadow-2xl"
                        style={{
                          width: `${currentPage.profileImageSize || 100}%`,
                          height: `${currentPage.profileImageSize || 100}%`,
                        }}
                      >
                        <img
                          src={currentPage.profileImage}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0 bg-black transition-all"
                          style={{
                            opacity: currentPage.theme.overlayOpacity / 100,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {currentPage.template === "split" && (
                    <div className="h-1/2 w-full relative z-0 shrink-0">
                      <img
                        src={currentPage.profileImage}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div
                    className={`min-h-full p-6 pt-12 flex flex-col relative z-20 ${currentPage.template === "split" ? "" : "items-center"} ${currentPage.template === "minimal" ? "justify-center" : ""} ${currentPage.template === "full" ? "justify-end pb-12" : ""}`}
                  >
                    {currentPage.template !== "full" && (
                      <div
                        className={`mb-8 relative z-10 ${currentPage.template === "split" ? "mt-4 text-left" : "text-center"}`}
                      >
                        {currentPage.template === "minimal" && (
                          <div
                            className="rounded-full bg-gray-800 mb-4 overflow-hidden border-4 shadow-xl mx-auto transition-all"
                            style={{
                              borderColor: currentPage.theme.pageBorderColor,
                              width: `${currentPage.profileImageSize || 96}px`,
                              height: `${currentPage.profileImageSize || 96}px`,
                            }}
                          >
                            <img
                              src={currentPage.profileImage}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg px-4">
                          {currentPage.profileName}
                        </h2>
                        <p className="text-white/70 text-xs mt-1 drop-shadow-md">
                          @{currentPage.name.toLowerCase().replace(/\s/g, "")}
                        </p>
                      </div>
                    )}
                    {currentPage.template === "full" && (
                      <div className="text-center mb-6">
                        <h2 className="text-white font-bold text-2xl leading-tight drop-shadow-lg px-4">
                          {currentPage.profileName}
                        </h2>
                      </div>
                    )}
                    <div
                      className={`w-full space-y-3 relative z-10 ${currentPage.template === "minimal" ? "max-w-[260px]" : ""}`}
                    >
                      {currentPage.buttons.map((btn) => (
                        <a
                          key={btn.id}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedButtonId(btn.id);
                            setShowButtonCreator(false);
                          }}
                          className={`block w-full py-3.5 px-6 font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 group backdrop-blur-sm cursor-pointer ${FONT_MAP[btn.font || "sans"]} ${selectedButtonId === btn.id ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-black" : ""}`}
                          style={{
                            backgroundColor:
                              currentPage.template === "full"
                                ? `${btn.color}CC`
                                : btn.color,
                            color: btn.textColor,
                            borderRadius: `${btn.borderRadius}px`,
                            opacity: btn.opacity / 100,
                          }}
                        >
                          {btn.type !== "custom" && (
                            <div className="w-5 h-5 fill-current">
                              {SOCIAL_PRESETS[btn.type].icon}
                            </div>
                          )}
                          {btn.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SIGUIENTE PASO BUTTON */}
            {currentPage?.status === "draft" && (
              <button
                onClick={() => {
                  if (allDraftPages.length > 0) {
                    // 1. VALIDATE ONLY CURRENT PAGE (if it's a draft)
                    if (currentPage.status === "draft") {
                      if ((currentPage.landingMode as string) === "direct") {
                        if (!currentPage.directUrl || !currentPage.directUrl.trim()) {
                          toast.error(
                            `"${currentPage.name}" no tiene URL de destino. Agregue una URL antes de continuar.`,
                            { duration: 5000 }
                          );
                          return;
                        }
                        if (!isValidUrl(currentPage.directUrl.trim())) {
                          toast.error(
                            `La URL de destino en "${currentPage.name}" no es válida. Debe empezar con https://`,
                            { duration: 4000 }
                          );
                          return;
                        }
                      } else {
                        if (!currentPage.buttons || currentPage.buttons.length === 0) {
                          toast.error(
                            `"${currentPage.name}" no tiene ningún botón. Debes agregar al menos 1 botón para continuar.`,
                            { duration: 5000 }
                          );
                          return;
                        }
                        for (const btn of currentPage.buttons) {
                          if (!btn.url || !btn.url.trim()) {
                            toast.error(
                              `El botón "${btn.title}" en "${currentPage.name}" no tiene URL. Agregue una URL antes de continuar.`,
                              { duration: 4000 }
                            );
                            return;
                          }
                          if (!isValidUrl(btn.url.trim())) {
                            toast.error(
                              `La URL del botón "${btn.title}" en "${currentPage.name}" no es válida. Debe empezar con https://`,
                              { duration: 4000 }
                            );
                            return;
                          }
                        }
                      }
                    }

                    // 2. FILTER OTHER DRAFTS (Include only those that are complete)
                    const validDrafts = allDraftPages.filter((page: any) => {
                      if (page.landingMode === "direct") {
                        return page.directUrl && page.directUrl.trim() && isValidUrl(page.directUrl.trim());
                      }
                      const hasButtons = page.buttons && page.buttons.length > 0;
                      const allUrlsValid = page.buttons.every((btn: any) => btn.url && btn.url.trim() && isValidUrl(btn.url.trim()));
                      return hasButtons && allUrlsValid;
                    });

                    if (validDrafts.length === 0) {
                      // This should only happen if the user manually tries to advance an empty state
                      // and somehow bypassed the current page check above.
                      return;
                    }

                    try {
                      localStorage.setItem(
                        "my_links_data_backup",
                        JSON.stringify({
                          timestamp: Date.now(),
                          linksData: validDrafts,
                        }),
                      );
                    } catch (e) {
                      console.warn("Could not save backup to local storage due to quota limits");
                    }

                    const hasMetaShield = validDrafts.some((p: any) => {
                      if (p.landingMode === "direct") return true;
                      return p.buttons?.some((b: any) => b.metaShield);
                    });
                    
                    const hasRotator = validDrafts.some((p: any) => 
                      p.buttons?.some((b: any) => b.rotatorActive)
                    );

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
                  } else {
                    navigate("/dashboard/home");
                  }
                }}
                className="w-[320px] py-3.5 px-6 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group touch-manipulation"
              >
                <span>{t("dashboard.links.nextStep")}</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* INACTIVE LINK ALERT MODAL */}
      {
        inactiveAlertPageId && (() => {
          const alertPage = pages.find(p => p.id === inactiveAlertPageId);
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setInactiveAlertPageId(null)}
            >
              <div
                className="w-full max-w-sm bg-[#0A0A0A] border border-orange-500/20 rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-24 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="p-8 text-center relative">
                  {/* Animated lock icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-orange-400 animate-pulse">
                      lock
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white mb-2">
                    Tu link aún no está activo
                  </h2>

                  {alertPage && (
                    <p className="text-sm text-silver/40 font-medium mb-1">
                      <span className="text-orange-400 font-bold">"{alertPage.name}"</span>
                    </p>
                  )}

                  <p className="text-sm text-silver/40 leading-relaxed mb-6">
                    Este link está en revisión o pendiente de activación. Una vez aprobado podrás visitarlo directamente.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setInactiveAlertPageId(null)}
                      className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">arrow_back</span>
                      Volver a Mis Links
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      }

      {/* DELETE CONFIRMATION MODAL */}
      {
        showDeleteConfirm && deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteTarget(null);
            }}
          >
            <div
              className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <h2 className="text-lg font-bold text-white mb-2">
                  {deleteTarget.type === "page"
                    ? t("dashboard.links.deletePageConfirmTitle")
                    : t("dashboard.links.deleteButtonConfirmTitle")}
                </h2>
                <p className="text-silver/60 text-sm mb-6">
                  {deleteTarget.type === "page"
                    ? t("dashboard.links.deletePageConfirmMsg")
                    : t("dashboard.links.deleteButtonConfirmMsg")}
                </p>

                <button
                  onClick={async () => {
                    if (deleteTarget.type === "page") {
                      if (pages.length <= 1) {
                        toast.error(t("dashboard.links.atLeastOnePageError"));
                        setShowDeleteConfirm(false);
                        setDeleteTarget(null);
                        return;
                      }

                      // DELETE FROM DB (for active/paid links)
                      const pageId = selectedPageId;
                      if (pageId && user) {
                        try {
                          const pageToDelete = pages.find(p => p.id === pageId);
                          if (pageToDelete?.profileImage && pageToDelete.profileImage.includes('supabase.co')) {
                            const { storageService } = await import('@/services/storageService');
                            await storageService.deleteImage(pageToDelete.profileImage);
                          }
                        } catch (e) {
                          console.error("Error deleting images:", e);
                        }

                        const { error } = await supabase
                          .from("smart_links")
                          .delete()
                          .eq("id", pageId)
                          .eq("user_id", user.id);
                        if (error) {
                          console.error("Error deleting page:", error);
                        }
                      }

                      const newPages = pages.filter(
                        (p) => p.id !== selectedPageId,
                      );
                      setPages(newPages);

                      // SYNC localStorage: save only remaining drafts
                      try {
                        const remainingDrafts = newPages.filter(
                          (p) => p.status === "draft",
                        );
                        localStorage.setItem(
                          "my_links_data",
                          JSON.stringify(remainingDrafts),
                        );
                      } catch (e) {
                        console.error(
                          "Error syncing localStorage after delete:",
                          e,
                        );
                      }

                      // Select next available page
                      setSelectedPageId(newPages[0]?.id || "");
                      toast.success(t("dashboard.links.pageDeletedSuccess"));
                    } else if (
                      deleteTarget.type === "button" &&
                      deleteTarget.id
                    ) {
                      handleDeleteButton(deleteTarget.id);
                    }
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all uppercase tracking-wider shadow-lg shadow-blue-600/20"
                >
                  {t("common.yesDelete")}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* SELECTOR DE TIPO DE LINK */}
      {
        showLinkTypeSelector && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
              onClick={() => setShowLinkTypeSelector(false)}
            />
            <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl animate-scale-up overflow-hidden">
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -ml-32 -mb-32" />

              <div className="relative z-10 text-center mb-10">
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                  {t("dashboard.links.createLinkModalTitle")}
                </h3>
                <p className="text-silver/40 text-sm font-medium">
                  {t("dashboard.links.createLinkModalSubtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Opción 1: Enlace Directo */}
                <button
                  onClick={() => confirmCreation("direct")}
                  className="group relative flex flex-col p-6 rounded-3xl bg-secondary/30 border border-white/5 hover:border-red-500/50 hover:bg-black transition-all text-left overflow-hidden h-full shadow-lg"
                >
                  <div className="absolute top-4 right-4 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">
                      {t("dashboard.links.directLinkPlatform")}
                    </span>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-red-500">
                      rocket_launch
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {t("dashboard.links.directLinkTitle")}
                  </h4>
                  <p className="text-silver/40 text-xs leading-relaxed mb-4">
                    {t("dashboard.links.directLinkDesc")}
                  </p>
                </button>

                {/* Opción 2: Landing Page */}
                <button
                  onClick={() => confirmCreation("landing")}
                  className="group relative flex flex-col p-6 rounded-3xl bg-secondary/30 border border-white/5 hover:border-blue-500/50 hover:bg-black transition-all text-left overflow-hidden h-full shadow-lg"
                >
                  <div className="absolute top-4 right-4 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                      {t("dashboard.links.landingPagePlatform")}
                    </span>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-blue-500">
                      web
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {t("dashboard.links.landingPageTitle")}
                  </h4>
                  <p className="text-silver/40 text-xs leading-relaxed mb-4">
                    {t("dashboard.links.landingPageDesc")}
                  </p>
                </button>
              </div>

              <button
                onClick={() => confirmCreation("both")}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.01] active:scale-[0.99] transition-all group shadow-[0_0_40px_rgba(147,51,234,0.3)] border-2 border-purple-400/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="material-symbols-outlined text-2xl text-white group-hover:rotate-12 transition-transform relative z-10">
                  auto_awesome
                </span>
                <span className="font-black text-sm uppercase tracking-widest text-white relative z-10">
                  {t("dashboard.links.createBothTitle")}
                </span>
              </button>

              <button
                onClick={() => setShowLinkTypeSelector(false)}
                className="mt-10 mx-auto block text-[10px] font-bold text-silver/30 uppercase tracking-widest hover:text-white transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )
      }

    </div >
  );
}