import { useEffect, useState } from 'react';
import { auditService, AuditLog } from '@/services/auditService';
import { useTranslation } from '@/contexts/I18nContext';

const AuditLogs = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = search 
        ? await auditService.searchLogs(search)
        : await auditService.getRecentLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{t('admin.audit.title')}</h1>
          <p className="text-silver/40 text-sm font-medium">{t('admin.audit.subtitle')}</p>
        </div>
        <div className="relative group max-w-sm w-full">
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-silver/20 group-hover:text-primary transition-colors">search</span>
           <input 
            type="text" 
            placeholder={t('admin.audit.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/30 border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
           />
        </div>
      </div>

      <div className="bg-surface/30 border border-border/50 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-white/5 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.audit.table.date')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.audit.table.admin')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.audit.table.action')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.audit.table.resource')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.audit.table.details')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-silver/40 text-sm font-bold">{t('common.loading')}</p>
                  </div>
                </td>
              </tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{new Date(log.created_at).toLocaleDateString()}</span>
                    <span className="text-[10px] text-silver/40 font-mono italic">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-silver/80">{log.admin_email}</span>
                    <span className="text-[10px] text-silver/40 font-mono truncate max-w-[150px]">{log.admin_id}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    log.action === 'DELETE' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    log.action === 'UPDATE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                    log.action === 'CREATE' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                    'bg-purple-500/10 border-purple-500/20 text-purple-400'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{log.resource_type}</span>
                    <span className="text-[10px] text-silver/40 font-mono truncate max-w-[120px]">{log.resource_id}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="max-w-[300px]">
                      <p className="text-[11px] text-silver/60 font-medium leading-relaxed italic">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </p>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && logs.length === 0 && (
          <div className="p-20 text-center">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">history</span>
            <p className="text-silver/40 text-sm font-bold">{t('admin.audit.table.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
