import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Archive, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ACCENT = '#3B82F6';

function TalentPoolPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchPool = () => {
    api.get('/candidates/pool')
      .then((res) => { setCandidates(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPool(); }, []);

  const handleRemove = (id) => {
    setRemovingId(id);
    api.delete(`/candidates/${id}/talent-pool`)
      .then(() => {
        toast.success('Candidat retiré du vivier');
        fetchPool();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setRemovingId(null));
  };

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  return (
    <div>
      <Link to="/recruitment" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: 'var(--color-text-muted)' }}>
        <ArrowLeft className="w-4 h-4" />
        Retour au recrutement
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ACCENT}18` }}>
          <Archive className="w-5 h-5" style={{ color: ACCENT }} />
        </div>
        <h1 className="font-poppins text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Vivier de talents</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{candidates.length} profil(s) conservé(s) pour de futures opportunités</p>

      {candidates.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <Archive className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>Aucun candidat dans le vivier</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Les profils intéressants non retenus peuvent y être ajoutés depuis leur fiche de candidature.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md flex flex-col justify-between"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{c.first_name} {c.last_name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.years_experience ?? 0} an(s) d'expérience</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </p>
                  {c.phone && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      {c.phone}
                    </p>
                  )}
                </div>

                {c.pool_note && (
                  <p className="text-xs italic rounded-lg px-3 py-2 mb-3" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                    {c.pool_note}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleRemove(c.id)}
                disabled={removingId === c.id}
                className="flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition-all hover:opacity-80 disabled:opacity-50 mt-2"
                style={{ borderColor: '#DC2626', color: '#DC2626', backgroundColor: 'transparent' }}
              >
                <UserMinus className="w-3.5 h-3.5" />
                {removingId === c.id ? 'Retrait...' : 'Retirer du vivier'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TalentPoolPage;