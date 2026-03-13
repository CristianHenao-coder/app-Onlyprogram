import { useMemo, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/I18nContext";
import Logo from "@/components/Logo";

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
      { to: "/dashboard/analytics", label: t("nav.analytics"), icon: "analytics" },
      { to: "/dashboard/links", label: t("nav.links"), icon: "link" },
      { to: "/dashboard/pricing", label: "Precios y Planes", icon: "workspace_premium" },
      { to: "/dashboard/payments", label: t("nav.payments"), icon: "payments" },
      { to: "/dashboard/affiliates", label: "Referidos", icon: "handshake" },
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
        <div className={`flex flex-col items-center justify-center border-b border-border transition-all ${collapsed ? 'h-24 py-4 px-2' : 'h-48 py-8 px-4'}`}>
          <Logo className={`${collapsed ? 'h-10 w-10' : 'h-28 w-28'} shrink-0 filter drop-shadow-[0_0_15px_rgba(0,123,255,0.2)]`} imgClassName="p-0" />

          {!collapsed && (
            <div className="text-center mt-3 animate-fade-in">
              <p className="text-white font-black leading-none text-xl tracking-tighter uppercase">Only Program</p>
              <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em] mt-1">User Panel</p>
            </div>
          )}
        </div>

        {/* Collapse tab — sticks out from the right edge, vertically centered */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle sidebar"
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3 z-10
            h-10 w-6 items-center justify-center
            rounded-r-xl border border-l-0 border-border bg-[#0B0B0B]
            text-silver/50 hover:text-white hover:bg-surface/40 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>

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

        {/* Bottom: user card + logout */}
        <div className="absolute bottom-0 left-0 right-0 pb-6 px-3 pt-3 border-t border-border bg-[#0B0B0B]">

          {/* User card */}
          <div className={["rounded-2xl border border-white/10 bg-surface/20 p-3 mb-2", collapsed ? "flex justify-center" : ""].join(" ")}>
            <div className={["flex items-center gap-3", collapsed ? "justify-center" : ""].join(" ")}>
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
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

          {/* Logout — always last */}
          <button
            onClick={() => { signOut(); navigate('/login'); }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${collapsed ? 'justify-center' : ''}`}
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {!collapsed && <span className="text-xs font-bold uppercase tracking-wide">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* MAIN AREA (reserve sidebar width on desktop only) */}
      <div className={["min-h-[100dvh] transition-[padding] duration-300", "md:pl-[280px]", collapsed ? "md:pl-[76px]" : ""].join(" ")}>
        
        {/* MOBILE TOPBAR */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border bg-[#0B0B0B]/80 backdrop-blur-xl fixed top-0 w-full z-40">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" imgClassName="p-0" />
            <span className="text-white font-black text-sm tracking-tighter uppercase">Only Program</span>
          </div>
          <button
            type="button"
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-surface/20 text-silver/70 hover:text-white transition-all shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* CONTENT */}
        <main className="px-0 sm:px-6 py-6 pt-20 md:pt-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
