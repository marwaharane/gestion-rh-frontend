import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';
import { getCurrentUser, logout } from '../services/auth';
import { getTheme, initTheme, toggleTheme } from '../services/theme';
import Sidebar from './Sidebar';

function Layout({ onLogout }) {
  const user = getCurrentUser();
 const [theme, setThemeState] = useState('light');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  useEffect(() => {
    setThemeState(initTheme());
  }, []);

  const handleToggleTheme = () => setThemeState(toggleTheme());

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : '?';

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
     <Sidebar expanded={sidebarExpanded} onExpand={() => setSidebarExpanded(true)} onCollapse={() => setSidebarExpanded(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 flex items-center justify-between px-6 sticky top-0 z-20 border-b"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div></div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-muted)' }}
              title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }}></div>

            <Link to="/profile" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:opacity-80">
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }}>
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium leading-tight" style={{ color: 'var(--color-text)' }}>{user?.name}</p>
                <p className="text-xs capitalize leading-tight" style={{ color: 'var(--color-text-muted)' }}>{user?.roles?.[0] || 'Employé'}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors hover:bg-rose-50 hover:text-rose-600"
              style={{ color: 'var(--color-text-muted)' }}
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;