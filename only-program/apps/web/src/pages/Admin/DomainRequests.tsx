import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useTranslation } from '@/contexts/I18nContext';
import { API_URL } from '@/services/apiConfig';
import toast from 'react-hot-toast';

interface DomainRequest {
  id: string;
  slug: string;
  title: string;
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

const StatusBadge = ({ status }: { status: string | null }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pendiente', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    active: { label: 'Activo', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    failed: { label: 'Fallido', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    none: { label: 'Sin dominio', cls: 'bg-white/5 text-silver/30 border-white/10' },
  };
  const effectiveStatus = status || 'none';
  const { label, cls } = map[effectiveStatus] || { label: effectiveStatus, cls: 'bg-white/10 text-white/40' };
  return (
    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
};

const DomainRequests = () => {
  const { language } = useTranslation();
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dnsResults, setDnsResults] = useState<Record<string, DnsTestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [acting, setActing] = useState<Record<string, boolean>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const [domainInputs, setDomainInputs] = useState<Record<string, string>>({});
  const [rejectModal, setRejectModal] = useState<{ linkId: string; domain: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'failed' | 'none'>('all');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/admin/domain-requests`, { headers });
      const json = await res.json();
      const data: DomainRequest[] = json.data || [];
      setRequests(data);
      // Pre-fill domain inputs with existing values
      const inputs: Record<string, string> = {};
      data.forEach(r => { inputs[r.id] = r.custom_domain || ''; });
      setDomainInputs(inputs);
    } catch {
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAssignDomain = async (linkId: string) => {
    const domain = (domainInputs[linkId] ?? '').trim();
    setAssigning(p => ({ ...p, [linkId]: true }));
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/admin/domain-requests/${linkId}/assign-domain`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_domain: domain }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(json.message || (domain ? `Dominio: ${domain}` : 'Dominio eliminado'));
      fetchRequests();
    } catch (e: any) {
      toast.error(e.message || 'Error al asignar dominio');
    } finally {
      setAssigning(p => ({ ...p, [linkId]: false }));
    }
  };

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
      toast.error('Error al probar DNS');
    } finally {
      setTesting(p => ({ ...p, [linkId]: false }));
    }
  };

  const handleActivate = async (linkId: string) => {
    setActing(p => ({ ...p, [linkId]: true }));
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/admin/domain-requests/${linkId}/activate`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error();
      toast.success('Dominio activado correctamente');
      fetchRequests();
    } catch {
      toast.error('Error al activar dominio');
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
      toast.success('Solicitud rechazada');
      setRejectModal(null);
      setRejectNote('');
      fetchRequests();
    } catch {
      toast.error('Error al rechazar solicitud');
    } finally {
      setActing(p => ({ ...p, [rejectModal!.linkId]: false }));
    }
  };

  const filtered = filter === 'all'
    ? requests
    : filter === 'none'
      ? requests.filter(r => !r.custom_domain || r.domain_status === null)
      : requests.filter(r => (r.domain_status || 'none') === filter);

  const counts = {
    pending: requests.filter(r => r.domain_status === 'pending').length,
    active: requests.filter(r => r.domain_status === 'active').length,
    failed: requests.filter(r => r.domain_status === 'failed').length,
    none: requests.filter(r => !r.domain_status || r.domain_status === null).length,
    total: requests.length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-1">Dominios</h1>
          <p className="text-silver/40 text-sm font-medium">Gestiona y asigna dominios a los links activos.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-silver hover:text-white transition-all text-sm font-bold"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Actualizar
        </button>
      </div>

      {/* DNS Config Reference */}
      <div className="bg-surface/30 border border-border/50 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">dns</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Configuración DNS Requerida</h2>
              <p className="text-silver/40 text-xs font-medium">Valores que el usuario debe configurar en su proveedor de dominio.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { tipo: 'A', host: '@', valor: '147.93.131.4', ttl: '1800' },
              { tipo: 'CNAME', host: 'www', valor: 'onlyprogramlink', ttl: '1800' },
            ].map((row, i) => (
              <div key={i} className="col-span-2 grid grid-cols-4 gap-3">
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-silver/40 font-black uppercase mb-1">Tipo</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}`}>{row.tipo}</span>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-silver/40 font-black uppercase mb-1">Host</p>
                  <p className="text-white font-mono text-sm font-bold">{row.host}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 cursor-pointer group/copy" onClick={() => { navigator.clipboard.writeText(row.valor); toast.success('Copiado'); }}>
                  <p className="text-[9px] text-silver/40 font-black uppercase mb-1 flex justify-between">
                    Valor
                    <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/copy:opacity-100 transition-opacity">content_copy</span>
                  </p>
                  <p className="text-primary font-mono text-sm font-bold">{row.valor}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-silver/40 font-black uppercase mb-1">TTL</p>
                  <p className="text-white font-mono text-sm font-bold">{row.ttl}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sin dominio', count: counts.none, color: 'text-silver/40', icon: 'link_off' },
          { label: 'Pendiente', count: counts.pending, color: 'text-yellow-400', icon: 'schedule' },
          { label: 'Activo', count: counts.active, color: 'text-emerald-400', icon: 'check_circle' },
          { label: 'Fallido', count: counts.failed, color: 'text-red-400', icon: 'cancel' },
        ].map(s => (
          <div key={s.label} className="bg-surface/30 border border-border/50 rounded-2xl p-5 flex items-center gap-4">
            <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
              <p className="text-silver/40 text-xs font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'none', 'pending', 'active', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${filter === f
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-white/5 text-silver/50 border-white/5 hover:text-white hover:bg-white/10'
              }`}
          >
            {f === 'all' ? `Todos (${counts.total})` : f === 'none' ? `Sin dominio (${counts.none})` : f === 'pending' ? `Pendiente (${counts.pending})` : f === 'active' ? `Activo (${counts.active})` : `Fallido (${counts.failed})`}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-spin material-symbols-outlined text-3xl text-primary">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-20 text-center border border-dashed border-white/10 rounded-3xl">
          <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">dns</span>
          <p className="text-silver/40 text-sm font-bold">No hay links en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(req => {
            const dns = dnsResults[req.id];
            return (
              <div key={req.id} className="bg-surface/30 border border-border/50 rounded-3xl p-6 flex flex-col gap-4">

                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-lg truncate">{req.title || 'Sin título'}</h3>
                    <p className="text-sm text-silver/60 truncate">{req.profiles?.full_name}</p>
                    {req.user_email && (
                      <p className="text-xs text-silver/40 truncate font-mono mt-0.5">{req.user_email}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={req.domain_status} />
                    <span className="text-[9px] text-silver/30 font-mono">slug: {req.slug || '—'}</span>
                  </div>
                </div>

                {/* Assign domain input */}
                <div className="bg-black/20 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] text-silver/40 uppercase tracking-widest font-black">Dominio asignado por admin</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={domainInputs[req.id] ?? (req.custom_domain || '')}
                        onChange={e => setDomainInputs(p => ({ ...p, [req.id]: e.target.value }))}
                        placeholder="ej: misitio.com"
                        className="w-full bg-surface/50 border border-white/10 rounded-xl px-3 py-2 pr-8 text-sm text-white font-mono placeholder:text-silver/20 outline-none focus:border-primary/50"
                      />
                      {(domainInputs[req.id] ?? req.custom_domain) && (
                        <button
                          onClick={() => setDomainInputs(p => ({ ...p, [req.id]: '' }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-silver/30 hover:text-red-400 transition-colors"
                          title="Limpiar dominio"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleAssignDomain(req.id)}
                      disabled={assigning[req.id]}
                      className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-black transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
                    >
                      {assigning[req.id]
                        ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                        : <span className="material-symbols-outlined text-sm">save</span>}
                      Guardar
                    </button>
                  </div>
                  {req.domain_requested_at && (
                    <p className="text-[10px] text-silver/30">
                      Solicitado: {new Date(req.domain_requested_at).toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {req.domain_notes && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-xs text-red-400">{req.domain_notes}</p>
                    </div>
                  )}
                </div>

                {/* DNS test result */}
                {dns && (
                  <div className={`rounded-xl p-3 text-xs font-medium border ${dns.configured
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : dns.message.includes('⚠️')
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                    }`}>
                    {dns.message}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto flex-wrap">
                  <button
                    onClick={() => handleTestDns(req.id)}
                    disabled={testing[req.id] || !req.custom_domain}
                    className="flex items-center gap-2 flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-silver hover:text-white text-xs font-bold transition-all disabled:opacity-30"
                    title={!req.custom_domain ? 'Asigna un dominio primero' : ''}
                  >
                    {testing[req.id]
                      ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                      : <span className="material-symbols-outlined text-sm">dns</span>}
                    Probar DNS
                  </button>

                  {req.domain_status !== 'active' && (
                    <button
                      onClick={() => handleActivate(req.id)}
                      disabled={acting[req.id] || !req.custom_domain}
                      className="flex items-center gap-2 flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition-all disabled:opacity-30"
                      title={!req.custom_domain ? 'Asigna un dominio primero' : ''}
                    >
                      {acting[req.id]
                        ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                        : <span className="material-symbols-outlined text-sm">check_circle</span>}
                      Activar
                    </button>
                  )}

                  {req.domain_status !== 'failed' && (
                    <button
                      onClick={() => setRejectModal({ linkId: req.id, domain: req.custom_domain || '' })}
                      disabled={acting[req.id]}
                      className="flex items-center gap-2 flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Rechazar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Rechazar Solicitud</h2>
              <button onClick={() => { setRejectModal(null); setRejectNote(''); }} className="text-silver/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-silver/60">Dominio: <span className="text-primary font-mono">{rejectModal.domain || '(sin dominio)'}</span></p>
            <div>
              <label className="block text-xs font-bold text-silver/60 uppercase mb-2">Nota para el usuario (opcional)</label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                rows={3}
                placeholder="Ej: El DNS aún no apunta al servidor..."
                className="w-full bg-surface/30 border border-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-silver/20 outline-none focus:border-red-400/50 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectNote(''); }}
                className="flex-1 py-3 rounded-xl font-bold text-silver hover:bg-white/5 border border-transparent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={acting[rejectModal.linkId]}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 px-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {acting[rejectModal.linkId]
                  ? <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                  : null}
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainRequests;
