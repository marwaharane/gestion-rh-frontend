import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FileDown, Wallet, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { hasRole } from '../services/auth';
import Modal from '../components/Modal';
import { exportToPdf } from '../utils/exportPdf';

const statusLabels = {
  draft: { label: 'Brouillon', className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  paid: { label: 'Payé', className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' },
};

const emptyForm = { employee_id: '', period: '', gross_salary: '', bonus: 0, deductions: 0, status: 'draft' };

// Classes Tailwind adaptées au Dark/Light mode
const inputClass = "w-full px-3 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all [color-scheme:light] dark:[color-scheme:dark]";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

function formatMonth(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(value || 0);
}

// Modal de secours si le composant externe Modal n'est pas disponible
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

export default function PayrollPage() {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const canManage = hasRole('admin', 'manager');
  const ActiveModal = Modal || DefaultModal;

  const fetchPayslips = () => {
    api.get('/payslips')
      .then((response) => {
        setPayslips(response.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayslips();
    if (canManage) {
      api.get('/employees').then((response) => setEmployees(response.data.data));
    }
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

    api.post('/payslips', formData)
      .then(() => {
        toast.success('Bulletin créé avec succès');
        closeForm();
        fetchPayslips();
      })
      .catch((err) => setFormError(err.response?.data?.message || 'Une erreur est survenue.'))
      .finally(() => setFormLoading(false));
  };

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce bulletin ?')) return;
    api.delete(`/payslips/${id}`)
      .then(() => {
        toast.success('Bulletin supprimé');
        fetchPayslips();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const handleExportPdf = (payslip) => {
    const columns = ['Champ', 'Valeur'];
    const rows = [
      ['Employé', `${payslip.employee?.first_name} ${payslip.employee?.last_name}`],
      ['Période', formatMonth(payslip.period)],
      ['Salaire brut', formatCurrency(payslip.gross_salary)],
      ['Prime', formatCurrency(payslip.bonus)],
      ['Retenues', formatCurrency(payslip.deductions)],
      ['Salaire net', formatCurrency(payslip.net_salary)],
      ['Statut', statusLabels[payslip.status]?.label || payslip.status],
    ];
    exportToPdf(columns, rows, 'Bulletin de paie', `bulletin_${payslip.employee?.last_name}`);
    toast.success('Bulletin PDF généré');
  };

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Chargement...</p>;

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour à l'accueil
      </Link>

      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-900 dark:text-white">Paie</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bulletins de salaire</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
            style={{ backgroundColor: '#0D9488' }}
          >
            <Plus className="w-4 h-4" />
            Nouveau bulletin
          </button>
        )}
      </div>

      {/* Tableau des bulletins */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700/60 text-left">
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Employé</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Période</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Brut</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Net</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Statut</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {payslips.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-5 py-4 text-slate-900 dark:text-slate-100 font-medium">{p.employee?.first_name} {p.employee?.last_name}</td>
                <td className="px-5 py-4 text-slate-500 dark:text-slate-400 capitalize">{formatMonth(p.period)}</td>
                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{formatCurrency(p.gross_salary)}</td>
                <td className="px-5 py-4 text-slate-900 dark:text-white font-semibold">{formatCurrency(p.net_salary)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[p.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[p.status]?.label || p.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3 items-center">
                    <button type="button" onClick={() => handleExportPdf(p)} title="Télécharger" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
                      <FileDown className="w-4 h-4" />
                    </button>
                    {canManage && (
                      <button type="button" onClick={() => handleDelete(p.id)} title="Supprimer" className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {payslips.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                  <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  Aucun bulletin pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal - Création de bulletin */}
      <ActiveModal isOpen={showForm} onClose={closeForm} title="Nouveau bulletin de paie">
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Employé</label>
              <select name="employee_id" value={formData.employee_id} onChange={handleFormChange} required className={inputClass}>
                <option value="" className="dark:bg-slate-800 dark:text-white">— Sélectionner —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="dark:bg-slate-800 dark:text-white">
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Période (mois)</label>
              <input type="date" name="period" value={formData.period} onChange={handleFormChange} required className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Salaire brut</label>
                <input type="number" name="gross_salary" value={formData.gross_salary} onChange={handleFormChange} required min="0" step="0.01" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prime</label>
                <input type="number" name="bonus" value={formData.bonus} onChange={handleFormChange} min="0" step="0.01" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Retenues</label>
                <input type="number" name="deductions" value={formData.deductions} onChange={handleFormChange} min="0" step="0.01" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select name="status" value={formData.status} onChange={handleFormChange} className={inputClass}>
                <option value="draft" className="dark:bg-slate-800 dark:text-white">Brouillon</option>
                <option value="paid" className="dark:bg-slate-800 dark:text-white">Payé</option>
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 px-3 py-2 rounded-lg mt-4 font-medium">{formError}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <button type="button" onClick={closeForm} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer">
              Annuler
            </button>
            <button type="submit" disabled={formLoading} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm" style={{ backgroundColor: '#0D9488' }}>
              {formLoading ? 'Enregistrement...' : 'Créer le bulletin'}
            </button>
          </div>
        </form>
      </ActiveModal>
    </div>
  );
}