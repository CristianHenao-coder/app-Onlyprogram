import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useModal } from '@/contexts/ModalContext';
import { useTranslation } from '@/contexts/I18nContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { linksService } from '@/services/links.service';
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from '@/services/productPricing.service';

// Import Social Media Logos
import instagramLogo from '@/assets/animations/instagram.png';
import tiktokLogo from '@/assets/animations/tik-tok.png';

// Types
type TemplateType = 'minimal' | 'split' | 'full';
type SocialType = 'instagram' | 'tiktok' | 'telegram' | 'onlyfans' | 'custom';
type FontType = 'sans' | 'serif' | 'mono' | 'display';
type PageStatus = 'active' | 'draft';
type BackgroundType = 'solid' | 'gradient' | 'blur';

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
}

interface LinkPage {
  id: string;
  status: PageStatus;
  name: string;
  profileName: string;
  profileImage: string;
  profileImageSize?: number; // 0-100 scale
  template: TemplateType;
  landingMode?: 'circle' | 'full'; // Circle (default) or Full Photo Background
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
  domainStatus?: 'none' | 'pending' | 'active' | 'failed';
  domainNotes?: string;
  slug?: string;
}

// Icons Components
const Icons = {
  Instagram: () => <img src={instagramLogo} alt="Instagram" className="w-full h-full object-contain" />,
  TikTok: () => <img src={tiktokLogo} alt="TikTok" className="w-full h-full object-contain" />,
  Telegram: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.441z" /></svg>,
  OnlyFans: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M16.48 2.02c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-11.5 5.5c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-7.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5z" /></svg>,
  Custom: () => <span className="material-symbols-outlined text-xl">link</span>
};

// Social Configs
const SOCIAL_PRESETS = {
  instagram: { title: 'Instagram', color: '#8B0000', icon: <Icons.Instagram />, placeholder: 'https://instagram.com/tu_usuario' },
  tiktok: { title: 'TikTok', color: '#000000', icon: <Icons.TikTok />, placeholder: 'https://tiktok.com/@tu_usuario' },
  telegram: { title: 'Telegram', color: '#0088cc', icon: <Icons.Telegram />, placeholder: 'https://t.me/tu_usuario' },
  onlyfans: { title: 'Contenido Exclusivo', color: '#00AFF0', icon: <Icons.OnlyFans />, placeholder: 'https://onlyfans.com/tu_usuario' },
  custom: { title: 'Personalizado', color: '#333333', icon: <Icons.Custom />, placeholder: 'https://...' }
};

const DEFAULT_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const DEFAULT_PAGE: LinkPage = {
  id: '',
  status: 'draft',
  name: 'Nueva Página',
  profileName: 'Name',
  profileImage: DEFAULT_PROFILE_IMAGE,
  profileImageSize: 50,
  template: 'minimal',
  landingMode: 'circle',
  theme: {
    pageBorderColor: '#333333',
    overlayOpacity: 40,
    backgroundType: 'solid',
    backgroundStart: '#000000',
    backgroundEnd: '#1a1a1a'
  },
  buttons: [],
  domainStatus: 'none'
};


// Font Classes Mapping
const FONT_MAP: Record<FontType, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
  display: 'font-sans tracking-widest'
};

// --- DND COMPONENT ---
function SortableButton({
  btn,
  isSelected,
  onClick,
  collapsed = false,
  rotatorSurcharge
}: {
  btn: ButtonLink,
  isSelected: boolean,
  onClick: () => void,
  collapsed?: boolean,
  rotatorSurcharge: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: btn.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={onClick}
      className={`w-full p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all relative group touch-none ${collapsed ? 'flex items-center justify-center' : 'flex items-center gap-3'
        } ${isSelected ? 'bg-white/5 border-primary shadow-lg' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}`}
      title={collapsed ? btn.title : undefined} // Show title on hover only when collapsed
    >
      <div className={`rounded-lg flex items-center justify-center shrink-0 ${collapsed ? 'h-10 w-10' : 'h-8 w-8'}`} style={{ backgroundColor: btn.color }}>
        <div className={`text-white ${collapsed ? 'w-6 h-6' : 'w-4 h-4'}`}>
          {SOCIAL_PRESETS[btn.type].icon}
        </div>
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-silver/60'}`}>
            {btn.title}
          </p>
          {btn.type === 'telegram' && btn.rotatorActive && (
            <p className="text-[9px] text-green-500 font-bold uppercase tracking-wide mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">sync</span> {`Rotativo Activo (+$${rotatorSurcharge})`}
            </p>
          )}
        </div>
      )}

      {/* Rotator indicator badge (only when collapsed) */}
      {collapsed && btn.type === 'telegram' && btn.rotatorActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050505] flex items-center justify-center">
          <span className="material-symbols-outlined text-[10px] text-black">sync</span>
        </div>
      )}
    </div>
  );
}

