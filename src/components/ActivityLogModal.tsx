import React from 'react';
import { useClients } from '../context/ClientContext';
import { History, PlusCircle, RefreshCw, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { logs, resetToDemoData } = useClients();

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
            Historique complet des ajouts, modifications et changements de statut en temps réel
          </p>
        </div>

        <button
          onClick={resetToDemoData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Réinitialiser les données d'exemple</span>
        </button>
      </div>

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
