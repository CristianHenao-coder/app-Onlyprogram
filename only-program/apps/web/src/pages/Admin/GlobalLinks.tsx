import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

const GlobalLinks = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('smart_links')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const toggleStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('smart_links')
        .update({ is_active: !currentStatus })
        .eq('id', linkId);
      
      if (error) throw error;
      fetchLinks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLinks = links.filter(l => 
    l.title?.toLowerCase().includes(search.toLowerCase()) || 
    l.id.toLowerCase().includes(search.toLowerCase()) ||
    l.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Global Links</h1>
          <p className="text-silver/40 text-sm font-medium">Monitor and manage all links created across the platform.</p>
        </div>
        <div className="relative group max-w-sm w-full">
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-silver/20 group-hover:text-primary transition-colors">search</span>
           <input 
            type="text" 
            placeholder="Search by title, ID or owner..." 
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
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Smart Link</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Owner</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Views</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filteredLinks.map((link) => (
              <tr key={link.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                       <span className="material-symbols-outlined uppercase text-lg">link</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white max-w-[200px] truncate">{link.title || 'Untitled Link'}</p>
                      <p className="text-[10px] text-silver/40 font-mono truncate max-w-[150px]">{link.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <p className="text-xs font-bold text-silver">{link.profiles?.full_name || 'Unknown'}</p>
                </td>
                <td className="px-6 py-5">
                   <p className="text-xs font-black text-primary">{link.stats?.views || 0}</p>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${link.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-silver/60">
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(link.id, !!link.is_active)}
                        className={`
                          px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                          ${link.is_active 
                            ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                            : 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}
                        `}
                      >
                         {link.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLinks.length === 0 && (
          <div className="p-20 text-center">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">link_off</span>
            <p className="text-silver/40 text-sm font-bold">No links found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalLinks;
