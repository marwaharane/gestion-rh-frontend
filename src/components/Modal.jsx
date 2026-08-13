import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white dark:bg-[#1E293B] w-full ${maxWidth} rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 p-6 relative animate-modal-in max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold font-poppins text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;