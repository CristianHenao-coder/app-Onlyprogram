import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
type TemplateType = 'minimal' | 'split' | 'full';
type SocialType = 'instagram' | 'tiktok' | 'telegram' | 'custom';
type FontType = 'sans' | 'serif' | 'mono' | 'display';

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
}

interface LinkPage {
  id: string;
  name: string;
  profileName: string;
  profileImage: string;
  template: TemplateType;
  theme: {
    pageBorderColor: string;
    overlayOpacity: number; // 0-100
  };
  buttons: ButtonLink[];
}

// Icons Components
const Icons = {
  Instagram: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
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
  name: 'Nueva Página',
  profileName: 'Name',
  profileImage: DEFAULT_PROFILE_IMAGE,
  template: 'minimal',
  theme: { pageBorderColor: '#333333', overlayOpacity: 40 },
  buttons: []
};

const LINK_PRICE = 60;
const MOCK_USER_HAS_CARD = false;

// Font Classes Mapping
const FONT_MAP: Record<FontType, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
  display: 'font-sans tracking-widest' // Simulated display
};

// --- DND COMPONENT ---
function SortableButton({
  btn,
  isSelected,
  onClick,
  onDelete
}: {
  btn: ButtonLink,
  isSelected: boolean,
  onClick: () => void,
  onDelete: (id: string) => void
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
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(btn.id); }}
        className="p-1.5 rounded-lg text-silver/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
      </button>
    </div>
  );
}

