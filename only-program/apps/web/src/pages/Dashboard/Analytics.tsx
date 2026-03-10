import { useState, useEffect } from 'react';
import { getAnalyticsOverview, AnalyticsOverview } from '@/services/analytics.service';

// Map: source name → display color
const SOURCE_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok:    '#010101',
  whatsapp:  '#25D366',
  telegram:  '#0088cc',
  twitter:   '#1DA1F2',
  facebook:  '#1877F2',
  youtube:   '#FF0000',
  google:    '#4285F4',
  direct:    '#6366f1',
  other:     '#64748b',
};

const BUTTON_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok:    '#69C9D0',
  onlyfans:  '#00AFF0',
  telegram:  '#0088cc',
  custom:    '#8b5cf6',
  page_view: '#94a3b8',
  other:     '#64748b',
};

const BUTTON_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok:    'TikTok',
  onlyfans:  'OnlyFans',
  telegram:  'Telegram',
  custom:    'Botón customizado',
  page_view: 'Vista de página',
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
);

const COUNTRY_FLAGS: Record<string, string> = {
  CO: '🇨🇴', MX: '🇲🇽', US: '🇺🇸', AR: '🇦🇷', VE: '🇻🇪',
  ES: '🇪🇸', CL: '🇨🇱', PE: '🇵🇪', EC: '🇪🇨', BR: '🇧🇷',
  GT: '🇬🇹', DO: '🇩🇴', HN: '🇭🇳', BO: '🇧🇴', UY: '🇺🇾',
  PY: '🇵🇾', CA: '🇨🇦', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
};

const dateRangeOptions = [
  { value: '7',  label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '365', label: 'Último año' },
];

