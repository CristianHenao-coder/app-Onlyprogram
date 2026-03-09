import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';

interface TelegramBot {
  id: number;
  smart_link_id: number;
  url: string;
  clicks_current: number;
  is_active: boolean;
  created_at: string;
}

interface SmartLink {
  id: number;
  slug: string;
  display_name: string;
  subtitle: string;
  photo: string;
  is_active: boolean;
  telegram_max_capacity: number;
  telegram_rotation_limit: number;
  current_bot_index: number;
  telegram_bots: TelegramBot[];
}

export default function Telegram() {
  const { user } = useAuth(); // Get current user
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<SmartLink | null>(null);
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [botToDelete, setBotToDelete] = useState<TelegramBot | null>(null);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [capacityForm, setCapacityForm] = useState({ max: 2000, limit: 1 });

  // Fetch links with Telegram Rotativo
  useEffect(() => {
    if (user) {
      fetchLinksWithRotator();
    }
  }, [user]);

  const fetchLinksWithRotator = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch smart_links that belong to current user, are active, and have telegram_bots
      const { data: linksData, error: linksError } = await supabase
        .from('smart_links')
        .select(`
          id,
          slug,
          display_name,
          subtitle,
          photo,
          is_active,
          telegram_max_capacity,
          telegram_rotation_limit,
          current_bot_index,
          telegram_bots (
            id,
            smart_link_id,
            url,
            clicks_current,
            is_active,
            created_at
          )
        `)
        .eq('user_id', user.id) // Filter by current user
        .eq('is_active', true)
        .not('telegram_bots', 'is', null);

      if (linksError) throw linksError;

      // Filter only links that have at least one telegram bot
      const filteredLinks = (linksData || []).filter(
        (link: any) => link.telegram_bots && link.telegram_bots.length > 0
      );

      setLinks(filteredLinks as SmartLink[]);
    } catch (error: any) {
      console.error('Error fetching links:', error);
      toast.error('Error al cargar los links con Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBot = (bot: TelegramBot) => {
    setEditingBot(bot);
    setEditUrl(bot.url);
  };

  const handleSaveEdit = async () => {
    if (!editingBot || !editUrl.trim()) {
      toast.error('La URL no puede estar vacía');
      return;
    }

    try {
      const { error } = await supabase
        .from('telegram_bots')
        .update({ url: editUrl.trim() })
        .eq('id', editingBot.id);

      if (error) throw error;

      toast.success('URL actualizada correctamente');
      setEditingBot(null);
      setEditUrl('');
      fetchLinksWithRotator(); // Refresh data
    } catch (error: any) {
      console.error('Error updating bot:', error);
      toast.error('Error al actualizar la URL');
    }
  };

  const handleDeleteBot = async () => {
    if (!botToDelete) return;

    try {
      const { error } = await supabase
        .from('telegram_bots')
        .delete()
        .eq('id', botToDelete.id);

      if (error) throw error;

      toast.success('Telegram eliminado correctamente');
      setShowDeleteConfirm(false);
      setBotToDelete(null);
      fetchLinksWithRotator(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast.error('Error al eliminar el Telegram');
    }
  };

  const handleSaveCapacity = async () => {
    if (!selectedLink) return;
    setSavingCapacity(true);
    try {
      const { error } = await supabase
        .from('smart_links')
        .update({
          telegram_max_capacity: capacityForm.max,
          telegram_rotation_limit: capacityForm.limit,
        })
        .eq('id', selectedLink.id);

      if (error) throw error;

      toast.success('Configuración guardada');
      fetchLinksWithRotator();
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSavingCapacity(false);
    }
  };

  const getTotalClicks = (bots: TelegramBot[]) => {
    return bots.reduce((sum, bot) => sum + (bot.clicks_current || 0), 0);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-silver/60">Cargando links con Telegram Rotativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Monitor de Telegram Rotativo</h1>
          <p className="text-silver/60 text-sm mt-1">
            Gestión centralizada de canales y estadísticas de tráfico
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
          <p className="text-blue-400 font-bold text-sm">
            {links.length} Link{links.length !== 1 ? 's' : ''} con Rotativo
          </p>
        </div>
      </div>

      {/* Links Grid */}
      {links.length === 0 ? (
        <div className="bg-surface/30 border border-border rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-silver/20 mb-4 block">analytics</span>
          <p className="text-silver/40 text-lg mb-2">No hay links con Telegram Rotativo activo</p>
          <p className="text-silver/60 text-sm">
            Los links con Telegram Rotativo aparecerán aquí una vez que sean activados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => {
                setSelectedLink(link);
                setCapacityForm({
                  max: (link as any).telegram_max_capacity || 2000,
                  limit: (link as any).telegram_rotation_limit || 1,
                });
              }}
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={link.photo || 'https://via.placeholder.com/80'}
                    alt={link.display_name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate group-hover:text-primary transition-colors">
                      {link.display_name}
                    </h3>
                    <p className="text-silver/60 text-xs truncate">@{link.slug}</p>
                    {link.subtitle && (
                      <p className="text-silver/40 text-xs mt-1 line-clamp-2">{link.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                      Telegrams
                    </p>
                    <p className="text-white text-2xl font-bold">
                      {link.telegram_bots.length}
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
                      Clics Totales
                    </p>
                    <p className="text-white text-2xl font-bold">
                      {getTotalClicks(link.telegram_bots)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link Detail Modal */}
      {selectedLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedLink(null)}
        >
          <div
            className="w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedLink.photo || 'https://via.placeholder.com/80'}
                    alt={selectedLink.display_name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white/10"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedLink.display_name}</h2>
                    <p className="text-silver/60 text-sm">@{selectedLink.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLink(null)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-white">close</span>
                </button>
              </div>
            </div>

            {/* Telegram Bots List */}
            <div className="p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">sync</span>
                URLs de Telegram Rotativo ({selectedLink.telegram_bots.length})
              </h3>

              <div className="space-y-3">
                {selectedLink.telegram_bots.map((bot, index) => (
                  <div
                    key={bot.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${index === selectedLink.current_bot_index
                          ? 'bg-primary/20 text-primary'
                          : 'bg-blue-500/20 text-blue-400'
                          }`}>
                          {index + 1}
                        </div>

                        {editingBot?.id === bot.id ? (
                          <input
                            type="text"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                            placeholder="https://t.me/..."
                            autoFocus
                          />
                        ) : (
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-mono truncate">{bot.url}</p>
                            {/* Barra de capacidad */}
                            {(() => {
                              const max = selectedLink.telegram_max_capacity || 2000;
                              const pct = Math.min(100, Math.round((bot.clicks_current || 0) / max * 100));
                              return (
                                <div className="mt-1.5">
                                  <div className="flex justify-between text-[9px] mb-0.5">
                                    <span className="text-silver/40">{bot.clicks_current || 0} / {max} clicks</span>
                                    <span className={pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-yellow-400' : 'text-green-400'}>{pct}%</span>
                                  </div>
                                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                            {!bot.is_active && <span className="text-red-400 text-[9px] mt-1 block">• Inactivo</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {editingBot?.id === bot.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                              title="Guardar"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingBot(null);
                                setEditUrl('');
                              }}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                              title="Cancelar"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditBot(bot)}
                              className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
                              title="Editar URL"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setBotToDelete(bot);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Capacity Configuration */}
              <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400 text-sm">settings</span>
                  Configuración de Rotación
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-silver/40 uppercase mb-1.5">Capacidad máx. por bot</label>
                    <input
                      type="number"
                      min={1}
                      value={capacityForm.max}
                      onChange={e => setCapacityForm(p => ({ ...p, max: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                    />
                    <p className="text-[9px] text-silver/30 mt-1">Clicks antes de marcar bot como lleno</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-silver/40 uppercase mb-1.5">Límite de batch (clicks)</label>
                    <input
                      type="number"
                      min={1}
                      value={capacityForm.limit}
                      onChange={e => setCapacityForm(p => ({ ...p, limit: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                    />
                    <p className="text-[9px] text-silver/30 mt-1">Rota al siguiente cada N clicks (1 = round robin puro)</p>
                  </div>
                </div>
                <button
                  onClick={handleSaveCapacity}
                  disabled={savingCapacity}
                  className="mt-4 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingCapacity && <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>}
                  {savingCapacity ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>

              {/* Statistics Summary */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Total URLs
                  </p>
                  <p className="text-white text-3xl font-bold">{selectedLink.telegram_bots.length}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Clics Totales
                  </p>
                  <p className="text-white text-3xl font-bold">
                    {getTotalClicks(selectedLink.telegram_bots)}
                  </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                  <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Promedio/URL
                  </p>
                  <p className="text-white text-3xl font-bold">
                    {selectedLink.telegram_bots.length > 0
                      ? Math.round(getTotalClicks(selectedLink.telegram_bots) / selectedLink.telegram_bots.length)
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && botToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-[#0A0A0A] border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¿Eliminar este Telegram?</h2>
                <p className="text-silver/60 text-sm mb-4">
                  Esta acción eliminará permanentemente esta URL del rotador. Los clics registrados se perderán.
                </p>
                <div className="bg-white/5 p-3 rounded-lg mb-6">
                  <p className="text-white text-sm font-mono truncate">{botToDelete.url}</p>
                  <p className="text-silver/40 text-xs mt-1">
                    Clics: {botToDelete.clicks_current || 0}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setBotToDelete(null);
                  }}
                  className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteBot}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
