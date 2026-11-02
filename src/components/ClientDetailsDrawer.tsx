import React, { useState, useEffect } from 'react';
import { Client, StatutDossier } from '../types/client';
import { useClients } from '../context/ClientContext';
import { formatDA, getWhatsAppUrl } from '../utils/format';
import { X, Edit3, Trash2, Calendar, Phone, Mail, MapPin, FileText, CheckCircle2, MessageCircle, CreditCard } from 'lucide-react';

interface ClientDetailsDrawerProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export const ClientDetailsDrawer: React.FC<ClientDetailsDrawerProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { updateClientStatut, deleteClient } = useClients();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleStatusChange = (newStatut: StatutDossier) => {
    updateClientStatut(client.id, newStatut);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteClient(client.id);
    setConfirmDelete(false);
    onClose();
  };

  const reste = client.montantReste !== undefined ? client.montantReste : Math.max(0, (client.montantTotal || 0) - (client.montantEncaisse || 0));
  const waUrl = getWhatsAppUrl(client.contact, `${client.prenom} ${client.nom}`, client.motifDossier, reste);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Top Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Dossier Client SERVI-DOX
            </span>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {client.nom.toUpperCase()} {client.prenom}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* WhatsApp Direct Action Button */}
          {client.contact && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ouvrir WhatsApp ({client.contact})</span>
            </a>
          )}

          {/* Status Changer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Statut du dossier (clic direct pour changer) :
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('En cours')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  client.statut === 'En cours'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                }`}
              >
                En cours
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Validé')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  client.statut === 'Validé'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                }`}
              >
                Validé
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('En attente')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  client.statut === 'En attente'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300'
                }`}
              >
                En attente
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Clôturé')}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  client.statut === 'Clôturé'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                Clôturé
              </button>
            </div>
          </div>

          {/* Financials in Algerian Dinars (DA) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-700" />
              <span>Règlement financier (DA)</span>
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 block uppercase">Total</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {formatDA(client.montantTotal)}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-emerald-200 rounded-lg">
                <span className="text-[10px] text-emerald-700 block uppercase font-medium">Encaissé</span>
                <span className="text-xs font-bold text-emerald-800 font-mono">
                  {formatDA(client.montantEncaisse)}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-amber-200 rounded-lg">
                <span className="text-[10px] text-amber-700 block uppercase font-medium">Reste</span>
                <span className="text-xs font-bold text-amber-800 font-mono">
                  {formatDA(reste)}
                </span>
              </div>
            </div>
          </div>

          {/* Type de dossier */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Type de dossier</span>
            <span className="text-sm font-bold text-blue-800">
              {client.typeDossier} {client.precisionAutre ? `(${client.precisionAutre})` : ''}
            </span>
          </div>

          {/* Motif du dossier */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Motif du dossier
            </h3>
            <p className="text-xs text-slate-700 p-3 bg-blue-50/50 rounded-lg border border-blue-100 leading-relaxed font-medium">
              {client.motifDossier}
            </p>
          </div>

          {/* Coordonnées & Date */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Coordonnées & Inscription
            </h3>
            <div className="space-y-2.5 text-sm text-slate-700">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs">
                  Inscrit le <strong className="text-slate-900 font-mono">{client.dateInscription}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`tel:${client.contact}`} className="font-mono text-xs text-blue-700 hover:underline">
                  {client.contact}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${client.email}`} className="text-xs text-blue-700 hover:underline truncate">
                  {client.email}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-800">
                  {client.adresse}, {client.codePostal} {client.ville}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Notes du gestionnaire
              </h3>
              <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* Drawer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              confirmDelete
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
                : 'text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{confirmDelete ? 'Confirmer ?' : 'Supprimer'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(client);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span>Modifier la fiche</span>
          </button>
        </div>
      </div>
    </div>
  );
};
