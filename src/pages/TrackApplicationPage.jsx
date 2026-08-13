import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Calendar, Clock } from 'lucide-react';
import axios from 'axios';

const statusLabels = {
  new: 'Candidature reçue',
  reviewing: 'En cours d\'examen',
  shortlisted: 'Présélectionné(e)',
  interview: 'Entretien',
  offer_sent: 'Offre envoyée',
  hired: 'Recruté(e)',
  rejected: 'Non retenu(e)',
  withdrawn: 'Retirée',
};

function TrackApplicationPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/public/applications/track/${token}`)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E3A5F' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins font-semibold text-slate-900">Gestion RH — Suivi de candidature</span>
        </div>

        {loading && <p className="text-slate-500">Chargement...</p>}
        {error && <p className="text-rose-600">Lien de suivi invalide ou expiré.</p>}

        {data && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <p className="text-sm text-slate-500 mb-1">{data.candidate_name}</p>
            <h1 className="font-poppins text-xl font-bold text-slate-900 mb-4">{data.job_title}</h1>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-1">Statut actuel</p>
              <p className="font-semibold text-slate-900">{statusLabels[data.status] || data.status}</p>
            </div>

            {data.interviews?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Entretiens</p>
                {data.interviews.map((iv, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(iv.scheduled_at).toLocaleString('fr-FR')} — {iv.type}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackApplicationPage;