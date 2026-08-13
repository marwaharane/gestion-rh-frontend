import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Clock, CalendarCheck, AlertTriangle, UserX, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';
import Modal from '../components/Modal';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';

const statusLabels = {
  present: { label: 'Présent', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  absent: { label: 'Absent', className: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
  late: { label: 'Retard', className: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  on_leave: { label: 'En congé', className: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
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

const inputClass = "w-full px-3 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all [color-scheme:light] dark:[color-scheme:dark]";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5";

function StatCard({ icon: Icon, label, value, color, darkIconColor }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color: darkIconColor || color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-300">{label}</p>
      </div>
    </div>
  );
}

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

  const handleExportExcel = () => {
    const rows = filteredAttendances.map((a) => ({
      Employé: `${a.employee?.first_name} ${a.employee?.last_name}`,
      Date: formatDate(a.date),
      Arrivée: formatTime(a.check_in),
      Départ: formatTime(a.check_out),
      'Retard (min)': a.late_minutes,
      Statut: statusLabels[a.status]?.label || a.status,
    }));
    exportToExcel(rows, 'presences');
    toast.success('Export Excel généré');
  };

  const handleExportPdf = () => {
    const columns = ['Employé', 'Date', 'Arrivée', 'Départ', 'Retard', 'Statut'];
    const rows = filteredAttendances.map((a) => [
      `${a.employee?.first_name} ${a.employee?.last_name}`,
      formatDate(a.date),
      formatTime(a.check_in),
      formatTime(a.check_out),
      `${a.late_minutes} min`,
      statusLabels[a.status]?.label || a.status,
    ]);
    exportToPdf(columns, rows, 'Suivi des présences', 'presences');
    toast.success('Export PDF généré');
  };

  const presentCount = attendances.filter((a) => a.status === 'present').length;
  const lateCount = attendances.filter((a) => a.status === 'late').length;
  const absentCount = attendances.filter((a) => a.status === 'absent').length;

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Chargement...</p>;
  if (error) return <p className="text-rose-600 dark:text-rose-400">Erreur : {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-900 dark:text-white">Présences</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Suivi des pointages de l'équipe</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-300" />
            PDF
          </button>
          {canManage && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-sm"
              style={{ backgroundColor: '#0D9488' }}
            >
              <Plus className="w-4 h-4" />
              Nouveau pointage
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={CalendarCheck} label="Présents" value={presentCount} color="#0D9488" darkIconColor="#2DD4BF" />
        <StatCard icon={AlertTriangle} label="Retards" value={lateCount} color="#D97706" darkIconColor="#FBBF24" />
        <StatCard icon={UserX} label="Absents" value={absentCount} color="#E11D48" darkIconColor="#FB7185" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-300" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
        >
          <option value="">Tous les statuts</option>
          <option value="present">Présent</option>
          <option value="absent">Absent</option>
          <option value="late">Retard</option>
          <option value="on_leave">En congé</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Employé</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Date</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Arrivée</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Départ</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Retard</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Statut</th>
                {canManage && <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedAttendances.map((attendance) => (
                <tr key={attendance.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-4 text-slate-900 dark:text-white font-medium">{attendance.employee?.first_name} {attendance.employee?.last_name}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-300">{formatDate(attendance.date)}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                      {formatTime(attendance.check_in)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{formatTime(attendance.check_out)}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-300">{attendance.late_minutes} min</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[attendance.status]?.className || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {statusLabels[attendance.status]?.label || attendance.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => openEditForm(attendance)} className="text-slate-400 hover:text-blue-500 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(attendance.id)} className="text-slate-400 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition-colors">
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
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button 
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
            disabled={currentPage === 1} 
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Précédent
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300">Page {currentPage} sur {totalPages}</span>
          <button 
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages} 
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}

      <Modal isOpen={showForm} onClose={closeForm} title={editingId ? 'Modifier le pointage' : 'Nouveau pointage'}>
        <form onSubmit={handleFormSubmit}>
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
          {formError && <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg mt-4">{formError}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/80">
            <button type="button" onClick={closeForm} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={formLoading} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: '#0D9488' }}>
              {formLoading ? 'Envoi...' : (editingId ? 'Enregistrer' : 'Enregistrer')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AttendancesPage;