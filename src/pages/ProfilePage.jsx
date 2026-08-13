import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Building2, Briefcase, 
  Calendar, UserCheck, BadgeCheck, ShieldCheck 
} from 'lucide-react';
import api from '../services/api';

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

const contractLabels = { CDI: 'CDI', CDD: 'CDD', Stage: 'Stage', Freelance: 'Freelance' };
const statusLabels = { active: 'Actif', inactive: 'Inactif', terminated: 'Terminé' };

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/my-profile')
      .then((response) => {
        setProfile(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Impossible de charger le profil.');
        setLoading(false);
      });
  }, []);

  const initials = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() : '?';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Bouton Retour */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour au tableau de bord
      </Link>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <p className="text-teal-600 text-sm font-medium animate-pulse">Chargement du profil...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          
          {/* CARTE D'EN-TÊTE COLORÉE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Liseré supérieur coloré */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500"></div>

            <div className="flex items-center gap-5 pt-1">
              {/* Avatar avec dégradé Vibrant */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/20 border border-teal-400/30">
                {initials}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 font-poppins tracking-tight">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${
                    profile.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {statusLabels[profile.status] || profile.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                  <span>{profile.position || 'Poste non renseigné'}</span>
                  {profile.department && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md text-xs font-semibold border border-teal-100">
                        {profile.department}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Badge Matricule Teinté */}
            {profile.matricule && (
              <div className="bg-teal-50/60 border border-teal-100 px-4 py-2.5 rounded-xl flex items-center gap-3 self-start md:self-auto">
                <div className="p-2 bg-teal-600 text-white rounded-lg shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Matricule</span>
                  <span className="text-sm font-mono font-bold text-slate-800">{profile.matricule}</span>
                </div>
              </div>
            )}
          </div>

          {/* GRILLE D'INFORMATIONS AVEC TOUCHES DE COULEUR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* BLOC 1 : INFORMATIONS PROFESSIONNELLES */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Informations Professionnelles
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 hover:bg-teal-50/30 hover:border-teal-100 transition-colors">
                  <div className="p-2 bg-teal-100/80 text-teal-700 rounded-lg flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Département</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.department || '—'}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 hover:bg-indigo-50/30 hover:border-indigo-100 transition-colors">
                  <div className="p-2 bg-indigo-100/80 text-indigo-700 rounded-lg flex-shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Manager direct</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.manager || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3 hover:bg-emerald-50/30 hover:border-emerald-100 transition-colors">
                    <div className="p-2 bg-emerald-100/80 text-emerald-700 rounded-lg flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Date d'embauche</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{formatDate(profile.hire_date)}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3 hover:bg-purple-50/30 hover:border-purple-100 transition-colors">
                    <div className="p-2 bg-purple-100/80 text-purple-700 rounded-lg flex-shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Contrat</p>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {contractLabels[profile.contract_type] || profile.contract_type || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOC 2 : COORDONNÉES & IDENTITÉ */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Coordonnées & Identité
                </h2>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 hover:bg-blue-50/30 hover:border-blue-100 transition-colors">
                  <div className="p-2 bg-blue-100/80 text-blue-700 rounded-lg flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Email professionnel</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.email || '—'}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 hover:bg-violet-50/30 hover:border-violet-100 transition-colors">
                  <div className="p-2 bg-violet-100/80 text-violet-700 rounded-lg flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Numéro de téléphone</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.phone || '—'}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 hover:bg-teal-50/30 hover:border-teal-100 transition-colors">
                  <div className="p-2 bg-teal-100/80 text-teal-700 rounded-lg flex-shrink-0">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Identifiant unique (Matricule)</p>
                    <p className="text-sm font-semibold font-mono text-slate-800 mt-0.5">{profile.matricule || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default ProfilePage;