export default function Links() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Added activationConstraint to handle click vs drag differentiation
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- STATE ---
  const [pages, setPages] = useState<LinkPage[]>(() => {
    const saved = localStorage.getItem('my_links_data');
    return saved ? JSON.parse(saved) : [{
      id: 'page1', name: 'Principal', profileName: 'Name', profileImage: DEFAULT_PROFILE_IMAGE, template: 'minimal', theme: { pageBorderColor: '#222222', overlayOpacity: 40 },
      buttons: [{ id: '1', type: 'instagram', title: 'Sígueme en IG', url: 'https://instagram.com', color: '#E1306C', textColor: '#FFFFFF', font: 'sans', borderRadius: 12, opacity: 100, isActive: true }]
    }];
  });

  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page1');
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [showButtonCreator, setShowButtonCreator] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [discountCode, setDiscountCode] = useState('');

  // Derived
  const currentPage = pages.find(p => p.id === selectedPageId) || pages[0];
  const selectedButton = currentPage.buttons.find(b => b.id === selectedButtonId);

  // Persistence
  useEffect(() => { localStorage.setItem('my_links_data', JSON.stringify(pages)); }, [pages]);

  // --- HANDLERS ---
  const handleAddPage = () => {
    const newId = `page${Date.now()}`;
    setPages(prev => [...prev, { ...DEFAULT_PAGE, id: newId, name: `Link ${prev.length + 1}` }]);
    setSelectedPageId(newId);
    setHasUnsavedChanges(true);
    toast.success('Nueva página creada');
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) return toast.error("Debes tener al menos una landing.");
    if (confirm('¿Eliminar esta Landing Page?')) {
      const newPages = pages.filter(p => p.id !== currentPage.id);
      setPages(newPages);
      setSelectedPageId(newPages[0].id);
      setHasUnsavedChanges(true);
      toast.success('Página eliminada');
    }
  };

  const handleUpdatePage = (field: string, value: any) => {
    setPages(prev => prev.map(p => {
      if (p.id !== selectedPageId) return p;
      if (field === 'theme.pageBorderColor') return { ...p, theme: { ...p.theme, pageBorderColor: value } };
      if (field === 'theme.overlayOpacity') return { ...p, theme: { ...p.theme, overlayOpacity: value } };
      return { ...p, [field]: value };
    }));
    setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
    }
  };

  // Button CRUD
  const handleCreateButton = (type: SocialType) => {
    const config = SOCIAL_PRESETS[type];
    const newButton: ButtonLink = {
      id: Math.random().toString(36).substring(2, 9),
      type, title: type === 'custom' ? 'Nuevo Botón' : config.title, url: '', color: config.color,
      textColor: '#FFFFFF', font: 'sans', borderRadius: 12, opacity: 100, isActive: true
    };
    setPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, buttons: [...p.buttons, newButton] } : p));
    setSelectedButtonId(newButton.id);
    setShowButtonCreator(false);
    setHasUnsavedChanges(true);
    toast.success('Botón añadido');
  };

  const handleDeleteButton = (id: string) => {
    if (confirm('¿Eliminar botón?')) {
      setPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, buttons: p.buttons.filter(b => b.id !== id) } : p));
      if (selectedButtonId === id) setSelectedButtonId(null);
      setHasUnsavedChanges(true);
      toast('Botón eliminado', { icon: '🗑️' });
    }
  };

  const handleUpdateButton = (field: keyof ButtonLink, value: any) => {
    setPages(prev => prev.map(p => p.id === selectedPageId ? {
      ...p, buttons: p.buttons.map(b => b.id === selectedButtonId ? { ...b, [field]: value } : b)
    } : p));
    setHasUnsavedChanges(true);
  };

  // Payment
  const handleProcessPayment = () => {
    const quantity = pages.length; // Fixed to pages length
    const total = quantity * LINK_PRICE;

    if (MOCK_USER_HAS_CARD) {
      toast.success(`Pago exitoso de $${total}.00`);
      setShowPaymentModal(false);
    } else {
      toast.loading('Redirigiendo a pagos...');
      setTimeout(() => {
        navigate('/dashboard/payments', {
          state: {
            pendingPurchase: { type: 'extra_links', quantity, amount: total, discountCode }
          }
        });
        toast.dismiss();
      }, 1000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white font-sans overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050505] z-30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">layers</span>
          </div>
          <h1 className="text-sm font-bold uppercase tracking-wider">Gestor Multi-Link</h1>
        </div>
        <button
          disabled={!hasUnsavedChanges} onClick={() => { setHasUnsavedChanges(false); toast.success('Guardado'); }}
          className={`px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${hasUnsavedChanges ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-active/30 cursor-not-allowed'
            }`}
        >
          {hasUnsavedChanges ? 'Guardar Cambios' : 'Guardado'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* COL 1: Page Switcher */}
        <aside className="w-20 border-r border-white/5 flex flex-col items-center py-6 gap-4 bg-black z-20">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => { setSelectedPageId(page.id); setSelectedButtonId(null); }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${selectedPageId === page.id ? 'bg-white/10 ring-2 ring-primary text-white' : 'bg-white/5 text-silver/40 hover:bg-white/10 hover:text-white'
                }`}
            >
              {page.profileImage.includes('pixabay') || page.profileImage.includes('data:image') ? (
                <div className="w-full h-full p-0.5"><img src={page.profileImage} className="w-full h-full object-cover rounded-xl" /></div>
              ) : <span className="material-symbols-outlined text-2xl">web</span>}
              {selectedPageId === page.id && <div className="absolute -right-1 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-black"></div>}
            </button>
          ))}
          <button onClick={handleAddPage} className="w-12 h-12 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-silver/40 hover:text-white hover:border-primary">
            <span className="material-symbols-outlined">add</span>
          </button>
        </aside>

        {/* COL 2: Button Manager (Sortable) */}
        <aside className="w-72 border-r border-white/5 flex flex-col bg-[#070707]">
          <div className="p-4 border-b border-white/5 bg-[#0A0A0A]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-1">Página Activa</h3>
            <h2 className="text-sm font-bold truncate">{currentPage.name}</h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentPage.buttons} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {currentPage.buttons.map(btn => (
                    <SortableButton
                      key={btn.id} btn={btn}
                      isSelected={selectedButtonId === btn.id}
                      onClick={() => { setSelectedButtonId(btn.id); setShowButtonCreator(false); }}
                      onDelete={handleDeleteButton}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="p-4 border-t border-white/5 flex flex-col gap-2 pb-8 mt-auto sticky bottom-0 bg-[#070707] z-10">
            <button onClick={handleDeletePage} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-red-500/50 hover:text-red-500 hover:bg-red-500/10">
              <span className="material-symbols-outlined text-sm">delete_forever</span> Eliminar Landing
            </button>
            <button onClick={() => setShowButtonCreator(true)} className="w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/50 text-primary transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">add_circle</span> <span className="text-xs font-bold">Añadir Botón</span>
            </button>
            <button onClick={() => setSelectedButtonId(null)} className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${selectedButtonId === null && !showButtonCreator ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-white hover:bg-white/5'}`}>
              <span className="material-symbols-outlined text-sm">settings</span> Configuración
            </button>
          </div>
        </aside>

        {/* COL 3: CENTER EDITOR */}
        <div className="flex-1 flex flex-col bg-[#050505] relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-32">
            <div className="max-w-2xl mx-auto">

              {showButtonCreator && (
                <div className="animate-fade-in space-y-6">
                  <div className="text-center mb-8"><h2 className="text-xl font-bold text-white mb-2">Añadir Botón</h2></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <h2 className="text-xl font-bold border-b border-white/5 pb-6">Editar Botón</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Título</label>
                      <input type="text" value={selectedButton.title} onChange={(e) => handleUpdateButton('title', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">URL</label>
                      <input type="text" value={selectedButton.url} onChange={(e) => handleUpdateButton('url', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-silver focus:outline-none focus:border-primary/50" />
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl space-y-4">
                      <h3 className="text-xs font-bold text-silver/60 border-b border-white/5 pb-2">Estilos</h3>

                      <div className="grid grid-cols-2 gap-6">
                        {/* BG COLOR */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Fondo</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={selectedButton.color} onChange={(e) => handleUpdateButton('color', e.target.value)} className="h-10 w-10 rounded-lg bg-transparent cursor-pointer border-none" />
                            <span className="text-xs font-mono text-silver/50">{selectedButton.color}</span>
                          </div>
                        </div>
                        {/* TEXT COLOR */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Texto</label>
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Redondez</label>
                            <span className="text-xs font-mono text-primary">{selectedButton.borderRadius}px</span>
                          </div>
                          <input type="range" min="0" max="50" value={selectedButton.borderRadius} onChange={(e) => handleUpdateButton('borderRadius', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                        </div>
                        {/* FONT */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Tipografía</label>
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
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-4">Plantilla de Diseño</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ id: 'minimal', label: 'Minimal', icon: 'crop_portrait' }, { id: 'split', label: 'Split', icon: 'vertical_split' }, { id: 'full', label: 'Full', icon: 'wallpaper' }].map((t) => (
                        <button key={t.id} onClick={() => handleUpdatePage('template', t.id as TemplateType)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${currentPage.template === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-transparent text-silver/40 hover:bg-white/10'}`}>
                          <span className="material-symbols-outlined text-2xl">{t.icon}</span><span className="text-[10px] font-bold uppercase">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6 pt-4">
                    <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Detalles del Perfil</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Nombre de la Página</label>
                        <input type="text" value={currentPage.name} onChange={(e) => handleUpdatePage('name', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Nombre Visible</label>
                        <input type="text" value={currentPage.profileName} onChange={(e) => handleUpdatePage('profileName', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Foto de Perfil</label>
                        <div className="flex gap-4 items-center">
                          <div className="h-16 w-16 rounded-xl overflow-hidden border border-white/10 bg-white/5 relative"><img src={currentPage.profileImage} className="w-full h-full object-cover" /></div>
                          <div className="flex-1">
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all">Subir Imagen</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 pt-4">
                    <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Apariencia</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Color de Borde</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={currentPage.theme.pageBorderColor} onChange={(e) => handleUpdatePage('theme.pageBorderColor', e.target.value)} className="h-10 w-10 rounded-lg bg-transparent cursor-pointer border-none" />
                          <span className="text-xs font-mono text-silver/50 uppercase">{currentPage.theme.pageBorderColor}</span>
                        </div>
                      </div>
                      {currentPage.template === 'full' && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex justify-between mb-2"><label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Opacidad</label><span className="text-xs font-mono text-primary">{currentPage.theme.overlayOpacity}%</span></div>
                          <input type="range" min="0" max="90" value={currentPage.theme.overlayOpacity} onChange={(e) => handleUpdatePage('theme.overlayOpacity', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
            <button onClick={() => { setDiscountCode(''); setShowPaymentModal(true); }} className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">shopping_cart</span> Comprar Links
            </button>
          </div>
        </div>

        {/* COL 4: PREVIEW */}
        <div className="w-[420px] bg-[#020202] border-l border-white/5 flex items-center justify-center relative p-8 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
          <div className="relative w-[320px] aspect-[9/19] bg-black rounded-[3rem] border-8 shadow-2xl overflow-hidden flex flex-col z-10" style={{ borderColor: currentPage.theme.pageBorderColor }}>
            <div className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col ${currentPage.template === 'full' ? 'bg-[#111]' : 'bg-black'}`}>
              {currentPage.template === 'full' && (<div className="absolute inset-0 z-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black transition-all" style={{ opacity: currentPage.theme.overlayOpacity / 100 }}></div></div>)}
              {currentPage.template === 'split' && (<div className="h-1/2 w-full relative z-0"><img src={currentPage.profileImage} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90"></div></div>)}
              <div className={`min-h-full p-6 flex flex-col relative z-20 ${currentPage.template === 'split' ? '' : 'items-center'} ${currentPage.template === 'minimal' ? 'justify-center' : ''} ${currentPage.template === 'full' ? 'justify-end pb-12' : ''}`}>
                {currentPage.template !== 'full' && (
                  <div className={`mb-8 relative z-10 ${currentPage.template === 'split' ? '-mt-12 text-left' : 'text-center'}`}>
                    {currentPage.template === 'minimal' && (<div className="h-24 w-24 rounded-full bg-gray-800 mb-4 overflow-hidden border-4 border-white/5 shadow-xl mx-auto"><img src={currentPage.profileImage} alt="Avatar" className="w-full h-full object-cover" /></div>)}
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

      {/* PAYMENT MODAL (Simplified) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10"><span className="material-symbols-outlined text-sm">close</span></button>
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary"><span className="material-symbols-outlined text-3xl">shopping_cart</span></div>
                <h2 className="text-2xl font-bold text-white">Resumen de Compra</h2>
                <p className="text-silver/60 text-sm mt-2">Pagando por tus {pages.length} landings creadas</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl space-y-3 my-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Cantidad de Páginas</span>
                  <span className="font-mono bg-black px-3 py-1 rounded border border-white/10">{pages.length}</span>
                </div>
                <div className="flex justify-between items-center text-silver/60 text-sm"><span>Precio unitario</span><span>${LINK_PRICE}.00</span></div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center font-bold text-lg"><span>Total a Pagar</span><span>${(pages.length * LINK_PRICE).toFixed(2)}</span></div>
              </div>
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">Código de Descuento</label>
                <div className="flex gap-2">
                  <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="CODE123" className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm" />
                  <button className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/20">Aplicar</button>
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