// Utility to get background style
const getBackgroundStyle = (page: LinkPage) => {
  if (page.theme.backgroundType === 'solid') {
    return { background: page.theme.backgroundStart };
  } else if (page.theme.backgroundType === 'blur') {
    return {
      backgroundImage: `url(${page.profileImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: `linear-gradient(to bottom right, ${page.theme.backgroundStart}, ${page.theme.backgroundEnd})` };
};

// Helper to check if page has rotator
const hasRotatorActive = (page: LinkPage) => page.buttons.some(b => b.type === 'telegram' && b.rotatorActive);

export default function Links() {
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pricingCfg, setPricingCfg] = useState<ProductPricingConfig>(DEFAULT_PRODUCT_PRICING);

  useEffect(() => {
    let mounted = true;
    productPricingService.get().then((cfg) => {
      if (mounted) setPricingCfg(cfg);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  const LINK_PRICE_STANDARD = pricingCfg.link.standard;
  const LINK_PRICE_ROTATOR = pricingCfg.link.rotator;
  const ROTATOR_SURCHARGE = Math.max(0, LINK_PRICE_ROTATOR - LINK_PRICE_STANDARD);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { user } = useAuth();

  // --- STATE ---
  const [pages, setPages] = useState<LinkPage[]>(() => {
    try {
      // Check if we have saved data
      const saved = localStorage.getItem('my_links_data');
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
            status: 'draft', // FORCE DRAFT FOR MIGRATION
            theme: {
              ...p.theme,
              backgroundType: p.theme?.backgroundType || 'solid',
              backgroundStart: p.theme?.backgroundStart || (p.theme?.background && !p.theme.background.includes('gradient') ? p.theme.background : '#000000'),
              backgroundEnd: p.theme?.backgroundEnd || '#1a1a1a'
            }
          }));
        }
      }
    } catch (e) {
      console.error("Error parsing local links", e);
      localStorage.removeItem('my_links_data');
    }

    return [{
      id: 'page1',
      status: 'draft',
      name: 'Nuevo Link',
      profileName: 'Name',
      profileImage: DEFAULT_PROFILE_IMAGE,
      template: 'minimal',
      theme: {
        pageBorderColor: '#222222',
        overlayOpacity: 40,
        backgroundType: 'solid',
        backgroundStart: '#000000',
        backgroundEnd: '#1a1a1a'
      },
      buttons: []
    }];
  });

  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page1');
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [showButtonCreator, setShowButtonCreator] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'domain'>('profile');

  // Deep linking: select page from URL ?id=...
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && idParam !== selectedPageId) {
      // Check if it exists in current pages
      const exists = pages.some(p => p.id === idParam);
      if (exists) {
        setSelectedPageId(idParam);
      }
    }
  }, [searchParams, pages, selectedPageId]);



  // Derived
  const currentPage = pages.find(p => p.id === selectedPageId) || pages[0];

  // GUARD: Prevents crash if pages is empty
  if (!currentPage) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedButton = currentPage.buttons?.find(b => b.id === selectedButtonId);

  // Split Pages logic moved to derived state below


  // Folder Management State
  const [showFolders, setShowFolders] = useState(false);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);

  // Derived Folders
  const folders = Array.from(new Set(pages.map(p => p.folder).filter(Boolean))) as string[];

  // Filtered Pages
  const filteredPages = folderFilter ? pages.filter(p => p.folder === folderFilter) : pages;
  const activePages = filteredPages.filter(p => p.status === 'active');
  const draftPages = filteredPages.filter(p => p.status === 'draft');


  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);


  // Sidebar Collapse State - Auto-collapse on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Auto-collapse on mobile/tablet screens
    return window.innerWidth < 1024;
  });

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'page' | 'button', id?: string, name?: string } | null>(null);


  // Horizontal Scroll State for Link Navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleCreateFolder = async () => {
    // Simple alert prompt for now, consistent with requested flow
    // In a real app we might use a custom modal
    // leveraging existing modal context if available or browser prompt
    const name = window.prompt("Nombre de la nueva carpeta:");
    if (name && name.trim()) {
      const cleanName = name.trim();
      // Just switch filter to new folder (it 'exists' when a link uses it)
      // But to make it "Created", we might want to update the current link to this folder?
      // Or just show it? 
      // Logic: Folders exist if links have them. "Creating" one usually implies
      // assigning the CURRENT link to it, or just creating a placeholder?
      // Let's assign current page to it to make it persist immediately.
      handleUpdatePage('folder', cleanName);
      setFolderFilter(cleanName);
      setShowFolders(true);
      toast.success(`Carpeta "${cleanName}" creada y asignada`);
    }
  };

  // --- SUPABASE INTEGRATION ---

  // 1. Fetch Links from DB
  useEffect(() => {
    if (!user?.id) return;

    const fetchLinks = async () => {
      try {
        // ONLY fetch ACTIVE (paid) links from DB
        const { data, error } = await supabase
          .from('smart_links')
          .select(`
            *,
            smart_link_buttons (*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true) // Solo links activos/pagados
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Map DB active links
        const dbPages: LinkPage[] = data && data.length > 0 ? data.map(link => ({
          id: link.id,
          status: 'active', // Todos son activos porque is_active=true
          name: link.config?.name || link.slug,
          profileName: link.title || '',
          profileImage: link.photo || DEFAULT_PROFILE_IMAGE,
          profileImageSize: link.config?.profileImageSize || 50,
          folder: link.config?.folder || '',
          template: link.config?.template || 'minimal',
          landingMode: link.config?.landingMode || 'circle',
          theme: {
            pageBorderColor: link.config?.theme?.pageBorderColor || '#333333',
            overlayOpacity: link.config?.theme?.overlayOpacity || 40,
            backgroundType: link.config?.theme?.backgroundType || 'solid',
            backgroundStart: link.config?.theme?.backgroundStart || '#000000',
            backgroundEnd: link.config?.theme?.backgroundEnd || '#1a1a1a'
          },
          customDomain: link.custom_domain,
          domainStatus: link.domain_status || 'none',
          domainNotes: link.domain_notes || '',
          slug: link.slug,
          buttons: (link.smart_link_buttons && link.smart_link_buttons.length > 0) 
            ? link.smart_link_buttons.sort((a: any, b: any) => a.order - b.order).map((b: any) => ({
                id: b.id,
                type: b.type,
                title: b.title,
                subtitle: b.subtitle,
                url: b.url,
                color: b.color,
                textColor: b.text_color,
                font: b.font,
                borderRadius: b.border_radius,
                opacity: b.opacity,
                isActive: b.is_active,
                rotatorActive: b.rotator_active,
                rotatorLinks: b.rotator_links || ['', '', '', '', '']
              }))
            : []
        })) : [];

        // Get drafts from localStorage
        const localDrafts: LinkPage[] = (() => {
          try {
            const saved = localStorage.getItem('my_links_data');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                return parsed.map((p: any) => ({
                  ...p,
                  status: 'draft' // Todos los de localStorage son drafts
                }));
              }
            }
          } catch (e) {
            console.error('Error reading localStorage drafts:', e);
          }
          return [];
        })();

        // Merge and Deduplicate: DB active links + localStorage drafts
        const pagesMap = new Map<string, LinkPage>();
        
        // 1. Add DB links (priority)
        dbPages.forEach(p => pagesMap.set(p.id, p));
        
        // 2. Add local drafts only if they don't exist in DB (check ID AND Name)
        const staleDraftIds: string[] = [];
        localDrafts.forEach(p => {
          const isDuplicateById = pagesMap.has(p.id);
          // Check if any DB page has the same name (case insensitive)
          const isDuplicateByName = dbPages.some(dbp => 
            dbp.name.toLowerCase().trim() === p.name.toLowerCase().trim()
          );
          
          if (!isDuplicateById && !isDuplicateByName) {
            pagesMap.set(p.id, p);
          } else {
            staleDraftIds.push(p.id);
          }
        });

        // 3. Cleanup stale drafts from localStorage
        if (staleDraftIds.length > 0) {
          try {
            const updatedLocalDrafts = localDrafts.filter(p => !staleDraftIds.includes(p.id));
            localStorage.setItem('my_links_data', JSON.stringify(updatedLocalDrafts));
            console.log(`Deduplicated ${staleDraftIds.length} stale drafts from localStorage`);
          } catch (e) {
            console.error('Error cleaning up stale drafts:', e);
          }
        }

        const allPages = Array.from(pagesMap.values());

        // FORCE DEFAULT: If user has NO links, create one
        if (allPages.length === 0) {
          const newId = `page${Date.now()}`;
          allPages.push({ ...DEFAULT_PAGE, id: newId, status: 'draft', name: 'Link 1' });
        }

        setPages(allPages);
        if (allPages.length > 0) {
          const exists = allPages.find(p => p.id === selectedPageId);
          if (!exists) setSelectedPageId(allPages[0].id);
        }
      } catch (error) {
        console.error('Error fetching links:', error);
        toast.error('Error cargando tus links');
      } finally {
        setInitialLoad(false);
      }
    };

    fetchLinks();
  }, [user?.id]);

  // 2. Sync to DB (Debounced + Visibility Change)
  useEffect(() => {
    if (initialLoad) return;
    if (!user) return;

    const syncToDb = async () => {
      setIsSaving(true);
      try {
        const currentPageToSave = pages.find(p => p.id === selectedPageId);
        if (!currentPageToSave) return;

        const isDraft = currentPageToSave.status === 'draft';

        if (isDraft) {
          // DRAFT: Save ALL drafts from state to localStorage (single source of truth)
          try {
            const allDrafts = pages.filter(p => p.status === 'draft');
            localStorage.setItem('my_links_data', JSON.stringify(allDrafts));
          } catch (e) {
            console.error('Error saving draft to localStorage:', e);
          }
        } else {
          // ACTIVE LINK: Save to Supabase
          const updates = {
            title: currentPageToSave.profileName,
            photo: currentPageToSave.profileImage,
            buttons: currentPageToSave.buttons,
            is_active: true, // Links activos siempre son is_active=true
            custom_domain: currentPageToSave.customDomain,
            domain_status: currentPageToSave.domainStatus,
            domain_notes: currentPageToSave.domainNotes,
            config: {
              template: currentPageToSave.template,
              theme: currentPageToSave.theme,
              name: currentPageToSave.name,
              folder: currentPageToSave.folder,
              landingMode: currentPageToSave.landingMode,
              profileImageSize: currentPageToSave.profileImageSize
            }
          };

          const { error } = await supabase
            .from('smart_links')
            .update(updates)
            .eq('id', currentPageToSave.id);

          if (error) throw error;

          // SPECIAL: Sync buttons to the dedicated table
          await linksService.updateButtons(currentPageToSave.id, currentPageToSave.buttons);
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
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Auto-save on navigation (component unmount)
      syncToDb();
    };
  }, [pages, user, selectedPageId, initialLoad]);

  // Migration: Update old Instagram button colors to white
  useEffect(() => {
    const needsMigration = pages.some(page =>
      page.buttons.some(btn => btn.type === 'instagram' && (btn.color === '#E1306C' || btn.color === '#8B5CF6'))
    );

    if (needsMigration) {
      setPages(prevPages => prevPages.map(page => ({
        ...page,
        buttons: page.buttons.map(btn =>
          btn.type === 'instagram' && (btn.color === '#E1306C' || btn.color === '#8B5CF6')
            ? { ...btn, color: '#FFFFFF' }
            : btn
        )
      })));
    }
  }, []);

  // Keyboard support for confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteConfirm && e.key === 'Escape') {
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirm]);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [pages]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // --- HANDLERS ---
  const handleAddPage = () => {
    const newId = `page${Date.now()}`;
    // New pages are DRAFTS by default, and named "Link X" or similar
    setPages(prev => [...prev, { ...DEFAULT_PAGE, id: newId, status: 'draft', name: `Link ${prev.length + 1}` }]);
    setSelectedPageId(newId);
    toast.success('Empieza a diseñar tu nuevo link');
  };


  const handleUpdatePage = (field: string, value: any) => {
    setPages(prev => prev.map(p => {
      if (p.id !== selectedPageId) return p;

      if (field === 'theme.pageBorderColor') return { ...p, theme: { ...p.theme, pageBorderColor: value } };
      if (field === 'theme.overlayOpacity') return { ...p, theme: { ...p.theme, overlayOpacity: value } };
      if (field === 'theme.backgroundType') return { ...p, theme: { ...p.theme, backgroundType: value } };
      if (field === 'theme.backgroundStart') return { ...p, theme: { ...p.theme, backgroundStart: value } };
      if (field === 'theme.backgroundEnd') return { ...p, theme: { ...p.theme, backgroundEnd: value } };

      return { ...p, [field]: value };
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdatePage('profileImage', reader.result as string);
        toast.success('Imagen actualizada');
      };
      reader.readAsDataURL(file);
    }
  };

  // DnD Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPages(prev => prev.map(p => {
        if (p.id !== selectedPageId) return p;
        const oldIndex = p.buttons.findIndex(b => b.id === active.id);
        const newIndex = p.buttons.findIndex(b => b.id === over?.id);
        return { ...p, buttons: arrayMove(p.buttons, oldIndex, newIndex) };
      }));
    }
  };

  // Button CRUD
  const handleCreateButton = (type: SocialType) => {
    // Check if button type already exists
    const existingButton = currentPage.buttons.find(btn => btn.type === type);

    if (existingButton) {
      toast.error(`Ya tienes un botón de ${SOCIAL_PRESETS[type].title}. Solo puedes agregar uno de cada tipo.`);
      return;
    }

    const config = SOCIAL_PRESETS[type];
    const newButton: ButtonLink = {
      id: Math.random().toString(36).substring(2, 9),
      type, title: type === 'custom' ? 'Nuevo Botón' : config.title,
      subtitle: '',
      url: '', color: config.color,
      textColor: '#FFFFFF', font: 'sans', borderRadius: 12, opacity: 100, isActive: true,
      rotatorActive: false, rotatorLinks: ['', '', '', '', '']
    };
    setPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, buttons: [...p.buttons, newButton] } : p));
    setSelectedButtonId(newButton.id);
    // Removed auto-close: setShowButtonCreator(false);
    toast.success('Botón añadido');
  };

  const handleDeleteButton = async (id: string) => {
    const confirmed = await showConfirm({
      title: '¿Eliminar este botón?',
      message: 'El botón se eliminará permanentemente.',
      confirmText: 'Eliminar',
      // cancelText: 'Cancelar', // Removed to simplify
      type: 'info' // Changed from warning to info/default for blue style
    });

    if (confirmed) {
      setPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, buttons: p.buttons.filter(b => b.id !== id) } : p));
      if (selectedButtonId === id) setSelectedButtonId(null);
      toast('Botón eliminado', { icon: '🗑️' });
    }
  };

  const handleUpdateButton = (field: keyof ButtonLink, value: any) => {
    setPages(prev => prev.map(p => p.id === selectedPageId ? {
      ...p, buttons: p.buttons.map(b => b.id === selectedButtonId ? { ...b, [field]: value } : b)
    } : p));
  };

  // Rotator Handler
  const handleUpdateRotatorLink = (index: number, val: string) => {
    if (!selectedButton) return;
    const currentLinks = selectedButton.rotatorLinks ? [...selectedButton.rotatorLinks] : ['', '', '', '', ''];
    currentLinks[index] = val;
    handleUpdateButton('rotatorLinks', currentLinks);
  };


  return (
    <div className="h-full flex flex-col bg-[#050505] text-white font-sans overflow-hidden">

      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050505] z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">layers</span>
          </div>
          <h1 className="text-sm font-bold uppercase tracking-wider">{t('dashboard.links.managerTitle')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <span className="text-[10px] uppercase font-bold text-silver/30 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></span>
            {isSaving ? 'Guardando...' : t('dashboard.links.autosave')}
          </span>
        </div>
      </header>

      {/* Responsive Layout: Mobile (Col), Desktop (Row) */}
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
                  <span className="material-symbols-outlined text-white text-lg group-hover:text-primary">chevron_left</span>
                </div>
              </button>
            )}

            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth px-4 h-full" ref={scrollContainerRef}>
              <button
                onClick={handleAddPage}
                className="flex flex-col items-center justify-center w-12 h-12 rounded-full border border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all text-silver/40 hover:text-primary shrink-0 group"
              >
                <span className="material-symbols-outlined text-xl group-active:scale-90 transition-transform">add</span>
                <span className="text-[7px] font-bold uppercase tracking-tighter">Crear</span>
              </button>

              <div className="h-8 w-px bg-white/10 shrink-0 mx-2"></div>

              {activePages.map(page => (
                <button
                  key={page.id}
                  onClick={() => { setSelectedPageId(page.id); setSelectedButtonId(null); }}
                  className={`relative group flex items-center gap-3 pr-4 pl-1 py-1 rounded-full transition-all border ${selectedPageId === page.id ? 'bg-white/10 border-primary/50' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    {page.profileImage && page.profileImage !== DEFAULT_PROFILE_IMAGE ? (
                      <img src={page.profileImage} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-sm">person</span></div>}
                  </div>
                  <div className="text-left min-w-[60px]">
                    <p className={`text-xs font-bold leading-tight ${selectedPageId === page.id ? 'text-white' : 'text-silver/60'}`}>{page.name}</p>
                    <span className="inline-flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] text-green-500 font-black uppercase tracking-wider">Link Activo</span>
                    </span>
                  </div>
                  {selectedPageId === page.id && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#080808]"></div>}
                </button>
              ))}

              {/* Drafts */}
              {draftPages.length > 0 && <div className="h-8 w-px bg-white/10 shrink-0 mx-2"></div>}
              {draftPages.map(page => (
                <button
                  key={page.id}
                  onClick={() => { setSelectedPageId(page.id); setSelectedButtonId(null); }}
                  className={`relative group flex items-center gap-3 pr-4 pl-1 py-1 rounded-full transition-all border ${selectedPageId === page.id ? 'bg-white/10 border-yellow-500/50' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    {page.profileImage && page.profileImage !== DEFAULT_PROFILE_IMAGE ? (
                      <img src={page.profileImage} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-sm">edit</span></div>}
                  </div>
                  <div className="text-left min-w-[60px]">
                    <p className={`text-xs font-bold leading-tight ${selectedPageId === page.id ? 'text-white' : 'text-silver/60'}`}>{page.name}</p>
                    <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">{t('dashboard.links.creatingDraft')}</p>
                  </div>
                  {hasRotatorActive(page) && <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-[#080808] flex items-center justify-center"><span className="material-symbols-outlined text-[8px] text-white">sync</span></div>}
                </button>
              ))}
            </div>

            {/* Right Arrow */}
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
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* LEFT PANEL: BUTTONS LIST & ADDER */}
            <div className={`border-r border-white/5 flex flex-col bg-[#070707] shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-16 md:w-20' : 'w-full sm:w-64 lg:w-80'}`}>

              {/* SIDEBAR HEADER & FOLDERS */}
              <div className="border-b border-white/5 relative z-10 bg-[#070707] flex flex-col">
                <div className="p-3 md:p-4 flex items-center justify-between">
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-all shrink-0 touch-manipulation"
                    title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
                  >
                    <span className="material-symbols-outlined text-white text-xl">menu</span>
                  </button>

                  {/* Folders Filter Indicator (Collapsed Mode) */}
                  {sidebarCollapsed && folderFilter && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30" title={`Filtrado por: ${folderFilter}`}>
                      <span className="material-symbols-outlined text-sm">folder</span>
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
                          <span className={`material-symbols-outlined text-base ${folderFilter ? 'text-primary' : ''}`}>{folderFilter ? 'folder_open' : 'folder'}</span>
                          <span className={folderFilter ? 'text-primary' : ''}>{folderFilter || 'Mis Carpetas'}</span>
                        </div>
                        <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${showFolders ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>

                      {(showFolders || folderFilter) && (
                        <div className={`space-y-1 overflow-hidden transition-all ${showFolders ? 'max-h-64 p-2 pt-0 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <button
                            onClick={handleCreateFolder}
                            className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Crear carpeta</span>
                          </button>

                          <button
                            onClick={() => setFolderFilter(null)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors ${!folderFilter ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-white hover:bg-white/5'}`}
                          >
                            <span className="material-symbols-outlined text-sm">grid_view</span>
                            <span>Ver Todo</span>
                          </button>

                          {folders.map(f => (
                            <button
                              key={f}
                              onClick={() => setFolderFilter(f === folderFilter ? null : f)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-colors group ${f === folderFilter ? 'bg-primary/20 text-primary border border-primary/20' : 'text-silver/40 hover:text-white hover:bg-white/5'}`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="material-symbols-outlined text-sm">folder</span>
                                <span className="truncate max-w-[120px]">{f}</span>
                              </div>
                              {f === folderFilter && <span className="material-symbols-outlined text-xs">check</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ADD BUTTON */}
                    <button onClick={() => setShowButtonCreator(true)} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation">
                      <span className="material-symbols-outlined text-xl">add_circle</span>
                      <span>{t('dashboard.links.addButton')}</span>
                    </button>
                  </div>
                )}

                {/* COLLAPSED ADD BUTTON */}
                {sidebarCollapsed && (
                  <div className="px-2 pb-3 flex justify-center">
                    <button onClick={() => setShowButtonCreator(true)} className="w-10 h-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center" title={t('dashboard.links.addButton')}>
                      <span className="material-symbols-outlined text-xl">add</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 relative z-0">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={currentPage.buttons} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {currentPage.buttons.map(btn => (
                        <div key={btn.id} className="relative group">
                          <SortableButton
                            btn={btn}
                            isSelected={selectedButtonId === btn.id}
                            onClick={() => { setSelectedButtonId(btn.id); setShowButtonCreator(false); }}
                            collapsed={sidebarCollapsed}
                            rotatorSurcharge={ROTATOR_SURCHARGE}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteButton(btn.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-silver/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ))}
                      {currentPage.buttons.length === 0 && !showButtonCreator && (
                        <div className="text-center py-10 px-4 border-2 border-dashed border-white/5 rounded-xl">
                          <span className="material-symbols-outlined text-3xl text-silver/20 mb-2">touch_app</span>
                          <p className="text-xs text-silver/40">Tu link está vacío. ¡Añade tu primer botón!</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* STICKY BOTTOM ACTIONS */}
              <div className="p-4 border-t border-white/5 bg-[#050505]">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setDeleteTarget({ type: 'page', name: currentPage.name });
                      setShowDeleteConfirm(true);
                    }}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/10 bg-white/5 transition-all ${sidebarCollapsed ? 'flex-col' : ''}`}
                    title={sidebarCollapsed ? "Borrar Link" : undefined}
                  >
                    <span className={`material-symbols-outlined ${sidebarCollapsed ? 'text-lg' : 'text-sm'}`}>delete</span>
                    {!sidebarCollapsed && "Borrar Link"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedButtonId(null);
                      setShowButtonCreator(false);
                    }}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-silver/40 hover:text-white hover:bg-white/5 bg-white/5 transition-all ${sidebarCollapsed ? 'flex-col' : ''}`}
                    title={sidebarCollapsed ? "Editar Perfil" : undefined}
                  >
                    <span className={`material-symbols-outlined ${sidebarCollapsed ? 'text-lg' : 'text-sm'}`}>settings</span>
                    {!sidebarCollapsed && "Editar Perfil"}
                  </button>
                </div>
              </div>
            </div>

            {/* MAIN EDITOR AREA */}
            <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 pb-32">
                <div className="max-w-2xl mx-auto">

                  {/* BUTTON CREATOR */}
                  {showButtonCreator && (
                    <div className="animate-fade-in space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setShowButtonCreator(false)} className="p-2 hover:bg-white/10 rounded-full text-silver/50 hover:text-white transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
                        <h2 className="text-xl font-bold text-white max-w-2xl">{t('dashboard.links.addButton')}</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(Object.keys(SOCIAL_PRESETS) as SocialType[]).map(key => (
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
                    <div className="animate-slide-up space-y-8">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white">{SOCIAL_PRESETS[selectedButton.type].icon}</div>
                          <div>
                            <h2 className="text-lg font-bold">Editar Botón</h2>
                            <p className="text-[10px] text-silver/40 uppercase font-bold tracking-wider">{selectedButton.type}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedButtonId(null)} className="p-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors">Guardar y Cerrar</button>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.title')}</label>
                            <input type="text" value={selectedButton.title} onChange={(e) => handleUpdateButton('title', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.mainUrl')}</label>
                            <div className="flex items-center bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus-within:border-primary/50">
                              <span className="material-symbols-outlined text-silver/20 mr-2 text-lg">link</span>
                              <input
                                type="text"
                                value={selectedButton.url}
                                onChange={(e) => handleUpdateButton('url', e.target.value)}
                                className="flex-1 bg-transparent text-sm font-mono text-silver focus:outline-none"
                                placeholder={SOCIAL_PRESETS[selectedButton.type].placeholder || 'https://...'}
                              />
                            </div>
                          </div>
                        </div>

                        {/* APPEARANCE CONTROLS */}
                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">palette</span>
                            Apariencia
                          </h3>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Fondo</label>
                              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                                <input
                                  type="color"
                                  value={selectedButton.color}
                                  onChange={(e) => handleUpdateButton('color', e.target.value)}
                                  className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-[10px] font-mono text-silver/50 uppercase">{selectedButton.color}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Texto</label>
                              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                                <input
                                  type="color"
                                  value={selectedButton.textColor || '#FFFFFF'}
                                  onChange={(e) => handleUpdateButton('textColor', e.target.value)}
                                  className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-[10px] font-mono text-silver/50 uppercase">{selectedButton.textColor || '#FFFFFF'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Tipografía</label>
                            <div className="grid grid-cols-4 gap-2">
                              {(['sans', 'serif', 'mono', 'display'] as FontType[]).map(font => (
                                <button
                                  key={font}
                                  onClick={() => handleUpdateButton('font', font)}
                                  className={`py-2 px-1 rounded-lg text-xs border transition-all ${selectedButton.font === font ? 'bg-primary text-white border-primary' : 'bg-black/20 text-silver/60 border-transparent hover:border-white/10'}`}
                                >
                                  <span className={FONT_MAP[font]}>Aa</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* TELEGRAM ROTATOR */}
                        {selectedButton.type === 'telegram' && (
                          <div className="p-5 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-blue-500/20 rounded-2xl">
                            <div className="flex justify-between items-start gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                  <span className="material-symbols-outlined">sync</span>
                                  <span className="text-sm font-bold">{t('dashboard.links.activateRotator')}</span>
                                </div>
                                <p className="text-[10px] text-silver/50 max-w-[250px]">{t('dashboard.links.rotatorDesc')}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedButton.rotatorActive || false}
                                  onChange={async (e) => {
                                    const isActivating = e.target.checked;

                                    if (!isActivating && selectedButton.rotatorActive) {
                                      // Deactivating rotator - show confirmation
                                      const confirmed = await showConfirm({
                                        title: '¿Desactivar Telegram Rotativo?',
                                        message: 'Al desactivar el rotador, se eliminarán las URLs 2-5. Solo se mantendrá la primera URL.',
                                        confirmText: 'Sí, Desactivar',
                                        cancelText: 'Cancelar',
                                      });

                                      if (confirmed) {
                                        // Keep only first URL, clear the rest
                                        const firstUrl = selectedButton.rotatorLinks?.[0] || '';
                                        handleUpdateButton('rotatorLinks', [firstUrl, '', '', '', '']);
                                        handleUpdateButton('rotatorActive', false);
                                        toast.success('Rotador desactivado. URLs 2-5 eliminadas.');
                                      }
                                    } else {
                                      // Activating rotator
                                      handleUpdateButton('rotatorActive', isActivating);
                                      if (isActivating) {
                                        toast.success('Telegram Rotativo activado. Ahora puedes agregar hasta 5 URLs.');
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
                                  <div key={idx} className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-blue-500/50 w-4 text-center">{idx + 1}</span>
                                    <input
                                      type="text"
                                      placeholder={`Link alternativo #${idx + 1}`}
                                      value={selectedButton.rotatorLinks?.[idx] || ''}
                                      onChange={(e) => handleUpdateRotatorLink(idx, e.target.value)}
                                      className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none placeholder:text-silver/20"
                                    />
                                  </div>
                                ))}
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
                        <h2 className="text-xl font-bold">Configuración de la Página</h2>
                        
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <button 
                            onClick={() => setSettingsTab('profile')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${settingsTab === 'profile' ? 'bg-primary text-white shadow-lg' : 'text-silver/40 hover:text-white'}`}
                          >
                            <span className="material-symbols-outlined text-sm">person</span>
                            Perfil
                          </button>
                          <button 
                            onClick={() => setSettingsTab('domain')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${settingsTab === 'domain' ? 'bg-primary text-white shadow-lg' : 'text-silver/40 hover:text-white'}`}
                          >
                            <span className="material-symbols-outlined text-sm">language</span>
                            Dominio
                          </button>
                        </div>
                      </div>

                      {settingsTab === 'profile' ? (
                        <div className="space-y-8 animate-fade-in">
                      <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-silver/40">person</span>
                            Perfil & Identidad
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="mb-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-silver/40 uppercase pl-1">Carpeta / Proyecto</label>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-silver/20 text-lg">folder</span>
                                <input
                                  type="text"
                                  value={currentPage.folder || ''}
                                  onChange={(e) => handleUpdatePage('folder', e.target.value)}
                                  placeholder="Ej. Mis Proyectos"
                                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary placeholder:text-silver/20"
                                  list="folder-suggestions"
                                />
                                <datalist id="folder-suggestions">
                                  <option value="Mis Proyectos" />
                                  <option value="Personal" />
                                  <option value="Negocios" />
                                </datalist>
                              </div>
                            </div>
                          </div>

                          <div className="mb-6 flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                            <div>
                              <span className="text-xs font-bold text-white block">Modo Landing</span>
                              <span className="text-[10px] text-silver/40">Estilo visual de la página</span>
                            </div>
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                              <button
                                onClick={() => handleUpdatePage('template', 'minimal')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${currentPage.template === 'minimal' ? 'bg-white text-black shadow-lg' : 'text-silver/60 hover:text-white'}`}
                              >
                                Minimalista
                              </button>
                              <button
                                onClick={() => handleUpdatePage('template', 'full')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${currentPage.template === 'full' ? 'bg-primary text-white shadow-lg' : 'text-silver/60 hover:text-white'}`}
                              >
                                Full
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-6 items-start">
                            <div className="space-y-3 shrink-0">
                              <div
                                className="group relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 hover:border-primary transition-colors"
                                style={{
                                  backgroundColor: currentPage.theme.backgroundType === 'solid' ? currentPage.theme.backgroundStart : currentPage.theme.backgroundStart
                                }}
                              >
                                <img src={currentPage.profileImage} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                  <span className="material-symbols-outlined text-white text-sm mb-1">upload</span>
                                  <span className="text-[8px] text-white font-bold uppercase">Cambiar</span>
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
                                <label className="text-[8px] font-bold text-silver/40 uppercase block text-center">Tamaño ({currentPage.profileImageSize || 75}px)</label>
                                <input
                                  type="range"
                                  min="50"
                                  max="150"
                                  value={currentPage.profileImageSize || 75}
                                  onChange={(e) => handleUpdatePage('profileImageSize', parseInt(e.target.value))}
                                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                />
                              </div>
                            </div>

                            <div className="flex-1 space-y-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-silver/40 uppercase pl-1">Nombre Visible</label>
                                <input type="text" value={currentPage.profileName} onChange={(e) => handleUpdatePage('profileName', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-silver/40 uppercase pl-1">Nombre Interno (Dashboard)</label>
                                <input type="text" value={currentPage.name} onChange={(e) => handleUpdatePage('name', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-silver focus:outline-none focus:border-primary" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/5">
                          <label className="text-[10px] font-bold text-silver/40 uppercase mb-3 block">{t('dashboard.links.pageBackground')}</label>
                          <div className="flex gap-4 mb-4">
                            <div className="flex bg-[#0B0B0B] border border-border p-1 rounded-xl w-fit">
                              <button onClick={() => handleUpdatePage('theme.backgroundType', 'solid')} className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === 'solid' ? 'bg-white/10 border border-white/10 text-white' : 'text-silver/40 hover:text-white'}`}>Sólido</button>
                              <button onClick={() => handleUpdatePage('theme.backgroundType', 'gradient')} className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === 'gradient' ? 'bg-white/10 border border-white/10 text-white' : 'text-silver/40 hover:text-white'}`}>Gradiente</button>
                              <button onClick={() => handleUpdatePage('theme.backgroundType', 'blur')} className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === 'blur' ? 'bg-white/10 border border-white/10 text-white' : 'text-silver/40 hover:text-white'}`}>Foto Blur</button>
                            </div>
                          </div>

                          {currentPage.theme.backgroundType === 'solid' ? (
                            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                              <input type="color" value={currentPage.theme.backgroundStart} onChange={(e) => handleUpdatePage('theme.backgroundStart', e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer border-none bg-transparent" />
                              <span className="text-xs font-mono text-silver/50 uppercase">{currentPage.theme.backgroundStart}</span>
                            </div>
                          ) : currentPage.theme.backgroundType === 'gradient' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] text-silver/30 font-bold uppercase mb-2">Inicio</p>
                                <input type="color" value={currentPage.theme.backgroundStart} onChange={(e) => handleUpdatePage('theme.backgroundStart', e.target.value)} className="h-10 w-full rounded-lg cursor-pointer border-none bg-transparent" />
                              </div>
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] text-silver/30 font-bold uppercase mb-2">Fin</p>
                                <input type="color" value={currentPage.theme.backgroundEnd} onChange={(e) => handleUpdatePage('theme.backgroundEnd', e.target.value)} className="h-10 w-full rounded-lg cursor-pointer border-none bg-transparent" />
                              </div>
                            </div>
                          ) : (
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                              <span className="material-symbols-outlined text-silver/40">blur_on</span>
                              <p className="text-[10px] text-silver/50">Se usará tu foto de perfil con un efecto borroso como fondo.</p>
                            </div>
                          )}
                        </div>
                          </section>
                        </div>
                      ) : (
                        <div className="space-y-8 animate-fade-in">
                          {/* DOMAIN CONFIGURATION SECTION */}
                          <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                              <h3 className="text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-silver/40">language</span>
                                Estado del Dominio
                              </h3>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                currentPage.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              }`}>
                                {currentPage.status === 'active' ? 'Publicado' : 'Borrador'}
                              </div>
                            </div>
                            
                            <div className="p-6 space-y-6">

                              {/* Custom Domain Section — state-based flow */}
                              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="flex items-center gap-2 mb-4 relative">
                                  <span className="material-symbols-outlined text-primary text-sm">verified</span>
                                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Dominio Personalizado Pro</h4>
                                </div>

                                {/* STATE: draft / no plan */}
                                {currentPage.status === 'draft' && (
                                  <div className="p-8 text-center bg-white/5 border border-white/5 rounded-[2rem] border-dashed">
                                    <span className="material-symbols-outlined text-4xl text-silver/20 mb-4 block">lock</span>
                                    <h4 className="text-white font-bold mb-2">Link no activado</h4>
                                    <p className="text-silver/40 text-xs max-w-xs mx-auto mb-6">Debes contratar un plan para desbloquear la configuración de dominio personalizado.</p>
                                    <button
                                      onClick={() => navigate('/dashboard/checkout', { state: { pendingPurchase: { linksData: [currentPage] } } })}
                                      className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:scale-110 transition-all"
                                    >
                                      Ver Planes
                                    </button>
                                  </div>
                                )}

                                {/* STATE: none — form to request domain */}
                                {currentPage.status === 'active' && (!currentPage.domainStatus || currentPage.domainStatus === 'none') && (
                                  <div className="space-y-4 relative">
                                    <p className="text-[11px] text-silver/40 leading-relaxed">
                                      Ingresa tu dominio y nuestro equipo lo configurará por ti. No necesitas tocar ningún DNS.
                                    </p>
                                    <div className="flex gap-2">
                                      <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-silver/20 text-sm">language</span>
                                        <input
                                          type="text"
                                          placeholder="ej: misitio.com"
                                          value={currentPage.customDomain || ''}
                                          onChange={(e) => handleUpdatePage('customDomain', e.target.value.toLowerCase().replace(/\s/g, '').replace(/https?:\/\//, ''))}
                                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-sm text-white placeholder:text-silver/20 focus:outline-none focus:border-primary/50 transition-all font-mono"
                                        />
                                      </div>
                                      <button
                                        onClick={async () => {
                                          if (!currentPage.customDomain) {
                                            toast.error('Ingresa un dominio primero');
                                            return;
                                          }
                                          const loadingToast = toast.loading('Enviando solicitud...');
                                          try {
                                            const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4005';
                                            const { supabase: sb } = await import('@/services/supabase');
                                            const { data: { session } } = await sb.auth.getSession();
                                            const res = await fetch(`${BACKEND_URL}/api/domains/request`, {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${session?.access_token}`,
                                              },
                                              body: JSON.stringify({ linkId: currentPage.id, domain: currentPage.customDomain }),
                                            });
                                            const json = await res.json();
                                            toast.dismiss(loadingToast);
                                            if (!res.ok) {
                                              toast.error(json.error || 'Error al enviar solicitud');
                                            } else {
                                              toast.success('¡Solicitud enviada! El equipo lo activará pronto.');
                                              handleUpdatePage('domainStatus', 'pending');
                                            }
                                          } catch {
                                            toast.dismiss(loadingToast);
                                            toast.error('Error al enviar solicitud');
                                          }
                                        }}
                                        className="px-5 bg-primary hover:bg-primary/80 text-black border border-primary/20 font-black rounded-xl text-xs uppercase tracking-widest transition-all whitespace-nowrap"
                                      >
                                        Solicitar Vinculación
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* STATE: pending — waiting for admin */}
                                {currentPage.status === 'active' && currentPage.domainStatus === 'pending' && (
                                  <div className="space-y-4 relative">
                                    <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                                      <span className="animate-pulse material-symbols-outlined text-yellow-400 text-2xl">schedule</span>
                                      <div>
                                        <p className="text-sm font-bold text-yellow-300">En proceso de configuración</p>
                                        <p className="text-xs text-yellow-400/70 mt-0.5">Nuestro equipo está configurando tu dominio. Te avisaremos cuando esté listo.</p>
                                      </div>
                                    </div>
                                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                                      <span className="text-[10px] text-silver/40 uppercase tracking-widest block mb-1">Dominio Solicitado</span>
                                      <p className="text-primary font-mono text-sm font-bold">{currentPage.customDomain}</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        handleUpdatePage('domainStatus', 'none');
                                        handleUpdatePage('customDomain', '');
                                      }}
                                      className="text-xs text-silver/40 hover:text-silver transition-colors underline underline-offset-2"
                                    >
                                      Cancelar solicitud / Cambiar dominio
                                    </button>
                                  </div>
                                )}

                                {/* STATE: active — domain live */}
                                {currentPage.status === 'active' && currentPage.domainStatus === 'active' && (
                                  <div className="space-y-4 relative">
                                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                      <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
                                      <div>
                                        <p className="text-sm font-bold text-emerald-300">¡Dominio Activo!</p>
                                        <p className="text-xs text-emerald-400/70 mt-0.5">Tu dominio ya está funcionando.</p>
                                      </div>
                                    </div>
                                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                                      <span className="text-[10px] text-silver/40 uppercase tracking-widest block mb-1">Tu Dominio</span>
                                      <p className="text-primary font-mono text-sm font-bold">{currentPage.customDomain}</p>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                      <button
                                        onClick={() => window.open(`https://${currentPage.customDomain}`, '_blank')}
                                        className="flex items-center gap-2 flex-1 py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-bold rounded-xl text-xs transition-all"
                                      >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        Ver mi sitio
                                      </button>
                                      <button
                                        onClick={() => navigate('/dashboard/analytics')}
                                        className="flex items-center gap-2 flex-1 py-3 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold rounded-xl text-xs transition-all"
                                      >
                                        <span className="material-symbols-outlined text-sm">bar_chart</span>
                                        Ver métricas
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* STATE: failed */}
                                {currentPage.status === 'active' && currentPage.domainStatus === 'failed' && (
                                  <div className="space-y-4 relative">
                                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                      <span className="material-symbols-outlined text-red-400 text-2xl">cancel</span>
                                      <div>
                                        <p className="text-sm font-bold text-red-300">Error de configuración</p>
                                        <p className="text-xs text-red-400/70 mt-0.5">{currentPage.domainNotes || 'Hubo un problema al configurar tu dominio. Contacta soporte.'}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        handleUpdatePage('domainStatus', 'none');
                                        handleUpdatePage('customDomain', '');
                                      }}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold rounded-xl text-xs transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm">refresh</span>
                                      Intentar de nuevo
                                    </button>
                                  </div>
                                )}
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
          <div className="relative w-[320px] aspect-[9/19] bg-black rounded-[3rem] border-[6px] border-[#333] shadow-2xl overflow-hidden flex flex-col z-10 cursor-pointer transition-colors hover:border-[#444]"
            onClick={() => {
              setSelectedButtonId(null);
              setShowButtonCreator(false);
            }}
          >
            <div
              className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col ${currentPage.template === 'full' ? '' : 'transition-all duration-500'}`}
              style={{
                background: getBackgroundStyle(currentPage).background,
                backgroundImage: getBackgroundStyle(currentPage).backgroundImage,
                backgroundSize: getBackgroundStyle(currentPage).backgroundSize,
                backgroundPosition: getBackgroundStyle(currentPage).backgroundPosition
              }}
            >
              {currentPage.theme.backgroundType === 'blur' && (
                <div className="absolute inset-0 z-0 backdrop-blur-3xl bg-black/40 pointer-events-none"></div>
              )}
              {currentPage.template === 'full' && (
                <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                  <div
                    className="relative transition-all duration-300 shadow-2xl"
                    style={{
                      width: `${currentPage.profileImageSize || 100}%`,
                      height: `${currentPage.profileImageSize || 100}%`
                    }}
                  >
                    <img src={currentPage.profileImage} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black transition-all" style={{ opacity: currentPage.theme.overlayOpacity / 100 }}></div>
                  </div>
                </div>
              )}
              {currentPage.template === 'split' && (<div className="h-1/2 w-full relative z-0 shrink-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /></div>)}
              <div className={`min-h-full p-6 pt-12 flex flex-col relative z-20 ${currentPage.template === 'split' ? '' : 'items-center'} ${currentPage.template === 'minimal' ? 'justify-center' : ''} ${currentPage.template === 'full' ? 'justify-end pb-12' : ''}`}>
                {currentPage.template !== 'full' && (
                  <div className={`mb-8 relative z-10 ${currentPage.template === 'split' ? 'mt-4 text-left' : 'text-center'}`}>
                    {currentPage.template === 'minimal' && (
                      <div
                        className="rounded-full bg-gray-800 mb-4 overflow-hidden border-4 shadow-xl mx-auto transition-all"
                        style={{
                          borderColor: currentPage.theme.pageBorderColor,
                          width: `${currentPage.profileImageSize || 96}px`,
                          height: `${currentPage.profileImageSize || 96}px`
                        }}
                      >
                        <img src={currentPage.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg px-4">{currentPage.profileName}</h2>
                    <p className="text-white/70 text-xs mt-1 drop-shadow-md">@{currentPage.name.toLowerCase().replace(/\s/g, '')}</p>
                  </div>
                )}
                {currentPage.template === 'full' && (<div className="text-center mb-6"><h2 className="text-white font-bold text-2xl leading-tight drop-shadow-lg px-4">{currentPage.profileName}</h2></div>)}
                <div className={`w-full space-y-3 relative z-10 ${currentPage.template === 'minimal' ? 'max-w-[260px]' : ''}`}>
                  {currentPage.buttons.map(btn => (
                    <a key={btn.id} href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedButtonId(btn.id); setShowButtonCreator(false); }} className={`block w-full py-3.5 px-6 font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 group backdrop-blur-sm cursor-pointer ${FONT_MAP[btn.font || 'sans']} ${selectedButtonId === btn.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black' : ''}`} style={{ backgroundColor: currentPage.template === 'full' ? `${btn.color}CC` : btn.color, color: btn.textColor, borderRadius: `${btn.borderRadius}px`, opacity: btn.opacity / 100 }}>
                      {btn.type !== 'custom' && (<div className="w-5 h-5 fill-current">{SOCIAL_PRESETS[btn.type].icon}</div>)}
                      {btn.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SIGUIENTE PASO BUTTON */}
          <button
            onClick={() => {
              if (draftPages.length > 0) {
                navigate('/dashboard/checkout', {
                  state: {
                    pendingPurchase: {
                      linksData: draftPages
                    }
                  }
                });
              } else {
                navigate('/dashboard/home');
              }
            }}
            className="w-[320px] py-3.5 px-6 bg-black border-2 border-blue-500 text-blue-500 font-bold text-sm rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2 group animate-pulse"
            style={{ animationDuration: '2s' }}
          >
            <span>Siguiente paso</span>
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div >

      {/* DELETE CONFIRMATION MODAL */}
      {
        showDeleteConfirm && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}>
            <div className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 text-center">
                <h2 className="text-lg font-bold text-white mb-2">
                  {deleteTarget.type === 'page' ? '¿Eliminar este Link?' : '¿Eliminar este botón?'}
                </h2>
                <p className="text-silver/60 text-sm mb-6">
                  {deleteTarget.type === 'page' ? 'Se eliminará permanentemente.' : 'El botón se eliminará permanentemente.'}
                </p>

                <button onClick={async () => {
                  if (deleteTarget.type === 'page') {
                    if (pages.length <= 1) {
                      toast.error("Debes tener al menos una página.");
                      setShowDeleteConfirm(false);
                      setDeleteTarget(null);
                      return;
                    }

                    // DELETE FROM DB (for active/paid links)
                    const pageId = selectedPageId;
                    if (pageId && user) {
                      const { error } = await supabase.from('smart_links').delete().eq('id', pageId).eq('user_id', user.id);
                      if (error) {
                        console.error('Error deleting page:', error);
                      }
                    }

                    const newPages = pages.filter(p => p.id !== selectedPageId);
                    setPages(newPages);

                    // SYNC localStorage: save only remaining drafts
                    try {
                      const remainingDrafts = newPages.filter(p => p.status === 'draft');
                      localStorage.setItem('my_links_data', JSON.stringify(remainingDrafts));
                    } catch (e) {
                      console.error('Error syncing localStorage after delete:', e);
                    }

                    // Select next available page
                    setSelectedPageId(newPages[0]?.id || '');
                    toast.success('Link eliminado correctamente');
                  } else if (deleteTarget.type === 'button' && deleteTarget.id) {
                    handleDeleteButton(deleteTarget.id);
                  }
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all uppercase tracking-wider shadow-lg shadow-blue-600/20">
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
