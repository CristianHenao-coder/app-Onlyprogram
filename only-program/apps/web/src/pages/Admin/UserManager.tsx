import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

const UserManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Error changing suspension status');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">User Management</h1>
          <p className="text-silver/40 text-sm font-medium">Manage accounts, verify payments, and handle moderation.</p>
        </div>
        <div className="relative group max-w-sm w-full">
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-silver/20 group-hover:text-primary transition-colors">search</span>
           <input 
            type="text" 
            placeholder="Search by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/30 border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
           />
        </div>
      </div>

      <div className="bg-surface/30 border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Profile</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Role/Plan</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                       {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.full_name || 'No name'}</p>
                      <p className="text-[10px] text-silver/40 font-mono truncate max-w-[150px]">{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-purple-400' : 'text-blue-400'}`}>
                      {user.role}
                    </span>
                    <span className="text-[10px] text-silver font-medium italic">
                      {user.plan_type || 'FREE'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${user.is_suspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <span className="text-xs font-bold text-silver/60">
                        {user.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleSuspension(user.id, !!user.is_suspended)}
                        className={`
                          px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                          ${user.is_suspended 
                            ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}
                        `}
                      >
                         {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">group_off</span>
            <p className="text-silver/40 text-sm font-bold">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
