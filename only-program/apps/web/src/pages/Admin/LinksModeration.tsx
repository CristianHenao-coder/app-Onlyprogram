import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import LinkPreviewModal from '@/components/LinkPreviewModal';
import { useTranslation } from '@/contexts/I18nContext';
import { API_URL } from '@/services/apiConfig';

interface PendingLink {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  photo: string;
  config: any;
  status: string;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
  buttons_list?: any[];
}

const LinksModeration = () => {
  const { t } = useTranslation();
  const [links, setLinks] = useState<PendingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<PendingLink | null>(null);
  const [targetSlug, setTargetSlug] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [previewLink, setPreviewLink] = useState<PendingLink | null>(null);

  const fetchPendingLinks = async () => {
    try {
      setLoading(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("No session");

      const response = await fetch(`${API_URL}/admin/moderation-links`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await response.json();
      if (json.success) {
        setLinks(json.data || []);
      } else {
        console.error('API Error:', json.error);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
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
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(`${API_URL}/admin/approve-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkId: selectedLink.id, slug: targetSlug })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.pricing.loadError')); // Using generic load error for now or fallback
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
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{t('admin.moderation.title')}</h1>
          <p className="text-silver/40 text-sm font-medium">{t('admin.moderation.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <div key={link.id} className="bg-surface/30 border border-border/50 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{link.title || t('admin.links.untitled')}</h3>
                <div className="mb-4">
                  <p className="text-sm text-primary font-bold">{t('admin.moderation.owner')}: {link.owner_name || link.owner_email || t('admin.links.unknown')}</p>
                  {link.owner_name && link.owner_email && (
                    <p className="text-xs text-gray-500">{link.owner_email}</p>
                  )}
                </div>
                <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-1 rounded uppercase">
                  {t('admin.moderation.pending')}
                </span>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 flex-1 space-y-3">
              <p className="text-xs text-silver/60 mb-2 font-mono">ID: {link.id}</p>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-silver/40 uppercase tracking-widest">{t('admin.moderation.requestedSlug')}</span>
                <p className="text-white font-mono text-sm">{link.slug}</p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-silver/40 uppercase tracking-widest">{t('admin.moderation.design')}</span>
                <p className="text-silver/80 text-xs truncate">{JSON.stringify(link.config).substring(0, 50)}...</p>
              </div>
            </div>

            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => setPreviewLink(link)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                {t('admin.moderation.viewDesign')}
              </button>
              <button
                onClick={() => {
                  setSelectedLink(link);
                  setTargetSlug(link.slug || '');
                }}
                className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold py-3 rounded-xl transition-all"
              >
                {t('admin.moderation.approve')}
              </button>
            </div>
          </div>
        ))}

        {links.length === 0 && !loading && (
          <div className="col-span-full p-20 text-center border border-dashed border-white/10 rounded-3xl">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">check_circle</span>
            <p className="text-silver/40 text-sm font-bold">{t('admin.moderation.noPending')}</p>
          </div>
        )}
      </div>

      {previewLink && (
        <LinkPreviewModal
          config={{
            template: previewLink.config?.template || 'minimal',
            landingMode: previewLink.config?.landingMode || 'circle',
            profileImageSize: previewLink.config?.profileImageSize,
            theme: {
              backgroundType: previewLink.config?.theme?.backgroundType || 'solid',
              backgroundStart: previewLink.config?.theme?.backgroundStart || '#000',
              backgroundEnd: previewLink.config?.theme?.backgroundEnd || '#111',
              pageBorderColor: previewLink.config?.theme?.pageBorderColor || '#333',
              overlayOpacity: previewLink.config?.theme?.overlayOpacity ?? 40,
            },
            profile: {
              title: previewLink.title,
              bio: previewLink.subtitle,
              image: previewLink.photo || previewLink.config?.profilePhotoBase64 || null
            },
            buttons: previewLink.buttons_list?.map((b: any) => ({
              id: b.id,
              title: b.title,
              url: b.url,
              color: b.color,
              text_color: b.text_color,
              border_radius: b.border_radius,
              opacity: b.opacity,
              type: b.type,
              isActive: b.is_active,
              subtitle: b.subtitle
            })) || [],
            socials: []
          }}
          onClose={() => setPreviewLink(null)}
        />
      )}

      {selectedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">{t('admin.moderation.modalTitle')}</h2>
              <button onClick={() => setSelectedLink(null)} className="text-silver/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-silver/60 uppercase mb-2">{t('admin.moderation.assignSlug')}</label>
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
                  {t('admin.moderation.urlDesc')}
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-yellow-500 text-sm">warning</span>
                  <span className="text-xs font-bold text-yellow-500 uppercase">{t('admin.moderation.warningTitle')}</span>
                </div>
                <p className="text-[10px] text-silver/70">
                  {t('admin.moderation.warningDesc')}
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setSelectedLink(null)}
                className="flex-1 px-6 py-4 rounded-xl font-bold text-silver hover:bg-white/5 transition-colors border border-transparent"
                disabled={isApproving}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving || !targetSlug}
                className="flex-1 bg-primary text-black px-6 py-4 rounded-xl font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving && <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>}
                {isApproving ? t('admin.moderation.approving') : t('admin.moderation.approve')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinksModeration;
