import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useModal } from '@/contexts/ModalContext';
import { useTranslation } from '@/contexts/I18nContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Import Social Media Logos
import instagramLogo from '@/assets/animations/instagram.png';
import tiktokLogo from '@/assets/animations/tik-tok.png';

// Types
type TemplateType = 'minimal' | 'split' | 'full';
type SocialType = 'instagram' | 'tiktok' | 'telegram' | 'onlyfans' | 'custom';
type FontType = 'sans' | 'serif' | 'mono' | 'display';
type PageStatus = 'active' | 'draft';
type BackgroundType = 'solid' | 'gradient';

interface ButtonLink {
  id: string;
  type: SocialType;
  title: string;
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
  template: TemplateType;
  theme: {
    pageBorderColor: string;
    overlayOpacity: number; // 0-100
    backgroundType: BackgroundType;
    backgroundStart: string;
    backgroundEnd: string;
  };
  buttons: ButtonLink[];
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
  instagram: { title: 'Instagram', color: '#FFFFFF', icon: <Icons.Instagram /> },
  tiktok: { title: 'TikTok', color: '#000000', icon: <Icons.TikTok /> },
  telegram: { title: 'Telegram', color: '#0088cc', icon: <Icons.Telegram /> },
  onlyfans: { title: 'OnlyFans', color: '#00AFF0', icon: <Icons.OnlyFans /> },
  custom: { title: 'Personalizado', color: '#333333', icon: <Icons.Custom /> }
};

const DEFAULT_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const DEFAULT_PAGE: LinkPage = {
  id: '',
  status: 'draft',
  name: 'Nueva Página',
  profileName: 'Name',
  profileImage: DEFAULT_PROFILE_IMAGE,
  template: 'minimal',
  theme: {
    pageBorderColor: '#333333',
    overlayOpacity: 40,
    backgroundType: 'solid',
    backgroundStart: '#000000',
    backgroundEnd: '#1a1a1a'
  },
  buttons: []
};

const LINK_PRICE_STANDARD = 60; // Base price for link without Telegram Rotativo
const ROTATOR_SURCHARGE = 20; // Additional charge for Telegram Rotativo feature
const LINK_PRICE_ROTATOR = LINK_PRICE_STANDARD + ROTATOR_SURCHARGE; // Total: $80

const MOCK_USER_HAS_CARD = false;

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
  collapsed = false
}: {
  btn: ButtonLink,
  isSelected: boolean,
  onClick: () => void,
  collapsed?: boolean
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
              <span className="material-symbols-outlined text-[10px]">sync</span> Rotativo Activo (+${ROTATOR_SURCHARGE})
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
  }
  return { background: `linear-gradient(to bottom right, ${page.theme.backgroundStart}, ${page.theme.backgroundEnd})` };
};

// Helper to check if page has rotator
const hasRotatorActive = (page: LinkPage) => page.buttons.some(b => b.type === 'telegram' && b.rotatorActive);

