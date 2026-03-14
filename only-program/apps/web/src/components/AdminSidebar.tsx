import { useState } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import Logo from "./Logo";

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
      ${isActive
        ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
        : "text-silver/40 hover:text-white hover:bg-white/5 border border-transparent"
      }
    `}
  >
    {children}
  </NavLink>
);

const AdminSidebar = ({ isCollapsed = false, onToggle }: AdminSidebarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isExpanded = !isCollapsed || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
      ${isExpanded ? "w-72" : "w-20"} 
      bg-background-dark border-r border-border/50 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-50
      ${isHovered && isCollapsed ? "shadow-2xl shadow-black/50 border-r border-primary/20" : ""}
    `}
    >
      {/* Brand Section */}
      <div className="flex flex-col items-center p-6 gap-4">
        <Link to="/admin/dashboard" className="flex flex-col items-center gap-3 group">
          <div
            className={`
            flex items-center justify-center transition-all duration-500
            ${isExpanded ? "h-28 w-28" : "h-12 w-12"}
          `}
          >
            <Logo className="w-full h-full" imgClassName="p-0" />
          </div>
          {isExpanded && (
            <div className="text-center animate-fade-in">
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
              flex items-center justify-center h-10 rounded-xl border transition-all shadow-lg shadow-primary/20
              bg-primary text-white border-primary hover:bg-blue-600 hover:border-blue-500
              ${isExpanded ? "w-full" : "w-12"}
            `}
          >
            <span className="material-symbols-outlined text-xl">
              {isExpanded ? "keyboard_double_arrow_left" : "menu"}
            </span>
          </button>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 ${isExpanded ? "px-4" : "px-3"} space-y-2 overflow-y-auto custom-scrollbar pt-2`}
      >
        {isExpanded && (
          <p className="px-4 text-[10px] font-black text-silver/20 uppercase tracking-[0.2em] mb-4">
            {t("admin.menu.main")}
          </p>
        )}

        <NavItem
          to="/admin/dashboard"
          icon="dashboard"
          label={t("admin.menu.overview")}
          isCollapsed={!isExpanded}
        />
        <NavItem
          to="/admin/cms"
          icon="edit_note"
          label={t("admin.menu.cms")}
          isCollapsed={!isExpanded}
        />
        <NavItem
          to="/admin/pricing"
          icon="paid"
          label={t("admin.menu.pricing")}
          isCollapsed={!isExpanded}
        />
        <NavItem
          to="/admin/users"
          icon="group"
          label={t("admin.menu.users")}
          isCollapsed={!isExpanded}
        />
        <NavItem
          to="/admin/coupons"
          icon="confirmation_number"
          label={t("admin.menu.coupons")}
          isCollapsed={!isExpanded}
        />
        <NavItem
          to="/admin/inbox"
          icon="inbox"
          label="Buzón"
          isCollapsed={!isExpanded}
        />

        <NavItem
          to="/admin/domains"
          icon="admin_panel_settings"
          label="Gestión Dominios"
          isCollapsed={!isExpanded}
        />
        <NavItem
          to="/admin/affiliates"
          icon="handshake"
          label="Referidos"
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/admin/settings"
          icon="settings"
          label={t("admin.menu.settings")}
          isCollapsed={!isExpanded}
        />
      </nav>

      {/* User Footer */}
      <div className="p-4 mt-auto">
        <div
          className={`bg-white/5 border border-white/5 rounded-2xl ${isExpanded ? "p-4" : "p-2"} transition-all`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
              rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10 border border-white/10 overflow-hidden shrink-0 transition-all
              ${isExpanded ? "h-12 w-12" : "h-10 w-10"}
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
            {isExpanded && (
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
            className={`flex gap-2 transition-all ${isExpanded ? "mt-4" : "flex-col mt-4"}`}
          >
            <button
              onClick={() => navigate("/admin/settings")}
              title={!isExpanded ? t("admin.menu.settings") : undefined}
              className={`
                flex items-center justify-center h-10 rounded-xl bg-white/5 text-silver hover:text-white hover:bg-white/10 border border-white/10 transition-all
                ${isExpanded ? "flex-1" : "w-10"}
              `}
            >
              <span className="material-symbols-outlined text-sm">
                settings
              </span>
              {isExpanded && (
                <span className="ml-2 text-xs font-bold uppercase tracking-widest">
                  {t("admin.menu.settings")}
                </span>
              )}
            </button>
            <button
              onClick={handleSignOut}
              title={!isExpanded ? t("admin.menu.logout") : undefined}
              className={`
                flex items-center justify-center h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all
                ${isExpanded ? "w-12" : "w-10"}
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
