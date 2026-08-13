import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, FileText, Bell, ArrowRight, UserCircle, Wallet, Briefcase, Download, Calendar } from 'lucide-react';
import api from '../services/api';
import { getCurrentUser } from '../services/auth';

const modules = [
  { to: '/employees', label: 'Employés', icon: Users, color: '#7C3AED', desc: 'Gérez vos collaborateurs et leurs informations.' },
  { to: '/attendances', label: 'Présences', icon: Clock, color: '#0D9488', desc: 'Suivez les présences et les horaires.' },
  { to: '/leave-requests', label: 'Demandes de congé', icon: Calendar, color: '#D97706', desc: 'Gérez les demandes de congé de vos équipes.' },
  { to: '/attestations', label: 'Attestations', icon: Bell, color: '#7C3AED', desc: 'Générez et gérez les attestations.' },
  { to: '/profile', label: 'Mon profil', icon: UserCircle, color: '#0EA5E9', desc: 'Consultez et mettez à jour vos informations.' },
  { to: '/export', label: 'Export des données', icon: Download, color: '#16A34A', desc: 'Exportez vos données RH en toute simplicité.' },
  { to: '/payroll', label: 'Paie', icon: Wallet, color: '#059669', desc: 'Gérez les bulletins et le suivi de la paie.' },
  { to: '/recruitment', label: 'Recrutement', icon: Briefcase, color: '#DB2777', desc: 'Publiez des offres et suivez vos candidatures.' },
];

function Sparkline({ color }) {
  const points = '0,20 15,15 30,18 45,8 60,12 75,4 90,10 100,2';
  return (
    <svg viewBox="0 0 100 24" className="w-24 h-6" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl shadow-sm p-6 flex items-center justify-between border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <p className="text-3xl font-bold font-poppins" style={{ color: 'var(--color-text)' }}>{value}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        </div>
      </div>
      <Sparkline color={color} />
    </div>
  );
}

function HomePage() {
  const user = getCurrentUser();
  const [stats, setStats] = useState({ employees: 0, pendingLeaves: 0, pendingAttestations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/leave-requests'),
      api.get('/attestation-requests'),
    ]).then(([employeesRes, leaveRes, attestationRes]) => {
      setStats({
        employees: employeesRes.data.data.length,
        pendingLeaves: leaveRes.data.data.filter((l) => l.status === 'pending').length,
        pendingAttestations: attestationRes.data.data.filter((a) => a.status === 'pending').length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-poppins text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Tableau de bord</h1>
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Bienvenue {user?.name?.split(' ')[0]} ! Voici un aperçu de votre gestion RH.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard icon={Users} label="Employés au total" value={loading ? '—' : stats.employees} color="#7C3AED" />
        <StatCard icon={Calendar} label="Congés en attente" value={loading ? '—' : stats.pendingLeaves} color="#0D9488" />
        <StatCard icon={FileText} label="Attestations en attente" value={loading ? '—' : stats.pendingAttestations} color="#7C3AED" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>Modules</p>
      <div className="grid grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.to} to={mod.to} className="group">
              <div
                className="rounded-2xl shadow-sm p-6 h-full flex flex-col justify-between border transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${mod.color}18` }}>
                    <Icon className="w-6 h-6" style={{ color: mod.color }} />
                  </div>
                  <p className="font-poppins font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{mod.label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{mod.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 mt-4 transition-colors" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;