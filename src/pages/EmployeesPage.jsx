import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, Mail, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';

const statusLabels = {
  active: { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  inactive: { label: 'Inactif', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  terminated: { label: 'Terminé', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
};

const emptyForm = {
  matricule: '', first_name: '', last_name: '', email: '', phone: '',
  department_id: '', position_id: '', manager_id: '',
  hire_date: '', contract_type: 'CDI', status: 'active',
};

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

const inputClass = "w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const canManage = hasRole('admin', 'manager');

  const fetchEmployees = () => {
    api.get('/employees')
      .then((response) => {
        setEmployees(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployees();
    api.get('/departments').then((response) => setDepartments(response.data));
    api.get('/positions').then((response) => setPositions(response.data));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (employee) => {
    setEditingId(employee.id);
    setFormData({
      matricule: employee.matricule,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      department_id: employee.department?.id || '',
      position_id: employee.position?.id || '',
      manager_id: employee.manager?.id || '',
      hire_date: employee.hire_date ? employee.hire_date.substring(0, 10) : '',
      contract_type: employee.contract_type,
      status: employee.status,
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
      ? api.put(`/employees/${editingId}`, formData)
      : api.post('/employees', formData);

    request
      .then(() => {
        toast.success(editingId ? 'Employé modifié avec succès' : 'Employé créé avec succès');
        closeForm();
        fetchEmployees();
      })
      .catch((err) => {
        const message = err.response?.data?.message || 'Une erreur est survenue.';
        setFormError(message);
      })
      .finally(() => setFormLoading(false));
  };

  const handleDelete = (id) => {
    if (!confirm('Supprimer cet employé ? Cette action est irréversible.')) return;

    api.delete(`/employees/${id}`)
      .then(() => {
        toast.success('Employé supprimé avec succès');
        fetchEmployees();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = searchTerm === '' ||
      `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === '' || employee.department?.id === parseInt(departmentFilter);

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const initials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  if (loading) return <p className="text-slate-500">Chargement...</p>;
  if (error) return <p className="text-rose-600">Erreur : {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-900">Employés</h1>
          <p className="text-sm text-slate-500 mt-1">{filteredEmployees.length} employé(s) au total</p>
        </div>
        {canManage && (
          <button
            onClick={showForm ? closeForm : openCreateForm}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-sm"
            style={{ backgroundColor: '#0D9488' }}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Annuler' : 'Nouvel employé'}
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, matricule, email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="terminated">Terminé</option>
        </select>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
          <option value="">Tous les départements</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6 max-w-2xl">
          <h3 className="font-poppins text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Modifier l\'employé' : 'Nouvel employé'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Matricule</label>
              <input type="text" name="matricule" value={formData.matricule} onChange={handleFormChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prénom</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleFormChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleFormChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date d'embauche</label>
              <input type="date" name="hire_date" value={formData.hire_date} onChange={handleFormChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Département</label>
              <select name="department_id" value={formData.department_id} onChange={handleFormChange} className={inputClass}>
                <option value="">— Aucun —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Poste</label>
              <select name="position_id" value={formData.position_id} onChange={handleFormChange} className={inputClass}>
                <option value="">— Aucun —</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Manager</label>
              <select name="manager_id" value={formData.manager_id} onChange={handleFormChange} className={inputClass}>
                <option value="">— Aucun —</option>
                {employees.filter((e) => e.id !== editingId).map((e) => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Type de contrat</label>
              <select name="contract_type" value={formData.contract_type} onChange={handleFormChange} className={inputClass}>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select name="status" value={formData.status} onChange={handleFormChange} className={inputClass}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="terminated">Terminé</option>
              </select>
            </div>
          </div>

          {formError && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-4">{formError}</p>}
          <button type="submit" disabled={formLoading} className="mt-4 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all" style={{ backgroundColor: '#0D9488' }}>
            {formLoading ? 'Enregistrement...' : (editingId ? 'Enregistrer les modifications' : 'Créer l\'employé')}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-left">
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Employé</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Matricule</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Département</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Poste</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Embauche</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Statut</th>
              {canManage && <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: '#1E3A5F' }}
                    >
                      {initials(employee.first_name, employee.last_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-900 font-medium truncate">{employee.first_name} {employee.last_name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600 font-mono text-xs">{employee.matricule}</td>
                <td className="px-5 py-4 text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {employee.department?.name || '—'}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700">{employee.position?.title || '—'}</td>
                <td className="px-5 py-4 text-slate-500">{formatDate(employee.hire_date)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[employee.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[employee.status]?.label || employee.status}
                  </span>
                </td>
                {canManage && (
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEditForm(employee)} className="text-slate-400 hover:text-[#1E3A5F] transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(employee.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
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
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Précédent
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {currentPage} sur {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;