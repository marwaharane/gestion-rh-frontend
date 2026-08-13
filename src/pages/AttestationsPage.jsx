import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  FileCheck, 
  Clock3, 
  CheckCircle2, 
  XOctagon, 
  Download, 
  FileCog, 
  XCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';
import Modal from '../components/Modal';

const typeLabels = {
  travail: 'Attestation de travail',
  salaire: 'Attestation de salaire',
  stage: 'Attestation de stage',
  conge: 'Attestation de congé',
  autre: 'Autre document',
};

const statusLabels = {
  pending: { label: 'En attente', className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60' },
  generated: { label: 'Générée', className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' },
  rejected: { label: 'Refusée', className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60' },
};

const emptyForm = { type: 'travail', reason: '', period_start: '', period_end: '' };

// Classes réutilisables avec support Light & Dark Mode
const inputClass = "w-full px-3 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all [color-scheme:light] dark:[color-scheme:dark]";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

// Modal de secours si le composant externe Modal présente des soucis
function DefaultModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-xl relative">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-poppins">{title}</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export default function AttestationsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canManage = hasRole('admin', 'manager');
  const ActiveModal = Modal || DefaultModal;

  const fetchRequests = () => {
    api.get('/attestation-requests')
      .then((response) => {
        setRequests(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openCreateForm = () => {
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setFormError(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    api.post('/attestation-requests', formData)
      .then(() => {
        toast.success('Demande soumise avec succès');
        closeForm();
        fetchRequests();
      })
      .catch((err) => setFormError(err.response?.data?.message || 'Une erreur est survenue.'))
      .finally(() => setFormLoading(false));
  };

  const handleGenerate = (id) => {
    setActionLoadingId(id);
    api.post(`/attestation-requests/${id}/generate`)
      .then(() => {
        toast.success('Attestation générée avec succès');
        fetchRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setActionLoadingId(null));
  };

  const openRejectModal = (id) => {
    setRejectingId(id);
    setRejectionReason('');
  };

  const handleReject = (e) => {
    e.preventDefault();
    setActionLoadingId(rejectingId);
    api.post(`/attestation-requests/${rejectingId}/reject`, { rejection_reason: rejectionReason })
      .then(() => {
        toast.success('Demande refusée');
        setRejectingId(null);
        fetchRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setActionLoadingId(null));
  };

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette demande ?')) return;
    api.delete(`/attestation-requests/${id}`)
      .then(() => {
        toast.success('Demande supprimée');
        fetchRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const handleDownload = (id) => {
    api.get(`/attestation-requests/${id}/download`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'attestation.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => toast.error('Impossible de télécharger le document'));
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const generatedCount = requests.filter((r) => r.status === 'generated').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Chargement...</p>;
  if (error) return <p className="text-rose-600 dark:text-rose-400">Erreur : {error}</p>;

  return (
    <div className="relative">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour à l'accueil
      </Link>

      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-900 dark:text-white">Attestations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Demandes de documents administratifs</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          style={{ backgroundColor: '#0D9488' }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Clock3} label="En attente" value={pendingCount} color="#D97706" />
        <StatCard icon={CheckCircle2} label="Générées" value={generatedCount} color="#0D9488" />
        <StatCard icon={XOctagon} label="Refusées" value={rejectedCount} color="#E11D48" />
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700/60 text-left">
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Employé</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Type</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Motif</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Demandée le</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Statut</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-5 py-4 text-slate-900 dark:text-slate-100 font-medium">{r.employee?.first_name} {r.employee?.last_name}</td>
                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                    {typeLabels[r.type] || r.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{r.reason || '—'}</td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(r.created_at)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[r.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[r.status]?.label || r.status}
                  </span>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[180px] truncate" title={r.rejection_reason}>{r.rejection_reason}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3 items-center">
                    {r.status === 'pending' && canManage && (
                      <>
                        <button type="button" onClick={() => handleGenerate(r.id)} disabled={actionLoadingId === r.id} title="Générer l'attestation" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 disabled:opacity-40 transition-colors cursor-pointer">
                          <FileCog className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => openRejectModal(r.id)} disabled={actionLoadingId === r.id} title="Refuser" className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 disabled:opacity-40 transition-colors cursor-pointer">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {r.status === 'generated' && r.has_file && (
                      <button type="button" onClick={() => handleDownload(r.id)} title="Télécharger" className="text-slate-500 hover:text-[#1E3A5F] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {canManage && (
                      <button type="button" onClick={() => handleDelete(r.id)} title="Supprimer" className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">Aucune demande pour le moment</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal - Création de demande */}
      <ActiveModal isOpen={showForm} onClose={closeForm} title="Nouvelle demande d'attestation">
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Type de document</label>
              <select name="type" value={formData.type} onChange={handleFormChange} required className={inputClass}>
                <option value="travail" className="dark:bg-slate-800 dark:text-white">Attestation de travail</option>
                <option value="salaire" className="dark:bg-slate-800 dark:text-white">Attestation de salaire</option>
                <option value="stage" className="dark:bg-slate-800 dark:text-white">Attestation de stage</option>
                <option value="conge" className="dark:bg-slate-800 dark:text-white">Attestation de congé</option>
                <option value="autre" className="dark:bg-slate-800 dark:text-white">Autre document</option>
              </select>
            </div>
            {(formData.type === 'salaire' || formData.type === 'stage' || formData.type === 'conge') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Période — début</label>
                  <input type="date" name="period_start" value={formData.period_start} onChange={handleFormChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Période — fin</label>
                  <input type="date" name="period_end" value={formData.period_end} onChange={handleFormChange} className={inputClass} />
                </div>
              </div>
            )}
            <div>
              <label className={labelClass}>Motif (optionnel)</label>
              <textarea name="reason" value={formData.reason} onChange={handleFormChange} rows="3" placeholder="Ex : dossier de prêt bancaire, visa..." className={inputClass} />
            </div>
          </div>
          {formError && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 px-3 py-2 rounded-lg mt-4 font-medium">{formError}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <button type="button" onClick={closeForm} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer">
              Annuler
            </button>
            <button type="submit" disabled={formLoading} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm" style={{ backgroundColor: '#0D9488' }}>
              {formLoading ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </div>
        </form>
      </ActiveModal>

      {/* Modal - Refus */}
     <Modal isOpen={rejectingId !== null} onClose={() => setRejectingId(null)} title="Motif du refus">
        <form onSubmit={handleReject}>
          <label className={labelClass}>Expliquez pourquoi cette demande est refusée</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            rows="3"
            autoFocus
            className={inputClass}
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setRejectingId(null)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={actionLoadingId === rejectingId}
              className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all bg-rose-600"
            >
              {actionLoadingId === rejectingId ? 'Envoi...' : 'Confirmer le refus'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}