import React, { useState, useEffect, useMemo } from 'react';
import { Employee } from '../types/client';
import { EmployerInfo, DEFAULT_SERVIDOX_EMPLOYER, AnnualPayrollSummary } from '../types/payroll';
import { PayslipDocument } from './payroll/PayslipDocument';
import { AnnualPayrollView } from './payroll/AnnualPayrollView';
import { generatePayslip, MONTH_NAMES_FR } from '../utils/payrollCalculations';
import { formatDA } from '../utils/format';
import { useClients } from '../context/ClientContext';
import { exportPayslipPDF, exportAnnualPayrollPDF } from '../utils/payrollPdfExport';
import { subscribeToEmployees } from '../services/firestoreSync';
import {
  FileText,
  Calendar,
  User,
  Building2,
  Printer,
  Sliders,
  DollarSign,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Edit,
  X,
  Save,
  RotateCcw,
  Sparkles,
  Users,
  Search,
  ExternalLink,
  FileDown,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { syncPayrollToGoogleSheet } from '../services/googleSheetsService';
import { getAccessToken } from '../services/gmailService';

const TEAM_STORAGE_KEY = 'servidox_team_employees_v1';
const EMPLOYER_STORAGE_KEY = 'servidox_employer_info_v1';

const FALLBACK_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-101',
    nom: 'BENALI',
    prenom: 'Karim',
    role: 'Responsable Dossiers RC & Entreprises',
    departement: 'Dossiers RC & Entreprises',
    dateRecrutement: '2025-09-01',
    joursTravail: 'Dimanche - Jeudi',
    heuresTravail: '08h30 - 16h30',
    typeContrat: 'CDI',
    statut: 'Actif',
    email: 'karim.benali@gmail.com',
    contact: '0550 23 45 67',
    adresse: 'Bab Ezzouar, Alger',
    salaireMensuel: 65000,
    profilBio:
      'Spécialiste CNRC, création de sociétés (SARL, EURL, SPA), modifications statutaires et suivi juridique des entreprises.',
    createdAt: '2025-09-01T08:30:00Z',
    updatedAt: '2025-09-01T08:30:00Z',
  },
  {
    id: 'EMP-102',
    nom: 'MEZIANI',
    prenom: 'Amina',
    role: 'Conseillère Auto-Entrepreneur & Suivi',
    departement: 'Auto-entrepreneur',
    dateRecrutement: '2025-10-15',
    joursTravail: 'Dimanche - Jeudi',
    heuresTravail: '08h30 - 16h30',
    typeContrat: 'CDI',
    statut: 'Actif',
    email: 'amina.meziani@gmail.com',
    contact: '0661 88 99 00',
    adresse: 'Kouba, Alger',
    salaireMensuel: 55000,
    profilBio:
      'Accompagnement des freelances, déclaration ANAE, fiscalité IFU et suivi des dossiers d’auto-entrepreneurs.',
    createdAt: '2025-10-15T09:00:00Z',
    updatedAt: '2025-10-15T09:00:00Z',
  },
  {
    id: 'EMP-103',
    nom: 'ZERROUKI',
    prenom: 'Sofiane',
    role: 'Responsable Comptabilité & Fiscalité',
    departement: 'Comptabilité & Finance',
    dateRecrutement: '2025-11-01',
    joursTravail: 'Dimanche - Jeudi',
    heuresTravail: '08h30 - 16h30',
    typeContrat: 'CDI',
    statut: 'Actif',
    email: 'sofiane.zerrouki@gmail.com',
    contact: '0770 12 34 56',
    adresse: 'Hydra, Alger',
    salaireMensuel: 75000,
    profilBio:
      'Comptabilité générale, déclarations fiscales G50, bilans financiers, déclarations CNAS et états récapitulatifs de paie.',
    createdAt: '2025-11-01T08:30:00Z',
    updatedAt: '2025-11-01T08:30:00Z',
  },
  {
    id: 'EMP-104',
    nom: 'HADDAD',
    prenom: 'Samia',
    role: "Chargée d'Accueil & Relation Client",
    departement: 'Accueil & Relation Client',
    dateRecrutement: '2026-01-10',
    joursTravail: 'Dimanche - Jeudi',
    heuresTravail: '08h30 - 16h30',
    typeContrat: 'CDD',
    statut: 'Actif',
    email: 'samia.haddad@gmail.com',
    contact: '0560 45 67 89',
    adresse: 'El Biar, Alger',
    salaireMensuel: 48000,
    profilBio:
      'Réception des clients, orientation, saisie des pièces administratives et permanence téléphonique.',
    createdAt: '2026-01-10T08:30:00Z',
    updatedAt: '2026-01-10T08:30:00Z',
  },
];

