import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useTranslation } from '@/contexts/I18nContext';
import { API_URL } from '@/services/apiConfig';
import toast from 'react-hot-toast';
import LinkPreviewModal from '@/components/LinkPreviewModal';

interface DomainRequest {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  photo: string;
  config: any;
  smart_link_buttons?: any[];
  custom_domain: string | null;
  domain_status: 'pending' | 'active' | 'failed' | null;
  domain_reservation_type: 'buy_new' | 'connect_own' | null;
  domain_requested_at: string | null;
  domain_activated_at: string | null;
  domain_notes: string | null;
  is_active: boolean;
  status: string;
  user_email: string | null;
  profiles: { full_name: string };
  created_at: string;
}

interface DnsTestResult {
  configured: boolean;
  message: string;
  addresses?: string[];
}

async function getAuthHeader() {
  const session = (await supabase.auth.getSession()).data.session;
  return { Authorization: `Bearer ${session?.access_token}` };
}

const StatusBadge = ({ isDomain, status }: { isDomain: boolean, status: string | null }) => {
  const { t } = useTranslation();
  if (!isDomain) {
    if (status === 'pending') {
      return <span className="text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider bg-orange-500/20 text-orange-400 border-orange-500/30">Requiere Moderación</span>;
    }
    return null;
  }

  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Dominio Pendiente', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    active: { label: t('admin.domains.statusActive'), cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    failed: { label: t('admin.domains.statusRejected'), cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    none: { label: t('admin.domains.noLink'), cls: 'bg-white/5 text-silver/30 border-white/10' },
  };
  const effectiveStatus = status || 'none';
  const { label, cls } = map[effectiveStatus] || { label: effectiveStatus, cls: 'bg-white/10 text-white/40' };

  if (effectiveStatus === 'none') return null;

  return (
    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
};

