import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DomainSearchModal from '@/components/DomainSearchModal';

const BACKEND_URL = import.meta.env.VITE_API_URL || '';

async function getAuthToken() {
    const session = (await supabase.auth.getSession()).data.session;
    return session?.access_token || '';
}

interface LinkHelper {
    id: string;
    title: string;
    slug: string;
    custom_domain?: string | null;
    domain_status?: string | null;
    domain_reservation_type?: string | null;
    domain_requested_at?: string | null;
    photo?: string;
}

const StatusPill = ({ status }: { status: string | null | undefined }) => {
    if (!status || status === 'none') return null;
    const cfg: Record<string, { label: string; cls: string; icon: string }> = {
        pending: { label: 'Reservado · Pendiente', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: 'schedule' },
        active: { label: 'Activo', cls: 'bg-green-500/15 text-green-400 border-green-500/30', icon: 'check_circle' },
        failed: { label: 'Error en configuración', cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: 'error' },
    };
    const { label, cls, icon } = cfg[status] ?? { label: status, cls: 'bg-white/10 text-white/40 border-white/10', icon: 'info' };
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${cls}`}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {label}
        </span>
    );
};

const Domains = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [links, setLinks] = useState<LinkHelper[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State for buy_new flow
    const [modalOpen, setModalOpen] = useState(false);
    const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);

    // Connect-own input state
    const [connectInputs, setConnectInputs] = useState<Record<string, string>>({});
    const [connectSending, setConnectSending] = useState<Record<string, boolean>>({});

    // Which links have the "connect" panel expanded
    const [connectExpanded, setConnectExpanded] = useState<Record<string, boolean>>({});

    // Canceling state per link
    const [canceling, setCanceling] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user) fetchLinks();
    }, [user]);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('smart_links')
                .select('id, title, slug, custom_domain, domain_status, domain_reservation_type, domain_requested_at, photo')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            setLinks(data || []);

            // Init connect inputs
            const inputs: Record<string, string> = {};
            (data || []).forEach(link => {
                if (link.domain_reservation_type === 'connect_own') {
                    inputs[link.id] = link.custom_domain || '';
                }
            });
            setConnectInputs(inputs);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar los links');
        } finally {
            setLoading(false);
        }
    };

    // --- CANCEL RESERVATION ---
    const handleCancelReservation = async (linkId: string) => {
        if (!window.confirm('¿Cancelar la reserva de este dominio? Quedará disponible para otros usuarios.')) return;
        setCanceling(prev => ({ ...prev, [linkId]: true }));
        try {
            const token = await getAuthToken();
            const res = await fetch(`${BACKEND_URL}/api/domains/reservation/${linkId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al cancelar');
            }
            toast.success('Reserva cancelada');
            fetchLinks();
        } catch (err: any) {
            toast.error(err.message || 'Error al cancelar la reserva');
        } finally {
            setCanceling(prev => ({ ...prev, [linkId]: false }));
        }
    };

    // --- CONNECT OWN DOMAIN ---
    const handleConnectSubmit = async (linkId: string) => {
        const domain = connectInputs[linkId]?.trim();
        if (!domain) { toast.error('Ingresa un dominio válido'); return; }
        setConnectSending(prev => ({ ...prev, [linkId]: true }));
        try {
            const token = await getAuthToken();
            const res = await fetch(`${BACKEND_URL}/api/domains/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ linkId, domain, reservation_type: 'connect_own' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar solicitud');
            toast.success('Solicitud enviada. El equipo configurará los DNS pronto.');
            fetchLinks();
        } catch (err: any) {
            toast.error(err.message || 'Error al solicitar vinculación');
        } finally {
            setConnectSending(prev => ({ ...prev, [linkId]: false }));
        }
    };

    // --- OPEN SEARCH MODAL (buy_new) ---
    const openModal = (linkId: string) => {
        setCurrentLinkId(linkId);
        setModalOpen(true);
    };

    const handleDomainReserved = (_domain: string) => {
        setModalOpen(false);
        toast.success('¡Dominio reservado! El equipo lo configurará pronto.');
        fetchLinks();
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configuración de Dominios</h1>
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl -z-10" />
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <span className="material-symbols-outlined text-xl">verified_user</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wide">¿Por qué necesitas un dominio?</h3>
                            <p className="text-silver/80 text-xs leading-relaxed max-w-3xl">
                                Tu dominio es la llave maestra de tu ecosistema digital.{' '}
                                <span className="text-white font-bold">Sin un dominio .com verificado, no podrás conectar tus redes sociales, tu página no estará activa públicamente.</span>{' '}
                                Elige un nombre profesional, sin números ni caracteres especiales.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Links list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
            ) : links.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                    <h3 className="text-white font-bold text-xl">No tienes links creados</h3>
                    <button onClick={() => navigate('/dashboard/links')} className="mt-4 text-primary font-bold hover:underline">
                        Crear mi primer link
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {links.map(link => {
                        const hasPending = link.domain_status === 'pending';
                        const isActive = link.domain_status === 'active';
                        const hasFailed = link.domain_status === 'failed';
                        const hasReservation = hasPending || isActive || hasFailed;
                        const connectOpen = connectExpanded[link.id];

                        return (
                            <div
                                key={link.id}
                                className={`bg-[#0A0A0A] border rounded-2xl overflow-hidden transition-all ${hasReservation ? 'border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.07)]' : 'border-white/5'}`}
                            >
                                {/* Top row: thumbnail + title + status */}
                                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                                        {link.photo ? (
                                            <img src={link.photo} alt={link.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-silver/40 font-bold text-lg">
                                                {link.title?.charAt(0) || 'L'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + slug */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold truncate">{link.title || 'Sin Título'}</h3>
                                        <p className="text-silver/40 text-xs font-mono truncate">{link.slug}</p>
                                    </div>

                                    {/* Status pill */}
                                    <StatusPill status={link.domain_status} />
                                </div>

                                {/* If domain is ACTIVE */}
                                {isActive && (
                                    <div className="px-4 pb-4">
                                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-400 text-lg">public</span>
                                            <div>
                                                <p className="text-green-400 font-bold text-sm font-mono">{link.custom_domain}</p>
                                                <p className="text-silver/50 text-xs">Dominio activo y configurado</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* If domain is PENDING (reserved) */}
                                {hasPending && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-yellow-400 font-bold text-sm font-mono">{link.custom_domain}</p>
                                                    <p className="text-silver/50 text-xs mt-0.5">
                                                        {link.domain_reservation_type === 'buy_new'
                                                            ? 'Nuestro equipo está comprando y configurando este dominio.'
                                                            : 'Nuestro equipo está configurando la vinculación DNS.'}
                                                    </p>
                                                    {link.domain_requested_at && (
                                                        <p className="text-silver/30 text-[10px] mt-1">
                                                            Solicitado: {new Date(link.domain_requested_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleCancelReservation(link.id)}
                                                    disabled={canceling[link.id]}
                                                    className="text-[10px] font-bold text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-2 py-1 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 shrink-0"
                                                >
                                                    {canceling[link.id]
                                                        ? <span className="animate-spin material-symbols-outlined text-xs">progress_activity</span>
                                                        : <span className="material-symbols-outlined text-xs">cancel</span>}
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* If domain FAILED */}
                                {hasFailed && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-red-400 font-bold text-sm font-mono">{link.custom_domain}</p>
                                                <p className="text-silver/50 text-xs mt-0.5">Error en la configuración. Contacta a soporte.</p>
                                            </div>
                                            <button
                                                onClick={() => handleCancelReservation(link.id)}
                                                disabled={canceling[link.id]}
                                                className="text-[10px] font-bold text-silver/50 hover:text-white border border-white/10 hover:border-white/20 px-2 py-1 rounded-lg transition-all shrink-0"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* If NO reservation yet → show options */}
                                {!hasReservation && (
                                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* OPTION 1: Buy New Domain */}
                                        <button
                                            onClick={() => openModal(link.id)}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all text-left group"
                                        >
                                            <div className="p-2 rounded-lg bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors shrink-0">
                                                <span className="material-symbols-outlined text-base">search</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-xs">Comprar Nuevo Dominio</h4>
                                                <p className="text-silver/40 text-[10px]">Buscamos y compramos por ti</p>
                                            </div>
                                        </button>

                                        {/* OPTION 2: Connect Own Domain */}
                                        {connectOpen ? (
                                            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-blue-400 font-bold text-xs">Conectar Dominio Propio</h4>
                                                    <button
                                                        onClick={() => setConnectExpanded(p => ({ ...p, [link.id]: false }))}
                                                        className="text-silver/30 hover:text-silver transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={connectInputs[link.id] || ''}
                                                    onChange={e => setConnectInputs(p => ({ ...p, [link.id]: e.target.value }))}
                                                    placeholder="ejemplo.com"
                                                    className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-xs font-bold"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleConnectSubmit(link.id)}
                                                    disabled={connectSending[link.id]}
                                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-60"
                                                >
                                                    {connectSending[link.id]
                                                        ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                                                        : 'Solicitar Vinculación'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConnectExpanded(p => ({ ...p, [link.id]: true }))}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/8 transition-all text-left group"
                                            >
                                                <div className="p-2 rounded-lg bg-white/10 text-silver/60 group-hover:bg-white/15 transition-colors shrink-0">
                                                    <span className="material-symbols-outlined text-base">link</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-silver font-bold text-xs">Conectar Dominio Propio</h4>
                                                    <p className="text-silver/40 text-[10px]">Ya tienes el dominio registrado</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Domain Search Modal (buy_new flow) */}
            {currentLinkId && (
                <DomainSearchModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onDomainReserved={handleDomainReserved}
                    linkId={currentLinkId}
                />
            )}
        </div>
    );
};

export default Domains;
