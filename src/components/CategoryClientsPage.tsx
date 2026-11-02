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
  Landmark,
  Globe2,
  Building,
  CreditCard,
  UserPlus,
  Calendar,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import { ClientEditModal } from './ClientEditModal';
import { ClientDetailsDrawer } from './ClientDetailsDrawer';

export type CategoryKey = 'sarl_eurl' | 'registre_rc' | 'hors_wilaya' | 'suivi_bureau';

interface CategoryClientsPageProps {
  category: CategoryKey;
  onSendGmail?: (client: Client) => void;
  onNavigateAdd?: () => void;
}

interface CategoryConfig {
  title: string;
  badge: string;
  subtitle: string;
  targetType: TypeDossier;
  defaultTarif: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badgeColor: string;
  borderColor: string;
  defaultMotif: string;
  placeholderVille: string;
}

const CATEGORY_CONFIGS: Record<CategoryKey, CategoryConfig> = {
  sarl_eurl: {
    title: 'Dossiers SARL & EURL',
    badge: "Création d'Entreprise",
    subtitle: "Suivi complet de la constitution des sociétés : statuts notariés, parutions légales, immatriculation et domiciliation.",
    targetType: 'Entreprise',
    defaultTarif: 100000,
    icon: Building2,
    gradient: 'from-blue-700 via-indigo-800 to-slate-900',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    borderColor: 'border-blue-200',
    defaultMotif: "Création d'entreprise SARL / EURL (Frais SERVI-DOX hors frais de dossier)",
    placeholderVille: '16 - Alger',
  },
  registre_rc: {
    title: 'Dossiers Registre du Commerce (RC)',
    badge: 'Immatriculation & Modification RC',
    subtitle: "Dossiers d'immatriculation au CNRC, adjonctions de codes d'activité, modifications statutaires et radiations.",
    targetType: 'RC',
    defaultTarif: 50000,
    icon: Landmark,
    gradient: 'from-emerald-700 via-teal-800 to-slate-900',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-200',
    defaultMotif: 'Immatriculation Registre du Commerce RC (Frais SERVI-DOX hors frais de dossier)',
    placeholderVille: '16 - Alger',
  },
  hors_wilaya: {
    title: 'Clients Hors Wilaya',
    badge: 'Suivi à Distance (58 Wilayas)',
    subtitle: "Accompagnement continu à distance des entrepreneurs résidant hors d'Alger : formalités, documents et assistance.",
    targetType: 'Inscription & Suivi (Hors Wilaya)',
    defaultTarif: 15000,
    icon: Globe2,
    gradient: 'from-purple-700 via-indigo-800 to-slate-900',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    borderColor: 'border-purple-200',
    defaultMotif: 'Inscription et suivi à distance — Client Hors Wilaya',
    placeholderVille: '31 - Oran',
  },
  suivi_bureau: {
    title: 'Suivi Bureau',
    badge: 'Inscription & Suivi au Cabinet',
    subtitle: "Dossiers des clients accueillis directement dans nos bureaux à Alger pour inscription et suivi administratif.",
    targetType: 'Inscription & Suivi (Bureau)',
    defaultTarif: 12000,
    icon: Building,
    gradient: 'from-sky-700 via-blue-800 to-slate-900',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    borderColor: 'border-sky-200',
    defaultMotif: 'Inscription et suivi administratif au niveau du bureau SERVI-DOX',
    placeholderVille: '16 - Alger',
  },
};

const WILAYAS_58 = [
  '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi', '05 - Batna',
  '06 - Béjaïa', '07 - Biskra', '08 - Béchar', '09 - Blida', '10 - Bouira',
  '11 - Tamanrasset', '12 - Tébessa', '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou',
  '16 - Alger', '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
  '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma', '25 - Constantine',
  '26 - Médéa', '27 - Mostaganem', '28 - M\'Sila', '29 - Mascara', '30 - Ouargla',
  '31 - Oran', '32 - El Bayadh', '33 - Illizi', '34 - Bordj Bou Arreridj', '35 - Boumerdès',
  '36 - El Tarf', '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
  '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla', '45 - Naâma',
  '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane', '49 - Timimoun',
  '50 - Bordj Badji Mokhtar', '51 - Ouled Djellal', '52 - Béni Abbès', '53 - In Salah',
  '54 - In Guezzam', '55 - Touggourt', '56 - Djanet', '57 - El M\'Ghair', '58 - El Meniaa',
];

