import { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import SmartLinkLanding from '@/pages/SmartLinkLanding';
import { Loader2 } from 'lucide-react';

interface DomainResolverProps {
    children: ReactNode;
}

const DomainResolver = ({ children }: DomainResolverProps) => {
    const [loading, setLoading] = useState(true);
    const [customSlug, setCustomSlug] = useState<string | null>(null);
    const [isCustomDomain, setIsCustomDomain] = useState(false);

    useEffect(() => {
        const checkDomain = async () => {
            const host = window.location.hostname;

            // Dominios que NO son custom (localhost, dominios de la app)
            // Ajusta esto con tus dominios reales de producción/desarrollo
            const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
            const isMainApp = host.includes('onlyprogramlink.com') || host.includes('vercel.app'); // Ajustar según domain real

            if (isLocal || isMainApp) {
                setLoading(false);
                return;
            }

            // Es un dominio custom
            setIsCustomDomain(true);
            try {
                // Try VITE_API_URL first as it's defined in .env
                const BACKEND_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:4005';
                console.log("Checking domain on:", BACKEND_URL);
                const { data } = await axios.get(`${BACKEND_URL}/api/gate/domain/${host}`);

                if (data && data.slug) {
                    setCustomSlug(data.slug);
                }
            } catch (error) {
                console.error("Error resolving domain:", error);
                // Si falla, tal vez mostrar 404 o dejar que cargue la app normal (que mostrará 404 en rutas)
                // Pero si es custom domain root, deberíamos mostrar error específico.
            } finally {
                setLoading(false);
            }
        };

        checkDomain();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (isCustomDomain && customSlug) {
        return <SmartLinkLanding slug={customSlug} />;
    }

    // Si es custom domain pero no resolvío (ej. dominio no configurado),
    // podríamos mostrar un error o dejar pasar (aunque dejar pasar cargaría la landing de la app en un dominio ajeno)
    if (isCustomDomain && !customSlug) {
        return (
            <div className="h-screen w-screen bg-[#030303] flex flex-col items-center justify-center text-white p-6 text-center font-sans selection:bg-primary/30">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative space-y-8 max-w-md animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl backdrop-blur-xl">
                        <span className="material-symbols-outlined text-silver/20 text-5xl">language_off</span>
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
                            Dominio No <span className="text-primary italic">Vinculado</span>
                        </h1>
                        <p className="text-silver/40 text-sm font-medium leading-relaxed">
                            Este dominio personalizado aún no ha sido configurado en nuestra plataforma o se encuentra en proceso de propagación.
                        </p>
                    </div>

                    <div className="pt-4">
                        <a 
                            href="https://onlyprogram.com" 
                            className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
                        >
                            Ir a OnlyProgram
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </a>
                    </div>
                </div>

                <div className="absolute bottom-12 left-0 right-0">
                    <p className="text-[10px] text-silver/10 font-bold uppercase tracking-[0.3em]">
                        Powered by OnlyProgram Link
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default DomainResolver;
