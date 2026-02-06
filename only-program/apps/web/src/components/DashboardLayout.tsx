import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard/overview', icon: 'dashboard', label: t('dashboard.overview') },
    { path: '/dashboard/links', icon: 'link', label: t('dashboard.links') },
    { path: '/dashboard/analytics', icon: 'bar_chart', label: t('dashboard.analytics') },
    { path: '/dashboard/telegram', icon: 'telegram', label: 'Telegram' },
    { path: '/dashboard/payments', icon: 'credit_card', label: t('dashboard.payments') },
    { path: '/dashboard/profile', icon: 'person', label: t('dashboard.profile') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-dark to-black">
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

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed positioning */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-72 bg-background-dark/40 backdrop-blur-xl border-r border-white/10 
          transform transition-transform duration-300 ease-in-out z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-2xl">link</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Only Program</h1>
              <p className="text-xs text-silver/60">{t('dashboard.title')}</p>
            </div>
          </Link>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                ${
                  isActive(item.path)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-silver/70 hover:bg-white/5 hover:text-white border border-transparent'
                }
              `}
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section - Fixed at bottom */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="text-silver/60 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="font-semibold text-sm">{t('dashboard.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Adjusted for sidebar */}
      <main className="lg:ml-72 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
