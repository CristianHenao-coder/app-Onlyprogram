import { useEffect, useState, Fragment } from 'react';
import { supabase } from '@/services/supabase';
import { useTranslation } from '@/contexts/I18nContext';
import { useModal } from '@/contexts/ModalContext';
import { logActions } from '@/services/auditService';
import { retryWithBackoff } from '@/utils/retryHelper';

import { API_URL } from '@/services/apiConfig';

const UserManager = () => {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Promotion Security State
  const [promotionTarget, setPromotionTarget] = useState<any | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [step, setStep] = useState<'none' | 'confirm' | 'verify'>('none');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, smart_links!smart_links_user_id_fkey(*, smart_link_buttons(*))')
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
      await retryWithBackoff(async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ is_suspended: !currentStatus })
          .eq('id', userId);

        if (error) throw error;
      });

      await logActions.userSuspend(userId, !currentStatus);
      fetchUsers();

      showAlert({
        title: !currentStatus ? t('admin.user.suspendedTitle') : t('admin.user.unsuspendedTitle'),
        message: t('admin.user.statusUpdated'),
        type: "success"
      });
    } catch (err) {
      console.error(err);
      showAlert({
        title: t('common.error'),
        message: t('admin.common.updateError'),
        type: "error"
      });
    }
  };

  const handleDeleteUser = async (user: any) => {
    const userName = user.full_name || user.email || user.id || t('admin.links.unknown');
    const confirmed = await showConfirm({
      title: t('admin.user.deleteTitle'),
      message: t('admin.user.deleteConfirm', { name: userName }),
      confirmText: t('admin.user.delete'),
      cancelText: t('common.cancel')
    });

    if (!confirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.common.error'));
      }

      showAlert({
        title: t('admin.user.deleteTitle'),
        message: t('admin.user.statusUpdated'),
        type: "success"
      });

      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: t('common.error'),
        message: err.message || t('admin.common.updateError'),
        type: "error"
      });
    }
  };

  const handleToggleLink = async (linkId: string, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/admin/links/${linkId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!response.ok) throw new Error(t('admin.common.error'));

      fetchUsers();

      showAlert({
        title: t('admin.common.success'),
        message: t('admin.user.statusUpdated'),
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: t('common.error'),
        message: err.message || t('admin.common.updateError'),
        type: "error"
      });
    }
  };

  const handleDeleteLink = async (linkId: string, title: string) => {
    const confirmed = await showConfirm({
      title: t('admin.links.deleteTitle'),
      message: t('admin.links.deleteConfirm', { name: title }),
      confirmText: t('admin.user.delete'),
      cancelText: t('common.cancel')
    });

    if (!confirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/admin/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('admin.common.error'));
      }

      showAlert({
        title: t('admin.links.deleteTitle'),
        message: t('admin.common.success'),
        type: "success"
      });

      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: t('common.error'),
        message: err.message || t('admin.common.updateError'),
        type: "error"
      });
    }
  };

  const handleRequestPromotion = async () => {
    if (!promotionTarget) return;
    setIsSendingCode(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/admin/request-promotion-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ targetUserId: promotionTarget.id })
      });

      if (!response.ok) throw new Error(t('admin.common.error'));

      setStep('verify');
    } catch (err) {
      showAlert({
        title: t('admin.user.securityTitle'),
        message: t('admin.common.updateError'),
        type: "error"
      });
      console.error(err);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyPromotion = async () => {
    if (!promotionTarget || !verificationCode) return;
    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/admin/verify-promotion-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          code: verificationCode,
          targetUserId: promotionTarget.id
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t('admin.common.error'));

      await logActions.userPromote(promotionTarget.id);

      showAlert({
        title: t('admin.user.promotedTitle'),
        message: t('admin.user.promotedMsg'),
        type: "success"
      });
      setStep('none');
      setPromotionTarget(null);
      setVerificationCode('');
      fetchUsers();
    } catch (err: any) {
      showAlert({
        title: t('admin.user.securityTitle'),
        message: err.message || t('admin.common.updateError'),
        type: "error"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleExpand = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{t('admin.user.title')}</h1>
          <p className="text-silver/40 text-sm font-medium">{t('admin.user.subtitle')}</p>
        </div>
        <div className="relative group max-w-sm w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-silver/20 group-hover:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder={t('admin.user.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/30 border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-surface/30 border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest w-12"></th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-center">ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">{t('admin.user.profile')} (Nombre)</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Contacto</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-center">Links</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-center">Inversión Total</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-center">Activos</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">{t('admin.user.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filteredUsers.map((user) => (
              <Fragment key={user.id}>
                <tr className="group hover:bg-white/[0.02] transition-colors relative z-10 bg-surface/30">
                  <td className="px-2 py-5 text-center">
                    <button
                      onClick={() => toggleExpand(user.id)}
                      className={`
                            h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300
                            ${expandedUsers.has(user.id) ? 'bg-primary text-white rotate-90' : 'text-silver/40 hover:text-white hover:bg-white/10'}
                        `}
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[10px] text-silver font-mono bg-white/5 px-2 py-1 rounded-md text-center max-w-[100px] truncate" title={user.id}>{user.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-xl">person</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white max-w-[150px] truncate" title={user.full_name}>{user.full_name || t('admin.links.unknown')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[11px] text-silver/80 truncate max-w-[180px]" title={user.email}>{user.email || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-sm font-black text-white">{user.smart_links?.length || 0}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-sm font-black text-green-400">
                      ${(user.smart_links?.filter((l: any) => l.is_active).length || 0) * 15} USD
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold">
                      {user.smart_links?.filter((l: any) => l.is_active).length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleSuspension(user.id, !!user.is_suspended)}
                        title={user.is_suspended ? t('admin.user.unsuspend') : t('admin.user.suspend')}
                        className={`
                            h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border
                            ${user.is_suspended
                            ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white'}
                          `}
                      >
                        <span className="material-symbols-outlined text-[16px]">{user.is_suspended ? 'play_arrow' : 'pause'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user)}
                        title={t('admin.user.delete')}
                        className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Links View - Tree/Fork Style */}
                {expandedUsers.has(user.id) && (
                  <tr className="bg-black/20">
                    <td colSpan={8} className="p-0 relative">
                      {/* Rama Principal Vertical */}
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent h-full z-0 ml-px"></div>

                      <div className="py-4 pl-16 pr-6 relative">
                        {user.smart_links && user.smart_links.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-silver/40 mb-2 pl-2">{t('admin.user.associatedLinks')}</h4>
                            {user.smart_links.map((link: any) => (
                              <div key={link.id} className="relative flex flex-col md:flex-row md:items-center gap-4 group">
                                {/* Conector Rama Horizontal */}
                                <div className="hidden md:block absolute -left-10 top-1/2 w-8 h-px bg-primary/30 group-hover:bg-primary/60 transition-colors"></div>
                                {/* Nodo */}
                                <div className="hidden md:block absolute -left-10 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>

                                <div className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 transition-all group-hover:translate-x-1">
                                  <div className="flex items-center gap-3 w-full md:w-1/4 min-w-[200px]">
                                    <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-white border border-white/10 overflow-hidden">
                                      {link.photo ? (
                                        <img src={link.photo} alt="Profile" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="material-symbols-outlined text-xl">link</span>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold text-white truncate" title={link.title}>{link.title}</p>
                                      <p className="text-[10px] text-silver/60 font-mono truncate" title={link.slug}>/{link.slug}</p>
                                    </div>
                                  </div>

                                  <div className="flex-1 flex flex-wrap items-center gap-6 justify-between md:justify-end">
                                    <div className="text-center min-w-[80px]">
                                      <span className="text-[10px] text-silver/40 font-bold block">Botones Activos</span>
                                      <span className="text-sm font-black text-white">{link.smart_link_buttons?.length || 0}</span>
                                    </div>
                                    <div className="text-center min-w-[80px]">
                                      <span className="text-[10px] text-silver/40 font-bold block">Precio/Mes</span>
                                      <span className="text-sm font-black text-green-400">$15</span>
                                    </div>
                                    <div className="text-center min-w-[80px]">
                                      <span className="text-[10px] text-silver/40 font-bold block">Fecha Pago</span>
                                      <span className="text-[11px] font-mono text-silver">{new Date(link.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-center gap-2 border-l border-white/10 pl-6 shrink-0">
                                      {/* Instagram Button Check / Link Out */}
                                      <a
                                        href={link.custom_domain ? `https://${link.custom_domain}` : `/${link.slug}`}
                                        target="_blank"
                                        title="Abrir URL como si fuera su Instagram"
                                        rel="noopener noreferrer"
                                        className="h-9 w-9 rounded-lg bg-pink-500/10 hover:bg-pink-500 flex items-center justify-center text-pink-500 hover:text-white transition-colors border border-pink-500/20"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                      </a>

                                      {/* Toggle is_active Button */}
                                      <button
                                        onClick={() => handleToggleLink(link.id, !!link.is_active)}
                                        title={link.is_active ? t('admin.user.active') : t('admin.user.inactive')}
                                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border
                                                                    ${link.is_active
                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white'
                                            : 'bg-silver/10 border-silver/20 text-silver/60 hover:bg-silver/20 hover:text-white'}
                                                                `}
                                      >
                                        <span className="material-symbols-outlined text-sm">{link.is_active ? 'power' : 'power_off'}</span>
                                      </button>

                                      {/* Delete Link Button */}
                                      <button
                                        onClick={() => handleDeleteLink(link.id, link.title)}
                                        title={t('admin.user.delete')}
                                        className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                      >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center relative">
                            {/* Conector vacío */}
                            <div className="absolute -left-10 top-1/2 w-8 h-px bg-white/10 border-t border-dashed border-silver/20 opacity-50"></div>
                            <span className="text-xs text-silver/30 font-medium italic">{t('admin.user.noLinks')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">group_off</span>
            <p className="text-silver/40 text-sm font-bold">{t('admin.user.noUsers')}</p>
          </div>
        )}
      </div>

      {/* Security Modal for Promotion */}
      {step !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setStep('none')}></div>
          <div className="bg-surface border border-border/50 rounded-[2.5rem] w-full max-w-md p-8 sm:p-10 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full"></div>

            <div className="relative text-center space-y-6">
              <div className="h-16 w-16 bg-purple-500/10 rounded-3xl mx-auto flex items-center justify-center border border-purple-500/20">
                <span className="material-symbols-outlined text-3xl text-purple-400">shield_person</span>
              </div>

              {step === 'confirm' ? (
                <>
                  <div>
                    <h3 className="text-xl font-black text-white">{t('admin.user.promote')}</h3>
                    <p className="text-silver/60 text-sm mt-2">
                      {t('admin.user.promoteMsg', { name: promotionTarget?.full_name })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={handleRequestPromotion}
                      disabled={isSendingCode}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50"
                    >
                      {isSendingCode ? t('admin.user.sendingCode') : t('admin.user.sendCode')}
                    </button>
                    <button onClick={() => setStep('none')} className="text-silver/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">{t('common.cancel')}</button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-black text-white">{t('admin.user.verifyTitle')}</h3>
                    <p className="text-silver/60 text-sm mt-2">{t('admin.user.enterCode')}</p>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-background-dark/50 border-2 border-border/50 rounded-2xl p-5 text-center text-3xl font-black tracking-[0.5em] text-white focus:border-purple-500/50 outline-none transition-all placeholder:text-silver/10"
                    />
                    <button
                      onClick={handleVerifyPromotion}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-green-600/20 disabled:opacity-50"
                    >
                      {isVerifying ? t('admin.user.verifying') : t('admin.user.confirmPromotion')}
                    </button>
                    <button onClick={() => setStep('confirm')} className="text-silver/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">{t('common.back')}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
