import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useModal } from '@/contexts/ModalContext';
import { useTranslation } from '@/contexts/I18nContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Types
type TemplateType = 'minimal' | 'split' | 'full';
type SocialType = 'instagram' | 'tiktok' | 'telegram' | 'custom';
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
  Instagram: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
  TikTok: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.58-1.09v8.32c.55 2.85-.27 6.37-2.6 7.9-2.33 1.53-6.04.88-7.51-1.38-1.47-2.26-1.39-4.8 1.09-6.66.56-.42 1.2-.7 1.86-.88.08-.02.1-.15.08-.23v-4c-2.5 1.24-5.26 3.65-5.26 7.04 0 3.06 2.05 5.59 5.09 5.92 3.04.33 6.01-1.47 6.89-4.32V5.33c1.46.22 2.75.95 3.73 2.02V1.16c-1.52.23-2.71.91-3.66 1.98-.16-.62-.33-1.22-.5-1.83-1.11-.02-2.21-.02-3.32-.02.04-.66-.46-.38-.01.73z" /></svg>,
  Telegram: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.441z" /></svg>,
  Custom: () => <span className="material-symbols-outlined text-xl">link</span>
};

// Social Configs
const SOCIAL_PRESETS = {
  instagram: { title: 'Instagram', color: '#E1306C', icon: <Icons.Instagram /> },
  tiktok: { title: 'TikTok', color: '#000000', icon: <Icons.TikTok /> },
  telegram: { title: 'Telegram', color: '#0088cc', icon: <Icons.Telegram /> },
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

const LINK_PRICE_STANDARD = 60;
const ROTATOR_SURCHARGE = 30;
const LINK_PRICE_ROTATOR = LINK_PRICE_STANDARD + ROTATOR_SURCHARGE;

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
  onClick
}: {
  btn: ButtonLink,
  isSelected: boolean,
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: btn.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={onClick}
      className={`w-full p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all relative group flex items-center gap-3 touch-none ${isSelected ? 'bg-white/5 border-primary shadow-lg' : 'bg-transparent border-transparent hover:bg-white/[0.02]'
        }`}
    >
      <div className="h-8 w-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: btn.color }}>
        <div className="w-4 h-4 text-white">
          {SOCIAL_PRESETS[btn.type].icon}
        </div>
      </div>
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

  // Persistence
  useEffect(() => { localStorage.setItem('my_links_data', JSON.stringify(pages)); }, [pages]);

  // --- HANDLERS ---
  const handleAddPage = () => {
    const newId = `page${Date.now()}`;
    // New pages are DRAFTS by default, and named "Link X" or similar
    setPages(prev => [...prev, { ...DEFAULT_PAGE, id: newId, status: 'draft', name: `Link ${prev.length + 1}` }]);
    setSelectedPageId(newId);
    toast.success('Empieza a diseñar tu nuevo link');
  };

  const handleDeletePage = async () => {
    if (pages.length <= 1) return toast.error("Debes tener al menos una página.");
    
    const confirmed = await showConfirm({
      title: '¿Eliminar esta Landing Page?',
      message: 'Esta acción no se puede deshacer. Se perderá toda la configuración de este link.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'error'
    });

    if (confirmed) {
      const newPages = pages.filter(p => p.id !== currentPage.id);
      setPages(newPages);
      setSelectedPageId(newPages[0].id);
      toast.success('Página eliminada');
    }
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
    const config = SOCIAL_PRESETS[type];
    const newButton: ButtonLink = {
      id: Math.random().toString(36).substring(2, 9),
      type, title: type === 'custom' ? 'Nuevo Botón' : config.title, url: '', color: config.color,
      textColor: '#FFFFFF', font: 'sans', borderRadius: 12, opacity: 100, isActive: true,
      rotatorActive: false, rotatorLinks: ['', '', '', '', '']
    };
    setPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, buttons: [...p.buttons, newButton] } : p));
    setSelectedButtonId(newButton.id);
    setShowButtonCreator(false);
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
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {t('dashboard.links.autosave')}
          </span>
        </div>
      </header>

      {/* Responsive Layout: Mobile (Col), Desktop (Row) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* COL 1: Editor & Config (Main Area) */}
        <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden order-2 lg:order-first transition-all">
          
          {/* TOP BAR: Page Switcher (Horizontal) */}
          <div className="w-full h-20 border-b border-white/5 bg-[#080808] flex items-center px-4 gap-4 overflow-x-auto custom-scrollbar shrink-0 z-20">
             {/* Create New */}
             <button onClick={handleAddPage} className="w-12 h-12 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-silver/40 hover:text-white hover:border-primary shrink-0 transition-colors group" title={t('dashboard.links.newLinkTitle')}>
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add</span>
             </button>
             <div className="h-8 w-px bg-white/10 shrink-0 mx-2"></div>
             
             {/* Active Links */}
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

          <div className="flex-1 flex overflow-hidden">
             
             {/* LEFT PANEL: BUTTONS LIST & ADDER */}
             <div className="w-full lg:w-80 border-r border-white/5 flex flex-col bg-[#070707] shrink-0">
                <div className="p-4 border-b border-white/5">
                   <button onClick={() => setShowButtonCreator(true)} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">add_circle</span> {t('dashboard.links.addButton')}
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={currentPage.buttons} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {currentPage.buttons.map(btn => (
                          <div key={btn.id} className="relative group">
                             <SortableButton
                                btn={btn}
                                isSelected={selectedButtonId === btn.id}
                                onClick={() => { setSelectedButtonId(btn.id); setShowButtonCreator(false); }}
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
                     <button onClick={handleDeletePage} className="py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/10 bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-sm">delete</span> {t('dashboard.links.delete')}
                     </button>
                     <button onClick={() => setSelectedButtonId(null)} className="py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-silver/40 hover:text-white hover:bg-white/5 bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-sm">settings</span> {t('dashboard.links.config')}
                     </button>
                   </div>
                </div>
             </div>

             {/* MAIN EDITOR AREA */}
             <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
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
                                           <input type="checkbox" checked={selectedButton.rotatorActive || false} onChange={(e) => handleUpdateButton('rotatorActive', e.target.checked)} className="sr-only peer" />
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

                               {/* STYLES */}
                               <div className="p-5 bg-white/5 rounded-2xl space-y-6">
                                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                     <span className="material-symbols-outlined text-primary">palette</span> Estilo & Diseño
                                  </h3>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40">Fondo</label>
                                        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                                           <input type="color" value={selectedButton.color} onChange={(e) => handleUpdateButton('color', e.target.value)} className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent" />
                                           <span className="text-[10px] font-mono text-silver/50 uppercase">{selectedButton.color}</span>
                                        </div>
                                     </div>
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40">Texto</label>
                                        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                                           <input type="color" value={selectedButton.textColor} onChange={(e) => handleUpdateButton('textColor', e.target.value)} className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent" />
                                           <span className="text-[10px] font-mono text-silver/50 uppercase">{selectedButton.textColor}</span>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="space-y-4 pt-2 border-t border-white/5">
                                     <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-silver/40">Redondez</label>
                                          <span className="text-[10px] font-mono text-primary">{selectedButton.borderRadius}px</span>
                                        </div>
                                        <input type="range" min="0" max="30" value={selectedButton.borderRadius} onChange={(e) => handleUpdateButton('borderRadius', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      )}

                      {/* PAGE CONFIG EDITOR */}
                      {!selectedButton && !showButtonCreator && (
                        <div className="animate-fade-in space-y-8">
                           {/* TEMPLATE PICKER */}
                           <div className="space-y-4">
                              <h3 className="text-xs font-bold text-silver/40 uppercase tracking-widest pl-1">Plantilla de Diseño</h3>
                              <div className="grid grid-cols-3 gap-3">
                                 {[{ id: 'minimal', label: 'Minimal', icon: 'crop_portrait' }, { id: 'split', label: 'Split', icon: 'vertical_split' }, { id: 'full', label: 'Full', icon: 'wallpaper' }].map((t) => (
                                    <button key={t.id} onClick={() => handleUpdatePage('template', t.id as TemplateType)} className={`group relative p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${currentPage.template === t.id ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-[#0A0A0A] border-white/5 text-silver/40 hover:bg-white/5 hover:border-white/10'}`}>
                                       <div className={`p-3 rounded-xl transition-colors ${currentPage.template === t.id ? 'bg-primary/20 text-white' : 'bg-black/40 group-hover:bg-black/60'}`}>
                                          <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                                       </div>
                                       <span className="text-[9px] font-bold uppercase tracking-wider">{t.label}</span>
                                       {currentPage.template === t.id && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           
                           <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-6">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                                 <span className="material-symbols-outlined text-silver/40">id_card</span> {t('dashboard.links.profileDetails')}
                              </h3>
                              
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

                              <div className="pt-2">
                                 <label className="text-[10px] font-bold text-silver/40 uppercase pl-1 mb-2 block">{t('dashboard.links.pageBackground')}</label>
                                 <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button onClick={() => handleUpdatePage('theme.backgroundType', 'solid')} className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${currentPage.theme.backgroundType === 'solid' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-white/10 text-silver/40'}`}>Sólido</button>
                                    <button onClick={() => handleUpdatePage('theme.backgroundType', 'gradient')} className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${currentPage.theme.backgroundType === 'gradient' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-white/10 text-silver/40'}`}>Gradiente</button>
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
                        </div>
                      )}
                   </div>
                </div>

                {/* STICKY BUY BUTTON - CONDITIONAL */}
                {draftPages.length > 0 && currentPage.status === 'draft' && (
                  <div className="p-4 bg-gradient-to-t from-black via-[#050505] to-[#050505] z-30 shrink-0 border-t border-white/5">
                     <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        <span>{t('dashboard.links.buyLinks')}</span>
                        <span className="bg-black/20 px-2 py-0.5 rounded text-xs ml-2">${paymentDetails.total}</span>
                     </button>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* COL 2: PREVIEW (Desktop Only) */}
        <div className="hidden lg:flex w-[420px] bg-[#020202] border-l border-white/5 items-center justify-center relative p-8 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] shrink-0 lg:order-last">
          <div className="relative w-[320px] aspect-[9/19] bg-black rounded-[3rem] border-8 border-[#333] shadow-2xl overflow-hidden flex flex-col z-10">
            <div
              className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col ${currentPage.template === 'full' ? '' : 'transition-all duration-500'}`}
              style={{ background: currentPage.template === 'full' ? '#111' : (getBackgroundStyle(currentPage).background) }}
            >
              {currentPage.template === 'full' && (<div className="absolute inset-0 z-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black transition-all" style={{ opacity: currentPage.theme.overlayOpacity / 100 }}></div></div>)}
              {currentPage.template === 'split' && (<div className="h-1/2 w-full relative z-0 shrink-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /></div>)}
              <div className={`min-h-full p-6 flex flex-col relative z-20 ${currentPage.template === 'split' ? '' : 'items-center'} ${currentPage.template === 'minimal' ? 'justify-center' : ''} ${currentPage.template === 'full' ? 'justify-end pb-12' : ''}`}>
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
                    <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">{currentPage.profileName}</h2>
                    <p className="text-white/70 text-xs mt-1 drop-shadow-md">@{currentPage.name.toLowerCase().replace(/\s/g, '')}</p>
                  </div>
                )}
                {currentPage.template === 'full' && (<div className="text-center mb-6"><h2 className="text-white font-bold text-2xl leading-tight drop-shadow-lg">{currentPage.profileName}</h2></div>)}
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

                  {/* COUPON INPUT */}
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
    </div>
  );
}