const DomainRequests = () => {
  const { t, language } = useTranslation();
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dnsResults, setDnsResults] = useState<Record<string, DnsTestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [acting, setActing] = useState<Record<string, boolean>>({});
  const [rejectModal, setRejectModal] = useState<{ linkId: string; domain: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Per-link editable domain inputs (admin can set/change domain before activating)
  const [editDomains, setEditDomains] = useState<Record<string, string>>({});

  // Moderation state
  const [selectedLinkForApprove, setSelectedLinkForApprove] = useState<DomainRequest | null>(null);
  const [targetSlug, setTargetSlug] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [previewLink, setPreviewLink] = useState<DomainRequest | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/admin/domain-requests`, { headers });
      const json = await res.json();
      setRequests(json.data || []);
    } catch {
      toast.error(t('admin.pricing.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleTestDns = async (linkId: string) => {
    setTesting(p => ({ ...p, [linkId]: true }));
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/admin/domain-requests/${linkId}/test`, {
        method: 'POST', headers,
      });
      const json = await res.json();
      setDnsResults(p => ({ ...p, [linkId]: json }));
    } catch {
      toast.error(t('admin.domains.testDnsError'));
    } finally {
      setTesting(p => ({ ...p, [linkId]: false }));
    }
  };

  const handleActivate = async (linkId: string, domainOverride?: string) => {
    setActing(p => ({ ...p, [linkId]: true }));
    try {
      const headers = await getAuthHeader();
      const body: any = {};
      if (domainOverride) body.custom_domain = domainOverride;
      const res = await fetch(`${API_URL}/admin/domain-requests/${linkId}/activate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.domains.activateSuccess'));
      fetchRequests();
    } catch {
      toast.error(t('admin.domains.activateError'));
    } finally {
      setActing(p => ({ ...p, [linkId]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActing(p => ({ ...p, [rejectModal.linkId]: true }));
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/admin/domain-requests/${rejectModal.linkId}/reject`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rejectNote || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.domains.rejectSuccess'));
      setRejectModal(null);
      setRejectNote('');
      fetchRequests();
    } catch {
      toast.error(t('admin.domains.rejectError'));
    } finally {
      setActing(p => ({ ...p, [rejectModal.linkId]: false }));
    }
  };

  const handleApproveModeration = async () => {
    if (!selectedLinkForApprove || !targetSlug) return;
    setIsApproving(true);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/admin/approve-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ linkId: selectedLinkForApprove.id, slug: targetSlug })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.pricing.loadError'));
      }

      toast.success("Link Aprobado Exitosamente");
      setSelectedLinkForApprove(null);
      setTargetSlug('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-1">Gestión de Dominios</h1>
          <p className="text-silver/40 text-sm font-medium">Asigna y activa dominios a dominios comprados.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-silver hover:text-white transition-all text-sm font-bold"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          {t('common.refresh')}
        </button>
      </div>

      {/* DNS Configuration Reference */}
      <div className="bg-surface/30 border border-border/50 rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32"></div>

        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">dns</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('admin.domains.dnsConfigTitle')}</h2>
              <p className="text-silver/40 text-xs font-medium">{t('admin.domains.dnsConfigSubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-4">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5 hover:border-primary/20 transition-colors">
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5">Tipo</p>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">Registro A</span>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5">Tipo</p>
                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">CNAME</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5">Nombre (Host)</p>
                <p className="text-white font-mono text-sm font-bold">@</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5">Nombre (Host)</p>
                <p className="text-white font-mono text-sm font-bold">www</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5 group/copy relative cursor-pointer" onClick={() => { navigator.clipboard.writeText('147.93.131.4'); toast.success(t('common.copied')); }}>
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5 flex justify-between">
                  {t('admin.domains.value')}
                  <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/copy:opacity-100 transition-opacity">content_copy</span>
                </p>
                <p className="text-primary font-mono text-sm font-bold">147.93.131.4</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5 group/copy relative cursor-pointer" onClick={() => { navigator.clipboard.writeText('onlyprogramlink'); toast.success(t('common.copied')); }}>
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5 flex justify-between">
                  {t('admin.domains.value')}
                  <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/copy:opacity-100 transition-opacity">content_copy</span>
                </p>
                <p className="text-white font-mono text-sm font-bold">onlyprogramlink</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5">TTL</p>
                <p className="text-white font-mono text-sm font-bold">1/2 Hora (1800)</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest mb-1.5">TTL</p>
                <p className="text-white font-mono text-sm font-bold">1/2 Hora (1800)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Cards */}
      {
        loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="animate-spin material-symbols-outlined text-3xl text-primary">progress_activity</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center border border-dashed border-white/10 rounded-3xl">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">dns</span>
            <p className="text-silver/40 text-sm font-bold">No hay link para activar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map(req => {
              const dns = dnsResults[req.id];
              const needsModeration = req.status === 'pending';
              const hasDomainRequest = req.domain_status != null;

              return (
                <div key={req.id} className={`bg-surface/30 border rounded-3xl p-6 flex flex-col gap-4 ${needsModeration ? 'border-orange-500/30' : 'border-border/50'}`}>
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">{req.title || t('admin.links.untitled')}</h3>
                      <p className="text-sm text-silver/60 truncate">{req.profiles?.full_name}</p>
                      {req.user_email && (
                        <p className="text-xs text-silver/40 truncate font-mono mt-0.5">{req.user_email}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge isDomain={false} status={req.status} />
                      {hasDomainRequest && <StatusBadge isDomain={true} status={req.domain_status} />}

                      {req.domain_reservation_type && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${req.domain_reservation_type === 'buy_new'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                          {req.domain_reservation_type === 'buy_new' ? `🛒 ${t('admin.domains.buyNew')}` : `🔗 ${t('admin.domains.connectOwn')}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Container */}
                  <div className="bg-black/20 rounded-2xl p-4 space-y-4">

                    {/* Slug / Base Link Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-silver/40 uppercase tracking-widest block mb-1">Slug Base</span>
                        <p className="text-white/80 font-mono text-xs">{req.slug || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-silver/40 uppercase tracking-widest block mb-1">Creado</span>
                        <p className="text-white/60 text-xs">
                          {new Date(req.created_at).toLocaleDateString(language === 'es' ? 'es-CO' : language === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Domain Info (If applicable) */}
                    {hasDomainRequest && (
                      <div className="pt-3 border-t border-white/5">
                        <span className="text-[10px] text-silver/40 uppercase tracking-widest block mb-1">{t('admin.domains.domain')} Solicitado</span>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editDomains[req.id] ?? (req.custom_domain || '')}
                            onChange={(e) => setEditDomains(p => ({ ...p, [req.id]: e.target.value }))}
                            placeholder="micliente.com"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-mono text-sm text-primary placeholder:text-silver/20 focus:outline-none focus:border-primary/50 transition-all"
                          />
                          {(editDomains[req.id] ?? req.custom_domain) && (
                            <a
                              href={`https://${editDomains[req.id] ?? req.custom_domain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-silver/40 hover:text-primary transition-colors"
                              title="Ver landing"
                            >
                              <span className="material-symbols-outlined text-base">open_in_new</span>
                            </a>
                          )}
                        </div>

                        {req.domain_notes && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3">
                            <p className="text-xs text-red-400">{req.domain_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* DNS test result */}
                  {dns && hasDomainRequest && (
                    <div className={`rounded-xl p-3 text-xs font-medium border ${dns.configured
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : dns.message.includes('⚠️')
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-300'
                      }`}>
                      {dns.message}
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="flex flex-col gap-3 mt-auto border-t border-white/5 pt-4">
                    {/* Top Bar: Preview */}
                    <div className="flex gap-2 bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl">
                      <button
                        onClick={() => setPreviewLink(req)}
                        className="flex-1 text-blue-400 font-bold py-2 px-3 rounded-lg hover:bg-blue-500/20 transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span> Previsualizar Diseño
                      </button>
                    </div>

                    {/* Domain Actions */}
                    {hasDomainRequest && (
                      <div className="flex gap-2 flex-wrap min-h-12 items-stretch">
                        <button
                          onClick={() => handleTestDns(req.id)}
                          disabled={testing[req.id]}
                          className="flex items-center justify-center gap-2 flex-1 min-w-[120px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-silver hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {testing[req.id]
                            ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                            : <span className="material-symbols-outlined text-sm">dns</span>}
                          {t('admin.domains.testDns')}
                        </button>

                        <button
                          onClick={() => {
                            const domain = editDomains[req.id] ?? req.custom_domain ?? '';
                            handleActivate(req.id, domain || undefined);
                          }}
                          disabled={acting[req.id]}
                          className="flex items-center justify-center gap-2 flex-1 min-w-[120px] rounded-xl bg-blue-500 hover:bg-blue-600 text-white border border-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          {acting[req.id]
                            ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                            : <span className="material-symbols-outlined text-sm">bolt</span>}
                          Activar Servicio
                        </button>

                        {req.domain_status !== 'failed' && (
                          <button
                            onClick={() => setRejectModal({ linkId: req.id, domain: req.custom_domain || '' })}
                            disabled={acting[req.id]}
                            className="flex items-center justify-center gap-2 flex-[0.3] min-w-[50px] rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )
      }

      {/* Link Preview Modal */}
      {
        previewLink && (
          <div style={{ zIndex: 9999 }}>
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
                buttons: previewLink.smart_link_buttons?.map((b: any) => ({
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
          </div>
        )
      }

      {/* Aprove Moderation Modal */}
      {
        selectedLinkForApprove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">Aprobar Publicación</h2>
                <button onClick={() => setSelectedLinkForApprove(null)} className="text-silver/40 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-silver/60 uppercase mb-2">Asignar Link Definitivo</label>
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
                    Si este usuario tiene una URL maliciosa o intentando robar una URL oficial, puedes cambiársela aquí antes de admitirlo.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setSelectedLinkForApprove(null)}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-silver hover:bg-white/5 transition-colors border border-transparent"
                  disabled={isApproving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApproveModeration}
                  disabled={isApproving || !targetSlug}
                  className="flex-1 bg-primary text-black px-6 py-4 rounded-xl font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApproving && <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>}
                  {isApproving ? 'Aprobando...' : 'Aprobar Link'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Reject Domain Modal */}
      {
        rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">{t('admin.domains.rejectModalTitle')}</h2>
                <button onClick={() => { setRejectModal(null); setRejectNote(''); }} className="text-silver/40 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-silver/60">{t('admin.domains.domain')}: <span className="text-primary font-mono">{rejectModal.domain}</span></p>
              <div>
                <label className="block text-xs font-bold text-silver/60 uppercase mb-2">{t('admin.domains.noteLabel')}</label>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder={t('admin.domains.notePlaceholder')}
                  className="w-full bg-surface/30 border border-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-silver/20 outline-none focus:border-red-400/50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectNote(''); }}
                  className="flex-1 py-3 rounded-xl font-bold text-silver hover:bg-white/5 border border-transparent transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleReject}
                  disabled={acting[rejectModal.linkId]}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 px-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {acting[rejectModal.linkId]
                    ? <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                    : null}
                  {t('admin.domains.confirmReject')}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default DomainRequests;
