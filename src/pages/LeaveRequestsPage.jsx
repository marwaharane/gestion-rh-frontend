import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, Check, XCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';

const statusLabels = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  approved: { label: 'Approuvée', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rejected: { label: 'Rejetée', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  cancelled: { label: 'Annulée', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
};

const emptyForm = { leave_type_id: '', start_date: '', end_date: '', reason: '' };

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

const inputClass = "w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

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

  const fetchBalances = () => {
    api.get('/my-leave-balances').then((response) => {
      setBalances(response.data);
    });
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
    api.get('/leave-types').then((response) => {
      setLeaveTypes(response.data);
    });
    fetchBalances();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
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

  if (loading) return <p className="text-slate-500">Chargement...</p>;
  if (error) return <p className="text-rose-600">Erreur : {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-900">Demandes de congé</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion des congés et absences</p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-sm"
          style={{ backgroundColor: '#0D9488' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Annuler' : 'Nouvelle demande'}
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvée</option>
          <option value="rejected">Rejetée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6 max-w-lg">
          <h3 className="font-poppins text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Modifier la demande' : 'Nouvelle demande'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Type de congé</label>
              <select name="leave_type_id" value={formData.leave_type_id} onChange={handleFormChange} required className={inputClass}>
                <option value="">— Sélectionner —</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {formData.leave_type_id && (() => {
                const balance = balances.find((b) => b.leave_type_id === parseInt(formData.leave_type_id));
                return balance ? (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Solde restant : <span className="font-medium text-[#0D9488]">{balance.remaining_days} jour(s)</span> sur {balance.allocated_days}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1.5">Aucun solde défini pour ce type de congé.</p>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date de début</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleFormChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date de fin</label>
                <input type="date" name="end_date" value={formData.end_date} onChange={handleFormChange} required className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Motif</label>
              <textarea name="reason" value={formData.reason} onChange={handleFormChange} rows="3" className={inputClass} />
            </div>
          </div>
          {formError && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-4">{formError}</p>}
          <button type="submit" disabled={formLoading} className="mt-4 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: '#0D9488' }}>
            {formLoading ? 'Envoi...' : (editingId ? 'Enregistrer les modifications' : 'Soumettre la demande')}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-left">
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Employé</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Type</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Période</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Jours</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Statut</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLeaveRequests.map((leave) => (
              <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4 text-slate-900 font-medium">{leave.employee?.first_name} {leave.employee?.last_name}</td>
                <td className="px-5 py-4 text-slate-700">{leave.leave_type?.name}</td>
                <td className="px-5 py-4 text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700 font-medium">{leave.days_count}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[leave.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[leave.status]?.label || leave.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3 items-center">
                    {leave.status === 'pending' && hasRole('admin', 'manager') && (
                      <>
                        <button
                          onClick={() => handleApprove(leave.id)}
                          disabled={actionLoadingId === leave.id}
                          title="Approuver"
                          className="text-emerald-600 hover:text-emerald-700 disabled:opacity-40 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(leave.id)}
                          disabled={actionLoadingId === leave.id}
                          title="Rejeter"
                          className="text-rose-600 hover:text-rose-700 disabled:opacity-40 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {canManage && (
                      <>
                        <button onClick={() => openEditForm(leave)} title="Modifier" className="text-slate-400 hover:text-[#1E3A5F] transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(leave.id)} title="Supprimer" className="text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">
            Précédent
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {currentPage} sur {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50">
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

export default LeaveRequestsPage;