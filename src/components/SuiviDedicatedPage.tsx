import React, { useState, useMemo } from 'react';
import { useClients } from '../context/ClientContext';
import { Client, StatutDossier, TypeDossier } from '../types/client';
import { formatDA, getWhatsAppUrl } from '../utils/format';
import { exportClientsListPDF, exportSingleClientPDF } from '../utils/pdfExport';
import {
  Search,
  X,
  Plus,
  FileDown,
  Edit3,
  Trash2,
  Eye,
  Check,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Building2,
  Globe2,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { ClientEditModal } from './ClientEditModal';
import { ClientDetailsDrawer } from './ClientDetailsDrawer';

interface SuiviDedicatedPageProps {
  mode: 'bureau' | 'hors_wilaya';
  onSendGmail?: (client: Client) => void;
}

const WILAYAS_ALGERIE = [
  '01 - Adrar',
  '02 - Chlef',
  '03 - Laghouat',
  '04 - Oum El Bouaghi',
  '05 - Batna',
  '06 - Béjaïa',
  '07 - Biskra',
  '08 - Béchar',
  '09 - Blida',
  '10 - Bouira',
  '11 - Tamanrasset',
  '12 - Tébessa',
  '13 - Tlemcen',
  '14 - Tiaret',
  '15 - Tizi Ouzou',
  '16 - Alger',
  '17 - Djelfa',
  '18 - Jijel',
  '19 - Sétif',
  '20 - Saïda',
  '21 - Skikda',
  '22 - Sidi Bel Abbès',
  '23 - Annaba',
  '24 - Guelma',
  '25 - Constantine',
  '26 - Médéa',
  '27 - Mostaganem',
  '28 - M\'Sila',
  '29 - Mascara',
  '30 - Ouargla',
  '31 - Oran',
  '32 - El Bayadh',
  '33 - Illizi',
  '34 - Bordj Bou Arreridj',
  '35 - Boumerdès',
  '36 - El Tarf',
  '37 - Tindouf',
  '38 - Tissemsilt',
  '39 - El Oued',
  '40 - Khenchela',
  '41 - Souk Ahras',
  '42 - Tipaza',
  '43 - Mila',
  '44 - Aïn Defla',
  '45 - Naâma',
  '46 - Aïn Témouchent',
  '47 - Ghardaïa',
  '48 - Relizane',
  '49 - Timimoun',
  '50 - Bordj Badji Mokhtar',
  '51 - Ouled Djellal',
  '52 - Béni Abbès',
  '53 - In Salah',
  '54 - In Guezzam',
  '55 - Touggourt',
  '56 - Djanet',
  '57 - El M\'Ghair',
  '58 - El Meniaa',
];

const TODAY_DATE = new Date().toISOString().split('T')[0];

export const SuiviDedicatedPage: React.FC<SuiviDedicatedPageProps> = ({ mode, onSendGmail }) => {
  const { clients, addClient, updateClientStatut, deleteClient } = useClients();

  const isBureau = mode === 'bureau';
  const targetType: TypeDossier = isBureau
    ? 'Inscription & Suivi (Bureau)'
    : 'Inscription & Suivi (Hors Wilaya)';
  const fixedTarif = isBureau ? 12000 : 15000;

  // Quick Add Form State
  const [showAddForm, setShowAddForm] = useState(true);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateInscription, setDateInscription] = useState(TODAY_DATE);
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState(isBureau ? '16 - Alger' : '31 - Oran');
  const [adresse, setAdresse] = useState('');
  const [motifDossier, setMotifDossier] = useState(
    isBureau
      ? 'Inscription et suivi administratif au bureau SERVI-DOX'
      : 'Inscription et suivi à distance — Client Hors Wilaya'
  );
  const [statut, setStatut] = useState<StatutDossier>('En cours');
  const [montantTotal, setMontantTotal] = useState<number>(fixedTarif);
  const [montantEncaisse, setMontantEncaisse] = useState<number>(fixedTarif);
  const [montantReste, setMontantReste] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<'all' | StatutDossier>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Reset default fields when switching between Bureau (12 000 DA) and Hors Wilaya (15 000 DA)
  React.useEffect(() => {
    setMontantTotal(fixedTarif);
    setMontantEncaisse(fixedTarif);
    setMontantReste(0);
    setVille(isBureau ? '16 - Alger' : '31 - Oran');
    setMotifDossier(
      isBureau
        ? 'Inscription et suivi administratif au bureau SERVI-DOX'
        : 'Inscription et suivi à distance — Client Hors Wilaya'
    );
    setFormError(null);
  }, [mode, fixedTarif, isBureau]);

  // Filter clients belonging to this dedicated page
  const pageClients = useMemo(() => {
    return clients.filter((c) => c.typeDossier === targetType);
  }, [clients, targetType]);

  const filteredClients = useMemo(() => {
    let list = [...pageClients];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.nom.toLowerCase().includes(q) ||
          c.prenom.toLowerCase().includes(q) ||
          c.contact.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.ville.toLowerCase().includes(q) ||
          c.motifDossier.toLowerCase().includes(q)
      );
    }
    if (statutFilter !== 'all') {
      list = list.filter((c) => c.statut === statutFilter);
    }
    return list;
  }, [pageClients, searchQuery, statutFilter]);

  const stats = useMemo(() => {
    const totalCount = pageClients.length;
    const totalFacture = pageClients.reduce((s, c) => s + (c.montantTotal || 0), 0);
    const totalEncaisse = pageClients.reduce((s, c) => s + (c.montantEncaisse || 0), 0);
    const totalReste = pageClients.reduce(
      (s, c) =>
        s +
        (c.montantReste !== undefined
          ? c.montantReste
          : Math.max(0, (c.montantTotal || 0) - (c.montantEncaisse || 0))),
      0
    );
    return { totalCount, totalFacture, totalEncaisse, totalReste };
  }, [pageClients]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !contact.trim()) {
      setFormError('Veuillez renseigner le Nom, le Prénom et le Numéro de téléphone / WhatsApp.');
      return;
    }

    addClient({
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateInscription: dateInscription || TODAY_DATE,
      adresse: adresse.trim() || (isBureau ? 'Bureau SERVI-DOX' : ville),
      ville: ville.trim(),
      codePostal: ville.split(' ')[0]?.padEnd(5, '0') || '16000',
      email: email.trim() || `${prenom.toLowerCase().replace(/\s+/g, '')}.${nom.toLowerCase().replace(/\s+/g, '')}@client.dz`,
      contact: contact.trim(),
      typeDossier: targetType,
      motifDossier: motifDossier.trim(),
      statut,
      montantTotal: Number(montantTotal) || fixedTarif,
      montantEncaisse: Number(montantEncaisse) || 0,
      montantReste: Number(montantReste) || 0,
      notes: notes.trim(),
    });

    // Reset form for next registration
    setNom('');
    setPrenom('');
    setContact('');
    setEmail('');
    setAdresse('');
    setNotes('');
    setMontantTotal(fixedTarif);
    setMontantEncaisse(fixedTarif);
    setMontantReste(0);
    setFormError(null);
  };

  const handleExportPDF = () => {
    exportClientsListPDF(filteredClients, {
      title: isBureau
        ? 'LISTE DES CLIENTS : INSCRIPTION & SUIVI AU BUREAU (12 000 DA)'
        : 'LISTE DES CLIENTS HORS WILAYA : INSCRIPTION & SUIVI (15 000 DA)',
      subtitle: `Forfait Frais SERVI-DOX (Hors frais de dossier) : ${formatDA(fixedTarif)} par dossier`,
      filenamePrefix: isBureau
        ? 'SERVI-DOX_Inscription_Suivi_Bureau_12000DA'
        : 'SERVI-DOX_Clients_Hors_Wilaya_15000DA',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Hero Header */}
      <div
        className={`rounded-2xl p-6 text-white shadow-sm border flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
          isBureau
            ? 'bg-slate-900 border-slate-800'
            : 'bg-indigo-950 border-indigo-900'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold ${
              isBureau
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isBureau ? <Building2 className="w-6 h-6" /> : <Globe2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-white/10 text-white rounded-md border border-white/15">
                {isBureau ? 'Présentiel au Bureau' : 'À Distance · 58 Wilayas'}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-emerald-500 text-slate-950 rounded-md">
                Tarif Frais SERVI-DOX : {formatDA(fixedTarif)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5">
              {isBureau
                ? 'Inscription & Suivi au Bureau — 12 000 DA'
                : 'Clients Hors Wilaya : Inscription & Suivi — 15 000 DA'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {isBureau
                ? 'Gestion dédiée des clients inscrits et suivis directement dans les locaux SERVI-DOX (12 000 DA hors frais de dossier).'
                : 'Gestion dédiée des clients résidant hors wilaya pour inscription et suivi administratif à distance (15 000 DA hors frais de dossier).'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            <span>Exporter Liste PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Masquer le formulaire' : `+ Inscrire Client (${formatDA(fixedTarif)})`}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards in DA (Frais SERVI-DOX hors frais de dossier) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            {isBureau ? 'Clients Suivi Bureau' : 'Clients Hors Wilaya'}
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {stats.totalCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">{formatDA(fixedTarif)} / client</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-blue-700 block font-semibold">
            Total Frais SERVI-DOX (DA)
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-blue-700 font-mono">
              {formatDA(stats.totalFacture)}
            </span>
            <span className="text-[11px] text-slate-500">Hors frais dossier</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-700 block font-semibold">
            Total Encaissé (DA)
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono">
              {formatDA(stats.totalEncaisse)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Perçu</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-700 block font-semibold">
            Reste à Payer (DA)
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-amber-700 font-mono">
              {formatDA(stats.totalReste)}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">À recouvrer</span>
          </div>
        </div>
      </div>

      {/* Instant Registration Form for 12 000 DA or 15 000 DA */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Nouvelle Inscription & Suivi {isBureau ? 'au Bureau (12 000 DA)' : 'Hors Wilaya (15 000 DA)'}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Forfait SERVI-DOX : {formatDA(fixedTarif)} (Hors frais de dossier)
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Mansouri"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex: Yacine"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Ex: 0550 12 34 56"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wilaya du Client *
                </label>
                <select
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white"
                >
                  {WILAYAS_ALGERIE.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date d'inscription
                </label>
                <input
                  type="date"
                  value={dateInscription}
                  onChange={(e) => setDateInscription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Client (optionnel)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif / Suivi demandé
                </label>
                <input
                  type="text"
                  value={motifDossier}
                  onChange={(e) => setMotifDossier(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statut du suivi
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutDossier)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="En cours">En cours de suivi</option>
                  <option value="Validé">Validé / Terminé</option>
                  <option value="En attente">En attente de pièces</option>
                  <option value="Clôturé">Clôturé</option>
                </select>
              </div>
            </div>

            {/* Financial Row in DA */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frais SERVI-DOX (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={montantTotal}
                  onChange={(e) => {
                    const tot = Number(e.target.value);
                    setMontantTotal(tot);
                    setMontantReste(Math.max(0, tot - montantEncaisse));
                  }}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">
                  Montant Encaissé (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={montantEncaisse}
                  onChange={(e) => {
                    const enc = Number(e.target.value);
                    setMontantEncaisse(enc);
                    setMontantReste(Math.max(0, montantTotal - enc));
                  }}
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-emerald-900 border border-emerald-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Reste à Payer (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={montantReste}
                  onChange={(e) => setMontantReste(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-amber-900 border border-amber-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer ({formatDA(montantTotal)})</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search & List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un client par nom, téléphone, wilaya..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'En cours', 'Validé', 'En attente', 'Clôturé'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatutFilter(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statutFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? `Tous (${pageClients.length})` : st}
              </button>
            ))}
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-bold text-slate-800">
              Aucun client enregistré dans « {targetType} »
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Utilisez le formulaire ci-dessus pour inscrire un client au tarif officiel de{' '}
              <strong>{formatDA(fixedTarif)}</strong> (Frais SERVI-DOX hors frais de dossier).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Wilaya</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Contact & WhatsApp</th>
                  <th className="py-3 px-4 text-right">Frais SERVI-DOX</th>
                  <th className="py-3 px-4 text-right">Encaissé</th>
                  <th className="py-3 px-4 text-right">Reste</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions & PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const reste =
                    client.montantReste !== undefined
                      ? client.montantReste
                      : Math.max(0, (client.montantTotal || 0) - (client.montantEncaisse || 0));
                  const waUrl = getWhatsAppUrl(
                    client.contact,
                    `${client.prenom} ${client.nom}`,
                    client.motifDossier,
                    reste
                  );

                  return (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setViewingClient(client)}
                          className="font-bold text-slate-900 hover:text-blue-700 text-left block"
                        >
                          {client.nom.toUpperCase()} {client.prenom}
                        </button>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {client.motifDossier}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {client.ville || 'Alger'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {client.dateInscription}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900">
                            {client.contact}
                          </span>
                          {client.contact && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          {client.email && onSendGmail && (
                            <button
                              type="button"
                              onClick={() => onSendGmail(client)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Gmail</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatDA(client.montantTotal)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatDA(client.montantEncaisse)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {reste === 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            Soldé
                          </span>
                        ) : (
                          <span className="text-amber-700">{formatDA(reste)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-block relative">
                          <select
                            value={client.statut}
                            onChange={(e) =>
                              updateClientStatut(client.id, e.target.value as StatutDossier)
                            }
                            className="cursor-pointer appearance-none pl-2.5 pr-6 py-1 rounded-md text-xs font-semibold border bg-white border-slate-300"
                          >
                            <option value="En cours">En cours</option>
                            <option value="Validé">Validé</option>
                            <option value="En attente">En attente</option>
                            <option value="Clôturé">Clôturé</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-2 pointer-events-none" />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => exportSingleClientPDF(client)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Télécharger la Fiche / Reçu PDF du client"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingClient(client)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingClient(client)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Supprimer le dossier de "${client.nom} ${client.prenom}" ?`
                                )
                              ) {
                                deleteClient(client.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClientEditModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
      />

      <ClientDetailsDrawer
        client={viewingClient}
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        onEdit={(c) => {
          setViewingClient(null);
          setEditingClient(c);
        }}
      />
    </div>
  );
};
