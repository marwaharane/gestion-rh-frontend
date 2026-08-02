import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, Clock, FileText, LogOut, Building2 } from 'lucide-react';
import { getCurrentUser, logout } from '../services/auth';

const navItems = [
  { to: '/employees', label: 'Employés', icon: Users },
  { to: '/attendances', label: 'Présences', icon: Clock },
  { to: '/leave-requests', label: 'Demandes de congé', icon: FileText },
];

function Layout({ onLogout }) {
  const user = getCurrentUser();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : '?';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0F2340 0%, #1E3A5F 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>

        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/10 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 backdrop-blur-sm border border-teal-400/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-teal-300" />
          </div>
          <span className="font-semibold text-white">Gestion RH</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 relative z-10">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Menu principal
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-400/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {user?.roles?.[0] || 'Employé'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-medium text-slate-300 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #1E3A5F 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        ></div>
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;