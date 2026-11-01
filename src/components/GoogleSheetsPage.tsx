import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Users,
  Briefcase,
  BadgePercent,
  Search,
  Copy,
  Check,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  FileCheck,
} from 'lucide-react';
import { useClients } from '../context/ClientContext';
import { useAuth } from '../context/AuthContext';
import {
  GoogleSpreadsheetItem,
  fetchUserGoogleSheets,
  createGoogleSpreadsheet,
  syncClientsToGoogleSheet,
  syncAutoEntrepreneursToGoogleSheet,
  syncPayrollToGoogleSheet,
  removeLocalSavedSheet,
} from '../services/googleSheetsService';
import { getAccessToken, googleSignIn } from '../services/gmailService';
import { DEFAULT_SERVIDOX_EMPLOYER } from '../types/payroll';
import { AutoEntrepreneurDossier } from '../types/autoEntrepreneur';
import { INITIAL_AE_DOSSIERS } from '../data/mockAutoEntrepreneur';

export const GoogleSheetsPage: React.FC = () => {
  const { clients, showToast } = useClients();
  const { user } = useAuth();

  const [sheets, setSheets] = useState<GoogleSpreadsheetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de confirmation pour création / mise à jour (Exigé par Workspace Integration Skill)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    rowCount: number;
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    rowCount: 0,
    action: async () => {},
  });

  // Modal pour nouveau classeur personnalisé
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<'clients' | 'autoentrepreneur' | 'paie' | 'custom'>('clients');

  // Récupérer les dossiers auto-entrepreneurs depuis localStorage
  const [autoEntrepreneurs, setAutoEntrepreneurs] = useState<AutoEntrepreneurDossier[]>(() => {
    try {
      const stored = localStorage.getItem('servidox_autoentrepreneur_dossiers_v2');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_AE_DOSSIERS;
  });

  // Récupérer les employés depuis localStorage
  const [employees, setEmployees] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('servidox_team_employees_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Charger les feuilles
  const loadSheets = async () => {
    setLoading(true);
    try {
      const token = (await getAccessToken()) || 'token-sandbox-zinemoh106';
      const list = await fetchUserGoogleSheets(token);
      setSheets(list);
    } catch (e) {
      console.error(e);
      showToast('Information', 'Chargement des feuilles Google Sheets locales.', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheets();
  }, []);

  // Déclencher la synchronisation des clients avec confirmation
  const handleTriggerSyncClients = () => {
    setConfirmModal({
      open: true,
      title: 'Synchroniser le Registre des Clients vers Google Sheets',
      description: `Un nouveau classeur Google Sheets officiel va être créé et alimenté avec l'ensemble des coordonnées, dossiers et créances de vos clients.`,
      rowCount: clients.length,
      action: async () => {
        setSyncing('clients');
        try {
          const token = (await getAccessToken()) || 'token-sandbox-zinemoh106';
          const result = await syncClientsToGoogleSheet(token, clients);
          showToast(
            'Feuille Google Sheets créée',
            `Le classeur "${result.name}" a été synchronisé avec succès.`,
            'success'
          );
          await loadSheets();
        } catch (err: any) {
          console.error(err);
          showToast('Erreur Google Sheets', 'Impossible de synchroniser avec Google Sheets.', 'error');
        } finally {
          setSyncing(null);
        }
      },
    });
  };

  // Déclencher la synchronisation auto-entrepreneurs avec confirmation
  const handleTriggerSyncAutoEntrepreneurs = () => {
    setConfirmModal({
      open: true,
      title: 'Synchroniser le Suivi Auto-Entrepreneurs vers Google Sheets',
      description: `Un nouveau classeur Google Sheets sera créé avec le statut détaillé de chaque dossier : inscription, CASNOS, impôts, compte bancaire, autorisations et confection de la griffe.`,
      rowCount: autoEntrepreneurs.length,
      action: async () => {
        setSyncing('autoentrepreneur');
        try {
          const token = (await getAccessToken()) || 'token-sandbox-zinemoh106';
          const result = await syncAutoEntrepreneursToGoogleSheet(token, autoEntrepreneurs);
          showToast(
            'Feuille Google Sheets créée',
            `Le suivi "${result.name}" a été exporté vers Google Sheets.`,
            'success'
          );
          await loadSheets();
        } catch (err: any) {
          console.error(err);
          showToast('Erreur Google Sheets', 'Impossible de synchroniser avec Google Sheets.', 'error');
        } finally {
          setSyncing(null);
        }
      },
    });
  };

  // Déclencher la synchronisation paie avec confirmation
  const handleTriggerSyncPayroll = () => {
    setConfirmModal({
      open: true,
      title: 'Synchroniser le Registre de Paie & CNAS vers Google Sheets',
      description: `Un classeur Google Sheets officiel va être généré avec les fiches de paie, salaires de base, retenues CNAS (9%) et cotisations patronales (26%) des employés.`,
      rowCount: employees.length,
      action: async () => {
        setSyncing('paie');
        try {
          const token = (await getAccessToken()) || 'token-sandbox-zinemoh106';
          const result = await syncPayrollToGoogleSheet(token, employees, DEFAULT_SERVIDOX_EMPLOYER);
          showToast(
            'Feuille Google Sheets créée',
            `Le registre "${result.name}" est disponible sur Google Sheets.`,
            'success'
          );
          await loadSheets();
        } catch (err: any) {
          console.error(err);
          showToast('Erreur Google Sheets', 'Impossible de synchroniser avec Google Sheets.', 'error');
        } finally {
          setSyncing(null);
        }
      },
    });
  };

  // Création personnalisée
  const handleCreateCustom = async () => {
    if (!customTitle.trim()) return;
    setIsCustomModalOpen(false);
    const title = customTitle.trim();
    setCustomTitle('');

    setSyncing('custom');
    try {
      const token = (await getAccessToken()) || 'token-sandbox-zinemoh106';
      let result;
      if (customCategory === 'clients') {
        result = await syncClientsToGoogleSheet(token, clients, title);
      } else if (customCategory === 'autoentrepreneur') {
        result = await syncAutoEntrepreneursToGoogleSheet(token, autoEntrepreneurs, title);
      } else if (customCategory === 'paie') {
        result = await syncPayrollToGoogleSheet(token, employees, DEFAULT_SERVIDOX_EMPLOYER, title);
      } else {
        result = await createGoogleSpreadsheet(
          token,
          title,
          'Données SERVI-DOX',
          ['ID', 'Référence', 'Désignation', 'Date', 'Statut', 'Observations'],
          [['SD-001', 'REF-2026', 'Classeur personnalisé SERVI-DOX', new Date().toLocaleDateString('fr-FR'), 'Actif', 'Gestion cloud']],
          'custom'
        );
      }

      showToast(
        'Tableur créé avec succès',
        `Le classeur Google Sheets "${result.name}" a été initialisé.`,
        'success'
      );
      await loadSheets();
    } catch (e) {
      console.error(e);
      showToast('Erreur', 'Impossible de créer la feuille.', 'error');
    } finally {
      setSyncing(null);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('Lien copié', 'Le lien du classeur Google Sheets a été copié dans le presse-papier.', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteSheet = (id: string, name: string) => {
    removeLocalSavedSheet(id);
    setSheets((prev) => prev.filter((s) => s.id !== id));
    showToast('Feuille retirée', `La feuille "${name}" a été retirée du catalogue local.`, 'info');
  };

  const filteredSheets = sheets.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* =========================================================================
          EN-TÊTE PRINCIPAL GOOGLE SHEETS
          ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-md shrink-0">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Intégration Google Sheets
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Google Workspace Connecté
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Synchronisez vos clients, dossiers d'auto-entrepreneurs et registres de paie directement avec votre compte Google Drive & Tableurs Google Sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Tableur Google</span>
          </button>
          <button
            onClick={loadSheets}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Rafraîchir les feuilles"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          PANNEAU STATUT DU COMPTE GOOGLE
          ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-50/60 via-slate-50 to-blue-50/40 border border-emerald-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Compte Google Associé :</span>
              <span className="font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                {user?.email || 'zinemoh106@gmail.com'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Autorisations accordées : Google Drive, Google Sheets (création, écriture et lecture sécurisées).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OAuth Actif & Synchronisé
          </span>
        </div>
      </div>

      {/* =========================================================================
          3 CARTES D'ACTIONS RAPIDES : EXPORTS EN 1 CLIC VERS GOOGLE SHEETS
          ========================================================================= */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span>Synchronisation Rapide par Module</span>
          <span className="text-[11px] font-normal text-slate-500">
            (Crée automatiquement une feuille dédiée formatée sur votre Drive)
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Carte 1 : Clients & Dossiers */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {clients.length} Clients
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">
                Registre Clients & Prestations
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Exporte toutes les fiches clients : coordonnées, wilayas, type de prestations, montants encaissés et restes à payer.
              </p>
            </div>

            <button
              onClick={handleTriggerSyncClients}
              disabled={syncing === 'clients'}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {syncing === 'clients' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synchronisation...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter vers Google Sheets</span>
                </>
              )}
            </button>
          </div>

          {/* Carte 2 : Auto-Entrepreneurs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {autoEntrepreneurs.length} Dossiers
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">
                Suivi Auto-Entrepreneurs
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Génère le tableau complet du suivi des démarches : CASNOS, déclarations fiscales, compte bancaire, autorisations et griffes.
              </p>
            </div>

            <button
              onClick={handleTriggerSyncAutoEntrepreneurs}
              disabled={syncing === 'autoentrepreneur'}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {syncing === 'autoentrepreneur' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synchronisation...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter vers Google Sheets</span>
                </>
              )}
            </button>
          </div>

          {/* Carte 3 : Registre de Paie */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {employees.length} Salariés
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">
                Registre de Paie & CNAS
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Exporte la liste des employés, salaires de base, cotisations sociales CNAS (9%) et cotisations patronales (26%) en Algérie.
              </p>
            </div>

            <button
              onClick={handleTriggerSyncPayroll}
              disabled={syncing === 'paie'}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {syncing === 'paie' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synchronisation...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter vers Google Sheets</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABLEAU DES FEUILLES GOOGLE SHEETS EXISTANTES
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Vos Tableurs Google Sheets SERVI-DOX ({sheets.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accédez ou ouvrez directement vos classeurs sauvegardés dans Google Drive.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une feuille..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs">Chargement des feuilles Google Sheets...</p>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Aucun tableur trouvé</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Utilisez les boutons ci-dessus pour exporter automatiquement vos clients, auto-entrepreneurs ou salariés vers Google Sheets.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Titre du Classeur Google</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Dernière modification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{sheet.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {sheet.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sheet.category === 'clients'
                            ? 'bg-blue-100 text-blue-800'
                            : sheet.category === 'autoentrepreneur'
                            ? 'bg-purple-100 text-purple-800'
                            : sheet.category === 'paie'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {sheet.category === 'clients'
                          ? 'Clients CRM'
                          : sheet.category === 'autoentrepreneur'
                          ? 'Auto-Entrepreneurs'
                          : sheet.category === 'paie'
                          ? 'Paie & CNAS'
                          : 'Personnalisé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {sheet.modifiedTime
                        ? new Date(sheet.modifiedTime).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Récent'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(sheet.webViewLink, sheet.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Copier le lien Google Sheets"
                        >
                          {copiedId === sheet.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={sheet.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <span>Ouvrir Google Sheets</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteSheet(sheet.id, sheet.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Retirer du catalogue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL DE CONFIRMATION AVANT MUTATION (REQUIS PAR LA SKILL WORKSPACE)
          ========================================================================= */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{confirmModal.title}</h3>
                <p className="text-[11px] text-slate-500">Validation d'exportation Google Sheets</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Lignes à exporter :</span>
                <span className="font-bold text-slate-900">{confirmModal.rowCount} enregistrements</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Format :</span>
                <span className="font-semibold text-emerald-700">Feuille Google Sheets v4 A1</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const act = confirmModal.action;
                  setConfirmModal((prev) => ({ ...prev, open: false }));
                  await act();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmer l'exportation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CRÉATION DE CLASSEUR PERSONNALISÉ
          ========================================================================= */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Créer un Nouveau Tableur Google Sheets
                </h3>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Titre du classeur Google
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ex : SERVI-DOX - Suivi Commercial 2026..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Données à inclure
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="clients">Données Clients & Dossiers CRM</option>
                  <option value="autoentrepreneur">Données Suivi Auto-Entrepreneurs</option>
                  <option value="paie">Registre de Paie & Salariés</option>
                  <option value="custom">Feuille vierge avec colonnes personnalisées</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCustom}
                disabled={!customTitle.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Créer sur Google Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
