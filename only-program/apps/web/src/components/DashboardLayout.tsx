import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import FloatingTutorial from "./FloatingTutorial";
import Logo from "./Logo";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? saved === "true" : true;
  });
  const [isHovered, setIsHovered] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      const fetchLinks = async () => {
        const { data } = await supabase
          .from("smart_links")
          .select("id, title, slug, photo, config")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        if (data) setLinks(data);
      };
      fetchLinks();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen.toString());
  }, [sidebarOpen]);

  useEffect(() => {
    // Show tutorial if first time
    const storageKey = `onlyprogram_tour_seen_${user?.id}`;
    const seen = localStorage.getItem(storageKey);
    if (!seen && user) {
      const timer = setTimeout(() => setShowTutorial(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleTutorialComplete = () => {
    const storageKey = `onlyprogram_tour_seen_${user?.id}`;
    localStorage.setItem(storageKey, "true");
    setShowTutorial(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    {
      path: "/dashboard/home",
      icon: "dashboard",
      label: "Dashboard",
      id: "nav-home",
    },
    { path: "/dashboard/links", icon: "link", label: "Links", id: "nav-links" },
    {
      path: "/dashboard/analytics",
      icon: "bar_chart",
      label: "Analíticas",
      id: "nav-analytics",
    },
    {
      path: "/dashboard/telegram",
      icon: "send",
      label: "Telegram",
      id: "nav-telegram",
    },
    {
      path: "/dashboard/domains",
      icon: "globe",
      label: "Dominios",
      id: "nav-domains",
    },
    {
      path: "/dashboard/payments",
      icon: "credit_card",
      label: "Pagos",
      id: "nav-payments",
    },
    {
      path: "/dashboard/settings",
      icon: "settings",
      label: "Configuración",
      id: "nav-settings",
    },
  ];

  const tutorialSteps = [
    {
      target: "#nav-home",
      titleKey: "tutorial.welcome",
      descriptionKey: "tutorial.welcome",
    },
    {
      target: "#nav-links",
      titleKey: "nav.links",
      descriptionKey: "tutorial.links",
    },
    {
      target: "#nav-analytics",
      titleKey: "nav.analytics",
      descriptionKey: "tutorial.analytics",
    },
    {
      target: "#nav-telegram",
      titleKey: "nav.telegram",
      descriptionKey: "tutorial.rotation",
    },
    {
      target: "#nav-settings",
      titleKey: "nav.settings",
      descriptionKey: "tutorial.settings",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-dark to-black">
      <FloatingTutorial
        active={showTutorial}
        steps={tutorialSteps}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialComplete}
      />

      {/* Mobile Menu Button - Fixed Top Left */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-background-dark/90 backdrop-blur-lg border border-white/10 rounded-xl text-white hover:bg-background-dark transition-all shadow-lg"
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-2xl">
          {sidebarOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Sidebar - Fixed positioning, collapsible on all screen sizes */}
    <aside
        id="sidebar"
        onMouseEnter={() => window.innerWidth >= 1024 && setIsHovered(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && setIsHovered(false)}
        className={`
          fixed top-0 left-0 h-screen bg-[#0a0a0a] border-r border-white/5 
          transition-all duration-300 ease-in-out z-40 flex flex-col
          ${(sidebarOpen || isHovered) ? "w-72" : "w-20"}
          ${(!sidebarOpen && !isHovered) ? "max-lg:-translate-x-full" : ""}
          ${isHovered && !sidebarOpen ? "shadow-2xl shadow-black/50 border-r border-primary/20" : ""}
        `}
      >
        {/* Brand Section */}
        <div className="flex flex-col items-center p-6 gap-6">
          <Link to="/dashboard/home" className="flex items-center gap-3 group">
            <div
              className={`
              flex items-center justify-center transition-all duration-500
              ${(sidebarOpen || isHovered) ? "h-20 w-20" : "h-10 w-10"}
            `}
            >
              <Logo className="w-full h-full" imgClassName="p-0" />
            </div>
            {(sidebarOpen || isHovered) && (
              <div className="animate-fade-in">
                <h1 className="text-white font-black tracking-tighter text-xl leading-none uppercase">
                  Only Program
                </h1>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mt-1">
                  Panel de Control
                </p>
              </div>
            )}
          </Link>

          {/* Toggle Button Below Logo */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`
              flex items-center justify-center h-10 rounded-xl border transition-all
              ${sidebarOpen 
                ? "w-full bg-primary text-white border-primary shadow-lg shadow-primary/20 hover:bg-primary-dark" 
                : "w-12 bg-white/5 text-silver border-white/10 hover:text-white hover:bg-white/10"}
            `}
            title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
          >
            <span className="material-symbols-outlined text-xl">
              {sidebarOpen ? "keyboard_double_arrow_left" : "menu"}
            </span>
          </button>
        </div>

        {/* FOLDERS & PROFILES SECTION */}
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar pt-2 space-y-6 transition-all ${(sidebarOpen || isHovered) ? "px-4" : "px-3"}`}
        >
          {(sidebarOpen || isHovered) ? (
            <>
              {/* FOLDERS SYSTEM */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-silver/20 uppercase tracking-[0.2em]">
                    Carpetas
                  </h3>
                  <button className="text-silver/40 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xs">
                      add
                    </span>
                  </button>
                </div>
                <div className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-silver/70 hover:bg-white/5 hover:text-white transition-all group">
                    <span className="material-symbols-outlined text-lg text-yellow-500/80">
                      folder
                    </span>
                    <span className="text-sm font-bold">Mis Proyectos</span>
                  </button>
                  {links
                    .map((l) => l.config?.folder)
                    .filter((v, i, a) => v && a.indexOf(v) === i)
                    .map((folder) => (
                      <button
                        key={folder}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-silver/70 hover:bg-white/5 hover:text-white transition-all group"
                      >
                        <span className="material-symbols-outlined text-lg text-yellow-500/80">
                          folder
                        </span>
                        <span className="text-sm font-bold">{folder}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* PROFILES LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-silver/20 uppercase tracking-[0.2em]">
                    Perfiles
                  </h3>
                </div>
                <div className="space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="group relative">
                      <button
                        onClick={() => {
                          navigate(`/dashboard/links?id=${link.id}`);
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all border ${location.search.includes(link.id) ? "bg-white/10 border-primary/50" : "bg-transparent border-transparent hover:bg-white/5"}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0">
                          {link.photo ? (
                            <img
                              src={link.photo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-xs text-silver/40">
                                person
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {link.title || link.slug}
                          </p>
                          <p className="text-[10px] text-silver/50 truncate">
                            /{link.slug}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate("/dashboard/links/new")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group text-silver/40 hover:text-primary"
                  >
                    <div className="w-8 h-8 rounded-full border border-dashed border-current flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">
                      Crear Nuevo Perfil
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <span className="material-symbols-outlined text-silver/20">
                folder
              </span>
              <span className="material-symbols-outlined text-silver/20">
                person
              </span>
            </div>
          )}

          {/* MAIN MENU ITEMS */}
          <div
            className={`border-t border-white/5 space-y-1 ${(sidebarOpen || isHovered) ? "pt-6" : "pt-4"}`}
          >
            {menuItems
              .filter((i) => !["nav-home", "nav-links"].includes(i.id))
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  id={item.id}
                  onClick={() =>
                    window.innerWidth < 1024 && setSidebarOpen(false)
                  }
                  className={`
                  flex items-center gap-3 rounded-xl transition-all group
                  ${(sidebarOpen || isHovered) ? "px-4 py-3" : "p-3 justify-center"}
                  ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-silver/40 hover:text-white hover:bg-white/5 border border-transparent"
                  }
                `}
                  title={!(sidebarOpen || isHovered) ? item.label : undefined}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  {(sidebarOpen || isHovered) && (
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {item.label}
                    </span>
                  )}
                </Link>
              ))}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 mt-auto">
          <div
            className={`bg-white/5 border border-white/5 rounded-2xl ${(sidebarOpen || isHovered) ? "p-4" : "p-2"} transition-all`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10 border border-white/10 overflow-hidden shrink-0 transition-all
                ${(sidebarOpen || isHovered) ? "h-12 w-12" : "h-10 w-10"}
              `}
              >
                {user?.user_metadata?.avatar_url ||
                user?.user_metadata?.picture ? (
                  <img
                    src={
                      user.user_metadata.avatar_url ||
                      user.user_metadata.picture
                    }
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
              {(sidebarOpen || isHovered) && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <p className="text-sm font-bold truncate text-white">
                    {user?.user_metadata?.full_name ||
                      user?.user_metadata?.name ||
                      "Usuario"}
                  </p>
                  <p className="text-[9px] text-silver/40 truncate uppercase font-black tracking-widest">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`flex gap-2 transition-all ${(sidebarOpen || isHovered) ? "mt-4" : "flex-col mt-4"}`}
            >
              <Link
                to="/dashboard/settings"
                title={(sidebarOpen || isHovered) ? undefined : "Configuración"}
                className={`
                  flex items-center justify-center h-10 rounded-xl bg-white/5 text-silver hover:text-white hover:bg-white/10 border border-white/10 transition-all
                  ${(sidebarOpen || isHovered) ? "flex-1" : "w-10"}
                `}
              >
                <span className="material-symbols-outlined text-sm">
                  settings
                </span>
                {(sidebarOpen || isHovered) && (
                  <span className="ml-2 text-xs font-bold uppercase tracking-widest">
                    Ajustes
                  </span>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                title={(sidebarOpen || isHovered) ? undefined : "Cerrar Sesión"}
                className={`
                  flex items-center justify-center h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all
                  ${(sidebarOpen || isHovered) ? "w-12" : "w-10"}
                `}
              >
                <span className="material-symbols-outlined text-sm">
                  logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"} pb-20 lg:pb-0`}
      >
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">{children}</div>
      </main>

      {/* Bottom Navigation - Mobile/Tablet Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 z-50 px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {menuItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all ${isActive(item.path) ? "text-primary scale-110" : "text-silver/40"}`}
          >
            <span className="material-symbols-outlined text-xl">
              {item.icon}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              {item.label.split(' ')[0]}
            </span>
          </Link>
        ))}
        {/* Toggle Sidebar for more items */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-1 text-silver/40"
        >
          <span className="material-symbols-outlined text-xl">
            more_horiz
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">
            Más
          </span>
        </button>
      </nav>
    </div>
  );
}
