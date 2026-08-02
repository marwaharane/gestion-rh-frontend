import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';

const statusLabels = {
  present: { label: 'Présent', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  absent: { label: 'Absent', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  late: { label: 'Retard', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  on_leave: { label: 'En congé', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
};

const emptyForm = { employee_id: '', date: '', check_in: '', check_out: '', status: 'present', late_minutes: 0 };

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

function formatTime(timeString) {
  if (!timeString) return '—';
  return new Date(timeString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const inputClass = "w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

function AttendancesPage() {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const canManage = hasRole('admin', 'manager');

  const fetchAttendances = () => {
    api.get('/attendances')
      .then((response) => {
        setAttendances(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAttendances();
    if (canManage) {
      api.get('/employees').then((response) => setEmployees(response.data.data));
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (attendance) => {
    setEditingId(attendance.id);
    setFormData({
      employee_id: attendance.employee?.id || '',
      date: attendance.date ? attendance.date.substring(0, 10) : '',
      check_in: attendance.check_in ? attendance.check_in.substring(11, 16) : '',
      check_out: attendance.check_out ? attendance.check_out.substring(11, 16) : '',
      status: attendance.status,
      late_minutes: attendance.late_minutes || 0,
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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    const request = editingId
      ? api.put(`/attendances/${editingId}`, formData)
      : api.post('/attendances', formData);

    request
      .then(() => {
        toast.success(editingId ? 'Pointage modifié avec succès' : 'Pointage enregistré avec succès');
        closeForm();
        fetchAttendances();
      })
      .catch((err) => {
        const message = err.response?.data?.message || 'Une erreur est survenue.';
        setFormError(message);
      })
      .finally(() => setFormLoading(false));
  };

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette présence ?')) return;

    api.delete(`/attendances/${id}`)
      .then(() => {
        toast.success('Présence supprimée avec succès');
        fetchAttendances();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const filteredAttendances = attendances.filter((attendance) => {
    const matchesSearch = searchTerm === '' ||
      `${attendance.employee?.first_name} ${attendance.employee?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || attendance.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
  const paginatedAttendances = filteredAttendances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p className="text-slate-500">Chargement...</p>;
  if (error) return <p className="text-rose-600">Erreur : {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Présences</h1>
          <p className="text-sm text-slate-500 mt-1">Suivi des pointages de l'équipe</p>
        </div>
        {canManage && (
          <button
            onClick={showForm ? closeForm : openCreateForm}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-sm"
            style={{ backgroundColor: '#0D9488' }}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Annuler' : 'Nouveau pointage'}
          </button>
        )}
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
          <option value="present">Présent</option>
          <option value="absent">Absent</option>
          <option value="late">Retard</option>
          <option value="on_leave">En congé</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6 max-w-lg">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Modifier le pointage' : 'Nouveau pointage'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Employé</label>
              <select name="employee_id" value={formData.employee_id} onChange={handleFormChange} required className={inputClass}>
                <option value="">— Sélectionner —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleFormChange} required className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Heure d'arrivée</label>
                <input type="time" name="check_in" value={formData.check_in} onChange={handleFormChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Heure de départ</label>
                <input type="time" name="check_out" value={formData.check_out} onChange={handleFormChange} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Minutes de retard</label>
              <input type="number" name="late_minutes" value={formData.late_minutes} onChange={handleFormChange} min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select name="status" value={formData.status} onChange={handleFormChange} required className={inputClass}>
                <option value="present">Présent</option>
                <option value="absent">Absent</option>
                <option value="late">Retard</option>
                <option value="on_leave">En congé</option>
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-4">{formError}</p>}
          <button type="submit" disabled={formLoading} className="mt-4 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: '#0D9488' }}>
            {formLoading ? 'Envoi...' : (editingId ? 'Enregistrer les modifications' : 'Enregistrer')}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-left">
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Employé</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Arrivée</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Départ</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Retard</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Statut</th>
              {canManage && <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAttendances.map((attendance) => (
              <tr key={attendance.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4 text-slate-900 font-medium">{attendance.employee?.first_name} {attendance.employee?.last_name}</td>
                <td className="px-5 py-4 text-slate-500">{formatDate(attendance.date)}</td>
                <td className="px-5 py-4 text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTime(attendance.check_in)}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700">{formatTime(attendance.check_out)}</td>
                <td className="px-5 py-4 text-slate-500">{attendance.late_minutes} min</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[attendance.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[attendance.status]?.label || attendance.status}
                  </span>
                </td>
                {canManage && (
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEditForm(attendance)} className="text-slate-400 hover:text-[#1E3A5F] transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(attendance.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
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

export default AttendancesPage;