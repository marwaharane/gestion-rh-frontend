import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import api from '../services/api';

function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/job-posts')
      .then((res) => { setJobs(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E3A5F' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins font-semibold text-slate-900">Gestion RH — Carrières</span>
        </div>

        <h1 className="font-poppins text-3xl font-bold text-slate-900 mb-2">Nos offres d'emploi</h1>
        <p className="text-slate-500 mb-8">Rejoignez notre équipe. Découvrez les postes actuellement ouverts.</p>

        {loading && <p className="text-slate-500">Chargement...</p>}
        {!loading && jobs.length === 0 && <p className="text-slate-500">Aucune offre disponible pour le moment.</p>}

        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/apply/${job.id}`}
              className="block bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-poppins font-semibold text-lg text-slate-900 mb-1">{job.title}</h2>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.contract_type}</span>
                    {job.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                    {job.department && <span>{job.department}</span>}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CareersPage;