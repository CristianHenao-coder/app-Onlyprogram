import { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useTranslation } from '@/contexts/I18nContext';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { language, setLanguage, t } = useTranslation() as any;
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!langRef.current) return;
      if (!langRef.current.contains(e.target as any)) setLangOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown as any);
  }, []);

  const currentLang = (language || "es").toLowerCase();

  const setLang = (lng: "es" | "en" | "fr") => {
    if (setLanguage) setLanguage(lng);
    setLangOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background-dark font-sans selection:bg-primary/30 selection:text-white">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block transition-all duration-300">
        <AdminSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar for Mobile */}
      <div className={`
        fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 lg:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
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
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">{t('admin.layout.panel')}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-surface/30 border border-border text-xs font-bold text-silver hover:text-white transition-all shadow-lg shadow-black/20"
              >
                <span className="material-symbols-outlined text-lg">language</span>
                <span>{currentLang.toUpperCase()}</span>
                <span className="material-symbols-outlined text-sm opacity-50">expand_more</span>
              </button>

              <div
                className={`
                  absolute right-0 mt-2 w-40 rounded-2xl border border-border bg-[#0B0B0B] shadow-2xl overflow-hidden z-50
                  transition-all duration-200 origin-top-right
                  ${langOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}
                `}
              >
                {[
                  { id: 'es', label: 'Español' },
                  { id: 'en', label: 'English' },
                  { id: 'fr', label: 'Français' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLang(l.id as any)}
                    className={`
                      w-full text-left px-4 py-3 text-xs font-bold transition-colors
                      ${currentLang === l.id ? 'bg-primary/10 text-primary' : 'text-silver/70 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="h-10 w-10 rounded-xl bg-surface/30 border border-border flex items-center justify-center text-silver hover:text-white transition-all shadow-lg shadow-black/20">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
           <div className="max-w-7xl mx-auto pb-12">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