// Normaliza la respuesta para garantizar que los arrays nunca sean undefined
function normalizeData(raw: any): AnalyticsOverview {
  return {
    totalClicks:    raw?.totalClicks    ?? 0,
    totalUnique:    raw?.totalUnique    ?? 0,
    botsBlocked:    raw?.botsBlocked    ?? 0,
    conversionRate: raw?.conversionRate ?? 0,
    countries: Array.isArray(raw?.countries) ? raw.countries : [],
    sources:   Array.isArray(raw?.sources)   ? raw.sources   : [],
    byMonth:   Array.isArray(raw?.byMonth)   ? raw.byMonth   : [],
    byButton:  Array.isArray(raw?.byButton)  ? raw.byButton  : [],
    links:     Array.isArray(raw?.links)     ? raw.links     : [],
  };
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAnalyticsOverview(parseInt(days))
      .then(raw => setData(normalizeData(raw)))
      .catch(() => setError('No se pudieron cargar las analíticas.'))
      .finally(() => setLoading(false));
  }, [days]);

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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-20 text-center gap-4">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-white font-bold text-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary rounded-xl text-white font-bold text-sm hover:bg-primary/80 transition-all">
          Reintentar
        </button>
      </div>
    );
  }

  const d = data!;
  const maxMonthVal = Math.max(...(d.byMonth.map(m => m.value) ?? [0]), 1);
  const hasData = d.totalClicks > 0 || d.botsBlocked > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Analíticas Globales</h1>
          <p className="text-silver/50 text-sm mt-1">
            {hasData ? 'Rendimiento en tiempo real de tus links activos' : 'Activa un link y compártelo para comenzar a ver analíticas'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={days}
              onChange={e => setDays(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-silver font-bold appearance-none cursor-pointer pr-10 hover:border-white/20 transition-colors focus:outline-none focus:border-blue-500/50"
            >
              {dateRangeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-silver/40 pointer-events-none text-lg">expand_more</span>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Clicks Totales */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-lg">ads_click</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Clicks Totales</span>
          </div>
          <p className={`text-3xl font-black ${hasData ? 'text-white' : 'text-silver/20'}`}>
            {d.totalClicks.toLocaleString()}
          </p>
          <p className="text-xs text-silver/40 mt-1 font-bold">{d.totalUnique.toLocaleString()} únicos</p>
        </div>

        {/* Bots Bloqueados */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-lg">shield</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Bots Bloqueados</span>
          </div>
          <p className={`text-3xl font-black ${d.botsBlocked > 0 ? 'text-white' : 'text-silver/20'}`}>
            {d.botsBlocked.toLocaleString()}
          </p>
          <p className="text-xs text-red-400/70 mt-1 font-bold">
            <span className="material-symbols-outlined text-xs align-text-bottom">security</span> Protección activa
          </p>
        </div>

        {/* Conversión */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-green-400 text-lg">percent</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Conversión</span>
          </div>
          <p className={`text-3xl font-black ${hasData ? 'text-white' : 'text-silver/20'}`}>
            {d.conversionRate}%
          </p>
          <p className="text-xs text-silver/40 mt-1 font-bold">clicks / visitas</p>
        </div>

        {/* Países */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-400 text-lg">public</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-silver/40">Países</span>
          </div>
          {d.countries.length > 0 ? (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {d.countries.slice(0, 5).map(c => (
                <span key={c.code} className="text-2xl" title={c.name}>{COUNTRY_FLAGS[c.code] || '🌍'}</span>
              ))}
              {d.countries.length > 5 && (
                <span className="text-silver/30 text-sm ml-1 font-bold">+{d.countries.length - 5}</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 opacity-40">
              <span className="material-symbols-outlined text-3xl mb-1">public_off</span>
              <span className="text-xs font-bold uppercase tracking-wider">Sin datos</span>
            </div>
          )}
        </div>
      </div>

      {/* CHART: Tendencia mensual */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">Tendencia de Tráfico</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-silver/50 font-bold">Clicks</span>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-48 border-b border-l border-white/5 px-4 pb-1 relative">
          <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between text-[9px] text-silver/20 font-mono -translate-x-3">
            <span>{maxMonthVal}</span>
            <span>{Math.round(maxMonthVal * 0.5)}</span>
            <span>0</span>
          </div>
          {d.byMonth.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end h-36">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-700 min-h-[2px]"
                  style={{ height: `${Math.round((bar.value / maxMonthVal) * 100)}%` }}
                  title={`${bar.label}: ${bar.value} clicks`}
                />
              </div>
              <span className="text-[9px] text-silver/25 font-bold">{bar.label}</span>
            </div>
          ))}
        </div>
        {!hasData && (
          <div className="text-center mt-4">
            <span className="material-symbols-outlined text-4xl text-silver/10">bar_chart</span>
            <p className="text-silver/20 text-sm font-bold mt-1">Sin datos disponibles aún</p>
          </div>
        )}
      </div>

      {/* BOTTOM GRID */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* País */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Tráfico por País</h3>
          <div className="space-y-3">
            {d.countries.length > 0 ? d.countries.map(c => (
              <div key={c.code} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{COUNTRY_FLAGS[c.code] || '🌍'}</span>
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
            )) : (
              <div className="flex flex-col items-center justify-center py-8 opacity-40">
                <span className="material-symbols-outlined text-3xl mb-1">public_off</span>
                <span className="text-xs font-bold uppercase tracking-wider">Sin datos de países</span>
              </div>
            )}
          </div>
        </div>

        {/* Fuentes */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Fuentes de Tráfico</h3>
          {d.sources.length > 0 ? (
            <div className="space-y-4">
              {d.sources.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${SOURCE_COLORS[s.name] || '#64748b'}20` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SOURCE_COLORS[s.name] || '#64748b' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-bold capitalize">{s.name}</span>
                      <span className="text-xs text-silver/50 font-bold">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ backgroundColor: `${SOURCE_COLORS[s.name] || '#64748b'}80`, width: `${s.pct}%` }}
                      />
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

      {/* CLICKS POR BOTÓN */}
      {d.byButton.filter(b => b.type !== 'page_view').length > 0 && (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-5">Clicks por Tipo de Botón</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {d.byButton.filter(b => b.type !== 'page_view').map(b => (
              <div key={b.type} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${BUTTON_COLORS[b.type] || '#64748b'}20` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BUTTON_COLORS[b.type] || '#64748b' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-black text-lg">{b.count.toLocaleString()}</p>
                  <p className="text-silver/40 text-[10px] uppercase tracking-wide font-bold truncate">
                    {BUTTON_LABELS[b.type] || b.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLE: Rendimiento por link */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-white font-bold text-lg">Rendimiento por Link</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Nombre del Link</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Clicks</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Únicos</th>
                <th className="text-center px-6 py-3 text-xs font-bold uppercase tracking-wider text-silver/40">Estado</th>
              </tr>
            </thead>
            <tbody>
              {d.links.length > 0 ? d.links.map(link => (
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
                    <span className="font-bold text-sm text-white">{link.clicks.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-sm text-silver/70">{link.unique_clicks.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {link.is_active ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-silver/30 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-silver/20" />
                        Inactivo
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-silver/30 text-sm font-bold">
                    No hay datos de links aún. Comparte tus links para ver las analíticas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
