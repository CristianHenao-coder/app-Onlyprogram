import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Logo from './Logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { pathname } = useLocation();
  const { signOut, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { label: 'Mis Links', icon: 'link', href: '/dashboard' },
    { label: 'Analíticas', icon: 'analytics', href: '/dashboard/analytics' },
    { label: 'Telegram Rotating', icon: 'sync', href: '/dashboard/telegram' },
    { label: 'Soporte', icon: 'support_agent', href: '/dashboard/support' },
    ...(isAdmin ? [{ label: 'Panel Admin', icon: 'shield_person', href: '/admin' }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-dark text-white flex">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface/50 border-r border-border backdrop-blur-xl 
        transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 mb-10 group">
            <Logo className="h-10 w-10 sm:h-10 sm:w-10" />
            <span className="text-lg font-bold tracking-tight uppercase group-hover:text-primary transition-colors">
              Only <span className="text-primary text-xs">Program</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                    ${isActive 
                      ? 'bg-primary/10 border border-primary/20 text-white' 
                      : 'text-silver/60 hover:text-white hover:bg-white/5 border border-transparent'}
                  `}
                >
                  <span className={`material-symbols-outlined text-xl ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="mt-auto pt-6 border-t border-border/50">
            <Link 
              to="/dashboard/settings"
              className={`
                flex items-center gap-3 mb-4 p-3 rounded-2xl transition-all group border
                ${pathname === '/dashboard/settings' 
                  ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' 
                  : 'bg-surface/30 border-border hover:border-silver/30 hover:bg-white/5'}
              `}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-105 transition-transform overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-xl">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-white">
                  {user?.user_metadata?.full_name || 'Usuario'}
                </p>
                <p className="text-[9px] text-primary truncate uppercase font-black tracking-widest">
                   {user?.user_metadata?.plan_type || 'Plan Básico'}
                </p>
              </div>
              <span className="material-symbols-outlined text-silver/20 text-sm">settings</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-silver/40 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm group"
            >
              <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-6 bg-background-dark/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-silver hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-xl font-bold text-white hidden sm:block">
              {menuItems.find(m => m.href === pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             {/* Simple Notification Dot */}
             <button className="relative p-2 text-silver hover:text-white transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-background-dark"></span>
             </button>
             
             {/* The avatar was removed from here and moved to the sidebar footer */}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
