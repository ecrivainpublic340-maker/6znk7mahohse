import React, { useState, useEffect } from 'react';
import { useClients } from '../context/ClientContext';
import { TypeDossier, StatutDossier, TARIFS_SERVIDOX_DA, DOSSIER_TARIF_LABELS } from '../types/client';
import { formatDA, getWhatsAppUrl } from '../utils/format';
import { 
  FolderPlus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Trash2, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  FileText,
  RotateCcw,
  MessageCircle,
  CreditCard,
  AlertCircle
} from 'lucide-react';

import { ActiveTab } from './Navbar';

interface AddClientPageProps {
  onSuccessNavigate: (targetTab?: ActiveTab) => void;
}

const DOSSIER_TYPES: TypeDossier[] = [
  'Entreprise',
  'RC',
  'Auto-entrepreneur',
  'Inscription & Suivi (Bureau)',
  'Inscription & Suivi (Hors Wilaya)',
  'Autre dossier',
];

const TODAY_DATE = new Date().toISOString().split('T')[0];

export const AddClientPage: React.FC<AddClientPageProps> = ({ onSuccessNavigate }) => {
  const { addClient, clientDraft, saveDraft, clearDraft } = useClients();

  const [nom, setNom] = useState(clientDraft?.nom || '');
  const [prenom, setPrenom] = useState(clientDraft?.prenom || '');
  const [dateInscription, setDateInscription] = useState(clientDraft?.dateInscription || TODAY_DATE);
  const [adresse, setAdresse] = useState(clientDraft?.adresse || '');
  const [ville, setVille] = useState(clientDraft?.ville || '');
  const [codePostal, setCodePostal] = useState(clientDraft?.codePostal || '');
  const [email, setEmail] = useState(clientDraft?.email || '');
  const [contact, setContact] = useState(clientDraft?.contact || '');
  const [typeDossier, setTypeDossier] = useState<TypeDossier>(clientDraft?.typeDossier || 'Auto-entrepreneur');
  const [precisionAutre, setPrecisionAutre] = useState(clientDraft?.precisionAutre || '');
  const [motifDossier, setMotifDossier] = useState(clientDraft?.motifDossier || '');
  const [statut, setStatut] = useState<StatutDossier>(clientDraft?.statut || 'En cours');
  
  // Montants en Dinars Algériens (DA) - Frais SERVI-DOX hors frais de dossier
  const [montantTotal, setMontantTotal] = useState<number>(clientDraft?.montantTotal ?? 40000);
  const [montantEncaisse, setMontantEncaisse] = useState<number>(clientDraft?.montantEncaisse ?? 40000);
  const [montantReste, setMontantReste] = useState<number>(clientDraft?.montantReste ?? 0);
  const [notes, setNotes] = useState(clientDraft?.notes || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sélection du type de dossier avec application automatique du tarif officiel SERVI-DOX (hors frais de dossier)
  const handleSelectDossierType = (newType: TypeDossier) => {
    setTypeDossier(newType);
    const officialTarif = TARIFS_SERVIDOX_DA[newType] ?? 40000;
    setMontantTotal(officialTarif);
    setMontantEncaisse(officialTarif);
    setMontantReste(0);
  };

  // Auto-calculate reste à payer when total or encaissé changes
  const handleTotalChange = (val: number) => {
    setMontantTotal(val);
    setMontantReste(Math.max(0, val - montantEncaisse));
  };

  const handleEncaisseChange = (val: number) => {
    setMontantEncaisse(val);
    setMontantReste(Math.max(0, montantTotal - val));
  };

  // Auto-save draft when fields change so unadded client info is held or can be wiped
  useEffect(() => {
    const hasData = nom || prenom || adresse || email || contact || motifDossier;
    if (hasData) {
      saveDraft({
        nom,
        prenom,
        dateInscription,
        adresse,
        ville,
        codePostal,
        email,
        contact,
        typeDossier,
        precisionAutre,
        motifDossier,
        statut,
        montantTotal,
        montantEncaisse,
        montantReste,
        notes,
      });
    }
  }, [nom, prenom, dateInscription, adresse, ville, codePostal, email, contact, typeDossier, precisionAutre, motifDossier, statut, montantTotal, montantEncaisse, montantReste, notes]);

  const handleWipeUnaddedFields = () => {
    setNom('');
    setPrenom('');
    setDateInscription(TODAY_DATE);
    setAdresse('');
    setVille('');
    setCodePostal('');
    setEmail('');
    setContact('');
    setTypeDossier('Auto-entrepreneur');
    setPrecisionAutre('');
    setMotifDossier('');
    setStatut('En cours');
    setMontantTotal(40000);
    setMontantEncaisse(40000);
    setMontantReste(0);
    setNotes('');
    setErrors({});
    clearDraft();
    setShowClearConfirm(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nom.trim()) errs.nom = 'Le nom est requis.';
    if (!prenom.trim()) errs.prenom = 'Le prénom est requis.';
    if (!dateInscription) errs.dateInscription = 'La date d\'inscription est requise.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Format d'adresse email invalide.";
    }
    if (!contact.trim()) errs.contact = 'Le contact téléphonique est requis.';
    if (typeDossier === 'Autre dossier' && !precisionAutre.trim()) {
      errs.precisionAutre = 'Veuillez préciser le type de dossier.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (andAddAnother: boolean = false) => {
    if (!validate()) return;

    const defaultMotif = DOSSIER_TARIF_LABELS[typeDossier]?.label || `Dossier ${typeDossier}`;

    addClient({
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateInscription,
      adresse: adresse.trim() || ville.trim() || 'Alger',
      ville: ville.trim() || 'Alger',
      codePostal: codePostal.trim() || '16000',
      email: email.trim(),
      contact: contact.trim(),
      typeDossier,
      ...(typeDossier === 'Autre dossier' && precisionAutre.trim()
        ? { precisionAutre: precisionAutre.trim() }
        : {}),
      motifDossier: motifDossier.trim() || defaultMotif,
      statut,
      montantTotal: Number(montantTotal) || 0,
      montantEncaisse: Number(montantEncaisse) || 0,
      montantReste: Number(montantReste) || 0,
      notes: notes.trim(),
    });

    const targetMap: Record<TypeDossier, ActiveTab> = {
      'Auto-entrepreneur': 'autoentrepreneur',
      'Entreprise': 'sarl_eurl',
      'RC': 'registre_rc',
      'Inscription & Suivi (Hors Wilaya)': 'hors_wilaya',
      'Inscription & Suivi (Bureau)': 'suivi_bureau',
      'Autre dossier': 'clients',
    };

    if (andAddAnother) {
      handleWipeUnaddedFields();
    } else {
      onSuccessNavigate(targetMap[typeDossier] || 'clients');
    }
  };

  const isFormDirty = Boolean(nom || prenom || adresse || email || contact || motifDossier);
  const whatsAppPreviewUrl = contact ? getWhatsAppUrl(contact, `${prenom} ${nom}`, motifDossier, montantReste) : '#';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section with top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            onClick={() => onSuccessNavigate()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la liste des dossiers SERVI-DOX</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fiche d'Ajout Client — SERVI-DOX
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tarifs en Dinars Algériens (DA), Encaissements, Reste à payer et Lien direct WhatsApp
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* EFFACER LES RENSEIGNEMENTS */}
          {isFormDirty && (
            <button
              type="button"
              onClick={() => {
                if (showClearConfirm) {
                  handleWipeUnaddedFields();
                } else {
                  setShowClearConfirm(true);
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Effacer tous les renseignements non encore ajoutés"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>{showClearConfirm ? 'Confirmer l\'effacement ?' : 'Effacer les renseignements'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer le dossier client</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form (2 cols) and Live Preview (1 col) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Identité du Client */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">
                1. Identité du Client & Date d'Inscription
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom de famille *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom de famille"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                    errors.nom
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                  }`}
                />
                {errors.nom && <p className="text-[11px] text-rose-600 mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Prénom"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                    errors.prenom
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                  }`}
                />
                {errors.prenom && <p className="text-[11px] text-rose-600 mt-1">{errors.prenom}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date d'inscription *
                </label>
                <input
                  type="date"
                  value={dateInscription}
                  onChange={(e) => setDateInscription(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                />
                {errors.dateInscription && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.dateInscription}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statut de traitement du dossier
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutDossier)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                >
                  <option value="En cours">En cours de traitement</option>
                  <option value="Validé">Validé / Terminé</option>
                  <option value="En attente">En attente de pièces</option>
                  <option value="Clôturé">Clôturé / Archivé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Coordonnées & Contact avec WhatsApp */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  2. Contact Téléphonique (WhatsApp), Email & Adresse
                </h2>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                Lien WhatsApp automatique
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact téléphonique direct (avec WhatsApp) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Ex: 0550 12 34 56 ou 0661..."
                    className={`w-full px-3 py-2 text-sm font-mono tabular-nums border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                      errors.contact
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                    }`}
                  />
                </div>
                {errors.contact && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.contact}</p>
                )}
                {contact && (
                  <a
                    href={whatsAppPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold hover:underline mt-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tester le lien WhatsApp avec ce numéro</span>
                  </a>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse postale *
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Ex : 12 Rue Didouche Mourad"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                    errors.adresse
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                  }`}
                />
                {errors.adresse && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.adresse}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  value={codePostal}
                  onChange={(e) => setCodePostal(e.target.value)}
                  placeholder="16000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ville (Wilaya)
                </label>
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ex : Alger, Oran, Constantine, Sétif"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Type, Motif & Montants en Dinars Algériens (DA) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">
                3. Qualification du Dossier & Tarification (Dinars Algériens - DA)
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Type de Dossier & Tarif Officiel Frais SERVI-DOX (Hors frais de dossier) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {DOSSIER_TYPES.map((t) => {
                    const info = DOSSIER_TARIF_LABELS[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleSelectDossierType(t)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          typeDossier === t
                            ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-xs font-bold block">{info.label}</span>
                        <span className="text-[11px] font-mono font-bold text-blue-700 mt-1 block">
                          {formatDA(info.tarifDA)} (Frais SERVI-DOX)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {typeDossier === 'Autre dossier' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Précisez le type de dossier *
                  </label>
                  <input
                    type="text"
                    value={precisionAutre}
                    onChange={(e) => setPrecisionAutre(e.target.value)}
                    placeholder="Ex : Modification statutaire, Radiation, Agrément..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                  />
                  {errors.precisionAutre && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.precisionAutre}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif du dossier *
                </label>
                <textarea
                  rows={2}
                  value={motifDossier}
                  onChange={(e) => setMotifDossier(e.target.value)}
                  placeholder="Ex : Création SARL/EURL, Immatriculation RC, Statut Auto-entrepreneur, Inscription & Suivi..."
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white text-slate-900 ${
                    errors.motifDossier
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-700'
                  }`}
                />
                {errors.motifDossier && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.motifDossier}</p>
                )}
              </div>

              {/* THREE AMOUNT BOXES: TOTAL FRAIS SERVI-DOX, ENCAISSÉ, RESTE A PAYER (DA) */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Calcul des Frais SERVI-DOX (Hors frais de dossier) en DA
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Seuls les frais SERVI-DOX sont comptabilisés
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Case 1: Frais SERVI-DOX (Hors frais de dossier) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Frais SERVI-DOX hors dossier (DA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={montantTotal}
                        onChange={(e) => handleTotalChange(Number(e.target.value))}
                        className="w-full px-3 pr-10 py-2 text-sm font-mono font-bold tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono font-semibold">
                        DA
                      </span>
                    </div>
                  </div>

                  {/* Case 2: Montant encaissé */}
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 mb-1">
                      Montant encaissé (DA) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={montantEncaisse}
                        onChange={(e) => handleEncaisseChange(Number(e.target.value))}
                        className="w-full px-3 pr-10 py-2 text-sm font-mono font-bold tabular-nums border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 bg-white text-emerald-900"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-mono font-semibold">
                        DA
                      </span>
                    </div>
                  </div>

                  {/* Case 3: Montant reste à payer */}
                  <div>
                    <label className="block text-xs font-semibold text-amber-800 mb-1">
                      Montant reste à payer (DA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={montantReste}
                        onChange={(e) => setMontantReste(Number(e.target.value))}
                        className={`w-full px-3 pr-10 py-2 text-sm font-mono font-bold tabular-nums border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                          montantReste > 0 
                            ? 'border-amber-300 text-amber-900 focus:border-amber-700 focus:ring-amber-500/20' 
                            : 'border-emerald-300 text-emerald-900'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono font-semibold">
                        DA
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                  <span>
                    État financier :{' '}
                    {montantReste === 0 ? (
                      <strong className="text-emerald-700">Dossier entièrement réglé</strong>
                    ) : (
                      <strong className="text-amber-700">Solde restant de {formatDA(montantReste)}</strong>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Le reste à payer se calcule automatiquement (Total - Encaissé)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes complémentaires (optionnel)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Modalités de paiement, pièces reçues, consignes particulières..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleWipeUnaddedFields}
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Effacer les renseignements</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Enregistrer & en ajouter un autre
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer le client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Card on Right */}
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Aperçu Fiche Client
              </span>
              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                Dossier {typeDossier}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {nom || prenom ? `${nom.toUpperCase()} ${prenom}` : 'NOM Prénom Client'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Inscrit le {dateInscription || '—'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700">{statut}</span>
              </div>
            </div>

            {/* Financial Status Summary in Algerian Dinars */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Montant total :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatDA(montantTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Montant encaissé :</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatDA(montantEncaisse)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">Reste à payer :</span>
                <span className={`font-mono font-bold ${montantReste > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatDA(montantReste)}
                </span>
              </div>
            </div>

            {/* Direct WhatsApp Action Button Preview */}
            {contact ? (
              <a
                href={whatsAppPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contacter le client sur WhatsApp</span>
              </a>
            ) : (
              <div className="p-2.5 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                Saisissez un numéro pour activer WhatsApp
              </div>
            )}

            {/* Motif Preview */}
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                Motif du dossier :
              </span>
              <p className="text-xs text-slate-700 italic bg-amber-50/50 p-2.5 rounded border border-amber-200/60 leading-relaxed">
                {motifDossier || 'Veuillez saisir le motif du dossier ci-contre...'}
              </p>
            </div>

            {/* Coordonnées */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono font-medium">{contact || 'Téléphone'}</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{email || 'email@client.dz'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {adresse ? `${adresse}, ` : ''}{codePostal} {ville || 'Algérie'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