export default function Links() {
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { user } = useAuth();

  // --- STATE ---
  const [pages, setPages] = useState<LinkPage[]>(() => {
    const saved = localStorage.getItem('my_links_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // STRICT MIGRATION: Force status='draft' and ensure bg fields
      return parsed.map((p: any) => ({
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
    return [{
      id: 'page1', status: 'draft', name: 'Principal', profileName: 'Name', profileImage: DEFAULT_PROFILE_IMAGE, template: 'minimal', theme: { pageBorderColor: '#222222', overlayOpacity: 40, backgroundType: 'solid', backgroundStart: '#000000', backgroundEnd: '#1a1a1a' },
      buttons: [{ id: '1', type: 'instagram', title: 'Sígueme en IG', url: 'https://instagram.com', color: '#E1306C', textColor: '#FFFFFF', font: 'sans', borderRadius: 12, opacity: 100, isActive: true }]
    }];
  });

  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page1');
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [showButtonCreator, setShowButtonCreator] = useState(false);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // DISCOUNT STATE
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, percent: number } | null>(null);
  const [discountError, setDiscountError] = useState('');

  // Derived
  const currentPage = pages.find(p => p.id === selectedPageId) || pages[0];
  const selectedButton = currentPage.buttons.find(b => b.id === selectedButtonId);

  // Split Pages
  const activePages = pages.filter(p => p.status === 'active');
  const draftPages = pages.filter(p => p.status === 'draft');

  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Animation State
  const [animateBuyButton, setAnimateBuyButton] = useState(false);
  const prevDraftCountRef = useRef(draftPages.length);

  useEffect(() => {
    if (draftPages.length > prevDraftCountRef.current) {
        setAnimateBuyButton(true);
        const timer = setTimeout(() => setAnimateBuyButton(false), 1000); // 1s animation
        return () => clearTimeout(timer);
    }
    prevDraftCountRef.current = draftPages.length;
  }, [draftPages.length]);

  // Sidebar Collapse State - Auto-collapse on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Auto-collapse on mobile/tablet screens
    return window.innerWidth < 1024;
  });

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'page' | 'button', id?: string, name?: string } | null>(null);

  // Telegram Rotator Suggestion Modal
  const [showRotatorSuggestion, setShowRotatorSuggestion] = useState(false);

  // Horizontal Scroll State for Link Navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // --- SUPABASE INTEGRATION ---

  // 1. Fetch Links from DB
  useEffect(() => {
    if (!user?.id) return;

    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('smart_links')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const dbPages: LinkPage[] = data.map(link => ({
            id: link.id,
            status: link.status as PageStatus,
            name: link.config?.name || link.slug,
            profileName: link.title || '',
            profileImage: link.photo || DEFAULT_PROFILE_IMAGE,
            template: link.config?.template || 'minimal',
            theme: {
              pageBorderColor: link.config?.theme?.pageBorderColor || '#333333',
              overlayOpacity: link.config?.theme?.overlayOpacity || 40,
              backgroundType: link.config?.theme?.backgroundType || 'solid',
              backgroundStart: link.config?.theme?.backgroundStart || '#000000',
              backgroundEnd: link.config?.theme?.backgroundEnd || '#1a1a1a'
            },
            buttons: ((link.buttons as any[]) || []).map(b => ({
              ...b,
              opacity: b.opacity ?? 100,
              borderRadius: b.borderRadius ?? 12,
              isActive: b.isActive ?? true,
              rotatorActive: b.rotatorActive ?? false,
              rotatorLinks: b.rotatorLinks || ['', '', '', '', '']
            }))
          }));
          setPages(dbPages);
          if (dbPages.length > 0) setSelectedPageId(dbPages[0].id);
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

        const isNewPage = currentPageToSave.id.includes('page') && !currentPageToSave.id.includes('-');

        if (isNewPage) {
          const randomSlug = Math.random().toString(36).substring(2, 8);
          const slugToUse = currentPageToSave.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + randomSlug;

          const { data: newLink, error: insertError } = await supabase
            .from('smart_links')
            .insert({
              user_id: user.id,
              slug: slugToUse,
              title: currentPageToSave.profileName,
              photo: currentPageToSave.profileImage,
              buttons: currentPageToSave.buttons,
              status: 'draft',
              config: {
                template: currentPageToSave.template,
                theme: currentPageToSave.theme,
                name: currentPageToSave.name
              }
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newLink) {
            setPages(prev => prev.map(p => p.id === currentPageToSave.id ? { ...p, id: newLink.id } : p));
            setSelectedPageId(newLink.id);
            toast.success("Link creado y guardado");
          }
        } else {
          const updates = {
            title: currentPageToSave.profileName,
            photo: currentPageToSave.profileImage,
            buttons: currentPageToSave.buttons,
            config: {
              ...currentPageToSave.theme,
              template: currentPageToSave.template,
              theme: currentPageToSave.theme,
              name: currentPageToSave.name
            }
          };

          const { error } = await supabase
            .from('smart_links')
            .update(updates)
            .eq('id', currentPageToSave.id);

          if (error) throw error;
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

  useEffect(() => {
    if (draftPages.length > prevDraftCountRef.current) {
      setAnimateBuyButton(true);
      const timer = setTimeout(() => setAnimateBuyButton(false), 1000);
      return () => clearTimeout(timer);
    }
    prevDraftCountRef.current = draftPages.length;
  }, [draftPages.length]);

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
      if (type === 'telegram') {
        // Show modal suggesting Telegram Rotativo
        setShowRotatorSuggestion(true);
        return;
      } else {
        // Silently prevent for other types
        toast.error(`Ya tienes un botón de ${SOCIAL_PRESETS[type].title}. Solo puedes agregar uno de cada tipo.`);
        return;
      }
    }

    const config = SOCIAL_PRESETS[type];
    const newButton: ButtonLink = {
      id: Math.random().toString(36).substring(2, 9),
      type, title: type === 'custom' ? 'Nuevo Botón' : config.title, url: '', color: config.color,
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
      cancelText: 'Cancelar',
      type: 'warning'
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

  // Payment Calculation
  const getPaymentDetails = () => {
    const rotatorPages = draftPages.filter(hasRotatorActive);
    const standardPages = draftPages.filter(p => !hasRotatorActive(p));

    const countRotator = rotatorPages.length;
    const countStandard = standardPages.length;

    const subtotal = (countStandard * LINK_PRICE_STANDARD) + (countRotator * LINK_PRICE_ROTATOR);

    // DISCOUNT LOGIC
    let discountAmount = 0;
    if (appliedDiscount) {
      discountAmount = (subtotal * appliedDiscount.percent) / 100;
    }

    const total = subtotal - discountAmount;

    return { countRotator, countStandard, subtotal, discountAmount, total };
  };

  // APPLY COUPON
  const handleApplyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'PRO20') {
      setAppliedDiscount({ code: 'PRO20', percent: 20 });
      setDiscountError('');
      toast.success('¡Código aplicado! 20% OFF');
    } else if (code === 'WELCOME10') {
      setAppliedDiscount({ code: 'WELCOME10', percent: 10 });
      setDiscountError('');
      toast.success('¡Código aplicado! 10% OFF');
    } else {
      setDiscountError('Código inválido');
      setAppliedDiscount(null);
    }
  };

  const handleProcessPayment = () => {
    // ONLY COUNT DRAFTS
    if (draftPages.length === 0) {
      toast('No hay links nuevos para comprar', { icon: 'ℹ️' });
      return;
    }

    const { total, countRotator, countStandard, discountAmount, subtotal } = getPaymentDetails();

    if (MOCK_USER_HAS_CARD) {
      toast.success(`Pago exitoso de $${total.toFixed(2)}`);
      // Upgrade status to active logic would go here
      setPages(prev => prev.map(p => p.status === 'draft' ? { ...p, status: 'active' } : p));
      setShowPaymentModal(false);
    } else {
      toast.loading('Redirigiendo a pagos...');
      setTimeout(() => {
        navigate('/dashboard/payments', {
          state: {
            pendingPurchase: {
              type: 'extra_links',
              quantity: draftPages.length,
              amount: total,
              discountApplied: appliedDiscount ? { ...appliedDiscount, amount: discountAmount } : null,
              details: { countStandard, countRotator, subtotal }
            }
          }
        });
        toast.dismiss();
      }, 1000);
    }
  };

  const paymentDetails = getPaymentDetails();

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
                    <p className="text-[9px] text-green-500 font-bold uppercase tracking-wider">{t('dashboard.links.active')}</p>
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
              <div className="p-3 md:p-4 border-b border-white/5 relative z-10 bg-[#070707] flex items-center gap-2">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-all shrink-0 touch-manipulation"
                  title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
                >
                  <span className="material-symbols-outlined text-white text-xl">menu</span>
                </button>
                {!sidebarCollapsed && (
                  <button onClick={() => setShowButtonCreator(true)} className="flex-1 py-2.5 md:py-3 rounded-xl bg-primary text-white font-bold text-xs md:text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation">
                    <span className="material-symbols-outlined text-lg md:text-xl">add_circle</span>
                    <span className="hidden sm:inline">{t('dashboard.links.addButton')}</span>
                    <span className="sm:hidden">Añadir</span>
                  </button>
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
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'button', id: btn.id, name: btn.title });
                              setShowDeleteConfirm(true);
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
                    onClick={() => setSelectedButtonId(null)}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-silver/40 hover:text-white hover:bg-white/5 bg-white/5 transition-all ${sidebarCollapsed ? 'flex-col' : ''}`}
                    title={sidebarCollapsed ? "Configuración del Link" : undefined}
                  >
                    <span className={`material-symbols-outlined ${sidebarCollapsed ? 'text-lg' : 'text-sm'}`}>settings</span>
                    {!sidebarCollapsed && "Config. Link"}
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
                              <input type="text" value={selectedButton.url} onChange={(e) => handleUpdateButton('url', e.target.value)} className="flex-1 bg-transparent text-sm font-mono text-silver focus:outline-none" placeholder="https://..." />
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
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h2 className="text-xl font-bold">Configuración de la Página</h2>
                      </div>
                      <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-silver/40">person</span>
                            Perfil & Identidad
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="flex gap-6 items-start">
                            <div className="group relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 hover:border-primary transition-colors bg-black/20 shrink-0">
                              <img src={currentPage.profileImage} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <span className="material-symbols-outlined text-white mb-1">cloud_upload</span>
                                <span className="text-[8px] font-bold text-white uppercase">Cambiar</span>
                              </div>
                              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
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

                          <div className="pt-6 mt-6 border-t border-white/5">
                            <label className="text-[10px] font-bold text-silver/40 uppercase mb-3 block">{t('dashboard.links.pageBackground')}</label>
                            <div className="flex gap-4 mb-4">
                              <div className="flex bg-[#0B0B0B] border border-border p-1 rounded-xl w-fit">
                                <button onClick={() => handleUpdatePage('theme.backgroundType', 'solid')} className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === 'solid' ? 'bg-white/10 border border-white/10 text-white' : 'text-silver/40 hover:text-white'}`}>Sólido</button>
                                <button onClick={() => handleUpdatePage('theme.backgroundType', 'gradient')} className={`px-6 py-2 text-[10px] font-bold transition-all rounded-lg ${currentPage.theme.backgroundType === 'gradient' ? 'bg-white/10 border border-white/10 text-white' : 'text-silver/40 hover:text-white'}`}>Gradiente</button>
                              </div>
                            </div>

                            {currentPage.theme.backgroundType === 'solid' ? (
                              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                                <input type="color" value={currentPage.theme.backgroundStart} onChange={(e) => handleUpdatePage('theme.backgroundStart', e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer border-none bg-transparent" />
                                <span className="text-xs font-mono text-silver/50 uppercase">{currentPage.theme.backgroundStart}</span>
                              </div>
                            ) : (
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
                            )}
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STRUCTURAL FOOTER BUY BUTTON (Only for unpaid draft links) */}
          {currentPage.status === 'draft' && draftPages.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-gradient-to-t from-[#0a0a0a] to-[#050505] z-20 shrink-0 flex justify-center">
              <button
                onClick={() => setShowPaymentModal(true)}
                className={`w-full max-w-md py-4 px-6 bg-gradient-to-r from-[#FFB700] via-[#FFC700] to-[#FF8A00] rounded-2xl text-black font-black uppercase tracking-wider shadow-[0_0_30px_rgba(255,183,0,0.3)] hover:shadow-[0_0_50px_rgba(255,183,0,0.5)] hover:scale-[1.02] transition-all flex items-center justify-between gap-4 relative overflow-hidden group ${animateBuyButton ? 'animate-bounce' : ''}`}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-black/10 backdrop-blur-sm flex items-center justify-center shrink-0 relative z-10">
                  <span className="material-symbols-outlined text-black text-2xl">shopping_cart</span>
                </div>

                {/* Text Content */}
                <div className="flex-1 flex flex-col items-start gap-1 relative z-10">
                  <span className="text-sm font-black uppercase tracking-wider leading-none">Continuar con el pago</span>
                  <span className="text-[10px] opacity-80 font-bold uppercase tracking-wide leading-none">Acceso Ilimitado • Hasta 100 links</span>
                </div>

                {/* Price Badge */}
                <div className="bg-black/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-black/10 shrink-0 relative z-10">
                  <span className="text-black font-black text-base">${paymentDetails.total}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* COL 2: PREVIEW (Desktop Only) */}
        <div className="hidden lg:flex w-[400px] bg-[#020202] border-l border-white/5 items-center justify-center relative p-4 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] shrink-0 lg:order-last">
          <div className="relative w-[320px] aspect-[9/19] bg-black rounded-[3rem] border-[6px] border-[#333] shadow-2xl overflow-hidden flex flex-col z-10">
            <div
              className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col ${currentPage.template === 'full' ? '' : 'transition-all duration-500'}`}
              style={{ background: currentPage.template === 'full' ? '#111' : (getBackgroundStyle(currentPage).background) }}
            >
              {currentPage.template === 'full' && (<div className="absolute inset-0 z-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black transition-all" style={{ opacity: currentPage.theme.overlayOpacity / 100 }}></div></div>)}
              {currentPage.template === 'split' && (<div className="h-1/2 w-full relative z-0 shrink-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /></div>)}
              <div className={`min-h-full p-6 pt-12 flex flex-col relative z-20 ${currentPage.template === 'split' ? '' : 'items-center'} ${currentPage.template === 'minimal' ? 'justify-center' : ''} ${currentPage.template === 'full' ? 'justify-end pb-12' : ''}`}>
                {currentPage.template !== 'full' && (
                  <div className={`mb-8 relative z-10 ${currentPage.template === 'split' ? 'mt-4 text-left' : 'text-center'}`}>
                    {currentPage.template === 'minimal' && (
                      <div
                        className="h-24 w-24 rounded-full bg-gray-800 mb-4 overflow-hidden border-4 shadow-xl mx-auto"
                        style={{ borderColor: currentPage.theme.pageBorderColor }}
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
                    <a key={btn.id} href="#" className={`block w-full py-3.5 px-6 font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 group backdrop-blur-sm ${FONT_MAP[btn.font || 'sans']}`} style={{ backgroundColor: currentPage.template === 'full' ? `${btn.color}CC` : btn.color, color: btn.textColor, borderRadius: `${btn.borderRadius}px`, opacity: btn.opacity / 100 }}>
                      {btn.type !== 'custom' && (<div className="w-5 h-5 fill-current">{SOCIAL_PRESETS[btn.type].icon}</div>)}
                      {btn.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10"><span className="material-symbols-outlined text-sm">close</span></button>
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary"><span className="material-symbols-outlined text-3xl">shopping_cart</span></div>
                <h2 className="text-2xl font-bold text-white">{t('dashboard.links.activateNewLinks')}</h2>
                <p className="text-silver/60 text-sm mt-2">{t('dashboard.links.pendingLinks', { count: draftPages.length })}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl space-y-3 my-6">
                {paymentDetails.countStandard > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-silver/60">{t('dashboard.links.standardLinks')} ({paymentDetails.countStandard})</span>
                    <span>${(paymentDetails.countStandard * LINK_PRICE_STANDARD).toFixed(2)}</span>
                  </div>
                )}
                {paymentDetails.countRotator > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-400">Links con Rotativo ({paymentDetails.countRotator})</span>
                    <span className="text-blue-400 font-bold">${(paymentDetails.countRotator * LINK_PRICE_ROTATOR).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between items-center font-semibold text-silver/60 text-sm mb-1"><span>Subtotal</span><span>${paymentDetails.subtotal.toFixed(2)}</span></div>
                  <div className="flex gap-2 mb-3 mt-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Código de referido..."
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        disabled={!!appliedDiscount}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary uppercase disabled:opacity-50"
                      />
                      {appliedDiscount && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                        </div>
                      )}
                    </div>
                    {!appliedDiscount ? (
                      <button onClick={handleApplyDiscount} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-bold">Aplicar</button>
                    ) : (
                      <button onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg text-xs font-bold">Quitar</button>
                    )}
                  </div>
                  {discountError && <p className="text-red-500 text-[10px] mb-2">{discountError}</p>}
                  {appliedDiscount && (
                    <div className="flex justify-between items-center text-green-500 text-sm font-bold animate-fade-in mb-1">
                      <span>Descuento ({appliedDiscount.percent}%)</span>
                      <span>-${paymentDetails.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-xl text-white mt-2 pt-2 border-t border-white/5">
                    <span>Total a Pagar</span>
                    <span>${paymentDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleProcessPayment} className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all uppercase tracking-wider shadow-lg">Continuar al Pago</button>
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM ROTATOR SUGGESTION MODAL */}
      {showRotatorSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowRotatorSuggestion(false)}>
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <span className="material-symbols-outlined text-3xl">sync</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¿Necesitas más Telegrams?</h2>
                <p className="text-silver/60 text-sm mb-4">Ya tienes un botón de Telegram. Para agregar más URLs de Telegram, activa el <span className="text-blue-400 font-bold">Telegram Rotativo</span>.</p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3 text-left">
                    <span className="material-symbols-outlined text-blue-400 text-xl mt-0.5">info</span>
                    <div>
                      <p className="text-white font-bold text-sm mb-1">Telegram Rotativo</p>
                      <p className="text-silver/60 text-xs mb-2">Permite agregar hasta <span className="text-blue-400 font-bold">5 URLs de Telegram</span> que rotarán automáticamente para distribuir el tráfico.</p>
                      <p className="text-xs text-silver/50"><span className="text-primary font-bold">Precio:</span> $80 por link (+$20 de recargo)</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRotatorSuggestion(false)} className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all uppercase tracking-wider">Cancelar</button>
                <button onClick={() => {
                  const telegramButton = currentPage.buttons.find(btn => btn.type === 'telegram');
                  if (telegramButton) {
                    setSelectedButtonId(telegramButton.id);
                    handleUpdateButton('rotatorActive', true);
                    toast.success('Telegram Rotativo activado. Ahora puedes agregar hasta 5 URLs.');
                  }
                  setShowRotatorSuggestion(false);
                  setShowButtonCreator(false);
                }} className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all uppercase tracking-wider shadow-lg shadow-blue-500/20">Activar Rotativo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}>
          <div className="w-full max-w-md bg-[#0A0A0A] border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{deleteTarget.type === 'page' ? '¿Eliminar este Link?' : '¿Eliminar este Botón?'}</h2>
                <p className="text-silver/60 text-sm mb-1">{deleteTarget.type === 'page' ? 'Esta acción no se puede deshacer. Se perderá toda la configuración de este link.' : 'Esta acción eliminará permanentemente este botón.'}</p>
                {deleteTarget.name && (<p className="text-white font-bold text-sm mt-3 bg-white/5 py-2 px-4 rounded-lg">"{deleteTarget.name}"</p>)}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all uppercase tracking-wider">Cancelar</button>
                <button onClick={() => {
                  if (deleteTarget.type === 'page') {
                    if (pages.length <= 1) {
                      toast.error("Debes tener al menos una página.");
                      setShowDeleteConfirm(false);
                      setDeleteTarget(null);
                      return;
                    }
                    setPages(prev => prev.filter(p => p.id !== selectedPageId));
                    setSelectedPageId(pages.find(p => p.id !== selectedPageId)?.id || pages[0].id);
                    toast.success('Link eliminado correctamente');
                  } else if (deleteTarget.type === 'button' && deleteTarget.id) {
                    handleDeleteButton(deleteTarget.id);
                  }
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all uppercase tracking-wider shadow-lg shadow-red-500/20">Sí, Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
