import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, FileText, FileCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { getCurrentUser } from '../services/auth';

const quickLinks = [
  { 
    to: '/employees', 
    label: 'Employés', 
    icon: Users, 
    color: '#6366F1', 
    desc: 'Gérer les fiches employés' 
  },
  { 
    to: '/attendances', 
    label: 'Présences', 
    icon: Clock, 
    color: '#14B8A6', 
    desc: 'Suivi des pointages' 
  },
  { 
    to: '/leave-requests', 
    label: 'Demandes de congé', 
    icon: FileText, 
    color: '#F59E0B', 
    desc: 'Gérer les absences' 
  },
  { 
    to: '/attestations', 
    label: 'Attestations', 
    icon: FileCheck, 
    color: '#A855F7', 
    desc: 'Demandes de documents' 
  },
];

function DashboardPage() {
  const user = getCurrentUser();
  const [stats, setStats] = useState({ 
    employees: 0, 
    pendingLeaves: 0, 
    pendingAttestations: 0, 
    todayPresent: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/leave-requests'),
      api.get('/attestation-requests'),
      api.get('/attendances'),
    ]).then(([employeesRes, leaveRes, attestationRes, attendanceRes]) => {
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        employees: employeesRes.data.data.length,
        pendingLeaves: leaveRes.data.data.filter((l) => l.status === 'pending').length,
        pendingAttestations: attestationRes.data.data.filter((a) => a.status === 'pending').length,
        todayPresent: attendanceRes.data.data.filter((a) => a.date?.startsWith(today) && a.status === 'present').length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="animate-fade-in-up">
      {/* Header de bienvenue */}
      <div className="mb-8">
        <h1 
          className="font-poppins text-2xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p 
          className="text-sm mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Voici un aperçu de votre espace RH aujourd'hui
        </p>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="card-static p-5">
          <p 
            className="text-3xl font-bold font-poppins tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {loading ? '—' : stats.employees}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Employés
          </p>
        </div>

        <div className="card-static p-5">
          <p 
            className="text-3xl font-bold font-poppins tracking-tight"
            style={{ color: '#14B8A6' }}
          >
            {loading ? '—' : stats.todayPresent}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Présents aujourd'hui
          </p>
        </div>

        <div className="card-static p-5">
          <p 
            className="text-3xl font-bold font-poppins tracking-tight"
            style={{ color: '#F59E0B' }}
          >
            {loading ? '—' : stats.pendingLeaves}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Congés en attente
          </p>
        </div>

        <div className="card-static p-5">
          <p 
            className="text-3xl font-bold font-poppins tracking-tight"
            style={{ color: '#A855F7' }}
          >
            {loading ? '—' : stats.pendingAttestations}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Attestations en attente
          </p>
        </div>
      </div>

      {/* Accès rapide */}
      <p 
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Accès rapide
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="card-pro p-5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${link.color}18` }}
                >
                  <Icon className="w-6 h-6" style={{ color: link.color }} />
                </div>
                <div>
                  <p 
                    className="font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {link.label}
                  </p>
                  <p 
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {link.desc}
                  </p>
                </div>
              </div>
              <ArrowRight 
                className="w-4 h-4 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardPage;