import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => (
  <NavLinkWrapper to={to}>
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    <span className="font-medium text-sm">{label}</span>
  </NavLinkWrapper>
);

import { NavLink } from 'react-router-dom';
const NavLinkWrapper = ({ to, children }: { to: string, children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
      ${isActive 
        ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' 
        : 'text-silver/40 hover:text-white hover:bg-white/5 border border-transparent'}
    `}
  >
    {children}
  </NavLink>
);

const AdminSidebar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-72 bg-background-dark border-r border-border/50 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white font-black">shield_person</span>
          </div>
          <div>
            <h1 className="text-white font-black tracking-tighter text-xl">ADMIN</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none">Control Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black text-silver/20 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        <NavItem to="/admin/dashboard" icon="dashboard" label="Overview" />
        <NavItem to="/admin/cms" icon="edit_note" label="CMS (Home Editor)" />
        <NavItem to="/admin/users" icon="group" label="User Management" />
        <NavItem to="/admin/links" icon="link" label="Global Links" />
        <NavItem to="/admin/coupons" icon="confirmation_number" label="Coupons" />
        
        <div className="pt-8">
          <p className="px-4 text-[10px] font-black text-silver/20 uppercase tracking-[0.2em] mb-4">Settings</p>
          <NavItem to="/dashboard" icon="arrow_back" label="Back to User App" />
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 mt-auto">
        <div className="bg-surface/30 border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden">
               <span className="material-symbols-outlined text-primary text-xl">person_filled</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-[9px] text-primary truncate uppercase font-black tracking-widest">
                 System Admin
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-all text-xs font-bold border border-red-400/20"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