const TODAY_DATE = new Date().toISOString().split('T')[0];

export const CategoryClientsPage: React.FC<CategoryClientsPageProps> = ({
  category,
  onSendGmail,
  onNavigateAdd,
}) => {
  const { clients, addClient, updateClientStatut, deleteClient, showToast } = useClients();
  const config = CATEGORY_CONFIGS[category];
  const IconComponent = config.icon;

  // Filter clients matching this category's targetType
  const categoryClients = useMemo(() => {
    return clients.filter((c) => c.typeDossier === config.targetType);
  }, [clients, config.targetType]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<'all' | StatutDossier>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Quick Inline Add Form State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateInscription, setDateInscription] = useState(TODAY_DATE);
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState(config.placeholderVille);
  const [adresse, setAdresse] = useState('');
  const [motifDossier, setMotifDossier] = useState(config.defaultMotif);
  const [statut, setStatut] = useState<StatutDossier>('En cours');
  const [montantTotal, setMontantTotal] = useState<number>(config.defaultTarif);
  const [montantEncaisse, setMontantEncaisse] = useState<number>(config.defaultTarif);
  const [montantReste, setMontantReste] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Update default values when category prop changes
  React.useEffect(() => {
    setMontantTotal(config.defaultTarif);
    setMontantEncaisse(config.defaultTarif);
    setMontantReste(0);
    setMotifDossier(config.defaultMotif);
    setVille(config.placeholderVille);
  }, [category, config]);

  const handleTotalChange = (val: number) => {
    setMontantTotal(val);
    setMontantReste(Math.max(0, val - montantEncaisse));
  };

  const handleEncaisseChange = (val: number) => {
    setMontantEncaisse(val);
    setMontantReste(Math.max(0, montantTotal - val));
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nom.trim() || !prenom.trim()) {
      setFormError('Le nom et le prénom sont obligatoires.');
      return;
    }
    if (!contact.trim()) {
      setFormError('Le numéro de téléphone est obligatoire.');
      return;
    }

    addClient({
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateInscription,
      adresse: adresse.trim() || ville,
      ville: ville.trim() || 'Alger',
      codePostal: '16000',
      email: email.trim(),
      contact: contact.trim(),
      typeDossier: config.targetType,
      motifDossier: motifDossier.trim() || config.defaultMotif,
      statut,
      montantTotal: Number(montantTotal) || 0,
      montantEncaisse: Number(montantEncaisse) || 0,
      montantReste: Number(montantReste) || 0,
      notes: notes.trim(),
    });

    showToast(
      'Dossier enregistré',
      `Le dossier [${config.badge}] de ${prenom} ${nom} a été ajouté avec succès.`,
      'success'
    );

    // Reset quick form
    setNom('');
    setPrenom('');
    setContact('');
    setEmail('');
    setAdresse('');
    setNotes('');
    setMontantTotal(config.defaultTarif);
    setMontantEncaisse(config.defaultTarif);
    setMontantReste(0);
    setShowQuickAdd(false);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return categoryClients.filter((client) => {
      if (statutFilter !== 'all' && client.statut !== statutFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${client.nom} ${client.prenom}`.toLowerCase();
        const matchName = fullName.includes(q);
        const matchPhone = (client.contact || '').toLowerCase().includes(q);
        const matchEmail = (client.email || '').toLowerCase().includes(q);
        const matchVille = (client.ville || '').toLowerCase().includes(q);
        const matchId = (client.id || '').toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail || matchVille || matchId;
      }
      return true;
    });
  }, [categoryClients, statutFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = categoryClients.length;
    const enCours = categoryClients.filter((c) => c.statut === 'En cours').length;
    const valides = categoryClients.filter((c) => c.statut === 'Validé').length;
    const enAttente = categoryClients.filter((c) => c.statut === 'En attente').length;
    const clotures = categoryClients.filter((c) => c.statut === 'Clôturé').length;

    const totalFacture = categoryClients.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
    const totalEncaisse = categoryClients.reduce((acc, c) => acc + (c.montantEncaisse || 0), 0);
    const totalReste = categoryClients.reduce((acc, c) => acc + (c.montantReste || 0), 0);

    return { total, enCours, valides, enAttente, clotures, totalFacture, totalEncaisse, totalReste };
  }, [categoryClients]);

  // Export PDF
  const handleExportPDF = () => {
    if (categoryClients.length === 0) {
      showToast('Aucun dossier', 'Aucun dossier à exporter pour cette catégorie.', 'warning');
      return;
    }
    exportClientsListPDF(categoryClients, {
      title: `LISTE DES DOSSIERS ${config.title.toUpperCase()} — SERVI-DOX`,
      subtitle: `${config.subtitle} — Montants en Dinars Algériens (DA)`,
      filenamePrefix: `SERVIDOX_${category}`,
    });
    showToast('Export PDF prêt', `Export PDF de ${categoryClients.length} dossier(s) généré.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (categoryClients.length === 0) {
      showToast('Aucun dossier', 'Aucun dossier à exporter.', 'warning');
      return;
    }
    const headers = ['ID', 'Nom', 'Prénom', 'Date Inscription', 'Téléphone', 'Email', 'Ville', 'Motif', 'Statut', 'Total DA', 'Encaissé DA', 'Reste DA'];
    const rows = categoryClients.map((c) => [
      c.id,
      `"${c.nom}"`,
      `"${c.prenom}"`,
      c.dateInscription,
      `"${c.contact}"`,
      `"${c.email || ''}"`,
      `"${c.ville || ''}"`,
      `"${c.motifDossier}"`,
      c.statut,
      c.montantTotal,
      c.montantEncaisse,
      c.montantReste,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `SERVIDOX_${category}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export CSV réussi', `${categoryClients.length} dossiers exportés en CSV.`);
  };

  const handleDeleteClient = (client: Client) => {
    deleteClient(client.id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${config.gradient} text-white p-6 sm:p-8 shadow-xl`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 flex items-center gap-1.5 backdrop-blur-sm">
                <IconComponent className="w-3.5 h-3.5 text-amber-300" />
                {config.badge}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Tarif officiel : {formatDA(config.defaultTarif)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {config.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {config.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 rounded-xl transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 rounded-xl transition shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              PDF A4
            </button>
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              {showQuickAdd ? 'Masquer Formulaire' : 'Nouveau Dossier'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards (en DA) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Dossiers {config.badge}</span>
            <IconComponent className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.enCours} en cours · {stats.valides} validés
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-sm bg-gradient-to-br from-blue-50/40 to-white">
          <div className="text-xs font-medium text-blue-700 flex items-center justify-between">
            <span>Total Facturé</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-blue-900">
            {formatDA(stats.totalFacture)}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-0.5">Frais SERVI-DOX du département</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="text-xs font-medium text-emerald-700 flex items-center justify-between">
            <span>Total Encaissé</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700">
            {formatDA(stats.totalEncaisse)}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Montants effectivement réglés</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
          <div className="text-xs font-medium text-amber-700 flex items-center justify-between">
            <span>Reste à Encaisser</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-amber-600">
            {formatDA(stats.totalReste)}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Solde à recouvrer auprès des clients</div>
        </div>
      </div>

      {/* Quick Add Form Drawer / Accordion */}
      {showQuickAdd && (
        <div className="bg-white rounded-3xl border border-blue-200 shadow-md p-6 sm:p-8 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Plus className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ajout Rapide : Nouveau Dossier {config.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Le client sera automatiquement classé sous "{config.badge}" et visible dans ce tableau.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQuickAdd(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleQuickAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone (WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="0550 12 34 56"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wilaya de Résidence
                </label>
                <select
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  {WILAYAS_58.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statut Initial
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutDossier)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="En cours">En cours</option>
                  <option value="Validé">Validé</option>
                  <option value="En attente">En attente</option>
                  <option value="Clôturé">Clôturé</option>
                </select>
              </div>
            </div>

            {/* Financial tracking in DA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frais SERVI-DOX (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={montantTotal}
                  onChange={(e) => handleTotalChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant Encaissé (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={montantEncaisse}
                  onChange={(e) => handleEncaisseChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold text-emerald-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reste à Payer (DA)
                </label>
                <input
                  type="number"
                  readOnly
                  value={montantReste}
                  className="w-full px-3 py-2 text-xs font-bold text-amber-700 bg-slate-100 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md"
              >
                Valider & Enregistrer dans {config.title}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Rechercher un dossier ${config.title} par nom, tél ou ville...`}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatutFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setStatutFilter('En cours')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'En cours'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            En cours ({stats.enCours})
          </button>
          <button
            onClick={() => setStatutFilter('Validé')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'Validé'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Validés ({stats.valides})
          </button>
          <button
            onClick={() => setStatutFilter('En attente')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'En attente'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            En attente ({stats.enAttente})
          </button>
          <button
            onClick={() => setStatutFilter('Clôturé')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'Clôturé'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Clôturés ({stats.clotures})
          </button>
        </div>
      </div>

      {/* Dossiers Table */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <IconComponent className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchQuery ? 'Aucun résultat trouvé' : `Aucun dossier ${config.title} pour le moment`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "Aucun client ne correspond à votre recherche. Essayez d'autres termes."
              : `Tous les clients enregistrés avec le type "${config.badge}" s'affichent automatiquement ici.`}
          </p>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Créer un dossier {config.badge}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Réf & Inscription</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Wilaya / Ville</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Règlement (DA)</th>
                  <th className="py-3 px-4 text-right">Actions Directes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((client) => {
                  const isValide = client.statut === 'Validé';
                  const isEnCours = client.statut === 'En cours';
                  const isEnAttente = client.statut === 'En attente';
                  const isCloture = client.statut === 'Clôturé';

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition">
                      {/* Ref & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800">{client.id}</span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {client.dateInscription}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {client.nom} {client.prenom}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.contact}</span>
                          {client.email && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="truncate max-w-[140px]">{client.email}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Wilaya / Ville */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{client.ville || 'Alger'}</span>
                        </div>
                        {client.adresse && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px] mt-0.5">
                            {client.adresse}
                          </div>
                        )}
                      </td>

                      {/* Statut Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={client.statut}
                          onChange={(e) => updateClientStatut(client.id, e.target.value as StatutDossier)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                            isValide
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isEnCours
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : isEnAttente
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="En cours">En cours</option>
                          <option value="Validé">Validé</option>
                          <option value="En attente">En attente</option>
                          <option value="Clôturé">Clôturé</option>
                        </select>
                      </td>

                      {/* Montants en DA */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatDA(client.montantTotal)}
                        </div>
                        <div className="text-[11px] mt-0.5 flex items-center gap-1.5">
                          <span className="text-emerald-700 font-semibold">
                            Enc: {formatDA(client.montantEncaisse)}
                          </span>
                          {(client.montantReste || 0) > 0 && (
                            <span className="text-amber-700 font-semibold">
                              (Reste: {formatDA(client.montantReste || 0)})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Direct Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* WhatsApp */}
                          <a
                            href={getWhatsAppUrl(
                              client.contact,
                              `${client.prenom} ${client.nom}`,
                              client.motifDossier,
                              client.montantReste
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Appel */}
                          <a
                            href={`tel:${client.contact}`}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            title="Appeler"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Gmail */}
                          {client.email && onSendGmail && (
                            <button
                              onClick={() => onSendGmail(client)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                              title="Envoyer Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Fiche PDF */}
                          <button
                            onClick={() => exportSingleClientPDF(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Télécharger Fiche PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Voir Drawer */}
                          <button
                            onClick={() => setViewingClient(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Consulter"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Modifier */}
                          <button
                            onClick={() => setEditingClient(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => handleDeleteClient(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
        </div>
      )}

      {/* Client View Drawer */}
      <ClientDetailsDrawer
        client={viewingClient}
        isOpen={Boolean(viewingClient)}
        onClose={() => setViewingClient(null)}
        onEdit={(c) => {
          setViewingClient(null);
          setEditingClient(c);
        }}
      />

      {/* Client Edit Modal */}
      <ClientEditModal
        client={editingClient}
        isOpen={Boolean(editingClient)}
        onClose={() => setEditingClient(null)}
      />
    </div>
  );
};
