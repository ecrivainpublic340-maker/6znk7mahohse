import React, { useState, useEffect } from 'react';
import { Client, StatutDossier, TypeDossier } from '../types/client';
import { useClients } from '../context/ClientContext';
import { formatDA, getWhatsAppUrl } from '../utils/format';
import { X, Check, Trash2, Calendar, Phone, Mail, MapPin, FileText, MessageCircle, CreditCard } from 'lucide-react';

interface ClientEditModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const DOSSIER_TYPES: TypeDossier[] = [
  'Entreprise',
  'RC',
  'Auto-entrepreneur',
  'Inscription & Suivi (Bureau)',
  'Inscription & Suivi (Hors Wilaya)',
  'Autre dossier',
];

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  client,
  isOpen,
  onClose,
}) => {
  const { updateClient, deleteClient } = useClients();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateInscription, setDateInscription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [typeDossier, setTypeDossier] = useState<TypeDossier>('Auto-entrepreneur');
  const [precisionAutre, setPrecisionAutre] = useState('');
  const [motifDossier, setMotifDossier] = useState('');
  const [statut, setStatut] = useState<StatutDossier>('En cours');
  
  // Montants en Dinars Algériens (DA)
  const [montantTotal, setMontantTotal] = useState<number>(0);
  const [montantEncaisse, setMontantEncaisse] = useState<number>(0);
  const [montantReste, setMontantReste] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (client) {
      setNom(client.nom);
      setPrenom(client.prenom);
      setDateInscription(client.dateInscription || '');
      setAdresse(client.adresse || '');
      setCodePostal(client.codePostal || '');
      setVille(client.ville || '');
      setEmail(client.email || '');
      setContact(client.contact || '');
      setTypeDossier(client.typeDossier);
      setPrecisionAutre(client.precisionAutre || '');
      setMotifDossier(client.motifDossier || '');
      setStatut(client.statut);
      
      const tot = client.montantTotal || 0;
      const enc = client.montantEncaisse || 0;
      const res = client.montantReste !== undefined ? client.montantReste : Math.max(0, tot - enc);
      
      setMontantTotal(tot);
      setMontantEncaisse(enc);
      setMontantReste(res);
      setNotes(client.notes || '');
      setErrors({});
      setConfirmDelete(false);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleTotalChange = (val: number) => {
    setMontantTotal(val);
    setMontantReste(Math.max(0, val - montantEncaisse));
  };

  const handleEncaisseChange = (val: number) => {
    setMontantEncaisse(val);
    setMontantReste(Math.max(0, montantTotal - val));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nom.trim()) errs.nom = 'Le nom est requis.';
    if (!prenom.trim()) errs.prenom = 'Le prénom est requis.';
    if (!contact.trim()) errs.contact = 'Le contact est requis.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    updateClient(client.id, {
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateInscription,
      adresse: adresse.trim() || ville.trim() || 'Alger',
      codePostal: codePostal.trim() || '16000',
      ville: ville.trim() || 'Alger',
      email: email.trim(),
      contact: contact.trim(),
      typeDossier,
      ...(typeDossier === 'Autre dossier' && precisionAutre.trim()
        ? { precisionAutre: precisionAutre.trim() }
        : {}),
      motifDossier: motifDossier.trim() || `Dossier ${typeDossier}`,
      statut,
      montantTotal: Number(montantTotal) || 0,
      montantEncaisse: Number(montantEncaisse) || 0,
      montantReste: Number(montantReste) || 0,
      notes: notes.trim(),
    });

    onClose();
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

  const waUrl = getWhatsAppUrl(contact, `${prenom} ${nom}`, motifDossier, montantReste);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Modification en direct · SERVI-DOX
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Dossier : {client.nom.toUpperCase()} {client.prenom} ({client.typeDossier})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom de famille *
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                  errors.nom ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                  errors.prenom ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date d'inscription
              </label>
              <input
                type="date"
                value={dateInscription}
                onChange={(e) => setDateInscription(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut du dossier
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutDossier)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
              >
                <option value="En cours">En cours</option>
                <option value="Validé">Validé</option>
                <option value="En attente">En attente</option>
                <option value="Clôturé">Clôturé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact téléphonique *
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                />
                {contact && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-2xs"
                    title="Ouvrir WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type de dossier
              </label>
              <select
                value={typeDossier}
                onChange={(e) => setTypeDossier(e.target.value as TypeDossier)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
              >
                {DOSSIER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* THREE AMOUNTS IN ALGERIAN DINAR (DA) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Montants du dossier en Dinars Algériens (DA)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total dossier (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={montantTotal}
                    onChange={(e) => handleTotalChange(Number(e.target.value))}
                    className="w-full px-3 pr-10 py-1.5 text-sm font-mono font-bold border border-slate-300 rounded-lg bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">DA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">
                  Encaissé (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={montantEncaisse}
                    onChange={(e) => handleEncaisseChange(Number(e.target.value))}
                    className="w-full px-3 pr-10 py-1.5 text-sm font-mono font-bold text-emerald-800 border border-emerald-300 rounded-lg bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-emerald-600 font-mono">DA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Reste à payer (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={montantReste}
                    onChange={(e) => setMontantReste(Number(e.target.value))}
                    className="w-full px-3 pr-10 py-1.5 text-sm font-mono font-bold text-amber-800 border border-amber-300 rounded-lg bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">DA</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse postale *
            </label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code postal
              </label>
              <input
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motif du dossier *
            </label>
            <textarea
              rows={2}
              value={motifDossier}
              onChange={(e) => setMotifDossier(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes & Commentaires
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              confirmDelete
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
                : 'text-rose-700 hover:text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmDelete ? 'Confirmer la suppression ?' : 'Supprimer le dossier'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer en DA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
