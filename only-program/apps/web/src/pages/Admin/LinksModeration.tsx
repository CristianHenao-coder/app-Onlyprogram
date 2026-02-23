import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

import LinkPreviewModal from '@/components/LinkPreviewModal';

interface PendingLink {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: string;
  config: any;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const LinksModeration = () => {
  // const { t } = useTranslation();
  const [links, setLinks] = useState<PendingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<PendingLink | null>(null);
  const [targetSlug, setTargetSlug] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [previewLink, setPreviewLink] = useState<PendingLink | null>(null);


  const fetchPendingLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('smart_links')
        .select(`
          *,
          profiles!smart_links_user_id_fkey (
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLinks();
  }, []);

  const handleApprove = async () => {
    if (!selectedLink || !targetSlug) return;
    setIsApproving(true);
    try {
      // Using backend route
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/approve-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ linkId: selectedLink.id, slug: targetSlug })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al aprobar');
      }

      setSelectedLink(null);
      setTargetSlug('');
      fetchPendingLinks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Moderación de Links</h1>
          <p className="text-silver/40 text-sm font-medium">Revisa y aprueba los links pagados pendientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <div key={link.id} className="bg-surface/30 border border-border/50 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{link.title || 'Sin Título'}</h3>
                <p className="text-sm text-silver/60">{link.profiles?.full_name}</p>
              </div>
              <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-1 rounded uppercase">
                Pendiente
              </span>
            </div>

            <div className="bg-black/20 rounded-xl p-4 flex-1 space-y-3">
               <p className="text-xs text-silver/60 mb-2 font-mono">ID: {link.id}</p>
               
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] text-silver/40 uppercase tracking-widest">Slug Solicitado</span>
                 <p className="text-white font-mono text-sm">{link.slug}</p>
               </div>

               <div className="flex flex-col gap-1">
                 <span className="text-[10px] text-silver/40 uppercase tracking-widest">Diseño</span>
                 <p className="text-silver/80 text-xs truncate">{JSON.stringify(link.config).substring(0, 50)}...</p>
               </div>
            </div>

            <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => setPreviewLink(link)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                Ver Diseño
              </button>
              <button 
                onClick={() => {
                  setSelectedLink(link);
                  setTargetSlug(link.slug || '');
                }}
                className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold py-3 rounded-xl transition-all"
              >
                Aprobar
              </button>
            </div>
          </div>
        ))}
        
        {links.length === 0 && !loading && (
          <div className="col-span-full p-20 text-center border border-dashed border-white/10 rounded-3xl">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">check_circle</span>
            <p className="text-silver/40 text-sm font-bold">No hay links pendientes de aprobación.</p>
          </div>
        )}
      </div>

      {previewLink && (
        <LinkPreviewModal 
          config={{
            theme: previewLink.config?.theme || 'custom',
            profile: {
              title: previewLink.title,
              bio: previewLink.subtitle,
              image: previewLink.config?.profilePhotoBase64 || null
            },
            buttons: previewLink.config?.blocks?.filter((b: any) => b.type === 'button').map((b: any) => ({
              id: b.id,
              title: b.title,
              url: b.url
            })) || [],
            socials: [] // Add if available in config
          }}
          onClose={() => setPreviewLink(null)}
        />
      )}

      {selectedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">Aprobar Link</h2>
              <button onClick={() => setSelectedLink(null)} className="text-silver/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-silver/60 uppercase mb-2">Asignar URL Final (Slug)</label>
                <div className="flex items-center bg-surface/30 border border-border/50 rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                   <span className="text-silver/40 text-sm mr-1">onlyprogram.com/</span>
                   <input 
                    type="text" 
                    value={targetSlug}
                    onChange={(e) => setTargetSlug(e.target.value)}
                    className="bg-transparent border-none outline-none text-white font-mono text-sm w-full placeholder:text-silver/20"
                    placeholder="mi-link"
                   />
                </div>
                <p className="text-[10px] text-silver/40 mt-2">
                  Esta será la URL pública del link una vez aprobado.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-yellow-500 text-sm">warning</span>
                  <span className="text-xs font-bold text-yellow-500 uppercase">Confirmación</span>
                </div>
                <p className="text-[10px] text-silver/70">
                  Al aprobar, el link se volverá público inmediatamente y el usuario podrá ver sus estadísticas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setSelectedLink(null)}
                className="flex-1 px-6 py-4 rounded-xl font-bold text-silver hover:bg-white/5 transition-colors border border-transparent"
                disabled={isApproving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleApprove}
                disabled={isApproving || !targetSlug}
                className="flex-1 bg-primary text-black px-6 py-4 rounded-xl font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving && <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>}
                {isApproving ? 'Aprobando...' : 'Aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinksModeration;
