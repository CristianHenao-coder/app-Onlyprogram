import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import FloatingTutorial from './FloatingTutorial';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      const fetchLinks = async () => {
        const { data } = await supabase.from('smart_links').select('id, title, slug, photo, config').eq('user_id', user.id).order('created_at', { ascending: true });
        if (data) setLinks(data);
      };
      fetchLinks();
    }
  }, [user]);

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
    localStorage.setItem(storageKey, 'true');
    setShowTutorial(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard/home', icon: 'dashboard', label: 'Dashboard', id: 'nav-home' },
    { path: '/dashboard/links', icon: 'link', label: 'Links', id: 'nav-links' },
    { path: '/dashboard/analytics', icon: 'bar_chart', label: 'Analíticas', id: 'nav-analytics' },
    { path: '/dashboard/telegram', icon: 'send', label: 'Telegram', id: 'nav-telegram' },
    { path: '/dashboard/domains', icon: 'globe', label: 'Dominios', id: 'nav-domains' },
    { path: '/dashboard/payments', icon: 'credit_card', label: 'Pagos', id: 'nav-payments' },
    { path: '/dashboard/settings', icon: 'settings', label: 'Configuración', id: 'nav-settings' },
  ];

  const tutorialSteps = [
    { target: '#nav-home', titleKey: 'tutorial.welcome', descriptionKey: 'tutorial.welcome' },
    { target: '#nav-links', titleKey: 'nav.links', descriptionKey: 'tutorial.links' },
    { target: '#nav-analytics', titleKey: 'nav.analytics', descriptionKey: 'tutorial.analytics' },
    { target: '#nav-telegram', titleKey: 'nav.telegram', descriptionKey: 'tutorial.rotation' },
    { target: '#nav-settings', titleKey: 'nav.settings', descriptionKey: 'tutorial.settings' },
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
          {sidebarOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Desktop Toggle Button - Inside sidebar area when open */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`
          hidden lg:block fixed top-4 z-50 p-2.5 bg-background-dark/90 backdrop-blur-lg border border-white/10 rounded-xl text-white hover:bg-purple-500/20 hover:border-purple-500/40 transition-all shadow-lg
          ${sidebarOpen ? 'left-[260px]' : 'left-4'}
        `}
        aria-label="Toggle sidebar"
        title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
      >
        <span className="material-symbols-outlined text-xl">
          {sidebarOpen ? 'menu_open' : 'menu'}
        </span>
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed positioning, collapsible on all screen sizes */}
      <aside
        id="sidebar"
        className={`
          fixed top-0 left-0 h-screen w-72 bg-black/95 backdrop-blur-xl border-r border-white/10 
          transform transition-transform duration-300 ease-in-out z-40 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl">link</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Only Program</h1>
              <p className="text-[10px] text-silver/60 font-bold uppercase tracking-widest">Panel de Control</p>
            </div>
          </Link>
        </div>

        {/* FOLDERS & PROFILES SECTION */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

          {/* FOLDERS SYSTEM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-silver/40 uppercase tracking-widest">Carpetas</h3>
              <button className="text-silver/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>
            <div className="space-y-1">
              {/* Default Folder */}
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-silver/70 hover:bg-white/5 hover:text-white transition-all group">
                <span className="material-symbols-outlined text-lg text-yellow-500/80">folder</span>
                <span className="text-sm font-bold">Mis Proyectos</span>
              </button>
              {links.map(l => l.config?.folder).filter((v, i, a) => v && a.indexOf(v) === i).map(folder => (
                <button key={folder} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-silver/70 hover:bg-white/5 hover:text-white transition-all group">
                  <span className="material-symbols-outlined text-lg text-yellow-500/80">folder</span>
                  <span className="text-sm font-bold">{folder}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PROFILES LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-silver/40 uppercase tracking-widest">Perfiles</h3>
            </div>

            <div className="space-y-2">
              {links.map(link => (
                <div key={link.id} className="group relative">
                  <button
                    onClick={() => {
                      navigate(`/dashboard/links?id=${link.id}`);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all border ${location.search.includes(link.id) ? 'bg-white/10 border-primary/50' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0">
                      {link.photo ? (
                        <img src={link.photo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-silver/40">person</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-bold text-white truncate">{link.title || link.slug}</p>
                      <p className="text-[10px] text-silver/50 truncate">/{link.slug}</p>
                    </div>
                    <div onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/links?id=${link.id}&mode=edit_profile`);
                    }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-silver/40 hover:text-white transition-all cursor-pointer" title="Editar Perfil">
                      <span className="material-symbols-outlined text-xs">edit</span>
                    </div>
                  </button>
                </div>
              ))}

              {/* CREATE NEW PROFILE BUTTON */}
              <button
                onClick={() => {
                  navigate('/dashboard/links/new');
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group text-silver/40 hover:text-primary"
              >
                <div className="w-8 h-8 rounded-full border border-dashed border-current flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">add</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">Crear Nuevo Perfil</span>
              </button>
            </div>
          </div>

          {/* MAIN MENU ITEMS (Collapsed/Secondary) */}
          <div className="pt-6 border-t border-white/5 space-y-1">
            {menuItems.filter(i => !['nav-home', 'nav-links'].includes(i.id)).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                id={item.id}
                onClick={() => setSidebarOpen(false)}
                className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                    ${isActive(item.path)
                    ? 'bg-white/5 text-white border border-white/10'
                    : 'text-silver/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                  `}
              >
                <span className="material-symbols-outlined text-lg">
                  {item.icon}
                </span>
                <span className="font-bold text-xs uppercase tracking-wide">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* User Section - Fixed at bottom */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">
                <span className="material-symbols-outlined text-white text-sm">person</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">
                {user?.user_metadata?.full_name || 'Usuario'}
              </p>
              <p className="text-silver/40 text-[10px] font-mono truncate">{user?.email}</p>
            </div>
            <button className="text-silver/40 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20 hover:border-red-500/30 group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">logout</span>
            <span className="font-black text-[10px] uppercase tracking-widest">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Adjusted for sidebar */}
      <main className={`min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
