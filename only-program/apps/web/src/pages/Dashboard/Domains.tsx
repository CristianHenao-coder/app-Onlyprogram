import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DomainSearchModal from '@/components/DomainSearchModal';
import { productPricingService, DEFAULT_PRODUCT_PRICING, type ProductPricingConfig } from '@/services/productPricing.service';

interface LinkHelper {
    id: string;
    title: string;
    slug: string;
    custom_domain?: string | null;
    photo?: string;
}

// Pricing Constants
const MOCK_USER_HAS_CARD = false; // Simulate if user has card

const Domains = () => {
    const navigate = useNavigate();

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

  const PRICE_CONNECT = pricingCfg.domain.connect;
  const PRICE_BUY = pricingCfg.domain.buy;
    const { user } = useAuth();
    const [links, setLinks] = useState<LinkHelper[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection State: Track what action is selected for each link
    // 'connect': Connect existing domain
    // 'buy': Buy new domain
    // null: No action
    const [selectedActions, setSelectedActions] = useState<Record<string, 'connect' | 'buy' | null>>({});

    // Input States
    const [domainsInput, setDomainsInput] = useState<Record<string, string>>({});

    // Discount State
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, percent: number } | null>(null);
    const [discountError, setDiscountError] = useState('');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [currentLinkForSearch, setCurrentLinkForSearch] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchLinks();
        }
    }, [user]);

    const fetchLinks = async () => {
        try {
            // 1. Fetch Active Links from DB
            const { data: dbLinks } = await supabase
                .from('smart_links')
                .select('id, title, slug, custom_domain, photo')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            // 2. Fetch Drafts from localStorage
            let localDrafts: LinkHelper[] = [];
            try {
                const saved = localStorage.getItem('my_links_data');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        localDrafts = parsed.map((d: any) => ({
                            id: d.id,
                            title: d.profileName || d.name || 'Borrador',
                            slug: 'Borrador', // Drafts usually don't have a final slug yet
                            photo: d.profileImage,
                            custom_domain: null // Drafts don't have domains yet
                        }));
                    }
                }
            } catch (e) {
                console.error("Error loading local drafts:", e);
            }

            // 3. Merge & Deduplicate (prefer DB if same ID exists)
            const activeIds = new Set(dbLinks?.map(l => l.id) || []);
            const uniqueDrafts = localDrafts.filter(d => !activeIds.has(d.id));

            const allLinks = [...(dbLinks || []), ...uniqueDrafts];
            setLinks(allLinks);

            // Initialize inputs
            const inputs: Record<string, string> = {};
            allLinks.forEach(link => {
                inputs[link.id] = link.custom_domain || '';
            });
            setDomainsInput(inputs);

        } catch (error) {
            console.error("Error fetching links:", error);
            toast.error("Error al cargar los links");
        } finally {
            setLoading(false);
        }
    };


    // --- LOGIC ---

    const toggleAction = (linkId: string, action: 'connect' | 'buy') => {
        setSelectedActions(prev => ({
            ...prev,
            [linkId]: prev[linkId] === action ? null : action
        }));
    };

    // Calculate Totals
    const calculateTotals = () => {
        let subtotal = 0;
        let itemsCount = 0;

        Object.values(selectedActions).forEach(action => {
            if (action === 'connect') subtotal += PRICE_CONNECT;
            if (action === 'buy') subtotal += PRICE_BUY;
            if (action) itemsCount++;
        });

        const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent) / 100 : 0;
        const total = subtotal - discountAmount;

        return { subtotal, discountAmount, total, itemsCount };
    };

    const { subtotal, discountAmount, total, itemsCount } = calculateTotals();

    const handleApplyDiscount = () => {
        const code = discountCode.toUpperCase().trim();
        if (code === 'ONLYPROGRAM25') {
            setAppliedDiscount({ code: 'ONLYPROGRAM25', percent: 25 });
            setDiscountError('');
            toast.success('¡Código aplicado! 25% OFF');
        } else if (code === 'WELCOME10') {
            setAppliedDiscount({ code: 'WELCOME10', percent: 10 });
            setDiscountError('');
            toast.success('¡Código aplicado! 10% OFF');
        } else {
            setDiscountError('Código inválido');
            setAppliedDiscount(null);
        }
    };

    const handlePayment = () => {
        if (itemsCount === 0) {
            toast.error("Selecciona al menos una opción para continuar");
            return;
        }

        if (MOCK_USER_HAS_CARD) {
            toast.success(`¡Pago exitoso de $${total.toFixed(2)}!`);
            // Here we would process backend update
        } else {
            toast.loading('Redirigiendo a pagos...');
            setTimeout(() => {
                navigate('/dashboard/payments', {
                    state: {
                        pendingPurchase: {
                            type: 'domains_bundle',
                            amount: total,
                            subtotal: subtotal,
                            discountApplied: appliedDiscount ? { ...appliedDiscount, amount: discountAmount } : null,
                            items: selectedActions // We pass what was selected so payment page knows
                        }
                    }
                });
                toast.dismiss();
            }, 1000);
        }
    };

    // DELETE FUNCTIONALITY
    const handleDelete = async (linkId: string, isDraft: boolean) => {
        if (!window.confirm('¿Estás seguro de eliminar este link?')) return;

        try {
            if (isDraft) {
                // Remove from localStorage
                const saved = localStorage.getItem('my_links_data');
                if (saved) {
                    const drafts = JSON.parse(saved);
                    const newDrafts = drafts.filter((d: any) => d.id !== linkId);
                    localStorage.setItem('my_links_data', JSON.stringify(newDrafts));
                }
            } else {
                // Remove from DB
                const { error } = await supabase
                    .from('smart_links')
                    .delete()
                    .eq('id', linkId)
                    .eq('user_id', user?.id);

                if (error) throw error;
            }

            toast.success('Link eliminado');
            fetchLinks(); // Refresh list
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar');
        }
    };

    // Open Search Modal
    const openSearchModal = (linkId: string) => {
        setCurrentLinkForSearch(linkId);
        setModalOpen(true);
        // Ensure 'buy' is selected
        if (selectedActions[linkId] !== 'buy') {
            toggleAction(linkId, 'buy');
        }
    };

    const handleDomainSelectedInModal = (domain: string) => {
        if (currentLinkForSearch) {
            setDomainsInput(prev => ({ ...prev, [currentLinkForSearch]: domain }));
            // Ensure buy action is selected
            setSelectedActions(prev => ({ ...prev, [currentLinkForSearch]: 'buy' }));
        }
        setModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-40">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configuración de Dominios</h1>
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl -z-10"></div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <span className="material-symbols-outlined text-xl">verified_user</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-white font-bold text-sm uppercase tracking-wide">¿Por qué necesitas un dominio?</h3>
                                <p className="text-silver/80 text-xs leading-relaxed max-w-3xl">
                                    Tu dominio es la llave maestra de tu ecosistema digital. <span className="text-white font-bold">Sin un dominio .com verificado, no podrás conectar tus redes sociales, tu página no estará activa públicamente y no funcionará el sistema de ventas.</span> Elige un nombre profesional, sin números ni caracteres especiales, para garantizar tu posicionamiento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map(link => {
                        const action = selectedActions[link.id];
                        const isConnected = !!link.custom_domain; // Already has domain?
                        const isDraft = link.id.toString().startsWith('draft_');

                        return (
                            <div key={link.id} className={`bg-[#0A0A0A] border transition-all rounded-2xl overflow-hidden ${action ? 'border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5'}`}>
                                {/* Link Compact Row */}
                                <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4 relative group/card">

                                    {/* DELETE BUTTON */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(link.id, isDraft); }}
                                        className="absolute top-2 right-2 p-1.5 text-silver/20 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100 bg-black/50 rounded-lg backdrop-blur-sm"
                                        title="Eliminar Link"
                                    >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>

                                    {/* Thumbnail & Title */}
                                    <div className="flex items-center gap-4 w-full md:w-1/3">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                                            {link.photo ? (
                                                <img src={link.photo} alt={link.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-silver/40 font-bold text-lg">
                                                    {link.title?.charAt(0) || 'L'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-bold text-sm truncate">{link.title || 'Sin Título'}</h3>
                                            <div className="flex items-center gap-1.5 text-silver/50 text-xs font-mono mt-0.5">
                                                {isDraft && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>}
                                                <span className="truncate max-w-[120px]">{link.slug}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active State */}
                                    {isConnected ? (
                                        <div className="flex-1 flex justify-end">
                                            <div className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/20 font-bold text-[10px] uppercase flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                Dominio Activo
                                            </div>
                                        </div>
                                    ) : (
                                        /* Options Grid */
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                            {/* OPTION 1: CONNECT */}
                                            <div
                                                onClick={() => toggleAction(link.id, 'connect')}
                                                className={`cursor-pointer rounded-xl p-3 border transition-all relative ${action === 'connect' ? 'bg-primary/5 border-primary' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className={`font-bold text-xs ${action === 'connect' ? 'text-primary' : 'text-silver'}`}>Conectar Propio</h4>
                                                    <span className="font-bold text-xs text-white">${PRICE_CONNECT}</span>
                                                </div>

                                                {action === 'connect' ? (
                                                    <input
                                                        type="text"
                                                        value={domainsInput[link.id] || ''}
                                                        onChange={(e) => setDomainsInput(prev => ({ ...prev, [link.id]: e.target.value }))}
                                                        placeholder="ejemplo.com"
                                                        className="w-full bg-black/40 border border-primary/30 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-primary text-xs font-bold mt-1"
                                                        autoFocus
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <p className="text-silver/40 text-[10px]">Si ya posees un dominio.</p>
                                                )}
                                            </div>

                                            {/* OPTION 2: BUY */}
                                            <div
                                                onClick={() => {
                                                    if (action !== 'buy') toggleAction(link.id, 'buy');
                                                }}
                                                className={`cursor-pointer rounded-xl p-3 border transition-all relative ${action === 'buy' ? 'bg-primary/5 border-primary' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className={`font-bold text-xs ${action === 'buy' ? 'text-primary' : 'text-silver'}`}>Comprar Nuevo</h4>
                                                    <span className="font-bold text-xs text-white">${PRICE_BUY}</span>
                                                </div>

                                                {action === 'buy' ? (
                                                    <div className="mt-1">
                                                        {domainsInput[link.id] ? (
                                                            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1.5">
                                                                <span className="text-green-500 font-bold text-xs flex items-center gap-1 truncate">
                                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                                    {domainsInput[link.id]}
                                                                </span>
                                                                <button onClick={(e) => { e.stopPropagation(); openSearchModal(link.id); }} className="text-[10px] text-silver underline hover:text-white">Cambiar</button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openSearchModal(link.id); }}
                                                                className="w-full bg-primary text-white text-xs font-bold py-1.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">search</span>
                                                                Buscar Dominio
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-silver/40 text-[10px] flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                                        Incluye SSL y Anti-Ban
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {links.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                            <h3 className="text-white font-bold text-xl">No tienes links creados</h3>
                            <button onClick={() => navigate('/dashboard/links')} className="mt-4 text-primary font-bold hover:underline">Crear mi primer link</button>
                        </div>
                    )}
                </div>
            )}

            {/* FIXED FOOTER */}
            <div className="fixed bottom-0 left-0 right-0 md:left-[280px] bg-[#0A0A0A] border-t border-white/10 z-50 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">

                    {/* LEFT: Discount Code */}
                    <div className="w-full lg:w-auto flex-1 max-w-md">
                        <label className="text-[10px] font-bold text-silver/40 uppercase mb-2 block tracking-wider">Código de Descuento</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="CÓDIGO..."
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    disabled={!!appliedDiscount}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary uppercase font-bold tracking-widest placeholder:text-silver/20 disabled:opacity-50"
                                />
                                {appliedDiscount && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-green-500/20">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        <span className="text-[10px] font-bold">APLICADO</span>
                                    </div>
                                )}
                            </div>
                            {!appliedDiscount ? (
                                <button onClick={handleApplyDiscount} className="bg-white/10 hover:bg-white/20 text-white px-6 rounded-xl text-xs font-bold transition-all border border-white/5 hover:border-white/20">
                                    APLICAR
                                </button>
                            ) : (
                                <button onClick={() => { setAppliedDiscount(null); setDiscountCode(''); setDiscountError(''); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 rounded-xl text-xs font-bold transition-all border border-red-500/20">
                                    QUITAR
                                </button>
                            )}
                        </div>
                        {discountError && <p className="text-red-500 text-[10px] mt-2 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span> {discountError}</p>}
                    </div>

                    {/* RIGHT: Totals & Action */}
                    <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                        <div className="text-right space-y-1">
                            {appliedDiscount && (
                                <div className="text-xs text-silver/60 line-through decoration-red-500 decoration-2 font-bold">${subtotal.toFixed(2)}</div>
                            )}
                            <div className="text-3xl font-black text-white tracking-tight flex items-center justify-end gap-2">
                                <span className="text-sm font-bold text-silver/40 uppercase tracking-widest translate-y-1">Total</span>
                                ${total.toFixed(2)}
                            </div>
                            {appliedDiscount && (
                                <div className="text-xs text-green-500 font-bold uppercase tracking-wider">Ahorras ${discountAmount.toFixed(2)} ({appliedDiscount.percent}%)</div>
                            )}
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={itemsCount === 0}
                            className="bg-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                        >
                            <span>Pagar</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{itemsCount} items</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* DOMAIN SEARCH MODAL */}
            <DomainSearchModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onDomainSelected={handleDomainSelectedInModal}
                initialValue={currentLinkForSearch && domainsInput[currentLinkForSearch] ? domainsInput[currentLinkForSearch] : ''}
            />
        </div>
    );
};

export default Domains;
