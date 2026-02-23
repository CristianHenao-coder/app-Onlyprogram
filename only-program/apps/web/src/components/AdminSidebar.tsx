import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
}

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const NavItem = ({ to, icon, label, isCollapsed }: NavItemProps & { isCollapsed: boolean }) => (
  <NavLinkWrapper to={to} isCollapsed={isCollapsed}>
    <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
    {!isCollapsed && <span className="font-medium text-sm truncate">{label}</span>}
  </NavLinkWrapper>
);

const NavLinkWrapper = ({ to, children, isCollapsed }: { to: string, children: React.ReactNode, isCollapsed: boolean }) => (
  <NavLink
    to={to}
    title={isCollapsed ? (Array.isArray(children) ? (children[1] as any)?.props?.children : undefined) : undefined}
    className={({ isActive }) => `
      flex items-center gap-3 rounded-xl transition-all duration-300 group
      ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'}
      ${isActive 
        ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' 
        : 'text-silver/40 hover:text-white hover:bg-white/5 border border-transparent'}
    `}
  >
    {children}
  </NavLink>
);

const AdminSidebar = ({ isCollapsed = false, onToggle }: AdminSidebarProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className={`
      ${isCollapsed ? 'w-20' : 'w-72'} 
      bg-background-dark border-r border-border/50 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out
    `}>
      {/* Brand & Toggle */}
      <div className={`${isCollapsed ? 'p-4' : 'p-8'} flex items-center justify-between`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white font-black">shield_person</span>
            </div>
            <div>
              <h1 className="text-white font-black tracking-tighter text-xl leading-none">ADMIN</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mt-1">Panel de Control</p>
            </div>
          </div>
        )}
        {isCollapsed && (
             <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary font-black">shield_person</span>
             </div>
        )}
      </div>

      <button 
        onClick={onToggle}
        className={`
          mx-4 mb-6 flex items-center justify-center h-10 rounded-xl border border-border bg-surface/30 text-silver hover:text-white transition-all
          ${isCollapsed ? 'w-12' : 'w-full max-w-[40px]'}
        `}
      >
        <span className="material-symbols-outlined">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} space-y-2 overflow-y-auto custom-scrollbar`}>
        {!isCollapsed && (
          <p className="px-4 text-[10px] font-black text-silver/20 uppercase tracking-[0.2em] mb-4">
            {t('admin.menu.main')}
          </p>
        )}
        
        <NavItem to="/admin/dashboard" icon="dashboard" label={t('admin.menu.overview')} isCollapsed={isCollapsed} />
        <NavItem to="/admin/cms" icon="edit_note" label={t('admin.menu.cms')} isCollapsed={isCollapsed} />
        <NavItem to="/admin/pricing" icon="paid" label="Precios" isCollapsed={isCollapsed} />
        <NavItem to="/admin/users" icon="group" label={t('admin.menu.users')} isCollapsed={isCollapsed} />
        <NavItem to="/admin/links" icon="link" label={t('admin.menu.links')} isCollapsed={isCollapsed} />
        <NavItem to="/admin/coupons" icon="confirmation_number" label={t('admin.menu.coupons')} isCollapsed={isCollapsed} />
        <NavItem to="/admin/audit-logs" icon="history" label={t('admin.menu.auditLogs')} isCollapsed={isCollapsed} />
        <NavItem to="/admin/moderation" icon="verified_user" label="Moderación" isCollapsed={isCollapsed} />
        <NavItem to="/admin/domains" icon="dns" label="Dominios" isCollapsed={isCollapsed} />
      </nav>

      {/* User Footer */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} mt-auto`}>
        <div className={`bg-surface/30 border border-border rounded-2xl ${isCollapsed ? 'p-1' : 'p-4'}`}>
          {!isCollapsed && (
            <div className="mb-4">
              <Link 
                to="/admin/settings"
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden shrink-0">
                   {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                   ) : (
                     <span className="material-symbols-outlined text-primary text-xl">person_filled</span>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-white group-hover:text-primary transition-colors">
                    {profile?.full_name || 'Admin'}
                  </p>
                  <p className="text-[9px] text-silver/40 truncate uppercase font-black tracking-widest">
                     Administrador
                  </p>
                </div>
                <span className="material-symbols-outlined text-silver/20 text-sm group-hover:text-white group-hover:rotate-45 transition-all">settings</span>
              </Link>
            </div>
          )}
          
          {isCollapsed && (
            <Link 
              to="/admin/settings"
              title="Ajustes de Perfil"
              className="h-10 w-10 mx-auto rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden mb-2 hover:border-primary transition-all"
            >
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
               ) : (
                 <span className="material-symbols-outlined text-primary text-xl">person_filled</span>
               )}
            </Link>
          )}

          <button
            onClick={handleSignOut}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
            className={`
              flex items-center justify-center gap-2 py-2 rounded-lg text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all text-xs font-bold border border-red-500/10 hover:border-red-500/20
              ${isCollapsed ? 'w-10 mx-auto px-0' : 'w-full'}
            `}
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