interface PayrollPageProps {
  initialEmployeeId?: string;
}

export const PayrollPage: React.FC<PayrollPageProps> = ({ initialEmployeeId }) => {
  const { showToast } = useClients();

  // Liste des employés
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const stored = localStorage.getItem(TEAM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return FALLBACK_EMPLOYEES;
  });

  // Employé sélectionné
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    if (initialEmployeeId) return initialEmployeeId;
    return employees.length > 0 ? employees[0].id : 'EMP-101';
  });

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  // Synchronisation en temps réel avec Cloud Firestore
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((remoteEmployees) => {
      if (remoteEmployees && remoteEmployees.length > 0) {
        setEmployees(remoteEmployees);
      }
    });
    return () => unsubscribe();
  }, []);

  // Informations de l'employeur SERVI-DOX
  const [employer, setEmployer] = useState<EmployerInfo>(() => {
    try {
      const stored = localStorage.getItem(EMPLOYER_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SERVIDOX_EMPLOYER;
  });

  // Modal d'édition des infos employeur
  const [isEmployerModalOpen, setIsEmployerModalOpen] = useState(false);
  const [tempEmployer, setTempEmployer] = useState<EmployerInfo>(employer);

  // Période sélectionnée
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Vue active : Fiche Mensuelle vs Récapitulatif Annuel
  const [activeView, setActiveView] = useState<'monthly' | 'annual'>('monthly');

  // Ajustement des primes et variables du mois
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [primePanier, setPrimePanier] = useState<number>(4500);
  const [primeTransport, setPrimeTransport] = useState<number>(3500);
  const [primeRendement, setPrimeRendement] = useState<number>(3000);
  const [primeResponsabilite, setPrimeResponsabilite] = useState<number>(0);
  const [heuresSupp, setHeuresSupp] = useState<number>(0);
  const [heuresSuppTaux, setHeuresSuppTaux] = useState<number>(350);
  const [autresPrimes, setAutresPrimes] = useState<number>(0);
  const [avancesAcomptes, setAvancesAcomptes] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<'Virement Bancaire' | 'CCP' | 'Chèque' | 'Espèces'>('Virement Bancaire');
  const [joursTravailles, setJoursTravailles] = useState<number>(22);
  const [joursConges, setJoursConges] = useState<number>(0);
  const [joursAbsence, setJoursAbsence] = useState<number>(0);

  // Recherche d'employé
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [confirmSheetsOpen, setConfirmSheetsOpen] = useState(false);

  // Détecter mise à jour externe des employés
  useEffect(() => {
    const handleTeamUpdate = () => {
      try {
        const stored = localStorage.getItem(TEAM_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEmployees(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('servidox-team-updated', handleTeamUpdate);
    return () => window.removeEventListener('servidox-team-updated', handleTeamUpdate);
  }, []);

  // L'employé actuellement sélectionné
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) || employees[0] || FALLBACK_EMPLOYEES[0];
  }, [employees, selectedEmployeeId]);

  // Si l'employé change, adapter les primes par défaut selon son rôle
  useEffect(() => {
    if (currentEmployee.role.toLowerCase().includes('responsable')) {
      setPrimeResponsabilite(5000);
    } else {
      setPrimeResponsabilite(0);
    }
  }, [currentEmployee]);

  // Génération du bulletin mensuel
  const monthlyPayslip = useMemo(() => {
    return generatePayslip({
      employee: currentEmployee,
      mois: selectedMonth,
      annee: selectedYear,
      primePanier,
      primeTransport,
      primeRendement,
      primeResponsabilite,
      heuresSupplementaires: heuresSupp,
      heuresSuppTauxHoraire: heuresSuppTaux,
      autresPrimes,
      avancesAcomptes,
      modePaiement,
      joursTravailles,
      joursConges,
      joursAbsence,
    });
  }, [
    currentEmployee,
    selectedMonth,
    selectedYear,
    primePanier,
    primeTransport,
    primeRendement,
    primeResponsabilite,
    heuresSupp,
    heuresSuppTaux,
    autresPrimes,
    avancesAcomptes,
    modePaiement,
    joursTravailles,
    joursConges,
    joursAbsence,
  ]);

  // Génération du récapitulatif annuel (12 mois)
  const annualSummary: AnnualPayrollSummary = useMemo(() => {
    const monthlyDetails = [];
    for (let m = 1; m <= 12; m++) {
      // Pour les mois futurs, on projette la même base
      monthlyDetails.push(
        generatePayslip({
          employee: currentEmployee,
          mois: m,
          annee: selectedYear,
          primePanier,
          primeTransport,
          primeRendement: m % 3 === 0 ? primeRendement : Math.round(primeRendement * 0.7),
          primeResponsabilite,
          heuresSupplementaires: m === selectedMonth ? heuresSupp : 0,
          heuresSuppTauxHoraire: heuresSuppTaux,
          autresPrimes: m === 12 ? 15000 : 0, // Gratification de fin d'année au mois 12
          avancesAcomptes: m === selectedMonth ? avancesAcomptes : 0,
          modePaiement,
          joursTravailles: 22,
          joursConges: m === 7 || m === 8 ? 10 : 0,
          joursAbsence: 0,
        })
      );
    }

    const totalSalaireBase = monthlyDetails.reduce((acc, cur) => acc + cur.salaireBase, 0);
    const totalPrimesIndemnites = monthlyDetails.reduce(
      (acc, cur) =>
        acc +
        cur.primePanier +
        cur.primeTransport +
        cur.primeRendement +
        cur.primeResponsabilite +
        cur.heuresSuppMontant +
        cur.autresPrimes,
      0
    );
    const totalSalaireBrut = monthlyDetails.reduce((acc, cur) => acc + cur.salaireBrut, 0);
    const totalCnasSalarie = monthlyDetails.reduce((acc, cur) => acc + cur.cnasSalarieMontant, 0);
    const totalSalaireImposable = monthlyDetails.reduce((acc, cur) => acc + cur.salaireImposable, 0);
    const totalIrg = monthlyDetails.reduce((acc, cur) => acc + cur.retenueIrg, 0);
    const totalAvances = monthlyDetails.reduce((acc, cur) => acc + cur.avancesAcomptes, 0);
    const totalSalaireNet = monthlyDetails.reduce((acc, cur) => acc + cur.salaireNet, 0);
    const totalCnasPatronale = monthlyDetails.reduce((acc, cur) => acc + cur.cnasPatronaleMontant, 0);
    const totalCoutEmployeur = monthlyDetails.reduce((acc, cur) => acc + cur.coutTotalEmployeur, 0);

    return {
      employeeId: currentEmployee.id,
      annee: selectedYear,
      moisCount: 12,
      totalSalaireBase,
      totalPrimesIndemnites,
      totalSalaireBrut,
      totalCnasSalarie,
      totalSalaireImposable,
      totalIrg,
      totalAvances,
      totalSalaireNet,
      totalCnasPatronale,
      totalCoutEmployeur,
      monthlyDetails,
    };
  }, [
    currentEmployee,
    selectedYear,
    selectedMonth,
    primePanier,
    primeTransport,
    primeRendement,
    primeResponsabilite,
    heuresSupp,
    heuresSuppTaux,
    avancesAcomptes,
    modePaiement,
  ]);

  const currentIndex = employees.findIndex((e) => e.id === selectedEmployeeId);
  const handlePrevEmployee = () => {
    if (employees.length === 0) return;
    const prevIdx = (currentIndex - 1 + employees.length) % employees.length;
    setSelectedEmployeeId(employees[prevIdx].id);
  };
  const handleNextEmployee = () => {
    if (employees.length === 0) return;
    const nextIdx = (currentIndex + 1) % employees.length;
    setSelectedEmployeeId(employees[nextIdx].id);
  };

  const handleDownloadPDF = async () => {
    try {
      if (activeView === 'monthly') {
        await exportPayslipPDF(monthlyPayslip, currentEmployee, employer);
        showToast(
          'Téléchargement réussi',
          `Fiche de paie de ${currentEmployee.prenom} ${currentEmployee.nom} (${monthlyPayslip.moisNom} ${monthlyPayslip.annee}) générée en PDF officiel.`,
          'success'
        );
      } else {
        await exportAnnualPayrollPDF(annualSummary, currentEmployee, employer);
        showToast(
          'Téléchargement réussi',
          `État récapitulatif annuel ${annualSummary.annee} de ${currentEmployee.prenom} ${currentEmployee.nom} généré en PDF officiel.`,
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      showToast('Erreur génération PDF', 'Une erreur est survenue lors de la création du fichier PDF.', 'error');
    }
  };

  const handlePrint = () => {
    try {
      // Tenter l'impression navigateur classique
      window.focus();
      window.print();
    } catch (e) {
      console.warn('Impression navigateur restreinte dans iframe, téléchargement PDF automatique :', e);
      handleDownloadPDF();
    }
  };

  const handleSaveEmployer = () => {
    setEmployer(tempEmployer);
    try {
      localStorage.setItem(EMPLOYER_STORAGE_KEY, JSON.stringify(tempEmployer));
    } catch (e) {
      console.error(e);
    }
    setIsEmployerModalOpen(false);
  };

  const handleResetEmployer = () => {
    setTempEmployer(DEFAULT_SERVIDOX_EMPLOYER);
  };

  const handleUpdateEmployerField = (field: keyof EmployerInfo, value: string) => {
    setEmployer((prev) => {
      const next = { ...prev, [field]: value };
      setTempEmployer(next);
      try {
        localStorage.setItem(EMPLOYER_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchEmployeeQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.departement.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-0">
      {/* =========================================================================
          PANNEAU DE CONTRÔLE (MASQUÉ LORS DE L'IMPRESSION)
          ========================================================================= */}
      <div className="print:hidden space-y-6">
        {/* Titre & Actions principales */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Fiches de Paie des Employés
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                  Législation Algérienne
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Calcul automatisé (CNAS 9%, Barème IRG, Net en DA) avec logo et filigrane officiel SERVI-DOX
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bouton Configurer l'Employeur */}
            <button
              onClick={() => {
                setTempEmployer(employer);
                setIsEmployerModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-300 shadow-xs"
              title="Vérifier ou modifier les coordonnées légales de l'employeur SERVI-DOX"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              Infos Employeur
            </button>

            {/* Bouton Paramètres & Primes */}
            <button
              onClick={() => setShowAdjustments(!showAdjustments)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all border shadow-xs ${
                showAdjustments
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              {showAdjustments ? 'Masquer Primes' : 'Ajuster Primes & Jours'}
            </button>

            {/* Bouton Télécharger en PDF */}
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              title="Télécharger la fiche de paie en fichier PDF officiel"
            >
              <FileDown className="w-4 h-4" />
              Télécharger en PDF
            </button>

            {/* Bouton d'Impression Directe */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
              title="Lancer l'impression directe de la fiche de paie"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Imprimer
            </button>

            {/* Bouton Export Google Sheets */}
            <button
              onClick={() => setConfirmSheetsOpen(true)}
              disabled={isExportingSheets}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Exporter le registre de paie vers Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              {isExportingSheets ? 'Exportation...' : 'Google Sheets'}
            </button>
          </div>
        </div>

        {/* BARRE DE SÉLECTION : EMPLOYÉ, PÉRIODE & MODE D'AFFICHAGE */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Sélecteur d'Employé (Col 1-5 avec navigation rapide précédent/suivant) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Sélectionner l'Employé(e) :
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {currentIndex + 1} / {employees.length} membre(s)
              </span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevEmployee}
                className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0 shadow-2xs"
                title="Employé précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="relative flex-1 min-w-0">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none pr-9 truncate"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom.toUpperCase()} {emp.prenom} — {emp.role} ({formatDA(emp.salaireMensuel || 40000)} DA)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={handleNextEmployee}
                className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0 shadow-2xs"
                title="Employé suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sélecteur de Période Mois & Année (Col 6-8) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Mois :
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={activeView === 'annual'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
              >
                {MONTH_NAMES_FR.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Année :</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Commutateur de vue : Mensuelle vs Annuelle (Col 9-12) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Type de consultation :</label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveView('monthly')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'monthly'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mensuelle
              </button>
              <button
                onClick={() => setActiveView('annual')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'annual'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annuelle (12M)
              </button>
            </div>
          </div>
        </div>

        {/* PANNEAU DÉPLIABLE D'AJUSTEMENT DES PRIMES & PARAMÈTRES DU MOIS */}
        {showAdjustments && activeView === 'monthly' && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-2xl border border-blue-200 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-blue-200 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Personnalisation des Rubriques du mois de {MONTH_NAMES_FR[selectedMonth - 1]} {selectedYear}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Employé : <strong>{currentEmployee.nom} {currentEmployee.prenom}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Panier (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={primePanier}
                  onChange={(e) => setPrimePanier(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Transport (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={primeTransport}
                  onChange={(e) => setPrimeTransport(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Rendement (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={primeRendement}
                  onChange={(e) => setPrimeRendement(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Responsabilité (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={primeResponsabilite}
                  onChange={(e) => setPrimeResponsabilite(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Heures Supp (h)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={heuresSupp}
                  onChange={(e) => setHeuresSupp(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Taux Heure Supp (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={heuresSuppTaux}
                  onChange={(e) => setHeuresSuppTaux(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Acompte versé (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={avancesAcomptes}
                  onChange={(e) => setAvancesAcomptes(Number(e.target.value))}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 font-mono text-amber-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jours Travaillés
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={joursTravailles}
                  onChange={(e) => setJoursTravailles(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Congés pris (j)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={joursConges}
                  onChange={(e) => setJoursConges(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Mode de Paiement
                </label>
                <select
                  value={modePaiement}
                  onChange={(e: any) => setModePaiement(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="CCP">Compte CCP Algérie Poste</option>
                  <option value="Chèque">Chèque Bancaire</option>
                  <option value="Espèces">Espèces (Contre décharge signée)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ZONE DE DOCUMENT (AFFICHAGE MENSUEL OU ANNUEL)
          ========================================================================= */}
      <div className="transition-all duration-300">
        {activeView === 'monthly' ? (
          <div className="space-y-4">
            {/* Barre d'action rapide au-dessus du bulletin */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto print:hidden">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900">
                  {currentEmployee.nom.toUpperCase()} {currentEmployee.prenom}
                </span>
                <span className="text-slate-400">•</span>
                <span>{monthlyPayslip.moisNom} {monthlyPayslip.annee}</span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-blue-700">Net : {formatDA(monthlyPayslip.salaireNet)} DA</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Télécharger le fichier PDF de la fiche de paie"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Télécharger PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Imprimer directement le bulletin de paie"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setConfirmSheetsOpen(true)}
                  disabled={isExportingSheets}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Exporter vers Google Sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheets</span>
                </button>
              </div>
            </div>

            {/* Barre de modification rapide des mentions légales avant impression */}
            <div className="print:hidden bg-white/95 border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Mentions Légales Modifiables</span>
                      <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                        NIF, NIS, RC, N° CNAS
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Modifiez les numéros officiels ci-dessous ou directement sur la feuille avant impression ou export PDF :
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateEmployerField('nif', DEFAULT_SERVIDOX_EMPLOYER.nif);
                    handleUpdateEmployerField('nis', DEFAULT_SERVIDOX_EMPLOYER.nis);
                    handleUpdateEmployerField('rc', DEFAULT_SERVIDOX_EMPLOYER.rc);
                    handleUpdateEmployerField('numeroCnas', DEFAULT_SERVIDOX_EMPLOYER.numeroCnas);
                  }}
                  className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Rétablir valeurs par défaut
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    NIF
                  </label>
                  <input
                    type="text"
                    value={employer.nif}
                    onChange={(e) => handleUpdateEmployerField('nif', e.target.value)}
                    placeholder="002016..."
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-50/70 border border-slate-300 rounded-lg hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    NIS
                  </label>
                  <input
                    type="text"
                    value={employer.nis}
                    onChange={(e) => handleUpdateEmployerField('nis', e.target.value)}
                    placeholder="198716..."
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-50/70 border border-slate-300 rounded-lg hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Numéro RC
                  </label>
                  <input
                    type="text"
                    value={employer.rc}
                    onChange={(e) => handleUpdateEmployerField('rc', e.target.value)}
                    placeholder="16/00-..."
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-50/70 border border-slate-300 rounded-lg hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    N° CNAS
                  </label>
                  <input
                    type="text"
                    value={employer.numeroCnas}
                    onChange={(e) => handleUpdateEmployerField('numeroCnas', e.target.value)}
                    placeholder="16-89..."
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-50/70 border border-slate-300 rounded-lg hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:outline-hidden transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Espace bureau centré A4 (Sans aucun cadre lors de l'impression) */}
            <div className="payslip-desk-wrapper bg-slate-200/80 p-3 sm:p-6 lg:p-8 rounded-3xl border border-slate-300/80 flex items-center justify-center shadow-inner print:bg-transparent print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none">
              <PayslipDocument
                payslip={monthlyPayslip}
                employee={currentEmployee}
                employer={employer}
                onUpdateEmployer={handleUpdateEmployerField}
                editable={true}
              />
            </div>
          </div>
        ) : (
          <AnnualPayrollView
            summary={annualSummary}
            employee={currentEmployee}
            employer={employer}
            onPrint={handlePrint}
          />
        )}
      </div>

      {/* =========================================================================
          MODAL DE CONFIGURATION DE L'EMPLOYEUR (SERVI-DOX)
          ========================================================================= */}
      {isEmployerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Coordonnées Officielles de l'Employeur
                </h3>
              </div>
              <button
                onClick={() => setIsEmployerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <p className="text-slate-500">
                Ces mentions légales apparaîtront sur l'en-tête de toutes les fiches de paie et les états récapitulatifs annuels imprimés.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Raison Sociale
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.raisonSociale}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, raisonSociale: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    NIF (Identifiant Fiscal)
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.nif}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, nif: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    NIS (Identifiant Statistique)
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.nis}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, nis: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    N° Registre de Commerce (RC)
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.rc}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, rc: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    N° Employeur CNAS
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.numeroCnas}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, numeroCnas: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Adresse du Siège Social
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.adresse}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, adresse: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Wilaya & Ville
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.wilaya}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, wilaya: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Téléphone / Contact
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.telephone}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, telephone: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Officiel
                  </label>
                  <input
                    type="email"
                    value={tempEmployer.email}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, email: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Représentant Légal / Gérant
                  </label>
                  <input
                    type="text"
                    value={tempEmployer.gerant}
                    onChange={(e) =>
                      setTempEmployer({ ...tempEmployer, gerant: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleResetEmployer}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rétablir Valeurs SERVI-DOX
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEmployerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEmployer}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  Exporter le Registre de Paie vers Google Sheets
                </h3>
                <p className="text-[11px] text-slate-500">
                  Création d'un classeur officiel sur votre Google Drive
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Voulez-vous synchroniser les <strong>{employees.length} employés et salaires</strong> actuels dans un nouveau classeur Google Sheets ? Les colonnes contiendront les salaires bruts, cotisations salariales CNAS (9%) et cotisations patronales (26%).
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
                    const res = await syncPayrollToGoogleSheet(token, employees, employer);
                    showToast(
                      'Exportation réussie',
                      `Le registre "${res.name}" a été créé sur Google Sheets avec succès.`,
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
