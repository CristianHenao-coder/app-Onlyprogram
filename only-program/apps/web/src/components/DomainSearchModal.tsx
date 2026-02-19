import { useState, useEffect } from 'react';
import { Search, Loader2, Check, AlertCircle, X, Globe } from 'lucide-react';
import axios from 'axios';

interface DomainSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDomainSelected: (domain: string) => void;
    initialValue?: string;
}

const DomainSearchModal = ({ isOpen, onClose, onDomainSelected, initialValue = '' }: DomainSearchModalProps) => {
    const [query, setQuery] = useState(initialValue);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ available: boolean; domain: string; error?: string } | null>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setQuery(initialValue);
            setResult(null);
        }
    }, [isOpen, initialValue]);

    const handleSearch = async () => {
        let domain = query.toLowerCase().trim();

        // --- STRICT VALIDATION & AUTO-FIX ---

        // 1. Auto-append .com if missing extension
        if (!domain.includes('.')) {
            domain += '.com';
            setQuery(domain); // Update input to show user
        }

        // 2. Must be .com
        if (!domain.endsWith('.com')) {
            setResult({ available: false, domain, error: 'Solo se permiten dominios .com por razones de seguridad y SEO.' });
            return;
        }

        // 3. No numbers allowed (Optional rule from user preference in UI, kept here)
        if (/\d/.test(domain)) {
            setResult({ available: false, domain, error: 'El dominio no puede contener números para mejor posicionamiento.' });
            return;
        }

        // 4. Length check
        if (domain.length < 5) { // x.com is minimum but practically we want real names
            setResult({ available: false, domain, error: 'El nombre es muy corto.' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4005';
            const res = await axios.get(`${BACKEND_URL}/api/domains/search?q=${domain}`);

            if (res.data && res.data.result && Array.isArray(res.data.result) && res.data.result.length > 0) {
                const match = res.data.result[0];
                setResult({
                    available: match.available,
                    domain: match.name || domain,
                    error: match.available ? undefined : 'Este dominio no está disponible.'
                });
            } else {
                // If array is empty, it means no exact match was returned by Cloudflare as "registerable"
                setResult({
                    available: false,
                    domain: domain,
                    error: 'Este dominio no está disponible para registro.'
                });
            }

        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.status === 403) {
                setResult({
                    available: false,
                    domain,
                    error: error.response.data?.details || 'Error de configuración en Cloudflare. Verifica tu cuenta.'
                });
            } else {
                setResult({ available: false, domain, error: 'Error de conexión. Intenta de nuevo.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Buscar Dominio
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-silver" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value.toLowerCase())}
                            onKeyDown={handleKeyDown}
                            placeholder="tumarca.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-silver/20 focus:outline-none focus:border-blue-500 transition-all font-bold text-lg"
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-silver/40 w-5 h-5" />
                    </div>

                    <p className="text-xs text-silver/40 mt-3 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Solo dominios <strong>.com</strong>, sin números ni símbolos especiales.
                    </p>

                    <button
                        onClick={handleSearch}
                        disabled={loading || !query}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar Disponibilidad'}
                    </button>

                    {/* Results */}
                    {result && (
                        <div className={`mt-6 p-4 rounded-xl border flex items-center justify-between animate-fade-in ${result.available
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${result.available ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                    }`}>
                                    {result.available ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${result.available ? 'text-green-500' : 'text-red-500'}`}>
                                        {result.available ? '¡Dominio Disponible!' : 'No disponible'}
                                    </h4>
                                    <p className="text-xs text-silver/60 mt-0.5">
                                        {result.available
                                            ? 'Puedes registrar este dominio ahora.'
                                            : result.error || 'Este dominio ya está en uso.'}
                                    </p>
                                </div>
                            </div>

                            {result.available && (
                                <button
                                    onClick={() => {
                                        onDomainSelected(result.domain);
                                        onClose();
                                    }}
                                    className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    Seleccionar
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DomainSearchModal;
