import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, ExternalLink, Download, Briefcase, Users, CalendarClock, TrendingUp, XCircle, Archive, RotateCcw, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';
import Modal from '../components/Modal';

const ACCENT = '#5cc5d7';

const columns = [
  { key: 'new', label: 'Nouveau', accent: '#64748B' },
  { key: 'shortlisted', label: 'Présélection', accent: ACCENT },
  { key: 'interview', label: 'Test / Entretien', accent: '#D97706' },
  { key: 'offer_sent', label: 'Offre envoyée', accent: '#7C3AED' },
  { key: 'hired', label: 'Embauché', accent: '#16A34A' },
];

const jobStatusLabels = {
  draft: { label: 'Brouillon', color: '#64748B' },
  published: { label: 'Publiée', color: '#16A34A' },
  closed: { label: 'Fermée', color: '#D97706' },
  archived: { label: 'Archivée', color: '#94A3B8' },
};

const sourceLabels = { site_web: 'Site Web', linkedin: 'LinkedIn', recommandation: 'Cooptation', email: 'Email', autre: 'Autre' };

const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all";
const labelClass = "block text-sm font-medium mb-1.5";
const inputStyle = { backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };
const labelStyle = { color: 'var(--color-text-muted)' };

const emptyJobForm = {
  title: '', department_id: '', description: '', requirements: '',
  contract_type: 'CDI', location: '', work_mode: 'presentiel',
  salary_min: '', salary_max: '', positions_count: 1, deadline: '', status: 'published',
};

const emptyRequestForm = {
  position_title: '', department_id: '', positions_count: 1, reason: 'nouveau_poste',
  contract_type: 'CDI', salary_min: '', salary_max: '', desired_start_date: '', notes: '',
};

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl shadow-sm p-5 border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold font-poppins" style={{ color: 'var(--color-text)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}
    </div>
  );
}

