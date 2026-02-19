import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DomainSearchModal from '@/components/DomainSearchModal';
import DomainPurchaseModal from '@/components/DomainPurchaseModal';

interface LinkHelper {
    id: string;
    title: string;
    slug: string;
    custom_domain?: string | null;
    photo?: string;
}

// Pricing Constants
const PRICE_CONNECT = 54.99;
const PRICE_BUY = 74.99;

const Domains = () => {
    const navigate = useNavigate();
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
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [selectedDomainForPurchase, setSelectedDomainForPurchase] = useState('');
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

    const toggleAction = (linkId: string, action: 'connect' | 'buy' | null) => {
        setSelectedActions(prev => ({
            ...prev,
            [linkId]: prev[linkId] === action ? null : action
        }));
    };

    // Calculate Totals - Modified to EXCLUDE 'buy' from cart since it's direct purchase now
    const calculateTotals = () => {
        let subtotal = 0;
        let itemsCount = 0;

        Object.values(selectedActions).forEach(action => {
            if (action === 'connect') {
                subtotal += PRICE_CONNECT;
                itemsCount++;
            }
            // Buy is handled directly via modal now
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

        toast.loading('Redirigiendo a pagos...');
        setTimeout(() => {
            navigate('/dashboard/payments', {
                state: {
                    pendingPurchase: {
                        type: 'domains_bundle',
                        amount: total,
                        subtotal: subtotal,
                        discountApplied: appliedDiscount ? { ...appliedDiscount, amount: discountAmount } : null,
                        items: selectedActions,
                        domainsInput: domainsInput
                    }
                }
            });
            toast.dismiss();
        }, 1000);
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
        // We don't toggle 'buy' action anymore for cart, we go direct flow
    };

    const handleDomainSelectedInModal = (domain: string) => {
        if (currentLinkForSearch) {
            setSelectedDomainForPurchase(domain);
            setModalOpen(false);
            setPurchaseModalOpen(true);
        }
    };

    const handlePurchaseSuccess = () => {
        fetchLinks();
        // Clear selection/input if needed
        if (currentLinkForSearch) {
            setDomainsInput(prev => ({ ...prev, [currentLinkForSearch]: selectedDomainForPurchase }));
            toggleAction(currentLinkForSearch, null); // Clear action
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-40">
            {/* ... (Header same) */}

            {loading ? (
                // ... (skeletons)
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map(link => {
                        const action = selectedActions[link.id];
                        const isConnected = !!link.custom_domain;
                        const isDraft = link.id.toString().startsWith('draft_');

                        return (
                            <div key={link.id} className={`bg-[#0A0A0A] border transition-all rounded-2xl overflow-hidden ${action ? 'border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5'}`}>
                                {/* ... (Link Row content same until Options Grid) */}
                                <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4 relative group/card">
                                    {/* ... (Delete button, Thumbnail, Title same) */}
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

                                    {/* Options */}
                                    {isConnected ? (
                                        <div className="flex-1 flex justify-end gap-3">
                                            <div className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/20 font-bold text-[10px] uppercase flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                Dominio Activo: {link.custom_domain}
                                            </div>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`¿Desvincular ${link.custom_domain} de este link?`)) {
                                                        try {
                                                            const { error } = await supabase
                                                                .from('smart_links')
                                                                .update({ custom_domain: null })
                                                                .eq('id', link.id);

                                                            if (error) throw error;
                                                            toast.success('Dominio desvinculado');
                                                            fetchLinks();
                                                        } catch (error) {
                                                            console.error('Error disconnecting:', error);
                                                            toast.error('Error al desvincular');
                                                        }
                                                    }
                                                }}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 font-bold text-[10px] uppercase transition-all"
                                            >
                                                Desvincular
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                            {/* CONNECT (Cart Flow) */}
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
                                                ) : <p className="text-silver/40 text-[10px]">Si ya posees un dominio.</p>}
                                            </div>

                                            {/* BUY (Direct Flow) */}
                                            <div
                                                onClick={() => openSearchModal(link.id)}
                                                className="cursor-pointer rounded-xl p-3 border bg-black/20 border-white/5 hover:border-white/10 transition-all relative"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-xs text-silver">Comprar Nuevo</h4>
                                                    <span className="font-bold text-xs text-white">${PRICE_BUY}</span>
                                                </div>
                                                <button
                                                    className="w-full bg-primary text-white text-xs font-bold py-1.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 mt-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">search</span>
                                                    Buscar y Comprar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer only appears if itemsCount > 0 (Connect actions) */}
            {itemsCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:left-[280px] bg-[#0A0A0A] border-t border-white/10 z-50 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    {/* ... (Footer content same as before) */}
                    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="w-full lg:w-auto flex-1 max-w-md">
                            {/* Discount input... */}
                            {/* ... */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    placeholder="CÓDIGO..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none uppercase font-bold"
                                />
                                <button onClick={handleApplyDiscount} className="bg-white/10 text-white px-6 rounded-xl text-xs font-bold">APLICAR</button>
                            </div>
                            {discountError && <p className="text-red-500 text-[10px] font-bold mt-1 pl-2 uppercase">{discountError}</p>}
                        </div>
                        <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                            <div className="text-right space-y-1">
                                <span className="text-sm font-bold text-silver/40 uppercase">Total</span>
                                <div className="text-3xl font-black text-white">${total.toFixed(2)}</div>
                            </div>
                            <button
                                onClick={handlePayment}
                                className="bg-primary text-white font-black px-8 py-4 rounded-xl flex items-center gap-3 hover:scale-105 transition-all"
                            >
                                <span>Pagar Conexión</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DomainSearchModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onDomainSelected={handleDomainSelectedInModal}
                initialValue={currentLinkForSearch && domainsInput[currentLinkForSearch] ? domainsInput[currentLinkForSearch] : ''}
            />

            {/* Purchase Modal (Direct Flow) */}
            {purchaseModalOpen && currentLinkForSearch && (
                <DomainPurchaseModal
                    isOpen={purchaseModalOpen}
                    onClose={() => setPurchaseModalOpen(false)}
                    domain={selectedDomainForPurchase}
                    price={PRICE_BUY}
                    linkId={currentLinkForSearch}
                    onSuccess={handlePurchaseSuccess}
                />
            )}
        </div>
    );
};

export default Domains;
