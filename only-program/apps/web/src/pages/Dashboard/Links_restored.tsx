import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
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

  const handleDeletePage = () => {
    if (pages.length <= 1) return toast.error("Debes tener al menos una página.");
    if (confirm('¿Eliminar esta Landing Page?')) {
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

  const handleDeleteButton = (id: string) => {
    if (confirm('¿Eliminar botón?')) {
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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* COL 1: Page Switcher */}
        <aside className="lg:w-20 w-full border-b lg:border-b-0 lg:border-r border-white/5 flex lg:flex-col flex-row items-center py-4 lg:py-6 px-4 lg:px-0 gap-4 bg-black z-20 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar shrink-0">

          {/* Active Links Group */}
          {activePages.length > 0 && (
            <div className="flex lg:flex-col gap-2 w-full items-center">
              <div className="text-[10px] font-black text-silver/20 uppercase hidden lg:block mb-1 w-full text-center">{t('dashboard.links.myLinks')}</div>
              {activePages.map(page => (
                <button
                  key={page.id}
                  onClick={() => { setSelectedPageId(page.id); setSelectedButtonId(null); }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group shrink-0 ${selectedPageId === page.id ? 'bg-white/10 ring-2 ring-primary text-white' : 'bg-white/5 text-silver/40 hover:bg-white/10 hover:text-white'
                    }`}
                  title={page.name}
                >
                  {page.profileImage && page.profileImage !== DEFAULT_PROFILE_IMAGE ? (
                    <div className="w-full h-full p-0.5"><img src={page.profileImage} className="w-full h-full object-cover rounded-xl" /></div>
                  ) : <span className="material-symbols-outlined text-2xl">person</span>}
                  {selectedPageId === page.id && <div className="absolute -right-1 top-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-black"></div>}
                </button>
              ))}
              <div className="lg:h-px lg:w-8 lg:bg-white/10 my-2"></div>
            </div>
          )}

          {/* Drafts Group (Crear Links) */}
          <div className="flex lg:flex-col gap-2 w-full items-center">
            <div className="text-[10px] font-black text-silver/20 uppercase hidden lg:block mb-1 w-full text-center text-nowrap scaling-75">{t('dashboard.links.createLink')}</div>
            {draftPages.map(page => (
              <button
                key={page.id}
                onClick={() => { setSelectedPageId(page.id); setSelectedButtonId(null); }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group shrink-0 ${selectedPageId === page.id ? 'bg-white/10 ring-2 ring-yellow-500 text-white' : 'bg-white/5 text-silver/40 hover:bg-white/10 hover:text-white'
                  }`}
                title={`${page.name} (Borrador)`}
              >
                {/* THUMBNAIL LOGIC */}
                {page.profileImage && page.profileImage !== DEFAULT_PROFILE_IMAGE ? (
                  <div className="w-full h-full p-0.5"><img src={page.profileImage} className="w-full h-full object-cover rounded-xl" /></div>
                ) : (
                  <span className="material-symbols-outlined text-2xl">person</span>
                )}
                {/* ROTATOR INDICATOR */}
                {hasRotatorActive(page) && (
                  <div className="absolute -left-1 -top-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border-2 border-black z-10" title="Rotativo Activo">
                    <span className="material-symbols-outlined text-[8px] text-white">sync</span>
                  </div>
                )}
                {selectedPageId === page.id && <div className="absolute -right-1 top-1 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-2 ring-black"></div>}
              </button>
            ))}
          </div>

          <button onClick={handleAddPage} className="w-12 h-12 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-silver/40 hover:text-white hover:border-primary shrink-0 lg:mt-2" title={t('dashboard.links.newLinkTitle')}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </aside>

        {/* COL 2: Button Manager (Sortable) */}
        <aside className="lg:w-72 w-full border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col bg-[#070707] shrink-0 h-64 lg:h-auto">
          {/* TOP ACTIONS */}
          <div className="p-4 border-b border-white/5 bg-[#0A0A0A] flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-1 flex items-center gap-2">
                  {currentPage.status === 'draft' ? <span className="text-yellow-500">{t('dashboard.links.creatingDraft')}</span> : <span className="text-green-500">{t('dashboard.links.active')}</span>}
                </h3>
                <h2 className="text-sm font-bold truncate max-w-[150px]">{currentPage.name}</h2>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleDeletePage} className="py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold text-red-500/50 hover:text-red-500 hover:bg-red-500/10 bg-white/5 transition-all">
                <span className="material-symbols-outlined text-sm">delete</span> {t('dashboard.links.delete')}
              </button>
              <button onClick={() => setSelectedButtonId(null)} className="py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold text-silver/40 hover:text-white hover:bg-white/5 bg-white/5 transition-all">
                <span className="material-symbols-outlined text-sm">settings</span> {t('dashboard.links.config')}
              </button>
              <button onClick={() => setShowButtonCreator(true)} className="col-span-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/50 text-primary transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">add_circle</span> <span className="text-xs font-bold">{t('dashboard.links.addButton')}</span>
              </button>
            </div>
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
                  {currentPage.buttons.length === 0 && (
                    <div className="text-center py-8 text-silver/30 text-xs italic">
                      {t('dashboard.links.noButtons')}
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </aside>

        {/* COL 3: CENTER EDITOR */}
        <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-32">
            <div className="max-w-2xl mx-auto">

              {showButtonCreator && (
                <div className="animate-fade-in space-y-6">
                  <div className="text-center mb-8"><h2 className="text-xl font-bold text-white mb-2">{t('dashboard.links.addButton')}</h2></div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(Object.keys(SOCIAL_PRESETS) as SocialType[]).map(key => (
                      <button key={key} onClick={() => handleCreateButton(key)} className="aspect-square rounded-2xl bg-[#0A0A0A] border border-white/10 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-white/5 hover:-translate-y-1 transition-all group">
                        <div className="h-10 w-10 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">{SOCIAL_PRESETS[key].icon}</div>
                        <span className="text-xs font-bold text-silver/60 group-hover:text-white capitalize">{SOCIAL_PRESETS[key].title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedButton && !showButtonCreator && (
                <div className="animate-slide-up space-y-8">
                  <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <h2 className="text-xl font-bold">{t('dashboard.links.editButton')}</h2>
                    <button onClick={() => setSelectedButtonId(null)} className="text-xs text-silver/50 hover:text-white">{t('dashboard.links.close')}</button>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.title')}</label>
                      <input type="text" value={selectedButton.title} onChange={(e) => handleUpdateButton('title', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.mainUrl')}</label>
                      <input type="text" value={selectedButton.url} onChange={(e) => handleUpdateButton('url', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-silver focus:outline-none focus:border-primary/50" />
                    </div>

                    {/* TELEGRAM ROTATOR SECTION */}
                    {selectedButton.type === 'telegram' && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-blue-400 mb-1">
                              <span className="material-symbols-outlined">sync</span>
                              <span className="text-sm font-bold">{t('dashboard.links.activateRotator')}</span>
                            </div>
                            <p className="text-[10px] text-silver/50 leading-tight">{t('dashboard.links.rotatorDesc')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={selectedButton.rotatorActive || false} onChange={(e) => handleUpdateButton('rotatorActive', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>

                        {selectedButton.rotatorActive && (
                          <div className="space-y-3 animate-fade-in pt-2">
                            <p className="text-[10px] text-silver/50 uppercase font-bold">{t('dashboard.links.addExtraLinks')}</p>
                            {[0, 1, 2, 3, 4].map((idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <span className="text-xs font-mono text-silver/40 w-4 text-center">{idx + 1}</span>
                                <input
                                  type="text"
                                  placeholder={`https://t.me/enlace_${idx + 1}`}
                                  value={selectedButton.rotatorLinks?.[idx] || ''}
                                  onChange={(e) => handleUpdateRotatorLink(idx, e.target.value)}
                                  className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 bg-white/5 rounded-xl space-y-4">
                      <h3 className="text-xs font-bold text-silver/60 border-b border-white/5 pb-2">{t('dashboard.links.styles')}</h3>

                      <div className="grid grid-cols-2 gap-6">
                        {/* BG COLOR */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.background')}</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={selectedButton.color} onChange={(e) => handleUpdateButton('color', e.target.value)} className="h-10 w-10 rounded-lg bg-transparent cursor-pointer border-none" />
                            <span className="text-xs font-mono text-silver/50">{selectedButton.color}</span>
                          </div>
                        </div>
                        {/* TEXT COLOR */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.text')}</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={selectedButton.textColor} onChange={(e) => handleUpdateButton('textColor', e.target.value)} className="h-10 w-10 rounded-lg bg-transparent cursor-pointer border-none" />
                            <span className="text-xs font-mono text-silver/50">{selectedButton.textColor}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-2">
                        {/* RADIUS */}
                        <div className="space-y-2 relative">
                          <div className="flex justify-between mb-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.radius')}</label>
                            <span className="text-xs font-mono text-primary">{selectedButton.borderRadius}px</span>
                          </div>
                          <input type="range" min="0" max="50" value={selectedButton.borderRadius} onChange={(e) => handleUpdateButton('borderRadius', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                        </div>
                        {/* FONT */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.typography')}</label>
                          <select
                            value={selectedButton.font || 'sans'}
                            onChange={(e) => handleUpdateButton('font', e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-2 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                          >
                            <option value="sans">Sans-Serif</option>
                            <option value="serif">Serif</option>
                            <option value="mono">Monospace</option>
                            <option value="display">Display</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedButton && !showButtonCreator && (
                <div className="animate-fade-in space-y-8">
                  <div className="p-6 rounded-2xl border border-white/5 bg-[#0A0A0A]">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-4">{t('dashboard.links.designTemplate')}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ id: 'minimal', label: 'Minimal', icon: 'crop_portrait' }, { id: 'split', label: 'Split', icon: 'vertical_split' }, { id: 'full', label: 'Full', icon: 'wallpaper' }].map((t) => (
                        <button key={t.id} onClick={() => handleUpdatePage('template', t.id as TemplateType)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${currentPage.template === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-transparent text-silver/40 hover:bg-white/10'}`}>
                          <span className="material-symbols-outlined text-2xl">{t.icon}</span><span className="text-[10px] font-bold uppercase">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6 pt-4">
                    <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">{t('dashboard.links.profileDetails')}</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.pageName')}</label>
                        <div className="flex gap-2">
                          <input type="text" value={currentPage.name} onChange={(e) => handleUpdatePage('name', e.target.value)} className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50" />
                          {currentPage.status === 'active' && <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center text-green-500"><span className="material-symbols-outlined text-base">check_circle</span></div>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.visibleName')}</label>
                        <input type="text" value={currentPage.profileName} onChange={(e) => handleUpdatePage('profileName', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.profilePhoto')}</label>
                        <div className="flex gap-4 items-center">
                          <div className="h-16 w-16 rounded-xl overflow-hidden border border-white/10 bg-white/5 relative shrink-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /></div>
                          <div className="flex-1 min-w-0">
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all whitespace-nowrap">{t('dashboard.links.uploadImage')}</button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.pageBackground')}</label>

                        {/* Type Toggle */}
                        <div className="flex gap-4 mb-2">
                          <button onClick={() => handleUpdatePage('theme.backgroundType', 'solid')} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${currentPage.theme.backgroundType === 'solid' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-transparent text-silver/40'}`}>
                            <div className="w-4 h-4 rounded-full bg-current"></div>
                            <span className="text-xs font-bold">{t('dashboard.links.solid')}</span>
                          </button>
                          <button onClick={() => handleUpdatePage('theme.backgroundType', 'gradient')} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${currentPage.theme.backgroundType === 'gradient' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-transparent text-silver/40'}`}>
                            <div className="flex -space-x-1"><div className="w-3 h-3 rounded-full bg-current"></div><div className="w-3 h-3 rounded-full bg-current opacity-50"></div></div>
                            <span className="text-xs font-bold">{t('dashboard.links.gradient')}</span>
                          </button>
                        </div>

                        {/* Pickers */}
                        <div className="flex flex-col gap-3">
                          {currentPage.theme.backgroundType === 'solid' ? (
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                              <input type="color" value={currentPage.theme.backgroundStart} onChange={(e) => handleUpdatePage('theme.backgroundStart', e.target.value)} className="h-10 w-10 shrink-0 rounded-lg bg-transparent cursor-pointer border-none" />
                              <span className="text-xs font-mono text-silver/50 uppercase">{currentPage.theme.backgroundStart}</span>
                            </div>
                          ) : (
                            <div className="flex gap-4">
                              <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-silver/30 font-bold">{t('dashboard.links.startColor')}</span>
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                  <input type="color" value={currentPage.theme.backgroundStart} onChange={(e) => handleUpdatePage('theme.backgroundStart', e.target.value)} className="h-10 w-10 shrink-0 rounded-lg bg-transparent cursor-pointer border-none" />
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-silver/30 font-bold">{t('dashboard.links.endColor')}</span>
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                  <input type="color" value={currentPage.theme.backgroundEnd} onChange={(e) => handleUpdatePage('theme.backgroundEnd', e.target.value)} className="h-10 w-10 shrink-0 rounded-lg bg-transparent cursor-pointer border-none" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 pt-4">
                    <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">{t('dashboard.links.appearance')}</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.borderColor')}</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={currentPage.theme.pageBorderColor} onChange={(e) => handleUpdatePage('theme.pageBorderColor', e.target.value)} className="h-10 w-10 shrink-0 rounded-lg bg-transparent cursor-pointer border-none" />
                          <span className="text-xs font-mono text-silver/50 uppercase">{currentPage.theme.pageBorderColor}</span>
                        </div>
                        <p className="text-[10px] text-silver/30">{t('dashboard.links.borderDesc')}</p>
                      </div>
                      {currentPage.template === 'full' && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex justify-between mb-2"><label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">{t('dashboard.links.opacity')}</label><span className="text-xs font-mono text-primary">{currentPage.theme.overlayOpacity}%</span></div>
                          <input type="range" min="0" max="90" value={currentPage.theme.overlayOpacity} onChange={(e) => handleUpdatePage('theme.overlayOpacity', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT BAR: VISIBLE ONLY IF THERE ARE DRAFTS */}
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all ${draftPages.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            <button onClick={() => { setDiscountCode(''); setAppliedDiscount(null); setDiscountError(''); setShowPaymentModal(true); }} className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap">
              <span className="material-symbols-outlined">shopping_cart</span>
              <span className="font-bold">{t('dashboard.links.buyLinks')}</span>
              <span className="bg-black/20 px-2 py-0.5 rounded text-xs ml-2">${paymentDetails.total}</span>
            </button>
          </div>
        </div>

        {/* COL 4: PREVIEW */}
        <div className="hidden lg:flex w-[420px] bg-[#020202] border-l border-white/5 items-center justify-center relative p-8 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] shrink-0">
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
