import { useMemo, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse


  const navItems: NavItem[] = useMemo(
    () => [
      { to: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
      { to: "/dashboard/links", label: t("nav.links"), icon: "link" },
      { to: "/dashboard/payments", label: t("nav.payments"), icon: "payments" },
      { to: "/dashboard/settings", label: t("nav.settings"), icon: "settings" },
    ],
    [t]
  );



  const sidebarWidth = collapsed ? "w-[76px]" : "w-[280px]";

  return (
    <div className="min-h-[100dvh] bg-background-dark text-silver">
      {/* MOBILE OVERLAY */}
      <div
        className={[
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR (desktop fixed column, mobile drawer overlay) */}
      <aside
        className={[
          "fixed top-0 left-0 z-[70] h-[100dvh] border-r border-border bg-[#0B0B0B]/80 backdrop-blur-xl",
          "transition-transform duration-300 md:translate-x-0",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
          <div className="h-10 w-10 rounded-2xl bg-surface/60 border border-border flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">verified</span>
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-extrabold leading-tight">Only Program</p>
              <p className="text-[11px] text-silver/45 -mt-0.5">User Panel</p>
            </div>
          )}

          <button
            type="button"
            className={[
              "ml-auto hidden md:inline-flex items-center justify-center rounded-xl border border-border bg-surface/40",
              "h-9 w-9 text-silver/70 hover:text-white hover:border-primary/40 transition-all",
            ].join(" ")}
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3">
          <p className={["px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-silver/40", collapsed ? "text-center" : ""].join(" ")}>
            Menu
          </p>

          <div className="mt-1 space-y-1">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/dashboard"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 border transition-all",
                    isActive
                      ? "border-primary/40 bg-primary/10 text-white"
                      : "border-transparent bg-surface/10 hover:bg-surface/20 text-silver/70 hover:text-white",
                    collapsed ? "justify-center" : "",
                  ].join(" ")
                }
              >
                <span className={["material-symbols-outlined text-[20px]", "text-primary"].join(" ")}>{it.icon}</span>
                {!collapsed && <span className="font-semibold">{it.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom user card */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-[#0B0B0B]">

          {/* Logout Button */}
          <button
            onClick={() => { signOut(); navigate('/login'); }}
            className={`w-full mb-3 flex items-center gap-3 rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${collapsed ? 'justify-center' : ''}`}
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {!collapsed && <span className="text-xs font-bold uppercase tracking-wide">Cerrar Sesión</span>}
          </button>

          <div className={["rounded-2xl border border-white/10 bg-surface/20 p-3", collapsed ? "flex justify-center" : ""].join(" ")}>
            <div className={["flex items-center gap-3", collapsed ? "justify-center" : ""].join(" ")}>
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-silver/70">person</span>
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{profile?.full_name || user?.email?.split('@')[0] || "Usuario"}</p>
                  <p className="text-[11px] text-silver/45 truncate">{user?.email || ""}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA (reserve sidebar width on desktop only) */}
      <div className={["min-h-[100dvh] transition-[padding] duration-300", "md:pl-[280px]", collapsed ? "md:pl-[76px]" : ""].join(" ")}>
        {/* TOPBAR */}


        {/* CONTENT */}
        <main className="px-4 sm:px-6 py-6 relative">
          {/* Mobile Menu Trigger (restored since header is gone) */}
          <button
            type="button"
            className="md:hidden absolute top-6 left-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface/40 text-silver/70 hover:text-white hover:border-primary/40 transition-all"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
