import { useState, useEffect } from 'react';
import DomainSearch from '@/components/DomainSearch';
import { supabase } from '@/services/supabase'; // Adjust based on project structure
import { useAuth } from '@/hooks/useAuth';

const Domains = () => {
    const { user } = useAuth();
    const [links, setLinks] = useState<any[]>([]);
    const [selectedLinkId, setSelectedLinkId] = useState<string>('');
    const [loadingLinks, setLoadingLinks] = useState(true);

    useEffect(() => {
        if (user) {
            fetchLinks();
        }
    }, [user]);

    const fetchLinks = async () => {
        try {
            const { data } = await supabase
                .from('smart_links')
                .select('id, title, slug, custom_domain')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (data) {
                setLinks(data);
                if (data.length > 0) setSelectedLinkId(data[0].id);
            }
        } catch (error) {
            console.error("Error fetching links:", error);
        } finally {
            setLoadingLinks(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dominios y Marca</h1>
                    <p className="text-gray-400">
                        Gestiona tus dominios personalizados y asegura tu marca con tecnología Anti-Ban.
                    </p>
                </div>
            </div>

            {/* Selector de Link */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Asociar dominio a:
                </label>
                {loadingLinks ? (
                    <div className="h-10 w-full bg-slate-700 animate-pulse rounded-lg"></div>
                ) : (
                    <div className="space-y-3">
                        <select
                            value={selectedLinkId}
                            onChange={(e) => setSelectedLinkId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            {links.length === 0 && <option value="">No tienes links creados</option>}
                            {links.map(link => (
                                <option key={link.id} value={link.id}>
                                    {link.title || link.slug} {link.custom_domain ? `(Actual: ${link.custom_domain})` : ''}
                                </option>
                            ))}
                        </select>

                        {links.length === 0 && (
                            <button
                                onClick={async () => {
                                    if (!user) return;
                                    const slug = `demo-${Date.now()}`;
                                    const { data: _data, error } = await supabase
                                        .from('smart_links')
                                        .insert({
                                            user_id: user.id,
                                            slug: slug,
                                            title: 'Link Demo',
                                            is_active: true,
                                            buttons: [],
                                            config: {},
                                            expires_at: new Date(Date.now() + 31536000000).toISOString() // +1 year
                                        })
                                        .select()
                                        .single();

                                    if (error) {
                                        console.error("Error creating demo link:", error);
                                        alert("Error creando link demo: " + error.message);
                                    } else {
                                        alert("Link demo creado! Ahora puedes asociar tu dominio.");
                                        fetchLinks();
                                    }
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                                + Crear Link de Prueba Automático
                            </button>
                        )}
                    </div>
                )}
                <p className="text-xs text-slate-500 mt-2">
                    Dominio actual: {links.find(l => l.id === selectedLinkId)?.custom_domain || 'Ninguno'}
                </p>
            </div>

            {/* Búsqueda y Compra */}
            <DomainSearch linkId={selectedLinkId} />

            {/* Lista de Dominios (Placeholder para el futuro) */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Tus Dominios Activos</h3>
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-gray-500 text-2xl">dns</span>
                    </div>
                    <div className="text-gray-400 mb-2">
                        {links.find(l => l.id === selectedLinkId)?.custom_domain ? (
                            <div className="space-y-2">
                                <p>Tienes vinculado: <span className="text-white font-bold">{links.find(l => l.id === selectedLinkId)?.custom_domain}</span></p>
                                <p className="text-sm">
                                    Para ver tu sitio (simulación local):<br />
                                    <a
                                        href={`http://localhost:3000/s/${links.find(l => l.id === selectedLinkId)?.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline"
                                    >
                                        http://localhost:3000/s/{links.find(l => l.id === selectedLinkId)?.slug}
                                    </a>
                                </p>
                            </div>
                        ) : 'No tienes dominios conectados aún.'}
                    </div>
                    <p className="text-sm text-gray-500">
                        Usa el buscador de arriba para registrar tu primer dominio profesional.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Domains;
