import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import DomainSearch from '@/components/DomainSearch';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface LinkHelper {
    id: string;
    title: string;
    slug: string;
    custom_domain?: string | null;
    photo?: string;
}

const Domains = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [links, setLinks] = useState<LinkHelper[]>([]);
    const [loading, setLoading] = useState(true);

    // Domain Management State
    const [domainsInput, setDomainsInput] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    // Modal State
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchLinks();
        }
    }, [user]);

    const fetchLinks = async () => {
        try {
            const { data } = await supabase
                .from('smart_links')
                .select('id, title, slug, custom_domain, photo')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (data) {
                setLinks(data);
                // Initialize inputs
                const inputs: Record<string, string> = {};
                data.forEach(link => {
                    inputs[link.id] = link.custom_domain || '';
                });
                setDomainsInput(inputs);
            }
        } catch (error) {
            console.error("Error fetching links:", error);
            toast.error("Error al cargar los links");
        } finally {
            setLoading(false);
        }
    };

    const handleConnectDomain = async (linkId: string) => {
        const domain = domainsInput[linkId]?.trim();
        if (!domain) return;

        setSavingId(linkId);
        try {
            // Update DB
            const { error } = await supabase
                .from('smart_links')
                .update({ custom_domain: domain })
                .eq('id', linkId);

            if (error) throw error;
            toast.success("Dominio actualizado correctamente");
        } catch (err) {
            console.error(err);
            toast.error("Error al conectar dominio");
        } finally {
            setSavingId(null);
        }
    };

    const openBuyModal = (linkId: string) => {
        setSelectedLinkId(linkId);
        setShowBuyModal(true);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configuración de Dominios</h1>
                    <p className="text-silver/60 mt-1">
                        Gestiona tus dominios personalizados y conecta tu marca.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {links.map(link => (
                        <div key={link.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/20 transition-all">
                            {/* Link Info */}
                            <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[250px]">
                                <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                                    {link.photo ? (
                                        <img src={link.photo} alt={link.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-silver/40 font-bold text-lg">
                                            {link.title?.charAt(0) || 'L'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white leading-tight">{link.title || 'Sin Título'}</h3>
                                    <span className="text-xs text-silver/50">/{link.slug}</span>
                                </div>
                            </div>

                            {/* Divider (Desktop) */}
                            <div className="hidden md:block w-px h-12 bg-white/5 mx-2"></div>

                            {/* Domain Configuration */}
                            <div className="flex-1 w-full relative">
                                <label className="text-[10px] font-bold text-silver/40 uppercase mb-1.5 block">Dominio Personalizado</label>
                                <div className="flex gap-2 relative">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-silver/30 text-lg">language</span>
                                        <input
                                            type="text"
                                            value={domainsInput[link.id] || ''}
                                            onChange={(e) => setDomainsInput(prev => ({ ...prev, [link.id]: e.target.value }))}
                                            placeholder="tudominio.com"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary focus:bg-white/5 transition-all placeholder:text-silver/20"
                                        />
                                    </div>

                                    {/* Connect Button */}
                                    <button
                                        onClick={() => handleConnectDomain(link.id)}
                                        disabled={savingId === link.id || !domainsInput[link.id]}
                                        className="bg-white/5 hover:bg-primary hover:text-white text-silver border border-white/10 hover:border-primary rounded-xl px-4 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingId === link.id ? (
                                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-lg">link</span>
                                                <span className="hidden sm:inline">Conectar</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Cart Button (Buy) */}
                                    {(!link.custom_domain && !domainsInput[link.id]) && (
                                        <button
                                            onClick={() => openBuyModal(link.id)}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:scale-105 rounded-xl px-4 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                            title="Comprar Dominio w/ Cloudflare"
                                        >
                                            <span className="material-symbols-outlined text-lg">shopping_cart</span>
                                            <span className="hidden sm:inline">Comprar</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {links.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-silver/40 text-3xl">link_off</span>
                            </div>
                            <h3 className="text-white font-bold text-xl">No tienes links creados</h3>
                            <p className="text-silver/50 mt-2 max-w-sm mx-auto">Crea tu primer link para poder conectarle un dominio personalizado.</p>
                        </div>
                    )}
                </div>
            )}

            {/* BUY DOMAIN MODAL */}
            {showBuyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowBuyModal(false)}>
                    <div className="w-full max-w-3xl bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-500">shopping_cart</span>
                                    Comprar Dominio
                                </h2>
                                <p className="text-xs text-silver/50 font-bold uppercase tracking-wider mt-1">Powered by Cloudflare</p>
                            </div>
                            <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-silver hover:text-white transition-all">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                                <span className="material-symbols-outlined text-yellow-500 shrink-0">info</span>
                                <div>
                                    <h4 className="text-yellow-500 font-bold text-sm uppercase">Solo dominios .COM</h4>
                                    <p className="text-yellow-500/70 text-xs mt-1">Por el momento, nuestra integración con Cloudflare solo permite la compra y registro de dominios con extensión .com.</p>
                                </div>
                            </div>

                            <div className="domain-search-wrapper">
                                <DomainSearch linkId={selectedLinkId || undefined} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 md:left-[280px] p-4 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/10 flex justify-between items-center z-40">
                <button
                    onClick={() => navigate('/dashboard/links')}
                    className="flex items-center gap-2 text-silver hover:text-white font-bold transition-colors px-4 py-2"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Anterior
                </button>

                <button
                    onClick={() => toast.success("Redirigiendo a pasarela de pago...")}
                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 text-white font-black uppercase tracking-wider px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105 transition-all flex items-center gap-2"
                >
                    Pagar
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default Domains;
