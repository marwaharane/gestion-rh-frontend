import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPublicSettings } from '../services/settings';
import {
  LayoutDashboard, Users, Clock, Calendar, Bell, Wallet,
  Briefcase, FileText, Building2, UserCircle,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, color: '#0D9488' },
  { to: '/employees', label: 'Employés', icon: Users, color: '#0D9488' },
  { to: '/attendances', label: 'Présences', icon: Clock, color: '#0D9488' },
  { to: '/leave-requests', label: 'Congés', icon: Calendar, color:'#0D9488'},
  { to: '/attestations', label: 'Attestations', icon: Bell, color: '#0D9488' },
  { to: '/payroll', label: 'Paie', icon: Wallet, color: '#0D9488' },
  { to: '/recruitment', label: 'Recrutement', icon: Briefcase, color:'#0D9488' },
  { to: '/export', label: 'Documents', icon: FileText, color: '#0D9488'},
  { to: '/profile', label: 'Mon profil', icon: UserCircle, color:'#0D9488' },
];

function Sidebar({ expanded, onExpand, onCollapse }) {
  const location = useLocation();
  const [companyName, setCompanyName] = useState('Gestion RH');

  useEffect(() => {
    getPublicSettings().then((s) => {
      if (s.company_name) setCompanyName(s.company_name);
    });
  }, []);
  return (
    <aside
      onMouseEnter={onExpand}
      onMouseLeave={onCollapse}
      className={`h-screen sticky top-0 flex flex-col border-r transition-all duration-150 z-30 ${expanded ? 'w-64' : 'w-16'}`}
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="h-16 flex items-center gap-2.5 px-4 border-b overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
          <Building2 className="w-5 h-5 text-white" />
        </div>
       {expanded && <span className="font-poppins font-semibold truncate" style={{ color: 'var(--color-text)' }}>{companyName}</span>}
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={!expanded ? item.label : ''}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors overflow-hidden whitespace-nowrap"
              style={
                isActive
                  ? { backgroundColor: item.color, color: '#FFFFFF' }
                  : { color: 'var(--color-text-muted)' }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;