import React from 'react';
import { useClients } from '../context/ClientContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useClients();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isInfo = toast.type === 'info';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white border rounded-lg shadow-lg transition-all animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'border-emerald-200 text-slate-800'
                : isInfo
                ? 'border-sky-200 text-slate-800'
                : isWarning
                ? 'border-amber-200 text-slate-800'
                : 'border-rose-200 text-slate-800'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {isInfo && <Info className="w-4 h-4 text-sky-600" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {isError && <XCircle className="w-4 h-4 text-rose-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{toast.title}</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
