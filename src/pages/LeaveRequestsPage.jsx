import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Check, XCircle, Calendar, Clock3, CheckCircle2, XOctagon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';
import Modal from '../components/Modal';

const statusLabels = {
  pending: { label: 'En attente', className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' },
  approved: { label: 'Approuvée', className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' },
  rejected: { label: 'Rejetée', className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30' },
  cancelled: { label: 'Annulée', className: 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50' },
};

const emptyForm = { leave_type_id: '', start_date: '', end_date: '', reason: '' };
const inputClass = "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/45 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-slate-900/45 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm p-5 flex items-center gap-4 backdrop-blur-xl">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-white font-poppins">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [balances, setBalances] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const canManage = hasRole('admin', 'manager');

  const fetchLeaveTypes = () => {
    api.get('/leave-types')
      .then((response) => setLeaveTypes(response.data))
      .catch((err) => {
        console.error('Erreur chargement types de congé :', err);
        toast.error('Impossible de charger les types de congé.');
      });
  };

  const fetchBalances = () => {
    api.get('/my-leave-balances')
      .then((response) => setBalances(response.data))
      .catch((err) => console.error('Erreur chargement soldes :', err));
  };

  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchLeaveRequests = () => {
    api.get('/leave-requests')
      .then((response) => {
        setLeaveRequests(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
    fetchBalances();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    fetchLeaveTypes();
    fetchBalances();
    setShowForm(true);
  };

  const openEditForm = (leave) => {
    setEditingId(leave.id);
    setFormData({
      leave_type_id: leave.leave_type?.id || '',
      start_date: leave.start_date ? leave.start_date.substring(0, 10) : '',
      end_date: leave.end_date ? leave.end_date.substring(0, 10) : '',
      reason: leave.reason || '',
    });
    setFormError(null);
    fetchLeaveTypes();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
  };

  const handleApprove = (id) => {
    setActionLoadingId(id);
    api.post(`/leave-requests/${id}/approve`)
      .then(() => {
        toast.success('Demande approuvée');
        fetchLeaveRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setActionLoadingId(null));
  };

  const handleReject = (id) => {
    setActionLoadingId(id);
    api.post(`/leave-requests/${id}/reject`)
      .then(() => {
        toast.success('Demande rejetée');
        fetchLeaveRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setActionLoadingId(null));
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    const request = editingId
      ? api.put(`/leave-requests/${editingId}`, formData)
      : api.post('/leave-requests', formData);

    request
      .then(() => {
        toast.success(editingId ? 'Demande modifiée avec succès' : 'Demande soumise avec succès');
        closeForm();
        fetchLeaveRequests();
      })
      .catch((err) => {
        const message = err.response?.data?.message || 'Une erreur est survenue.';
        setFormError(message);
      })
      .finally(() => setFormLoading(false));
  };

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette demande de congé ?')) return;

    api.delete(`/leave-requests/${id}`)
      .then(() => {
        toast.success('Demande supprimée avec succès');
        fetchLeaveRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const filteredLeaveRequests = leaveRequests.filter((leave) => {
    const matchesSearch = searchTerm === '' ||
      `${leave.employee?.first_name} ${leave.employee?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLeaveRequests.length / itemsPerPage);
  const paginatedLeaveRequests = filteredLeaveRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pendingCount = leaveRequests.filter((l) => l.status === 'pending').length;
  const approvedCount = leaveRequests.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaveRequests.filter((l) => l.status === 'rejected').length;

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Chargement...</p>;
  if (error) return <p className="text-rose-500">Erreur : {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-800 dark:text-white">Demandes de congé</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestion des congés et absences</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm"
          style={{ backgroundColor: '#0D9488' }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Clock3} label="En attente" value={pendingCount} color="#F59E0B" />
        <StatCard icon={CheckCircle2} label="Approuvées" value={approvedCount} color="#0D9488" />
        <StatCard icon={XOctagon} label="Rejetées" value={rejectedCount} color="#F43F5E" />
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900/45 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-slate-900/45 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-sm">
          <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Tous les statuts</option>
          <option value="pending" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">En attente</option>
          <option value="approved" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Approuvée</option>
          <option value="rejected" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Rejetée</option>
          <option value="cancelled" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Annulée</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900/45 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-left">
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Employé</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Type</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Période</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Jours</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Statut</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {paginatedLeaveRequests.map((leave) => (
              <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 text-slate-800 dark:text-white font-medium">{leave.employee?.first_name} {leave.employee?.last_name}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{leave.leave_type?.name}</td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">{leave.days_count}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[leave.status]?.className || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    {statusLabels[leave.status]?.label || leave.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3 items-center">
                    {leave.status === 'pending' && hasRole('admin', 'manager') && (
                      <>
                        <button onClick={() => handleApprove(leave.id)} disabled={actionLoadingId === leave.id} title="Approuver" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(leave.id)} disabled={actionLoadingId === leave.id} title="Rejeter" className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 disabled:opacity-40 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {canManage && (
                      <>
                        <button onClick={() => openEditForm(leave)} title="Modifier" className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(leave.id)} title="Supprimer" className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedLeaveRequests.length === 0 && (
              <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-400">Aucune demande</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm bg-white dark:bg-slate-900/45 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm">
            Précédent
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400">Page {currentPage} sur {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm bg-white dark:bg-slate-900/45 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm">
            Suivant
          </button>
        </div>
      )}

      {/* MODALE */}
      <Modal isOpen={showForm} onClose={closeForm} title={editingId ? 'Modifier la demande' : 'Nouvelle demande'}>
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Type de congé</label>
              <select name="leave_type_id" value={formData.leave_type_id} onChange={handleFormChange} required className={inputClass}>
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">— Sélectionner —</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{type.name}</option>
                ))}
              </select>
              {leaveTypes.length === 0 && (
                <p className="text-xs text-rose-500 mt-1">Aucun type de congé chargé. Vérifiez la console (F12).</p>
              )}
              {formData.leave_type_id && (() => {
                const balance = balances.find((b) => b.leave_type_id === parseInt(formData.leave_type_id));
                return balance ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Solde restant : <span className="font-medium text-teal-600 dark:text-teal-400">{balance.remaining_days} jour(s)</span> sur {balance.allocated_days}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Aucun solde défini pour ce type de congé.</p>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date de début</label>
                <div className="relative">
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleFormChange} required className={`${inputClass} [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer`} />
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Date de fin</label>
                <div className="relative">
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleFormChange} required className={`${inputClass} [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer`} />
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Motif</label>
              <textarea name="reason" value={formData.reason} onChange={handleFormChange} rows="3" className={inputClass} />
            </div>
          </div>
          {formError && <p className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-3 py-2 rounded-lg mt-4">{formError}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
            <button type="button" onClick={closeForm} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">Annuler</button>
            <button type="submit" disabled={formLoading} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm" style={{ backgroundColor: '#0D9488' }}>
              {formLoading ? 'Envoi...' : (editingId ? 'Enregistrer' : 'Soumettre')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LeaveRequestsPage;