function CandidateCard({ app, onOpen }) {
  return (
    <button
      onClick={() => onOpen(app)}
      className="w-full text-left rounded-xl p-3.5 border transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: ACCENT, color: '#111827' }}>
          {app.candidate?.first_name?.[0]}{app.candidate?.last_name?.[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{app.candidate?.first_name} {app.candidate?.last_name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{app.job_post?.title} · {app.candidate?.years_experience ?? 0} ans</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: 'var(--color-bg)', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
          {sourceLabels[app.source] || app.source}
        </span>
        {app.match_score != null && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
            style={{
              backgroundColor: app.match_score >= 80 ? '#DCFCE7' : app.match_score >= 60 ? '#FEF3C7' : '#FEE2E2',
              color: app.match_score >= 80 ? '#166534' : app.match_score >= 60 ? '#92400E' : '#991B1B',
            }}
          >
            Score : {app.match_score}%
          </span>
        )}
      </div>
    </button>
  );
}

function RecruitmentPage() {
  const [jobPosts, setJobPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState('all');
  const [sourcingLoading, setSourcingLoading] = useState(false);
  const [requestActionId, setRequestActionId] = useState(null);

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormData, setJobFormData] = useState(emptyJobForm);
  const [jobFormError, setJobFormError] = useState(null);
  const [jobFormLoading, setJobFormLoading] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState(emptyRequestForm);
  const [requestFormError, setRequestFormError] = useState(null);
  const [requestFormLoading, setRequestFormLoading] = useState(false);

  const [selectedApp, setSelectedApp] = useState(null);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [talentPoolLoading, setTalentPoolLoading] = useState(false);

  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewData, setInterviewData] = useState({ application_id: null, scheduled_at: '', type: 'visio', location: '' });

  const canManage = hasRole('admin', 'manager');

  const fetchAll = () => {
    Promise.all([
      api.get('/job-posts'),
      api.get('/applications'),
      api.get('/departments'),
      api.get('/recruitment-requests'),
    ]).then(([jobsRes, appsRes, deptRes, reqRes]) => {
      setJobPosts(jobsRes.data.data);
      setApplications(appsRes.data.data);
      setDepartments(deptRes.data);
      setRequests(reqRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreateJob = () => {
    setJobFormData(emptyJobForm);
    setJobFormError(null);
    setShowJobForm(true);
  };

  const handleJobFormChange = (e) => setJobFormData({ ...jobFormData, [e.target.name]: e.target.value });

  const handleJobFormSubmit = (e) => {
    e.preventDefault();
    setJobFormError(null);
    setJobFormLoading(true);
    api.post('/job-posts', jobFormData)
      .then(() => {
        toast.success('Offre publiée avec succès');
        setShowJobForm(false);
        fetchAll();
      })
      .catch((err) => setJobFormError(err.response?.data?.message || 'Une erreur est survenue.'))
      .finally(() => setJobFormLoading(false));
  };

  const openCreateRequest = () => {
    setRequestFormData(emptyRequestForm);
    setRequestFormError(null);
    setShowRequestForm(true);
  };

  const handleRequestFormChange = (e) => setRequestFormData({ ...requestFormData, [e.target.name]: e.target.value });

  const handleRequestFormSubmit = (e) => {
    e.preventDefault();
    setRequestFormError(null);
    setRequestFormLoading(true);
    api.post('/recruitment-requests', requestFormData)
      .then(() => {
        toast.success('Demande de recrutement soumise');
        setShowRequestForm(false);
        fetchAll();
      })
      .catch((err) => setRequestFormError(err.response?.data?.message || 'Une erreur est survenue.'))
      .finally(() => setRequestFormLoading(false));
  };

  const handleApproveRequest = (id) => {
    setRequestActionId(id);
    api.post(`/recruitment-requests/${id}/approve`)
      .then(() => { toast.success('Demande approuvée'); fetchAll(); })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setRequestActionId(null));
  };

  const handleRejectRequest = (id) => {
    setRequestActionId(id);
    api.post(`/recruitment-requests/${id}/reject`)
      .then(() => { toast.success('Demande refusée'); fetchAll(); })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setRequestActionId(null));
  };

  const handleRunSourcing = () => {
    if (activeJobId === 'all') {
      toast.error('Sélectionnez une offre précise pour lancer le sourcing.');
      return;
    }
    setSourcingLoading(true);
    api.post(`/job-posts/${activeJobId}/run-sourcing`)
      .then((res) => {
        toast.success(res.data.message);
        fetchAll();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setSourcingLoading(false));
  };

  const handleStatusChange = (appId, newStatus) => {
    setStatusLoadingId(appId);
    
    setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(prev => ({ ...prev, status: newStatus }));
    }

    api.post(`/applications/${appId}/status`, { status: newStatus })
      .then(() => {
        toast.success(newStatus === 'hired' ? 'Candidat embauché — fiche employé créée !' : 'Statut mis à jour');
        fetchAll();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
        fetchAll();
      })
      .finally(() => setStatusLoadingId(null));
  };

  const handleAddToTalentPool = (candidateId) => {
    setTalentPoolLoading(true);
    // Route corrigée vers /candidates/.../talent-pool pour correspondre aux routes standards
    api.post(`/candidates/${candidateId}/talent-pool`)
      .then(() => {
        toast.success('Candidat ajouté au vivier de talents');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Erreur lors de l'ajout au vivier");
      })
      .finally(() => setTalentPoolLoading(false));
  };

  const handleDownloadCv = (appId) => {
    api.get(`/applications/${appId}/cv`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'cv.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => toast.error('CV non disponible'));
  };

  const handleJobAction = (id, action) => {
    api.post(`/job-posts/${id}/${action}`)
      .then(() => {
        toast.success('Offre mise à jour');
        fetchAll();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const handleInterviewSubmit = (e) => {
    e.preventDefault();
    api.post('/interviews', interviewData)
      .then(() => {
        toast.success('Entretien planifié');
        setShowInterviewForm(false);
        fetchAll();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const filteredApplications = activeJobId === 'all'
    ? applications
    : applications.filter((a) => a.job_post?.id === parseInt(activeJobId));

  const visibleJobPosts = jobPosts.filter((j) => j.status !== 'archived');

  const totalCandidatures = applications.length;
  const activeOffers = jobPosts.filter((j) => j.status === 'published').length;
  const interviewCount = applications.filter((a) => a.status === 'interview').length;
  const hiredCount = applications.filter((a) => a.status === 'hired').length;
  const conversionRate = totalCandidatures > 0 ? ((hiredCount / totalCandidatures) * 100).toFixed(1) : '0.0';

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        <Link to="/talent-pool" className="inline-flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: ACCENT }}>
          <Archive className="w-4 h-4" />
          Voir le vivier de talents
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-poppins text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Gestion du recrutement (ATS)</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Offres actives, candidatures & suivi du pipeline</p>
        </div>
        {canManage && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openCreateRequest}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm border"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <Plus className="w-4 h-4" />
              Nouvelle demande
            </button>
            <button
              onClick={handleRunSourcing}
              disabled={sourcingLoading}
              className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
              style={{ backgroundColor: '#059669' }}
            >
              <Sparkles className="w-4 h-4" />
              {sourcingLoading ? 'Analyse...' : 'Lancer le sourcing'}
            </button>
            <button
              onClick={openCreateJob}
              className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm"
              style={{ backgroundColor: ACCENT }}
            >
              <Plus className="w-4 h-4" />
              Publier une offre
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Briefcase} label="Offres actives" value={activeOffers} sub={`${jobPosts.length} au total`} color={ACCENT} />
        <KpiCard icon={Users} label="Candidatures total" value={totalCandidatures} color={ACCENT} />
        <KpiCard icon={CalendarClock} label="En entretien" value={interviewCount} color="#D97706" />
        <KpiCard icon={TrendingUp} label="Taux de conversion" value={`${conversionRate}%`} sub={`${hiredCount} embauché(s)`} color="#16A34A" />
      </div>

      {requests.filter((r) => r.status === 'submitted').length > 0 && canManage && (
        <div className="rounded-2xl p-4 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: ACCENT }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Demandes de recrutement en attente de validation</p>
          <div className="space-y-2">
            {requests.filter((r) => r.status === 'submitted').map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm border" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <span style={{ color: 'var(--color-text)' }}>
                  <strong style={{ color: ACCENT }}>{r.position_title}</strong> — {r.department || 'Département non précisé'} ({r.positions_count} poste(s))
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(r.id)}
                    disabled={requestActionId === r.id}
                    className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleRejectRequest(r.id)}
                    disabled={requestActionId === r.id}
                    className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    style={{ backgroundColor: '#DC2626' }}
                  >
                    Refusé
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManage && (
        <div className="rounded-2xl shadow-sm border mb-6 overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Gestion des offres</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {visibleJobPosts.map((job) => (
              <div key={job.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{job.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: `${jobStatusLabels[job.status]?.color}18`, color: jobStatusLabels[job.status]?.color }}>
                    {jobStatusLabels[job.status]?.label}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>{job.applications_count} candidature(s)</span>
                </div>
                <div className="flex gap-3 items-center flex-shrink-0">
                  {job.status === 'published' && (
                    <>
                      <a href={`/apply/${job.id}`} target="_blank" rel="noreferrer" title="Voir la page publique" style={{ color: ACCENT }} className="hover:opacity-70 transition-opacity">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleJobAction(job.id, 'close')} title="Fermer l'offre" className="text-amber-500 hover:text-amber-600 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {job.status === 'closed' && (
                    <>
                      <button onClick={() => handleJobAction(job.id, 'republish')} title="Republier" className="text-emerald-500 hover:text-emerald-600 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleJobAction(job.id, 'archive')} title="Archiver" style={{ color: 'var(--color-text-muted)' }} className="hover:opacity-70 transition-opacity">
                        <Archive className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {job.status === 'draft' && (
                    <button onClick={() => handleJobAction(job.id, 'archive')} title="Archiver" style={{ color: 'var(--color-text-muted)' }} className="hover:opacity-70 transition-opacity">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {visibleJobPosts.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Aucune offre pour le moment</p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>Pipeline des candidats</p>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveJobId('all')}
          className="px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
          style={activeJobId === 'all'
            ? { backgroundColor: ACCENT, color: '#111827' }
            : { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          Toutes les offres
        </button>
        {jobPosts.filter((j) => j.status === 'published').map((j) => (
          <button
            key={j.id}
            onClick={() => setActiveJobId(String(j.id))}
            className="px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={activeJobId === String(j.id)
              ? { backgroundColor: ACCENT, color: '#111827' }
              : { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {j.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {columns.map((col) => {
          const items = filteredApplications.filter((a) => a.status === col.key);
          return (
            <div key={col.key} className="rounded-2xl p-3 min-h-[200px] border" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.accent }}></span>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{col.label} ({items.length})</p>
              </div>
              <div className="space-y-2.5">
                {items.map((app) => (
                  <CandidateCard key={app.id} app={app} onOpen={canManage ? setSelectedApp : () => {}} />
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: 'var(--color-text-muted)' }}>Aucun candidat</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nouvelle offre */}
      <Modal isOpen={showJobForm} onClose={() => setShowJobForm(false)} title="Publier une offre" maxWidth="max-w-2xl">
        <form onSubmit={handleJobFormSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass} style={labelStyle}>Titre du poste</label>
              <input type="text" name="title" value={jobFormData.title} onChange={handleJobFormChange} required className={inputClass} style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className={labelClass} style={labelStyle}>Description</label>
              <textarea name="description" value={jobFormData.description} onChange={handleJobFormChange} required rows="3" className={inputClass} style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className={labelClass} style={labelStyle}>Compétences requises</label>
              <textarea name="requirements" value={jobFormData.requirements} onChange={handleJobFormChange} rows="2" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Département</label>
              <select name="department_id" value={jobFormData.department_id} onChange={handleJobFormChange} className={inputClass} style={inputStyle}>
                <option value="">— Aucun —</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Type de contrat</label>
              <select name="contract_type" value={jobFormData.contract_type} onChange={handleJobFormChange} className={inputClass} style={inputStyle}>
                <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="Stage">Stage</option><option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Lieu</label>
              <input type="text" name="location" value={jobFormData.location} onChange={handleJobFormChange} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Mode de travail</label>
              <select name="work_mode" value={jobFormData.work_mode} onChange={handleJobFormChange} className={inputClass} style={inputStyle}>
                <option value="presentiel">Présentiel</option><option value="hybride">Hybride</option><option value="teletravail">Télétravail</option>
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Salaire min</label>
              <input type="number" name="salary_min" value={jobFormData.salary_min} onChange={handleJobFormChange} min="0" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Salaire max</label>
              <input type="number" name="salary_max" value={jobFormData.salary_max} onChange={handleJobFormChange} min="0" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Nombre de postes</label>
              <input type="number" name="positions_count" value={jobFormData.positions_count} onChange={handleJobFormChange} min="1" required className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Date limite</label>
              <input type="date" name="deadline" value={jobFormData.deadline} onChange={handleJobFormChange} className={inputClass} style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className={labelClass} style={labelStyle}>Statut</label>
              <select name="status" value={jobFormData.status} onChange={handleJobFormChange} className={inputClass} style={inputStyle}>
                <option value="draft">Brouillon</option><option value="published">Publiée</option><option value="closed">Fermée</option><option value="archived">Archivée</option>
              </select>
            </div>
          </div>
          {jobFormError && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-4">{jobFormError}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={() => setShowJobForm(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors" style={{ color: 'var(--color-text-muted)' }}>Annuler</button>
            <button type="submit" disabled={jobFormLoading} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: ACCENT }}>
              {jobFormLoading ? 'Publication...' : "Publier l'offre"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nouvelle demande */}
      <Modal isOpen={showRequestForm} onClose={() => setShowRequestForm(false)} title="Nouvelle demande de recrutement">
        <form onSubmit={handleRequestFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>Intitulé du poste</label>
              <input type="text" name="position_title" value={requestFormData.position_title} onChange={handleRequestFormChange} required className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={labelStyle}>Département</label>
                <select name="department_id" value={requestFormData.department_id} onChange={handleRequestFormChange} className={inputClass} style={inputStyle}>
                  <option value="">— Aucun —</option>
                  {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Nombre de postes</label>
                <input type="number" name="positions_count" value={requestFormData.positions_count} onChange={handleRequestFormChange} min="1" required className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={labelStyle}>Motif</label>
                <select name="reason" value={requestFormData.reason} onChange={handleRequestFormChange} className={inputClass} style={inputStyle}>
                  <option value="nouveau_poste">Nouveau poste</option>
                  <option value="remplacement">Remplacement</option>
                  <option value="expansion">Expansion</option>
                </select>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Type de contrat</label>
                <select name="contract_type" value={requestFormData.contract_type} onChange={handleRequestFormChange} className={inputClass} style={inputStyle}>
                  <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="Stage">Stage</option><option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={labelStyle}>Salaire min</label>
                <input type="number" name="salary_min" value={requestFormData.salary_min} onChange={handleRequestFormChange} min="0" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Salaire max</label>
                <input type="number" name="salary_max" value={requestFormData.salary_max} onChange={handleRequestFormChange} min="0" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Date de début souhaitée</label>
              <input type="date" name="desired_start_date" value={requestFormData.desired_start_date} onChange={handleRequestFormChange} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Notes</label>
              <textarea name="notes" value={requestFormData.notes} onChange={handleRequestFormChange} rows="2" className={inputClass} style={inputStyle} />
            </div>
          </div>
          {requestFormError && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-4">{requestFormError}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={() => setShowRequestForm(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors" style={{ color: 'var(--color-text-muted)' }}>Annuler</button>
            <button type="submit" disabled={requestFormLoading} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: ACCENT }}>
              {requestFormLoading ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Détail candidat */}
      <Modal isOpen={selectedApp !== null} onClose={() => setSelectedApp(null)} title="Détail de la candidature">
        {selectedApp && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: ACCENT, color: '#111827' }}>
                  {selectedApp.candidate?.first_name?.[0]}{selectedApp.candidate?.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{selectedApp.candidate?.first_name} {selectedApp.candidate?.last_name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selectedApp.candidate?.email} · {selectedApp.job_post?.title}</p>
                </div>
              </div>

              {/* Bouton Ajouter au vivier de talents */}
              <button
                onClick={() => handleAddToTalentPool(selectedApp.candidate?.id || selectedApp.candidate_id)}
                disabled={talentPoolLoading}
                className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-bg)', color: ACCENT, borderColor: `${ACCENT}40` }}
                title="Ajouter au vivier de talents"
              >
                <UserPlus className="w-4 h-4" />
                {talentPoolLoading ? 'Ajout...' : 'Ajouter au vivier'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-bg)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Expérience</p>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{selectedApp.candidate?.years_experience ?? '—'} an(s)</p>
              </div>
              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-bg)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Score</p>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{selectedApp.match_score ?? '—'}%</p>
              </div>
            </div>

            {selectedApp.candidate?.has_cv && (
              <button onClick={() => handleDownloadCv(selectedApp.id)} className="flex items-center gap-2 text-sm font-medium mb-4 hover:underline" style={{ color: ACCENT }}>
                <Download className="w-4 h-4" /> Télécharger le CV
              </button>
            )}

            {selectedApp.interviews?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>Entretiens</p>
                {selectedApp.interviews.map((iv) => (
                  <div key={iv.id} className="text-sm rounded-lg px-3 py-2 mb-1.5" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
                    {new Date(iv.scheduled_at).toLocaleString('fr-FR')} — {iv.type} {iv.score != null && `— Score: ${iv.score}/100`}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setShowInterviewForm(true); setInterviewData({ application_id: selectedApp.id, scheduled_at: '', type: 'visio', location: '' }); }}
              className="text-sm font-medium mb-4 hover:underline block"
              style={{ color: ACCENT }}
            >
              + Planifier un entretien
            </button>

            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>Changer le statut</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {columns.map((col) => {
                const isActive = selectedApp.status === col.key;
                const isLoading = statusLoadingId === selectedApp.id;
                return (
                  <button
                    key={col.key}
                    onClick={() => handleStatusChange(selectedApp.id, col.key)}
                    disabled={isLoading}
                    className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: isActive ? ACCENT : 'var(--color-bg)',
                      color: isActive ? '#111827' : 'var(--color-text)',
                      border: isActive ? `1px solid ${ACCENT}` : '1px solid var(--color-border)'
                    }}
                  >
                    {col.label}
                  </button>
                );
              })}
              <button
                onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                disabled={statusLoadingId === selectedApp.id}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: selectedApp.status === 'rejected' ? '#DC2626' : 'var(--color-bg)',
                  color: selectedApp.status === 'rejected' ? '#FFFFFF' : '#DC2626',
                  border: '1px solid #DC2626'
                }}
              >
                Refusé
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Planifier entretien */}
      <Modal isOpen={showInterviewForm} onClose={() => setShowInterviewForm(false)} title="Planifier un entretien">
        <form onSubmit={handleInterviewSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>Date et heure</label>
              <input
                type="datetime-local"
                value={interviewData.scheduled_at}
                onChange={(e) => setInterviewData({ ...interviewData, scheduled_at: e.target.value })}
                required
                className={inputClass}
                style={{ ...inputStyle, colorScheme: 'var(--color-scheme, light dark)' }}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Type</label>
              <select value={interviewData.type} onChange={(e) => setInterviewData({ ...interviewData, type: e.target.value })} className={inputClass} style={inputStyle}>
                <option value="visio">Visioconférence</option>
                <option value="telephone">Téléphone</option>
                <option value="presentiel">Présentiel</option>
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Lieu / lien</label>
              <input type="text" value={interviewData.location} onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={() => setShowInterviewForm(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl" style={{ color: 'var(--color-text-muted)' }}>Annuler</button>
            <button type="submit" className="text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all" style={{ backgroundColor: ACCENT, color: '#111827' }}>
              Planifier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RecruitmentPage;