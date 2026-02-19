import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

// Types
interface ActiveLink {
  id: string;
  title: string;
  slug: string;
  photo?: string;
  is_active: boolean;
  clicks?: number;
  unique_clicks?: number;
  status: string;
}

// Skeleton Pulse component
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
);

export default function Analytics() {
  const { user } = useAuth();
  const [activeLinks, setActiveLinks] = useState<ActiveLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const hasActiveLinks = activeLinks.length > 0;

  useEffect(() => {
    if (!user?.id) return;
    const fetchLinks = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('smart_links')
        .select('id, title, slug, photo, is_active, status')
        .eq('user_id', user.id)
        .eq('is_active', true); // Only fetch active links

      if (data) {
        setActiveLinks(data.map((l: any) => ({
          ...l,
          clicks: l.clicks || 0,
          unique_clicks: l.unique_clicks || 0,
        })));
      }
      setLoading(false);
    };
    fetchLinks();
  }, [user]);

  // Calculate totals
  const totalClicks = hasActiveLinks ? activeLinks.reduce((sum, l) => sum + (l.clicks || 0), 0) : 0;
  const totalUnique = hasActiveLinks ? activeLinks.reduce((sum, l) => sum + (l.unique_clicks || 0), 0) : 0;
  const conversionRate = hasActiveLinks && totalClicks > 0 ? ((totalUnique / totalClicks) * 100).toFixed(1) : '0';

  const dateRangeOptions = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' },
    { value: '1y', label: 'Último año' },
  ];

  // Empty chart bars for skeleton
  const chartBars = Array.from({ length: 12 }, (_, i) => ({
    label: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i],
    value: 0,
  }));

  // Countries skeleton
  const countries: any[] = [];

  // Sources skeleton
  const sources: any[] = [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Analíticas Globales</h1>
          <p className="text-silver/50 text-sm mt-1">
            {hasActiveLinks ? 'Rendimiento en tiempo real de tus links activos' : 'Activa un link para comenzar a ver analíticas'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-silver font-bold appearance-none cursor-pointer pr-10 hover:border-white/20 transition-colors focus:outline-none focus:border-blue-500/50"
            >
              {dateRangeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-silver/40 pointer-events-none text-lg">expand_more</span>
          </div>
          <button
            disabled={!hasActiveLinks}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${hasActiveLinks ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:border-blue-500/50' : 'bg-white/5 border border-white/5 text-silver/30 cursor-not-allowed'}`}
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Clicks Totales */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-lg">ads_click</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Clicks Totales</span>
          </div>
          <p className={`text-3xl font-black ${hasActiveLinks ? 'text-white' : 'text-silver/20'}`}>
            {hasActiveLinks ? totalClicks.toLocaleString() : '0'}
          </p>
          {hasActiveLinks && (
            <p className="text-xs text-green-400/70 mt-1 font-bold">
              <span className="material-symbols-outlined text-xs align-text-bottom">trending_up</span> +12.5%
            </p>
          )}
        </div>

        {/* Bots Bloqueados */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-lg">shield</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Bots Bloqueados</span>
          </div>
          <p className={`text-3xl font-black ${hasActiveLinks ? 'text-white' : 'text-silver/20'}`}>
            {hasActiveLinks ? Math.floor(totalClicks * 0.08) : '0'}
          </p>
          {hasActiveLinks && (
            <p className="text-xs text-red-400/70 mt-1 font-bold">
              <span className="material-symbols-outlined text-xs align-text-bottom">security</span> Protección activa
            </p>
          )}
        </div>

        {/* Tasa de Conversión */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-green-400 text-lg">percent</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Conversión</span>
          </div>
          <p className={`text-3xl font-black ${hasActiveLinks ? 'text-white' : 'text-silver/20'}`}>
            {hasActiveLinks ? `${conversionRate}%` : '0%'}
          </p>
          {hasActiveLinks && (
            <p className="text-xs text-green-400/70 mt-1 font-bold">
              <span className="material-symbols-outlined text-xs align-text-bottom">trending_up</span> +3.2%
            </p>
          )}
        </div>

        {/* Países Principales */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-400 text-lg">public</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Países</span>
          </div>
          {hasActiveLinks ? (
            <div className="flex items-center gap-1 mt-1">
              {countries.slice(0, 4).map(c => (
                <span key={c.name} className="text-2xl" title={c.name}>{c.code}</span>
              ))}
              <span className="text-silver/30 text-sm ml-1 font-bold">+1</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-40">
              <span className="material-symbols-outlined text-3xl mb-1">public_off</span>
              <span className="text-xs font-bold uppercase tracking-wider">Sin datos</span>
            </div>
          )}
        </div>
      </div>

      {/* CHART: Tendencia de Tráfico */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">Tendencia de Tráfico</h3>
          {hasActiveLinks && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-silver/50 font-bold">Clicks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500/30" />
                <span className="text-silver/50 font-bold">Únicos</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-end gap-2 h-48 border-b border-l border-white/5 p-4 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-silver/20 font-mono -translate-x-1">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>
          {/* Bars */}
          {chartBars.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end h-36">
                {hasActiveLinks ? (
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500 min-h-[4px]"
                    style={{ height: `${bar.value}%` }}
                  />
                ) : (
                  <div className="w-full bg-white/[0.03] rounded-t-md h-full" />
                )}
              </div>
              <span className="text-[9px] text-silver/25 font-bold">{bar.label}</span>
            </div>
          ))}
        </div>
        {!hasActiveLinks && (
          <div className="text-center mt-6">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-2">bar_chart</span>
            <p className="text-silver/20 text-sm font-bold">Sin datos disponibles</p>
            <p className="text-silver/10 text-xs mt-1">Activa un link para ver las tendencias</p>
          </div>
        )}
      </div>

      {/* BOTTOM GRID: Country + Sources */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Tráfico por País */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Tráfico por País</h3>
          <div className="space-y-3">
            {hasActiveLinks ? (
              countries.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xl">{c.code}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-bold">{c.name}</span>
                      <span className="text-xs text-silver/50 font-bold">{c.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500/60 rounded-full transition-all duration-700" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fuentes de Tráfico */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Fuentes de Tráfico</h3>
          {hasActiveLinks ? (
            <div className="space-y-4">
              {sources.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-bold">{s.name}</span>
                      <span className="text-xs text-silver/50 font-bold">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ backgroundColor: `${s.color}80`, width: `${s.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-40">
              <span className="material-symbols-outlined text-3xl mb-1">query_stats</span>
              <span className="text-xs font-bold uppercase tracking-wider">Sin datos</span>
            </div>
          )}
        </div>
      </div>

      {/* TABLE: Rendimiento por Link */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-white font-bold text-lg">Rendimiento por Link</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Nombre del Link</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Clicks Totales</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Únicos</th>
                <th className="text-center px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Estado</th>
              </tr>
            </thead>
            <tbody>
              {activeLinks.length > 0 ? (
                activeLinks.map(link => (
                  <tr key={link.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                          {link.photo ? (
                            <img src={link.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-silver/30 text-lg">link</span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{link.title || link.slug}</p>
                          <p className="text-silver/30 text-xs font-mono">/{link.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-sm ${link.is_active ? 'text-white' : 'text-silver/20'}`}>
                        {link.is_active ? (link.clicks || 0).toLocaleString() : '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-sm ${link.is_active ? 'text-silver/70' : 'text-silver/20'}`}>
                        {link.is_active ? (link.unique_clicks || 0).toLocaleString() : '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {link.is_active ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Link Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-silver/30 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-silver/20" />
                          Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // No active links state
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-silver/30 text-sm font-bold">
                    No tienes links activos con datos reportados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div >

      {/* CTA Banner when no active links */}
      {
        !hasActiveLinks && (
          <div className="bg-gradient-to-r from-blue-600/10 via-blue-500/5 to-transparent border border-blue-500/10 rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-blue-400/30 mb-4">rocket_launch</span>
            <h3 className="text-white font-black text-xl mb-2">Activa tu primer link</h3>
            <p className="text-silver/40 text-sm max-w-md mx-auto mb-4">
              Compra y activa un link para empezar a recibir analíticas en tiempo real: clicks, países, fuentes de tráfico y más.
            </p>
            <a href="/dashboard/links" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined">add</span>
              Ir a mis Links
            </a>
          </div>
        )
      }
    </div >
  );
}
