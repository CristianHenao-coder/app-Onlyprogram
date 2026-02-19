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
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Domain Not Configured</h1>
                <p className="text-gray-400">This custom domain is not linked to any profile yet.</p>
            </div>
        );
    }

    return <>{children}</>;
};

export default DomainResolver;
