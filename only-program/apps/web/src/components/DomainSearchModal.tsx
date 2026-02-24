import { useState, useEffect } from 'react';
import { Search, Loader2, Check, AlertCircle, X, Globe, Lock, ShoppingCart } from 'lucide-react';
import { supabase } from '@/services/supabase';

const BACKEND_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';

interface DomainSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when the user confirms reservation of a domain */
    onDomainReserved: (domain: string) => void;
    /** linkId of the smart link this domain will be reserved for */
    linkId: string;
    initialValue?: string;
}

type SearchState =
    | { phase: 'idle' }
    | { phase: 'searching' }
    | { phase: 'available'; domain: string; price?: number | null; currency?: string | null }
    | { phase: 'reserved'; domain: string }
    | { phase: 'taken'; domain: string }
    | { phase: 'error'; message: string };

async function getAuthToken() {
    const session = (await supabase.auth.getSession()).data.session;
    return session?.access_token || '';
}

const DomainSearchModal = ({
    isOpen,
    onClose,
    onDomainReserved,
    linkId,
    initialValue = '',
}: DomainSearchModalProps) => {
    const [query, setQuery] = useState(initialValue);
    const [state, setState] = useState<SearchState>({ phase: 'idle' });
    const [reserving, setReserving] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setQuery(initialValue);
            setState({ phase: 'idle' });
            setReserving(false);
        }
    }, [isOpen, initialValue]);

    const handleSearch = async () => {
        let domain = query.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '');

        // Auto-append .com if missing
        if (!domain.includes('.')) {
            domain += '.com';
            setQuery(domain);
        }

        if (!domain.endsWith('.com')) {
            setState({ phase: 'error', message: 'Solo se permiten dominios .com por razones de seguridad y SEO.' });
            return;
        }

        if (/\d/.test(domain)) {
            setState({ phase: 'error', message: 'El dominio no puede contener números para mejor posicionamiento.' });
            return;
        }

        if (domain.length < 5) {
            setState({ phase: 'error', message: 'El nombre del dominio es muy corto.' });
            return;
        }

        setState({ phase: 'searching' });

        try {
            const res = await fetch(`${BACKEND_URL}/api/domains/search?q=${encodeURIComponent(domain)}`);
            const data = await res.json();

            if (!data.success || !Array.isArray(data.result) || data.result.length === 0) {
                setState({ phase: 'taken', domain });
                return;
            }

            const match = data.result[0];

            if (match.reserved) {
                // Reserved in our system by another user
                setState({ phase: 'reserved', domain: match.name || domain });
            } else if (match.available) {
                setState({
                    phase: 'available',
                    domain: match.name || domain,
                    price: match.price ?? null,
                    currency: match.currency ?? null,
                });
            } else {
                setState({ phase: 'taken', domain: match.name || domain });
            }
        } catch {
            setState({ phase: 'error', message: 'Error de conexión. Intenta de nuevo.' });
        }
    };

    const handleReserve = async () => {
        if (state.phase !== 'available') return;
        const domain = state.domain;

        setReserving(true);
        try {
            const token = await getAuthToken();
            const res = await fetch(`${BACKEND_URL}/api/domains/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    linkId,
                    domain,
                    reservation_type: 'buy_new',
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setState({ phase: 'error', message: data.error || 'Error al reservar el dominio.' });
                return;
            }

            onDomainReserved(domain);
            onClose();
        } catch {
            setState({ phase: 'error', message: 'Error de conexión al reservar. Intenta de nuevo.' });
        } finally {
            setReserving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Buscar y Reservar Dominio
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-silver" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-5">
                    {/* Search input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value.toLowerCase()); setState({ phase: 'idle' }); }}
                            onKeyDown={handleKeyDown}
                            placeholder="tumarca.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-silver/20 focus:outline-none focus:border-blue-500 transition-all font-bold text-lg"
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-silver/40 w-5 h-5" />
                    </div>

                    <p className="text-xs text-silver/40 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Solo dominios <strong>.com</strong>, sin números ni símbolos especiales.
                    </p>

                    {/* Search button */}
                    <button
                        onClick={handleSearch}
                        disabled={state.phase === 'searching' || !query.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {state.phase === 'searching'
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <><Search className="w-4 h-4" /> Verificar Disponibilidad</>}
                    </button>

                    {/* Result */}
                    {state.phase === 'available' && (
                        <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5 animate-fade-in space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-500/20 text-green-500">
                                    <Check className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-green-400">¡Dominio Disponible!</h4>
                                    <p className="text-sm font-mono text-white truncate">{state.domain}</p>
                                    {state.price && (
                                        <p className="text-xs text-silver/50 mt-0.5">
                                            Precio referencial: {state.currency === 'USD' ? '$' : ''}{(state.price / 1000000).toFixed(2)} USD/año
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-silver/50 bg-white/5 rounded-xl p-3 leading-relaxed">
                                Al reservar, nuestro equipo comprará este dominio por ti y configurará los DNS. El costo del dominio ya está incluido en tu plan.
                            </p>
                            <button
                                onClick={handleReserve}
                                disabled={reserving}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {reserving
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <><ShoppingCart className="w-4 h-4" /> Reservar Dominio</>}
                            </button>
                        </div>
                    )}

                    {state.phase === 'reserved' && (
                        <div className="p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-500">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-yellow-400">Dominio Reservado</h4>
                                    <p className="text-xs text-silver/60 mt-0.5">
                                        <span className="font-mono text-white">{state.domain}</span> ya está reservado por otro usuario. Prueba con un nombre diferente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {state.phase === 'taken' && (
                        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-red-500/20 text-red-500">
                                    <X className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-400">No Disponible</h4>
                                    <p className="text-xs text-silver/60 mt-0.5">
                                        <span className="font-mono text-white">{state.domain}</span> ya está registrado en internet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {state.phase === 'error' && (
                        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 animate-fade-in">
                            <div className="flex items-center gap-3 text-red-400">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p className="text-sm">{state.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DomainSearchModal;
