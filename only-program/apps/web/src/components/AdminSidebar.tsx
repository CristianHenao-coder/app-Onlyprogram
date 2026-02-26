import { useNavigate, Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
}

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const NavItem = ({
  to,
  icon,
  label,
  isCollapsed,
}: NavItemProps & { isCollapsed: boolean }) => (
  <NavLinkWrapper to={to} isCollapsed={isCollapsed}>
    <span className="material-symbols-outlined text-[20px] shrink-0">
      {icon}
    </span>
    {!isCollapsed && (
      <span className="font-medium text-sm truncate">{label}</span>
    )}
  </NavLinkWrapper>
);

const NavLinkWrapper = ({
  to,
  children,
  isCollapsed,
}: {
  to: string;
  children: React.ReactNode;
  isCollapsed: boolean;
}) => (
  <NavLink
    to={to}
    title={
      isCollapsed
        ? Array.isArray(children)
          ? (children[1] as any)?.props?.children
          : undefined
        : undefined
    }
    className={({ isActive }) => `
      flex items-center gap-3 rounded-xl transition-all duration-300 group
      ${isCollapsed ? "p-3 justify-center" : "px-4 py-3"}
      ${
        isActive
          ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
          : "text-silver/40 hover:text-white hover:bg-white/5 border border-transparent"
      }
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
    navigate("/login");
  };

  return (
    <aside
      className={`
      ${isCollapsed ? "w-20" : "w-72"} 
      bg-background-dark border-r border-border/50 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-50
    `}
    >
      {/* Brand Section */}
      <div className="flex flex-col items-center p-6 gap-6">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div
            className={`
            bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-all duration-500 overflow-hidden
            ${isCollapsed ? "h-12 w-12" : "h-14 w-14"}
          `}
          >
            <img
              src="/src/assets/img/logoinc.png"
              alt="OnlyProgram Logo"
              className="w-full h-full object-contain p-2"
            />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-white font-black tracking-tighter text-xl leading-none">
                ONLY
              </h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mt-1">
                PROGRAM ADMIN
              </p>
            </div>
          )}
        </Link>

        {/* Toggle Button Below Logo */}
        <button
          onClick={onToggle}
          className={`
            flex items-center justify-center h-10 rounded-xl border border-white/10 bg-white/5 text-silver hover:text-white transition-all hover:bg-white/10
            ${isCollapsed ? "w-12" : "w-full"}
          `}
        >
          <span className="material-symbols-outlined text-xl">
            {isCollapsed ? "menu" : "menu_open"}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 ${isCollapsed ? "px-3" : "px-4"} space-y-2 overflow-y-auto custom-scrollbar pt-2`}
      >
        {!isCollapsed && (
          <p className="px-4 text-[10px] font-black text-silver/20 uppercase tracking-[0.2em] mb-4">
            {t("admin.menu.main")}
          </p>
        )}

        <NavItem
          to="/admin/dashboard"
          icon="dashboard"
          label={t("admin.menu.overview")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/cms"
          icon="edit_note"
          label={t("admin.menu.cms")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/pricing"
          icon="paid"
          label={t("admin.menu.pricing")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/users"
          icon="group"
          label={t("admin.menu.users")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/links"
          icon="link"
          label={t("admin.menu.links")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/coupons"
          icon="confirmation_number"
          label={t("admin.menu.coupons")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/audit-logs"
          icon="history"
          label={t("admin.menu.auditLogs")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/moderation"
          icon="verified_user"
          label={t("admin.menu.moderation")}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/domains"
          icon="dns"
          label={t("admin.menu.domains")}
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* User Footer */}
      <div className="p-4 mt-auto">
        <div
          className={`bg-white/5 border border-white/5 rounded-2xl ${isCollapsed ? "p-2" : "p-4"} transition-all`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
              rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10 border border-white/10 overflow-hidden shrink-0 transition-all
              ${isCollapsed ? "h-10 w-10" : "h-12 w-12"}
            `}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl">
                    person
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-bold truncate text-white">
                  {profile?.full_name || "Administrator"}
                </p>
                <p className="text-[9px] text-silver/40 truncate uppercase font-black tracking-widest">
                  {t("admin.menu.roleAdmin")}
                </p>
              </div>
            )}
          </div>

          <div
            className={`flex gap-2 transition-all ${isCollapsed ? "flex-col mt-4" : "mt-4"}`}
          >
            <button
              onClick={() => navigate("/admin/settings")}
              title={isCollapsed ? t("admin.menu.settings") : undefined}
              className={`
                flex items-center justify-center h-10 rounded-xl bg-white/5 text-silver hover:text-white hover:bg-white/10 border border-white/10 transition-all
                ${isCollapsed ? "w-10" : "flex-1"}
              `}
            >
              <span className="material-symbols-outlined text-sm">
                settings
              </span>
              {!isCollapsed && (
                <span className="ml-2 text-xs font-bold uppercase tracking-widest">
                  {t("admin.menu.settings")}
                </span>
              )}
            </button>
            <button
              onClick={handleSignOut}
              title={isCollapsed ? t("admin.menu.logout") : undefined}
              className={`
                flex items-center justify-center h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all
                ${isCollapsed ? "w-10" : "w-12"}
              `}
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
