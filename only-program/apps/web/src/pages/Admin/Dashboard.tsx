import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { useTranslation } from '@/contexts/I18nContext';

type TimeRange = '24h' | '7d' | '30d';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [range, setRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    links: 0,
    payments: 0,
    revenue: 0,
    prevUsers: 0,
    prevLinks: 0,
    prevPayments: 0,
    prevRevenue: 0
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      let prevStartDate = new Date();

      if (range === '24h') {
        startDate.setHours(now.getHours() - 24);
        prevStartDate.setHours(now.getHours() - 48);
      } else if (range === '7d') {
        startDate.setDate(now.getDate() - 7);
        prevStartDate.setDate(now.getDate() - 14);
      } else {
        startDate.setDate(now.getDate() - 30);
        prevStartDate.setDate(now.getDate() - 60);
      }

      const [
        usersCur, usersPrev, 
        linksCur, linksPrev, 
        paysCur, paysPrev
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('created_at', startDate.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('created_at', prevStartDate.toISOString()).lt('created_at', startDate.toISOString()),
        supabase.from('smart_links').select('*', { count: 'exact', head: true }).gt('created_at', startDate.toISOString()),
        supabase.from('smart_links').select('*', { count: 'exact', head: true }).gt('created_at', prevStartDate.toISOString()).lt('created_at', startDate.toISOString()),
        supabase.from('payments').select('amount').gt('created_at', startDate.toISOString()),
        supabase.from('payments').select('amount').gt('created_at', prevStartDate.toISOString()).lt('created_at', startDate.toISOString()),
      ]);

      const revCur = (paysCur.data || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const revPrev = (paysPrev.data || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

      setStats({
        users: usersCur.count || 0,
        links: linksCur.count || 0,
        payments: (paysCur.data || []).length,
        revenue: revCur,
        prevUsers: usersPrev.count || 0,
        prevLinks: linksPrev.count || 0,
        prevPayments: (paysPrev.data || []).length,
        prevRevenue: revPrev
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  const calculateGrowth = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const MetricCard = ({ title, value, prevValue, icon, color, unit = "" }: any) => {
    const growth = calculateGrowth(value, prevValue);
    const isPositive = growth >= 0;

    return (
      <div className="bg-surface/30 border border-border/50 p-6 rounded-[2rem] hover:border-primary/30 transition-all group">
        <div className="flex justify-between items-start mb-6">
          <div className={`h-12 w-12 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-500`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            <span className="material-symbols-outlined text-[14px]">
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
            {Math.abs(growth)}%
          </div>
        </div>
        <h3 className="text-silver/40 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-3xl font-black text-white tracking-tighter">
          {unit}{value.toLocaleString()}
        </p>
      </div>
    );
  };

  // Mock graph data for visualization based on current stats
  const graphPoints = useMemo(() => {
    const points = [10, 40, 25, 60, 45, 90, 75]; // base shape
    return points.map(p => (p * (stats.users + 1)) % 100); // dynamic based on users
  }, [stats.users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{t('admin.dashboard.title')}</h1>
          <p className="text-silver/40 text-sm font-medium">{t('admin.dashboard.subtitle')}</p>
        </div>

        <div className="flex bg-surface/50 border border-border/50 p-1 rounded-2xl shrink-0">
          {(['24h', '7d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                range === r 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-silver/40 hover:text-silver/60'
              }`}
            >
              {r === '24h' ? t('admin.dashboard.today') : r === '7d' ? t('admin.dashboard.days7') : t('admin.dashboard.days30')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title={t('admin.dashboard.newUsers')} 
          value={stats.users} 
          prevValue={stats.prevUsers} 
          icon="group" 
          color="blue" 
        />
        <MetricCard 
          title={t('admin.dashboard.smartLinksCreated')} 
          value={stats.links} 
          prevValue={stats.prevLinks} 
          icon="link" 
          color="primary" 
        />
        <MetricCard 
          title={t('admin.dashboard.transactions')} 
          value={stats.payments} 
          prevValue={stats.prevPayments} 
          icon="shopping_cart" 
          color="green" 
        />
        <MetricCard 
          title={t('admin.dashboard.estimatedRevenue')} 
          value={stats.revenue} 
          prevValue={stats.prevRevenue} 
          icon="payments" 
          color="purple" 
          unit="$"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface/30 border border-border/50 rounded-[2.5rem] p-8 overflow-hidden relative">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h2 className="text-xl font-black text-white tracking-tight uppercase italic">{t('admin.dashboard.systemActivity')}</h2>
                 <p className="text-silver/40 text-[10px] font-black uppercase tracking-widest mt-1">{t('admin.dashboard.growthTrend')}</p>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-black text-primary tracking-tighter">+{calculateGrowth(stats.users, stats.prevUsers)}%</p>
                 <p className="text-[10px] text-silver/40 font-black uppercase tracking-widest">{t('admin.dashboard.vsPrevious')}</p>
              </div>
           </div>

           <div className="h-48 w-full relative group">
              {/* SVG Chart Background */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 200" preserveAspectRatio="none">
                 <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                       <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                       <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                 </defs>
                 
                  {/* Area */}
                  <path 
                     d={`M 0,192 ${graphPoints.map((p, i) => `L ${(i / (graphPoints.length-1)) * 100},${192 - p}`).join(' ')} L 100,192 Z`}
                     fill="url(#grad)"
                     className="transition-all duration-1000 ease-in-out"
                  />
                  
                  {/* Line */}
                  <path 
                     d={`M 0,${192-graphPoints[0]} ${graphPoints.map((p, i) => `L ${(i / (graphPoints.length-1)) * 100},${192 - p}`).join(' ')}`}
                     fill="none"
                     stroke="var(--primary)"
                     strokeWidth="3"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-all duration-1000 ease-in-out drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                  />

                  {/* Points */}
                  {graphPoints.map((p, i) => (
                     <circle 
                        key={i}
                        cx={(i / (graphPoints.length-1)) * 100}
                        cy={192 - p}
                        r="2"
                        className="fill-primary stroke-[#0B0B0B] stroke-[0.5] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     />
                  ))}
               </svg>

              <div className="absolute inset-0 flex justify-between items-end px-2 pointer-events-none opacity-20 border-b border-border/30">
                 {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                    <span key={`${day}-${i}`} className="text-[10px] text-silver/40 font-black mb-2">{day}</span>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 flex flex-col justify-between">
           <div>
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 mb-6 group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined text-3xl">offline_bolt</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight uppercase mb-4">
                 {t('admin.dashboard.readyForFuture')} <br /> <span className="text-primary italic">{t('admin.dashboard.digitalFuture')}</span>
              </h3>
              <p className="text-silver/60 text-sm leading-relaxed">
                 {t('admin.dashboard.futureDesc')}
              </p>
           </div>
           
           <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-silver/40">
                 <span>{t('admin.dashboard.serverHealth')}</span>
                 <span className="text-green-500">99.9%</span>
              </div>
              <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                 <div className="h-full w-[95%] bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
