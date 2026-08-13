import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, MapPin, Briefcase, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { apiUpload } from '../services/api';
import { getCsrfCookie } from '../services/csrf';

const inputClass = "w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', city: '',
  linkedin_url: '', years_experience: '', expected_salary: '',
  availability_date: '', consent_given: false,
};

function PublicApplyPage() {
  const { jobPostId } = useParams();
  const [jobPost, setJobPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [cvFile, setCvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/public/job-posts/${jobPostId}`)
      .then((res) => {
        setJobPost(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobPostId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!cvFile) {
      setError('Merci de joindre votre CV.');
      return;
    }

    setSubmitting(true);

    try {
      // Étape obligatoire : récupérer le cookie de sécurité avant tout envoi
      await getCsrfCookie();

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      payload.append('cv', cvFile);

      await apiUpload.post(`/public/job-posts/${jobPostId}/apply`, payload);

      setSubmitted(true);
      toast.success('Candidature envoyée !');
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>;
  if (!jobPost) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cette offre n'est plus disponible.</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E3A5F' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins font-semibold text-slate-900">Gestion RH — Carrières</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 mb-6">
          <h1 className="font-poppins text-2xl font-bold text-slate-900 mb-2">{jobPost.title}</h1>
          <div className="flex gap-4 text-sm text-slate-500 mb-4">
            <span className="inline-flex items-center gap-1"><Briefcase className="w-4 h-4" />{jobPost.contract_type}</span>
            {jobPost.location && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{jobPost.location}</span>}
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-line">{jobPost.description}</p>
          {jobPost.requirements && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-900 mb-1">Compétences requises</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{jobPost.requirements}</p>
            </div>
          )}
        </div>

        {submitted ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="font-semibold text-slate-900 mb-1">Candidature envoyée avec succès</p>
            <p className="text-sm text-slate-500">Notre équipe RH examinera votre profil et vous contactera prochainement.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <h2 className="font-poppins font-semibold text-slate-900 mb-5">Postuler à cette offre</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Ville</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn / Portfolio</label>
                <input type="text" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Années d'expérience</label>
                <input type="number" name="years_experience" value={formData.years_experience} onChange={handleChange} min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prétention salariale</label>
                <input type="number" name="expected_salary" value={formData.expected_salary} onChange={handleChange} min="0" className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Disponibilité</label>
                <input type="date" name="availability_date" value={formData.availability_date} onChange={handleChange} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>CV (PDF, DOC — max 5 Mo)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files[0])} required className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" name="consent_given" checked={formData.consent_given} onChange={handleChange} required className="mt-0.5" />
                  J'accepte que mes données personnelles soient utilisées dans le cadre de ce processus de recrutement.
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-4">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ backgroundColor: '#DB2777' }}
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PublicApplyPage;