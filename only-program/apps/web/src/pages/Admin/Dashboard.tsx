import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    links: 0,
    payments: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [users, links, payments] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('smart_links').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        users: users.count || 0,
        links: links.count || 0,
        payments: payments.count || 0,
        revenue: 0 
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Platform Overview</h1>
        <p className="text-silver/40 text-sm font-medium">Real-time metrics across all users and links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface/30 border border-border/50 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <h3 className="text-silver/40 text-xs font-black uppercase tracking-widest mb-1">Total Users</h3>
          <p className="text-3xl font-black text-white tracking-tighter">{stats.users}</p>
        </div>

        <div className="bg-surface/30 border border-border/50 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined">link</span>
            </div>
          </div>
          <h3 className="text-silver/40 text-xs font-black uppercase tracking-widest mb-1">Active Links</h3>
          <p className="text-3xl font-black text-white tracking-tighter">{stats.links}</p>
        </div>

        <div className="bg-surface/30 border border-border/50 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <h3 className="text-silver/40 text-xs font-black uppercase tracking-widest mb-1">Total Payments</h3>
          <p className="text-3xl font-black text-white tracking-tighter">{stats.payments}</p>
        </div>

        <div className="bg-surface/30 border border-border/50 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined">database</span>
            </div>
          </div>
          <h3 className="text-silver/40 text-xs font-black uppercase tracking-widest mb-1">Gross Metrics</h3>
          <p className="text-3xl font-black text-white tracking-tighter">Live</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
