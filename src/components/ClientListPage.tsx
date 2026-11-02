import React, { useState, useMemo } from 'react';
import { useClients } from '../context/ClientContext';
import { Client, StatutDossier, TypeDossier } from '../types/client';
import { formatDA, getWhatsAppUrl } from '../utils/format';
import { exportClientsListPDF, exportSingleClientPDF } from '../utils/pdfExport';
import { 
  Search, 
  X, 
  Plus, 
  Download, 
  FileDown,
  Edit3, 
  Trash2, 
  Eye, 
  Check, 
  ChevronDown, 
  Calendar,
  Phone,
  Mail,
  FolderKanban,
  RotateCcw,
  MessageCircle,
  CreditCard,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { syncClientsToGoogleSheet } from '../services/googleSheetsService';
import { getAccessToken } from '../services/gmailService';
import { ClientEditModal } from './ClientEditModal';
import { ClientDetailsDrawer } from './ClientDetailsDrawer';

interface ClientListPageProps {
  onNavigateAdd: () => void;
  onSendGmail?: (client: Client) => void;
}

type SortField = 'dateInscription' | 'nom' | 'typeDossier' | 'statut' | 'montantTotal' | 'montantReste';
type SortOrder = 'asc' | 'desc';

export const ClientListPage: React.FC<ClientListPageProps> = ({ onNavigateAdd, onSendGmail }) => {
  const { 
    clients, 
    updateClient, 
    updateClientStatut, 
    deleteClient, 
    clearAllClients,
    loadSampleClients,
    exportCSV, 
    resetToDemoData,
    lastUpdatedClientId,
    showToast,
  } = useClients();

  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [confirmSheetsOpen, setConfirmSheetsOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<'all' | StatutDossier>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TypeDossier>('all');
  const [sortField, setSortField] = useState<SortField>('dateInscription');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals & Drawers state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Inline row edit state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState<Partial<Client>>({});

  // Real-time calculation of statistics in Algerian Dinars (DA)
  const stats = useMemo(() => {
    const total = clients.length;
    const enCours = clients.filter((c) => c.statut === 'En cours').length;
    const valides = clients.filter((c) => c.statut === 'Validé').length;
    const enAttente = clients.filter((c) => c.statut === 'En attente').length;
    const clotures = clients.filter((c) => c.statut === 'Clôturé').length;

    const totalFacture = clients.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
    const totalEncaisse = clients.reduce((acc, c) => acc + (c.montantEncaisse || 0), 0);
    const totalReste = clients.reduce((acc, c) => acc + (c.montantReste !== undefined ? c.montantReste : Math.max(0, (c.montantTotal || 0) - (c.montantEncaisse || 0))), 0);

    return { 
      total, 
      enCours, 
      valides, 
      enAttente, 
      clotures, 
      totalFacture, 
      totalEncaisse, 
      totalReste 
    };
  }, [clients]);

  // Real-time search & filter
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search query across nom, prenom, email, contact, motif, adresse, ville, typeDossier
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nom.toLowerCase().includes(q) ||
          c.prenom.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contact.toLowerCase().includes(q) ||
          c.motifDossier.toLowerCase().includes(q) ||
          c.typeDossier.toLowerCase().includes(q) ||
          c.adresse.toLowerCase().includes(q) ||
          c.ville.toLowerCase().includes(q) ||
          (c.dateInscription && c.dateInscription.includes(q))
      );
    }

    // Status filter
    if (statutFilter !== 'all') {
      result = result.filter((c) => c.statut === statutFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((c) => c.typeDossier === typeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'nom') {
        comparison = a.nom.localeCompare(b.nom);
      } else if (sortField === 'typeDossier') {
        comparison = a.typeDossier.localeCompare(b.typeDossier);
      } else if (sortField === 'statut') {
        comparison = a.statut.localeCompare(b.statut);
      } else if (sortField === 'montantTotal') {
        comparison = (a.montantTotal || 0) - (b.montantTotal || 0);
      } else if (sortField === 'montantReste') {
        const resteA = a.montantReste ?? 0;
        const resteB = b.montantReste ?? 0;
        comparison = resteA - resteB;
      } else {
        // dateInscription
        comparison = (a.dateInscription || '').localeCompare(b.dateInscription || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [clients, searchQuery, statutFilter, typeFilter, sortField, sortOrder]);

  // Start inline editing
  const handleStartInlineEdit = (client: Client) => {
    setInlineEditingId(client.id);
    setInlineFormData({
      nom: client.nom,
      prenom: client.prenom,
      contact: client.contact,
      email: client.email,
      typeDossier: client.typeDossier,
      motifDossier: client.motifDossier,
      statut: client.statut,
      montantTotal: client.montantTotal || 0,
      montantEncaisse: client.montantEncaisse || 0,
      montantReste: client.montantReste || 0,
    });
  };

  // Save inline edit in real-time
  const handleSaveInlineEdit = (id: string) => {
    if (!inlineFormData.nom?.trim() || !inlineFormData.prenom?.trim()) {
      showToast('Champs obligatoires', 'Le nom et le prénom sont obligatoires.', 'error');
      return;
    }

    const total = Number(inlineFormData.montantTotal) || 0;
    const encaisse = Number(inlineFormData.montantEncaisse) || 0;
    const reste = inlineFormData.montantReste !== undefined ? Number(inlineFormData.montantReste) : Math.max(0, total - encaisse);

    updateClient(id, {
      ...inlineFormData,
      montantTotal: total,
      montantEncaisse: encaisse,
      montantReste: reste,
    });
    setInlineEditingId(null);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineFormData({});
  };

  // Fast direct status change
  const handleQuickStatusChange = (id: string, newStatut: StatutDossier) => {
    updateClientStatut(id, newStatut);
  };

  const handleDeleteWithPrompt = (id: string) => {
    deleteClient(id);
  };

  const getTypeBadge = (type: TypeDossier) => {
    switch (type) {
      case 'Auto-entrepreneur':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
            Auto-entrepreneur (40 000 DA)
          </span>
        );
      case 'RC':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
            RC (50 000 DA)
          </span>
        );
      case 'Entreprise':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
            SARL / EURL (100 000 DA)
          </span>
        );
      case 'Inscription & Suivi (Bureau)':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
            Suivi Bureau (12 000 DA)
          </span>
        );
      case 'Inscription & Suivi (Hors Wilaya)':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-purple-800 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md">
            Hors Wilaya (15 000 DA)
          </span>
        );
      case 'Autre dossier':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            Autre dossier
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Stats Header in Algerian Dinars (DA) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Dossiers</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500">en base SERVI-DOX</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Facturé (DA)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
              {formatDA(stats.totalFacture)}
            </span>
            <span className="text-xs text-blue-600 font-medium">chiffre d'affaires</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-700 block font-semibold">Total Encaissé (DA)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {formatDA(stats.totalEncaisse)}
            </span>
            <span className="text-xs text-emerald-600 font-medium">perçu</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-700 block font-semibold">Reste à Payer (DA)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {formatDA(stats.totalReste)}
            </span>
            <span className="text-xs text-amber-600 font-medium">à recouvrer</span>
          </div>
        </div>
      </div>

      {/* Main Section Header with Search & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Espace Contrôle des Clients & Dossiers SERVI-DOX
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Recherche instantanée, bouton direct WhatsApp et gestion des encaissements en Dinars (DA)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={() => exportClientsListPDF(filteredClients)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg shadow-xs transition-colors"
              title="Exporter la liste des clients au format PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Exporter PDF</span>
            </button>

            <button
              onClick={() => setConfirmSheetsOpen(true)}
              disabled={isExportingSheets}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Exporter vers un classeur Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isExportingSheets ? 'Exportation...' : 'Google Sheets'}</span>
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              title="Exporter tous les dossiers au format CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={onNavigateAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau client</span>
            </button>
          </div>
        </div>

        {/* Real-time Search Input & Type Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Instant Search Bar */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche instantanée (Nom, Prénom, contact, email, motif, adresse, type)..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | TypeDossier)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
            >
              <option value="all">Tous les types de dossier</option>
              <option value="Entreprise">Création SARL / EURL (100 000 DA)</option>
              <option value="RC">Registre du Commerce RC (50 000 DA)</option>
              <option value="Auto-entrepreneur">Auto-entrepreneur (40 000 DA)</option>
              <option value="Inscription & Suivi (Bureau)">Inscription & Suivi Bureau (12 000 DA)</option>
              <option value="Inscription & Suivi (Hors Wilaya)">Clients Hors Wilaya (15 000 DA)</option>
              <option value="Autre dossier">Autre dossier</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="md:col-span-3">
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(f);
                setSortOrder(o);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white text-slate-900"
            >
              <option value="dateInscription-desc">Date d'inscription (récents)</option>
              <option value="dateInscription-asc">Date d'inscription (anciens)</option>
              <option value="nom-asc">Nom du client (A → Z)</option>
              <option value="nom-desc">Nom du client (Z → A)</option>
              <option value="montantTotal-desc">Montant le plus élevé (DA)</option>
              <option value="montantReste-desc">Reste à payer le plus élevé (DA)</option>
              <option value="statut-asc">Statut de traitement</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs (Segmented controls) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStatutFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statutFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({clients.length})
            </button>
            <button
              onClick={() => setStatutFilter('En cours')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statutFilter === 'En cours'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En cours ({clients.filter((c) => c.statut === 'En cours').length})
            </button>
            <button
              onClick={() => setStatutFilter('Validé')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statutFilter === 'Validé'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Validés ({clients.filter((c) => c.statut === 'Validé').length})
            </button>
            <button
              onClick={() => setStatutFilter('En attente')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statutFilter === 'En attente'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En attente ({clients.filter((c) => c.statut === 'En attente').length})
            </button>
            <button
              onClick={() => setStatutFilter('Clôturé')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statutFilter === 'Clôturé'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clôturés ({clients.filter((c) => c.statut === 'Clôturé').length})
            </button>
          </div>

          <div className="text-xs text-slate-500">
            <span>{filteredClients.length}</span> résultat{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''} sur{' '}
            <span className="font-mono tabular-nums">{clients.length}</span> dossiers au total
          </div>
        </div>
      </div>

      {/* Main Table: SERVI-DOX Client Control & Live Editing */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {clients.length === 0 ? (
              <>
                <h3 className="text-base font-bold text-slate-900">
                  La liste des clients est actuellement vierge
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Aucun dossier client n'est encore enregistré dans votre base SERVI-DOX.
                  Commencez dès maintenant en créant votre premier client avec ses montants en Dinars Algériens (DA).
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={onNavigateAdd}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un premier client</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-800">
                  Aucun dossier ne correspond à votre recherche
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Aucun résultat pour vos filtres actuels. Réinitialisez la recherche ou vos critères.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatutFilter('all');
                      setTypeFilter('all');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Effacer les filtres
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
                  <th className="py-3 px-4">Client (Nom & Prénom)</th>
                  <th className="py-3 px-4">Date Inscription</th>
                  <th className="py-3 px-4">Type & Motif</th>
                  <th className="py-3 px-4">Contact & WhatsApp</th>
                  <th className="py-3 px-4 text-right">Montant Encaissé</th>
                  <th className="py-3 px-4 text-right">Reste à Payer</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const isInlineEditing = inlineEditingId === client.id;
                  const isRecentlyUpdated = lastUpdatedClientId === client.id;
                  const waUrl = getWhatsAppUrl(client.contact, `${client.prenom} ${client.nom}`, client.motifDossier, client.montantReste);

                  if (isInlineEditing) {
                    return (
                      <tr
                        key={client.id}
                        className="bg-blue-50/60 transition-colors border-y-2 border-blue-500"
                      >
                        {/* Inline Nom & Prénom */}
                        <td className="py-3 px-4 space-y-1">
                          <input
                            type="text"
                            value={inlineFormData.nom || ''}
                            onChange={(e) =>
                              setInlineFormData({ ...inlineFormData, nom: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            placeholder="Nom"
                          />
                          <input
                            type="text"
                            value={inlineFormData.prenom || ''}
                            onChange={(e) =>
                              setInlineFormData({ ...inlineFormData, prenom: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            placeholder="Prénom"
                          />
                        </td>

                        {/* Date Inscription */}
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {client.dateInscription}
                        </td>

                        {/* Inline Type & Motif */}
                        <td className="py-3 px-4 space-y-1">
                          <select
                            value={inlineFormData.typeDossier}
                            onChange={(e) =>
                              setInlineFormData({
                                ...inlineFormData,
                                typeDossier: e.target.value as TypeDossier,
                              })
                            }
                            className="text-xs px-2 py-1 border border-blue-400 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 w-full"
                          >
                            <option value="Entreprise">SARL / EURL (100 000 DA)</option>
                            <option value="RC">RC (50 000 DA)</option>
                            <option value="Auto-entrepreneur">Auto-entrepreneur (40 000 DA)</option>
                            <option value="Inscription & Suivi (Bureau)">Suivi Bureau (12 000 DA)</option>
                            <option value="Inscription & Suivi (Hors Wilaya)">Hors Wilaya (15 000 DA)</option>
                            <option value="Autre dossier">Autre dossier</option>
                          </select>
                          <input
                            type="text"
                            value={inlineFormData.motifDossier || ''}
                            onChange={(e) =>
                              setInlineFormData({
                                ...inlineFormData,
                                motifDossier: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            placeholder="Motif"
                          />
                        </td>

                        {/* Inline Contact & Email */}
                        <td className="py-3 px-4 space-y-1">
                          <input
                            type="tel"
                            value={inlineFormData.contact || ''}
                            onChange={(e) =>
                              setInlineFormData({ ...inlineFormData, contact: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs font-mono border border-blue-400 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            placeholder="Téléphone"
                          />
                          <input
                            type="email"
                            value={inlineFormData.email || ''}
                            onChange={(e) =>
                              setInlineFormData({ ...inlineFormData, email: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            placeholder="Email"
                          />
                        </td>

                        {/* Inline Montant Encaissé (DA) */}
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={inlineFormData.montantEncaisse ?? 0}
                            onChange={(e) => {
                              const enc = Number(e.target.value);
                              const tot = inlineFormData.montantTotal ?? 0;
                              setInlineFormData({
                                ...inlineFormData,
                                montantEncaisse: enc,
                                montantReste: Math.max(0, tot - enc),
                              });
                            }}
                            className="w-24 px-2 py-1 text-xs font-mono font-bold text-emerald-800 border border-emerald-400 rounded bg-white text-right focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            placeholder="Encaissé"
                          />
                          <span className="text-[10px] text-slate-400 block font-mono">DA</span>
                        </td>

                        {/* Inline Reste à Payer (DA) */}
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={inlineFormData.montantReste ?? 0}
                            onChange={(e) =>
                              setInlineFormData({
                                ...inlineFormData,
                                montantReste: Number(e.target.value),
                              })
                            }
                            className="w-24 px-2 py-1 text-xs font-mono font-bold text-amber-800 border border-amber-400 rounded bg-white text-right focus:outline-none focus:ring-1 focus:ring-amber-600"
                            placeholder="Reste"
                          />
                          <span className="text-[10px] text-slate-400 block font-mono">DA</span>
                        </td>

                        {/* Inline Statut */}
                        <td className="py-3 px-4 text-center">
                          <select
                            value={inlineFormData.statut}
                            onChange={(e) =>
                              setInlineFormData({
                                ...inlineFormData,
                                statut: e.target.value as StatutDossier,
                              })
                            }
                            className="text-xs px-2 py-1 border border-blue-400 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                          >
                            <option value="En cours">En cours</option>
                            <option value="Validé">Validé</option>
                            <option value="En attente">En attente</option>
                            <option value="Clôturé">Clôturé</option>
                          </select>
                        </td>

                        {/* Inline Save / Cancel */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveInlineEdit(client.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1 shadow-xs"
                              title="Enregistrer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Enregistrer</span>
                            </button>
                            <button
                              onClick={handleCancelInlineEdit}
                              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded transition-colors"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const reste = client.montantReste !== undefined ? client.montantReste : Math.max(0, (client.montantTotal || 0) - (client.montantEncaisse || 0));

                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-slate-50 transition-colors group ${
                        isRecentlyUpdated ? 'bg-emerald-50/70 animate-pulse duration-1000' : ''
                      }`}
                    >
                      {/* Client Name */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setViewingClient(client)}
                          className="font-bold text-slate-900 hover:text-blue-700 text-left block transition-colors leading-tight"
                        >
                          {client.nom.toUpperCase()} {client.prenom}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {client.id}
                        </span>
                      </td>

                      {/* Date Inscription */}
                      <td className="py-3 px-4 text-slate-700 font-mono tabular-nums whitespace-nowrap">
                        {client.dateInscription || '—'}
                      </td>

                      {/* Type & Motif */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="mb-0.5">{getTypeBadge(client.typeDossier)}</div>
                        <p className="text-slate-700 line-clamp-1 text-[11px] leading-relaxed">
                          {client.motifDossier}
                        </p>
                      </td>

                      {/* Contact & WhatsApp / Gmail Buttons */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-slate-900 font-medium">
                            {client.contact}
                          </span>
                          {/* DIRECT WHATSAPP BUTTON */}
                          {client.contact && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs"
                              title={`Contacter ${client.nom} sur WhatsApp`}
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          {/* DIRECT GMAIL BUTTON */}
                          {client.email && onSendGmail && (
                            <button
                              type="button"
                              onClick={() => onSendGmail(client)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-2xs"
                              title={`Envoyer un email Gmail à ${client.nom}`}
                            >
                              <Mail className="w-3 h-3 text-blue-600" />
                              <span>Gmail</span>
                            </button>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[190px] mt-0.5">
                          {client.email}
                        </div>
                      </td>

                      {/* Montant Encaissé (DA) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-700 tabular-nums">
                          {formatDA(client.montantEncaisse)}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          sur {formatDA(client.montantTotal)}
                        </span>
                      </td>

                      {/* Reste à Payer (DA) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {reste === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3" />
                            Soldé
                          </span>
                        ) : (
                          <div>
                            <span className="font-mono font-bold text-amber-700 tabular-nums">
                              {formatDA(reste)}
                            </span>
                            <span className="block text-[10px] text-amber-600 font-medium">
                              Reste dû
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Statut (Direct Clickable Dropdown) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-block relative">
                          <select
                            value={client.statut}
                            onChange={(e) =>
                              handleQuickStatusChange(client.id, e.target.value as StatutDossier)
                            }
                            className={`cursor-pointer appearance-none pl-2.5 pr-6 py-1 rounded-md text-xs font-semibold border transition-all ${
                              client.statut === 'Validé'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : client.statut === 'En cours'
                                ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                : client.statut === 'En attente'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Modifier le statut du dossier en temps réel"
                          >
                            <option value="En cours">En cours</option>
                            <option value="Validé">Validé</option>
                            <option value="En attente">En attente</option>
                            <option value="Clôturé">Clôturé</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-2 pointer-events-none" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Direct WhatsApp icon */}
                          {client.contact && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Contacter sur WhatsApp"
                              aria-label="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Export individual client PDF fiche */}
                          <button
                            onClick={() => exportSingleClientPDF(client)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Exporter la Fiche / Reçu PDF de ce client"
                            aria-label="Exporter PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick inline edit toggle */}
                          <button
                            onClick={() => handleStartInlineEdit(client)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Modifier directement dans la ligne"
                            aria-label="Modifier la ligne"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Full modal edit */}
                          <button
                            onClick={() => setEditingClient(client)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            title="Consulter et modifier en détail"
                            aria-label="Fiche complète"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteWithPrompt(client.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Supprimer ce dossier"
                            aria-label="Supprimer"
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

      {/* Real-time Indicator Footer Note */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>SERVI-DOX · Monnaie configurée en Dinars Algériens (DA) · WhatsApp direct activé</span>
        </div>
        <div className="text-slate-400">
          Cliquez sur le badge vert "WhatsApp" pour ouvrir la conversation avec le client
        </div>
      </div>

      {/* Edit Modal Component */}
      <ClientEditModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
      />

      {/* Details Drawer Component */}
      <ClientDetailsDrawer
        client={viewingClient}
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        onEdit={(client) => {
          setViewingClient(null);
          setEditingClient(client);
        }}
      />

      {/* Confirmation Modal pour Google Sheets */}
      {confirmSheetsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Exporter vers Google Sheets
                </h3>
                <p className="text-[11px] text-slate-500">
                  Création d'un nouveau classeur sur votre Google Drive
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Voulez-vous synchroniser les <strong>{filteredClients.length} dossiers clients</strong> actuels dans un nouveau classeur Google Sheets ? Vous pourrez y accéder directement depuis Google Drive ou Servidox.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSheetsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmSheetsOpen(false);
                  setIsExportingSheets(true);
                  try {
                    const token = (await getAccessToken()) || 'token-sandbox-zinemoh106';
                    const res = await syncClientsToGoogleSheet(token, filteredClients);
                    showToast(
                      'Exportation réussie',
                      `Le classeur Google Sheets "${res.name}" a été créé avec succès.`,
                      'success'
                    );
                  } catch (e) {
                    console.error(e);
                    showToast('Erreur', 'Impossible de synchroniser avec Google Sheets.', 'error');
                  } finally {
                    setIsExportingSheets(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmer l'exportation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
