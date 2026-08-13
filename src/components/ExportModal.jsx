import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../services/api';
import Modal from './Modal';

const sheetsMeta = [
  { key: 'employees', label: 'Employés' },
  { key: 'attendances', label: 'Présences' },
  { key: 'leave_requests', label: 'Demandes de congé' },
  { key: 'attestations', label: 'Attestations' },
];

/* Classes ajustées avec la gestion du picker de date en mode sombre */
const inputClass = "w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 dark:focus:ring-teal-500/20 focus:border-[#1E3A5F] dark:focus:border-teal-500 transition-all dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

function ExportModal({ isOpen, onClose }) {
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    department_id: '', status: '', contract_type: '', start_date: '', end_date: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/departments').then((res) => setDepartments(res.data));
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleExport = () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));

    api.get('/export/all', { params })
      .then((response) => {
        const workbook = XLSX.utils.book_new();
        sheetsMeta.forEach(({ key, label }) => {
          const sheet = XLSX.utils.json_to_sheet(response.data[key] || []);
          XLSX.utils.book_append_sheet(workbook, sheet, label);
        });
        XLSX.writeFile(workbook, `gestion_rh_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success('Export généré avec succès');
        onClose();
      })
      .catch(() => toast.error("Erreur lors de l'export"))
      .finally(() => setLoading(false));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exporter les données (Excel)">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Le fichier contiendra une feuille par module. Les filtres ci-dessous s'appliquent aux employés, présences et congés.
        </p>

        <div>
          <label className={labelClass}>Département</label>
          <select name="department_id" value={filters.department_id} onChange={handleChange} className={inputClass}>
            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Tous</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{d.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Statut</label>
            <select name="status" value={filters.status} onChange={handleChange} className={inputClass}>
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Tous</option>
              <option value="active" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Actif</option>
              <option value="inactive" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Inactif</option>
              <option value="pending" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">En attente</option>
              <option value="approved" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Approuvé</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Type de contrat</label>
            <select name="contract_type" value={filters.contract_type} onChange={handleChange} className={inputClass}>
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Tous</option>
              <option value="CDI" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">CDI</option>
              <option value="CDD" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">CDD</option>
              <option value="Stage" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Stage</option>
              <option value="Freelance" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Freelance</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date de début</label>
            <input type="date" name="start_date" value={filters.start_date} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date de fin</label>
            <input type="date" name="end_date" value={filters.end_date} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          Annuler
        </button>
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
          style={{ backgroundColor: '#0D9488' }}
        >
          <Download className="w-4 h-4" />
          {loading ? 'Génération...' : 'Exporter'}
        </button>
      </div>
    </Modal>
  );
}

export default ExportModal;