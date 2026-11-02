import React, { useState } from 'react';
import { useClients } from '../context/ClientContext';
import { History, PlusCircle, RefreshCw, Trash2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { logs, clearLogs } = useClients();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    clearLogs();
    setShowConfirm(false);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'creation':
        return (
          <span className="flex items-center gap-1 text-emerald-700 font-medium text-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            Création
          </span>
        );
      case 'modification':
        return (
          <span className="flex items-center gap-1 text-sky-700 font-medium text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Modification
          </span>
        );
      case 'changement_statut':
        return (
          <span className="flex items-center gap-1 text-indigo-700 font-medium text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Statut
          </span>
        );
      case 'suppression':
        return (
          <span className="flex items-center gap-1 text-rose-700 font-medium text-xs">
            <Trash2 className="w-3.5 h-3.5" />
            Suppression
          </span>
        );
      default:
        return <span className="text-slate-600 text-xs">{action}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Journal d'Activité en Direct
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Historique des notifications d'ajouts, modifications et changements de statut
          </p>
        </div>

        <button
          onClick={() => {
            if (logs.length === 0) return;
            setShowConfirm(true);
          }}
          disabled={logs.length === 0}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-all self-start sm:self-auto ${
            logs.length === 0
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer'
          }`}
          title="Effacer uniquement les notifications du journal sans toucher aux clients ni aux calculs"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Effacer les notifications du journal</span>
        </button>
      </div>

      {/* Confirmation sécurisée avant effacement */}
      {showConfirm && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Effacer uniquement l'historique des notifications ?
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 inline" />
                <span>
                  <strong>Vos clients, dossiers et calculs financiers ne seront PAS effacés</strong>. Seules les lignes de notifications ci-dessous seront nettoyées.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs cursor-pointer"
            >
              Confirmer le nettoyage
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Aucun événement enregistré pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {getActionBadge(log.action)}
                    <span className="font-semibold text-slate-900 text-sm">
                      {log.clientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Par {log.author}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-600 sm:ml-7">
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
