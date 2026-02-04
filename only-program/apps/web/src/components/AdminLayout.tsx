import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-dark font-sans selection:bg-primary/30 selection:text-white">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block">
        <AdminSidebar />
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
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">Admin Control</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="h-10 w-10 rounded-xl bg-surface/30 border border-border flex items-center justify-center text-silver hover:text-white transition-all">
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
