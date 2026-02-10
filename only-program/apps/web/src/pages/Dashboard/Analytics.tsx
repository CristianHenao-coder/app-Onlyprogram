import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Social Network Logos (inline SVG for white versions)
const SocialLogos = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  generic: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  )
};

interface LinkPage {
  id: string;
  name: string;
  status: 'active' | 'draft';
  buttons: ButtonLink[];
  profileImage?: string;
  theme: {
    template: 'minimal' | 'split' | 'full';
    borderColor: string;
    backgroundType: 'color' | 'gradient';
    backgroundStart: string;
    backgroundEnd: string;
  };
}

interface ButtonLink {
  id: string;
  type: 'instagram' | 'tiktok' | 'telegram' | 'whatsapp' | 'twitter' | 'facebook' | 'generic';
  text: string;
  url: string;
  color: string;
  radius: number;
  font: string;
  rotatorActive?: boolean;
  rotatorLinks?: string[];
  clicks?: number; // Simulated clicks
}

export default function Analytics() {
  const [pages, setPages] = useState<LinkPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    // Load pages from localStorage
    const stored = localStorage.getItem('onlyprogram_pages');
    if (stored) {
      const loadedPages: LinkPage[] = JSON.parse(stored);
      const activePages = loadedPages.filter(p => p.status === 'active');

      // Simulate clicks for each button
      const pagesWithClicks = activePages.map(page => ({
        ...page,
        buttons: page.buttons.map(btn => ({
          ...btn,
          clicks: Math.floor(Math.random() * 5000) + 500 // Random clicks between 500-5500
        }))
      }));

      setPages(pagesWithClicks);
      if (pagesWithClicks.length > 0) {
        setSelectedPageId(pagesWithClicks[0].id);
      }
    }
  }, []);

  const selectedPage = pages.find(p => p.id === selectedPageId);

  // Calculate metrics for selected page
  const getMetrics = () => {
    if (!selectedPage) return null;

    const totalClicks = selectedPage.buttons.reduce((sum, btn) => sum + (btn.clicks || 0), 0);
    const sortedButtons = [...selectedPage.buttons].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

    // Simulate weekly distribution
    const weeklyTraffic = Array.from({ length: 7 }, (_, i) => ({
      day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
      clicks: Math.floor(totalClicks / 7 * (0.8 + Math.random() * 0.4))
    }));

    // Group by social platform
    const socialTraffic = selectedPage.buttons.reduce((acc, btn) => {
      const existing = acc.find(s => s.platform === btn.type);
      if (existing) {
        existing.clicks += btn.clicks || 0;
      } else {
        acc.push({
          platform: btn.type,
          clicks: btn.clicks || 0
        });
      }
      return acc;
    }, [] as { platform: string; clicks: number }[]);

    return {
      totalClicks,
      sortedButtons,
      weeklyTraffic,
      socialTraffic: socialTraffic.sort((a, b) => b.clicks - a.clicks),
      topOrigins: [
        { country: 'Estados Unidos', flag: '🇺🇸', percentage: 45 },
        { country: 'México', flag: '🇲🇽', percentage: 22 },
        { country: 'Colombia', flag: '🇨🇴', percentage: 18 },
        { country: 'Argentina', flag: '🇦🇷', percentage: 15 }
      ]
    };
  };

  const metrics = getMetrics();

  const getSocialIcon = (type: string) => {
    return SocialLogos[type as keyof typeof SocialLogos] || SocialLogos.generic;
  };

  const getSocialColor = (type: string) => {
    const colors: Record<string, string> = {
      instagram: '#E1306C',
      tiktok: '#000000',
      telegram: '#0088cc',
      whatsapp: '#25D366',
      twitter: '#1DA1F2',
      facebook: '#1877F2',
      generic: '#666666'
    };
    return colors[type] || '#666666';
  };

  // Demo data for when there are no active links
  const getDemoMetrics = () => {
    const demoButtons = [
      { id: '1', type: 'instagram', text: 'Instagram', clicks: 3421, color: '#E1306C' },
      { id: '2', type: 'telegram', text: 'Telegram', clicks: 2890, color: '#0088cc' },
      { id: '3', type: 'tiktok', text: 'TikTok', clicks: 2156, color: '#000000' },
      { id: '4', type: 'whatsapp', text: 'WhatsApp', clicks: 1834, color: '#25D366' },
    ];

    return {
      totalClicks: 10301,
      sortedButtons: demoButtons,
      weeklyTraffic: [
        { day: 'Lun', clicks: 1200 },
        { day: 'Mar', clicks: 1850 },
        { day: 'Mié', clicks: 2100 },
        { day: 'Jue', clicks: 1950 },
        { day: 'Vie', clicks: 2300 },
        { day: 'Sáb', clicks: 2150 },
        { day: 'Dom', clicks: 1297 }
      ],
      socialTraffic: [
        { platform: 'instagram', clicks: 3421 },
        { platform: 'telegram', clicks: 2890 },
        { platform: 'tiktok', clicks: 2156 },
        { platform: 'whatsapp', clicks: 1834 }
      ],
      topOrigins: [
        { country: 'Estados Unidos', flag: '🇺🇸', percentage: 45 },
        { country: 'México', flag: '🇲🇽', percentage: 22 },
        { country: 'Colombia', flag: '🇨🇴', percentage: 18 },
        { country: 'Argentina', flag: '🇦🇷', percentage: 15 }
      ]
    };
  };

  const isDemo = pages.length === 0;
  const displayMetrics = isDemo ? getDemoMetrics() : metrics;
  const maxClicks = displayMetrics ? Math.max(...displayMetrics.weeklyTraffic.map(d => d.clicks)) : 0;

  if (!displayMetrics) return null;

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white font-sans overflow-hidden relative">
      {/* Zero State Silhouette Overlay */}
      {isDemo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-background-dark/80 backdrop-blur-2xl border border-primary/20 p-8 rounded-[2.5rem] shadow-[0_0_100px_rgba(168,85,247,0.15)] text-center relative overflow-hidden"
          >
            {/* Animated Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full" />
            
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">monitoring</span>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Sin datos de tráfico aún</h2>
            <p className="text-silver/50 text-sm leading-relaxed mb-8">
              Tus analíticas cobrarán vida cuando tus links empiecen a recibir visitas. Crea tu primer smart link para comenzar el rastreo.
            </p>
            
            <Link 
              to="/dashboard/links" 
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-black font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
            >
              Crear mi primer Link
              <span className="material-symbols-outlined text-sm">add_circle</span>
            </Link>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#050505] z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div id="analytics-title" className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">analytics</span>
          </div>
          <h1 className="text-sm font-bold uppercase tracking-wider">Analytics</h1>

          {/* Link Selector - Only show if not demo */}
          {!isDemo && (
            <div className="ml-4">
              <select
                value={selectedPageId || ''}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-primary transition-all"
              >
                {pages.map(page => (
                  <option key={page.id} value={page.id} className="bg-[#0A0A0A]">
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-3">
          <div id="analytics-filters" className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${timeFilter === filter
                  ? 'bg-primary text-white'
                  : 'text-silver/60 hover:text-white'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content - Blurred if isDemo */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 transition-all duration-700 ${isDemo ? 'blur-md opacity-30 grayscale pointer-events-none' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">

              {/* Weekly Traffic Chart */}
              <div id="analytics-traffic" className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Tráfico Semanal</h2>
                  <span className="text-xs text-silver/40 font-mono">Últimos 7 días</span>
                </div>

                <div className="space-y-4">
                  {displayMetrics.weeklyTraffic.map((day, idx) => {
                    const heightPercent = (day.clicks / maxClicks) * 100;
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <span className="text-xs font-bold text-silver/60 w-8">{day.day}</span>
                        <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-lg transition-all duration-500 relative"
                            style={{ width: `${heightPercent}%` }}
                          >
                            <div className="absolute inset-0 bg-primary/30 blur-md"></div>
                          </div>
                        </div>
                        <span className="text-sm font-mono font-bold text-white w-16 text-right">
                          {day.clicks.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Button Rankings */}
              <div id="analytics-ranking" className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Ranking de Botones</h2>
                <div className="space-y-3">
                  {displayMetrics.sortedButtons.map((btn, idx) => (
                    <div key={btn.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-sm font-black text-silver/60">
                        #{idx + 1}
                      </div>
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white p-2" style={{ backgroundColor: `${getSocialColor(btn.type)}40` }}>
                        {getSocialIcon(btn.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{btn.text}</p>
                        <div className="w-full h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${((btn.clicks || 0) / (displayMetrics.sortedButtons[0].clicks || 1)) * 100}%`,
                              backgroundColor: getSocialColor(btn.type)
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-lg font-mono font-bold text-white">
                        {(btn.clicks || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Widgets */}
            <div className="space-y-6">

              {/* Total Clicks Card */}
              <div id="analytics-total" className="bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">touch_app</span>
                  <h3 className="text-xs font-black text-silver/60 uppercase tracking-widest">Total Clicks</h3>
                </div>
                <p className="text-4xl font-black text-white">{displayMetrics.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  +12.5% vs periodo anterior
                </p>
              </div>

              {/* Mobile Heatmap */}
              <div id="analytics-heatmap" className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Mapa de Calor</h2>
                <div className="flex justify-center">
                  <div className="relative w-[140px] aspect-[9/19] bg-black rounded-[2rem] border-4 border-[#333] shadow-2xl overflow-hidden">
                    {/* Phone Screen */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] p-4 flex flex-col">
                      {/* Profile Area - Low heat */}
                      <div className="h-12 rounded-xl bg-white/5 mb-3 relative">
                        <div className="absolute inset-0 bg-yellow-500/10 rounded-xl blur-sm"></div>
                      </div>

                      {/* Buttons Area - High heat */}
                      <div className="flex-1 space-y-2">
                        {displayMetrics.sortedButtons.slice(0, 4).map((_btn, i) => (
                          <div key={i} className="h-6 rounded-lg bg-white/5 relative">
                            <div
                              className="absolute inset-0 rounded-lg blur-md"
                              style={{
                                backgroundColor: i === 0 ? '#ff0000' : i === 1 ? '#ff6600' : i === 2 ? '#ffaa00' : '#ffdd00',
                                opacity: i === 0 ? 0.4 : i === 1 ? 0.3 : i === 2 ? 0.2 : 0.15
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Compact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">

            {/* Top Origins */}
            <div id="analytics-origins" className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">Top Orígenes</h2>
              <div className="space-y-4">
                {displayMetrics.topOrigins.map((origin, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{origin.flag}</span>
                        <span className="text-sm font-bold text-white">{origin.country}</span>
                      </div>
                      <span className="text-sm font-mono font-bold text-primary">{origin.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${origin.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Traffic */}
            <div id="analytics-platforms" className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">Tráfico por Plataforma</h2>
              <div className="grid grid-cols-2 gap-4">
                {displayMetrics.socialTraffic.map((social) => (
                  <div key={social.platform} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 text-white">
                        {getSocialIcon(social.platform)}
                      </div>
                      <span className="text-xs font-bold text-silver/60 capitalize">{social.platform}</span>
                    </div>
                    <p className="text-2xl font-black text-white">{social.clicks.toLocaleString()}</p>
                    <p className="text-[10px] text-silver/40 font-bold mt-1">clicks</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
