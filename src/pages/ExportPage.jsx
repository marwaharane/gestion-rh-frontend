import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, FileSpreadsheet, Sparkles, 
  CheckCircle2, ShieldCheck, Layers 
} from 'lucide-react';
import ExportModal from '../components/ExportModal';

function ExportPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Bouton de retour */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l'accueil
      </Link>

      <div className="space-y-6">
        
        {/* En-tête de la page */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500"></div>

          <div className="pt-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-poppins text-2xl font-bold text-slate-900 tracking-tight">
                Export des données
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <Sparkles className="w-3 h-3 text-teal-600" />
                Module RH
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Téléchargez les données de la plateforme avec des filtres personnalisés
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2.5 self-start md:self-auto">
            <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />
            <span className="text-xs font-semibold text-slate-700">Format Sécurisé</span>
          </div>
        </div>

        {/* Carte Principale d'Exportation */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 hover:border-teal-500/30 transition-all">
          
          <div className="flex items-start justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100/80 flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-7 h-7 text-[#0D9488]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-lg">
              Format .XLSX
            </span>
          </div>

          <h2 className="font-poppins font-bold text-xl text-slate-900 mb-2">
            Export Excel (.xlsx)
          </h2>

          <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-2xl">
            Fichier avec feuilles Employés, Présences, Congés et Attestations, filtrable par département, statut, contrat et période.
          </p>

          {/* Liste visuelle des éléments inclus */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              Onglets inclus dans le fichier :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Employés
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Présences
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Congés
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Attestations
              </span>
            </div>
          </div>

          {/* Bouton de déclenchement du modal */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-md shadow-teal-600/15 hover:opacity-95 transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#0D9488' }}
          >
            <Download className="w-4 h-4" />
            Configurer et exporter
          </button>
        </div>

      </div>

      {/* Modal d'export */}
      <ExportModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default ExportPage;