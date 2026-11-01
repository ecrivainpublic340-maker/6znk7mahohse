import React, { useState, useEffect, useMemo } from 'react';
import {
  Employee,
  StatutEmploye,
  DepartementEmploye,
  ContratEmploye,
} from '../types/client';
import { useClients } from '../context/ClientContext';
import { useAuth } from '../context/AuthContext';
import { formatDA, getEmployeeWhatsAppUrl } from '../utils/format';
import {
  subscribeToEmployees,
  persistEmployeeToFirestore,
  deleteEmployeeFromFirestore,
} from '../services/firestoreSync';
import {
  Users,
  UserPlus,
  Search,
  X,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Briefcase,
  Building2,
  MapPin,
  Edit3,
  Trash2,
  Download,
  CheckCircle2,
  CreditCard,
  LayoutGrid,
  List,
  Sparkles,
  FileText,
  UserCheck,
} from 'lucide-react';

const TEAM_STORAGE_KEY = 'servidox_team_employees_v1';

const SAMPLE_EMPLOYEES: Employee[] = [
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
    nom: 'MANSOURI',
    prenom: 'Yasmine',
    role: 'Conseillère Dossiers Auto-entrepreneur',
    departement: 'Auto-entrepreneur',
    dateRecrutement: '2026-01-15',
    joursTravail: 'Dimanche - Jeudi',
    heuresTravail: '09h00 - 17h00',
    typeContrat: 'CDI',
    statut: 'Actif',
    email: 'yasmine.mansouri@gmail.com',
    contact: '0661 88 90 12',
    adresse: 'Hydra, Alger',
    salaireMensuel: 50000,
    profilBio:
      'Accompagnement complet des auto-entrepreneurs (inscription ANAE, CASNOS, NIF, suivi des cartes et attestations).',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'EMP-103',
    nom: 'TOUATI',
    prenom: 'Mehdi',
    role: 'Chargé Accueil, Facturation & Relances',
    departement: 'Accueil & Relation Client',
    dateRecrutement: '2026-03-10',
    joursTravail: 'Samedi - Jeudi',
    heuresTravail: '08h30 - 16h00',
    typeContrat: 'CDD',
    statut: 'Actif',
    email: 'mehdi.touati@gmail.com',
    contact: '0770 44 55 66',
    adresse: 'Kouba, Alger',
    salaireMensuel: 45000,
    profilBio:
      'Accueil physique et téléphonique des clients, encaissements en DA, relances WhatsApp et suivi administratif quotidien.',
    createdAt: '2026-03-10T08:30:00Z',
    updatedAt: '2026-03-10T08:30:00Z',
  },
];

const ROLE_SUGGESTIONS = [
  'Gestionnaire Dossiers RC & Entreprise',
  'Conseiller Auto-entrepreneur',
  'Responsable Administratif',
  'Comptable & Facturation',
  'Chargé(e) Accueil & Relation Client',
  ' Juriste / Consultant Formalités',
];

const JOURS_SUGGESTIONS = [
  'Dimanche - Jeudi',
  'Samedi - Jeudi',
  'Samedi - Mercredi',
  'Lundi - Vendredi',
  'Mi-temps / Flexible',
];

const HEURES_SUGGESTIONS = [
  '08h30 - 16h30',
  '09h00 - 17h00',
  '08h00 - 16h00',
  '08h30 - 12h30 (Matin)',
  '13h00 - 17h00 (Après-midi)',
];

interface TeamPageProps {
  onSendEmployeeGmail?: (email: string, fullName: string, role: string) => void;
  onNavigatePayroll?: (employeeId?: string) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({ onSendEmployeeGmail, onNavigatePayroll }) => {
  const { showToast } = useClients();
  const { user, registeredUsers, approveUserAccount, rejectUserAccount, isMasterAdmin } = useAuth();
  const canModifyEmployees = isMasterAdmin;
  const pendingAccounts = useMemo(
    () =>
      isMasterAdmin
        ? registeredUsers.filter((u) => u.accountStatus === 'pending')
        : [],
    [registeredUsers, isMasterAdmin]
  );

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(TEAM_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
      console.error(e);
    }
  }, [employees]);

  useEffect(() => {
    const handleTeamSync = () => {
      try {
        const saved = localStorage.getItem(TEAM_STORAGE_KEY);
        if (saved) {
          setEmployees(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('servidox-team-updated', handleTeamSync);
    return () => window.removeEventListener('servidox-team-updated', handleTeamSync);
  }, []);

  // Synchronisation en temps réel avec Cloud Firestore (multi-ordinateurs)
  useEffect(() => {
    let hasReconciled = false;
    const unsubscribe = subscribeToEmployees((remoteEmployees) => {
      if (!hasReconciled) {
        hasReconciled = true;
        if (remoteEmployees && remoteEmployees.length > 0) {
          setEmployees(remoteEmployees);
        } else {
          try {
            const saved = localStorage.getItem(TEAM_STORAGE_KEY);
            if (saved) {
              const parsed: Employee[] = JSON.parse(saved);
              if (parsed && parsed.length > 0) {
                console.info(`Synchronisation de ${parsed.length} employé(s) vers Cloud Firestore...`);
                parsed.forEach((emp) => persistEmployeeToFirestore(emp));
              }
            }
          } catch (e) {
            console.error('Erreur téléversement initial employés:', e);
          }
        }
      } else {
        setEmployees(remoteEmployees || []);
      }
    });
    return () => unsubscribe();
  }, []);

  // Search, filter & view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<'all' | StatutEmploye>('all');
  const [deptFilter, setDeptFilter] = useState<'all' | DepartementEmploye>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal state for Add / Edit Employee
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Form fields
  const todayISO = new Date().toISOString().split('T')[0];
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [role, setRole] = useState('');
  const [departement, setDepartement] = useState<DepartementEmploye>('Dossiers RC & Entreprises');
  const [dateRecrutement, setDateRecrutement] = useState(todayISO);
  const [joursTravail, setJoursTravail] = useState('Dimanche - Jeudi');
  const [heuresTravail, setHeuresTravail] = useState('08h30 - 16h30');
  const [typeContrat, setTypeContrat] = useState<ContratEmploye>('CDI');
  const [statut, setStatut] = useState<StatutEmploye>('Actif');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [adresse, setAdresse] = useState('');
  const [salaireMensuel, setSalaireMensuel] = useState<string>('');
  const [profilBio, setProfilBio] = useState('');

  // Reset or populate modal form
  const openAddModal = () => {
    setEditingEmployee(null);
    setNom('');
    setPrenom('');
    setRole('Gestionnaire Dossiers RC & Entreprise');
    setDepartement('Dossiers RC & Entreprises');
    setDateRecrutement(todayISO);
    setJoursTravail('Dimanche - Jeudi');
    setHeuresTravail('08h30 - 16h30');
    setTypeContrat('CDI');
    setStatut('Actif');
    setEmail('');
    setContact('');
    setAdresse('');
    setSalaireMensuel('');
    setProfilBio('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setNom(emp.nom);
    setPrenom(emp.prenom);
    setRole(emp.role);
    setDepartement(emp.departement);
    setDateRecrutement(emp.dateRecrutement);
    setJoursTravail(emp.joursTravail);
    setHeuresTravail(emp.heuresTravail);
    setTypeContrat(emp.typeContrat);
    setStatut(emp.statut);
    setEmail(emp.email);
    setContact(emp.contact);
    setAdresse(emp.adresse);
    setSalaireMensuel(emp.salaireMensuel ? String(emp.salaireMensuel) : '');
    setProfilBio(emp.profilBio);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !role.trim()) {
      showToast('Champs requis', 'Veuillez renseigner le nom, le prénom et le rôle.', 'error');
      return;
    }

    const now = new Date().toISOString();

    if (editingEmployee) {
      let updatedEmp: Employee | null = null;
      const updatedList = employees.map((item) => {
        if (item.id === editingEmployee.id) {
          updatedEmp = {
            ...item,
            nom: nom.trim().toUpperCase(),
            prenom: prenom.trim(),
            role: role.trim(),
            departement,
            dateRecrutement,
            joursTravail: joursTravail.trim() || 'Dimanche - Jeudi',
            heuresTravail: heuresTravail.trim() || '08h30 - 16h30',
            typeContrat,
            statut,
            email: email.trim(),
            contact: contact.trim(),
            adresse: adresse.trim(),
            salaireMensuel: Number(salaireMensuel) || 0,
            profilBio: profilBio.trim(),
            updatedAt: now,
          };
          return updatedEmp;
        }
        return item;
      });
      setEmployees(updatedList);
      if (updatedEmp) {
        persistEmployeeToFirestore(updatedEmp);
      }
      showToast(
        'Employé modifié',
        `La fiche de ${prenom.trim()} ${nom.trim().toUpperCase()} a été mise à jour.`,
        'success'
      );
    } else {
      const newEmp: Employee = {
        id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        nom: nom.trim().toUpperCase(),
        prenom: prenom.trim(),
        role: role.trim(),
        departement,
        dateRecrutement,
        joursTravail: joursTravail.trim() || 'Dimanche - Jeudi',
        heuresTravail: heuresTravail.trim() || '08h30 - 16h30',
        typeContrat,
        statut,
        email: email.trim(),
        contact: contact.trim(),
        adresse: adresse.trim(),
        salaireMensuel: Number(salaireMensuel) || 0,
        profilBio: profilBio.trim(),
        createdAt: now,
        updatedAt: now,
      };
      setEmployees([newEmp, ...employees]);
      persistEmployeeToFirestore(newEmp);
      showToast(
        'Nouvel employé ajouté',
        `${newEmp.prenom} ${newEmp.nom} (${newEmp.role}) fait maintenant partie de l'équipe SERVI-DOX.`,
        'success'
      );
    }

    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleQuickStatusChange = (id: string, newStatut: StatutEmploye) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const updated = { ...emp, statut: newStatut, updatedAt: new Date().toISOString() };
          persistEmployeeToFirestore(updated);
          return updated;
        }
        return emp;
      })
    );
    showToast('Statut mis à jour', `Le statut de l'employé est passé à "${newStatut}".`, 'info');
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (confirm(`Confirmez-vous la suppression de la fiche employé de "${emp.prenom} ${emp.nom}" ?`)) {
      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      deleteEmployeeFromFirestore(emp.id);
      if (viewingEmployee?.id === emp.id) {
        setViewingEmployee(null);
      }
      showToast('Employé supprimé', `La fiche de ${emp.prenom} ${emp.nom} a été retirée.`, 'warning');
    }
  };

  const handleExportTeamCSV = () => {
    if (employees.length === 0) {
      showToast('Équipe vide', 'Aucun employé à exporter.', 'warning');
      return;
    }
    const headers = [
      'ID',
      'Nom',
      'Prénom',
      'Rôle / Poste',
      'Département',
      'Date Recrutement',
      'Jours de Travail',
      'Horaires',
      'Contrat',
      'Statut',
      'Email',
      'Téléphone / WhatsApp',
      'Adresse',
      'Salaire Mensuel (DA)',
      'Profil & Compétences',
    ];
    const rows = employees.map((e) => [
      e.id,
      `"${e.nom}"`,
      `"${e.prenom}"`,
      `"${e.role}"`,
      `"${e.departement}"`,
      e.dateRecrutement,
      `"${e.joursTravail}"`,
      `"${e.heuresTravail}"`,
      e.typeContrat,
      e.statut,
      e.email,
      `"${e.contact}"`,
      `"${e.adresse}"`,
      e.salaireMensuel || 0,
      `"${(e.profilBio || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `equipe_servidox_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export CSV réussi', 'La liste de votre équipe a été téléchargée.', 'success');
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.nom.toLowerCase().includes(q) ||
          e.prenom.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.departement.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.contact.toLowerCase().includes(q) ||
          e.joursTravail.toLowerCase().includes(q) ||
          e.heuresTravail.toLowerCase().includes(q) ||
          e.profilBio.toLowerCase().includes(q)
      );
    }
    if (statutFilter !== 'all') {
      result = result.filter((e) => e.statut === statutFilter);
    }
    if (deptFilter !== 'all') {
      result = result.filter((e) => e.departement === deptFilter);
    }
    return result;
  }, [employees, searchQuery, statutFilter, deptFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const actifs = employees.filter((e) => e.statut === 'Actif').length;
    const enCongeOuMission = employees.filter(
      (e) => e.statut === 'En congé' || e.statut === 'En mission'
    ).length;
    const masseSalariale = employees
      .filter((e) => e.statut !== 'Inactif')
      .reduce((acc, e) => acc + (e.salaireMensuel || 0), 0);

    return { total, actifs, enCongeOuMission, masseSalariale };
  }, [employees]);

  const getStatutStyle = (st: StatutEmploye) => {
    switch (st) {
      case 'Actif':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'En congé':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'En mission':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Inactif':
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Pending Employee Account Requests Banner */}
      {isMasterAdmin && pendingAccounts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>
                {pendingAccounts.length} demande{pendingAccounts.length > 1 ? 's' : ''} de création
                de compte Employé en attente de votre validation
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {pendingAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{acc.name}</span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {acc.jobTitle || 'Employé'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {acc.email} {acc.phone ? `· ${acc.phone}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      approveUserAccount(acc.id);
                      showToast(
                        'Compte Employé validé',
                        `${acc.name} peut maintenant accéder à la plateforme et a été ajouté à l'équipe.`,
                        'success'
                      );
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valider l'accès & Ajouter à l'équipe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      rejectUserAccount(acc.id);
                      showToast('Demande refusée', `L'accès de ${acc.name} a été refusé.`, 'warning');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Effectif Total Équipe</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500">collaborateur{stats.total > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Employés en Poste (Actifs)</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
              {stats.actifs}
            </span>
            <span className="text-xs text-emerald-600 font-medium">disponibles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>En Congé / En Mission</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums">
              {stats.enCongeOuMission}
            </span>
            <span className="text-xs text-amber-600 font-medium">absents / déplacements</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
            <span>Masse Salariale Mensuelle</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
              {formatDA(stats.masseSalariale)}
            </span>
            <span className="text-xs text-blue-600 font-medium">par mois</span>
          </div>
        </div>
      </div>

      {/* Main Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Notre Équipe SERVI-DOX — Gestion des Employés & Horaires
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rôles, dates de recrutement, timing de travail, profils, e-mails et contact WhatsApp en un clic
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canModifyEmployees && employees.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Voulez-vous vraiment vider toute la liste des employés de l'équipe ?")) {
                    setEmployees([]);
                    showToast('Liste vidée', "La liste de l'équipe est maintenant vierge.", 'info');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Vider l'équipe</span>
              </button>
            )}

            <button
              onClick={handleExportTeamCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter CSV</span>
            </button>

            {canModifyEmployees && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ajouter un employé</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un employé (nom, rôle, département, timing, téléphone, email)..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as 'all' | DepartementEmploye)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white"
            >
              <option value="all">Tous les départements</option>
              <option value="Direction & Administration">Direction & Administration</option>
              <option value="Dossiers RC & Entreprises">Dossiers RC & Entreprises</option>
              <option value="Auto-entrepreneur">Auto-entrepreneur</option>
              <option value="Comptabilité & Finance">Comptabilité & Finance</option>
              <option value="Accueil & Relation Client">Accueil & Relation Client</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-between gap-2">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value as 'all' | StatutEmploye)}
              className="flex-1 py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 bg-white"
            >
              <option value="all">Tous les statuts ({employees.length})</option>
              <option value="Actif">Actif</option>
              <option value="En congé">En congé</option>
              <option value="En mission">En mission</option>
              <option value="Inactif">Inactif</option>
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Affichage en Cartes Profils"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Affichage en Tableau RH"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area: Empty State / Grid Cards / Table */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs py-16 px-4 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          {employees.length === 0 ? (
            <>
              <h3 className="text-base font-bold text-slate-900">
                Aucun employé n'est encore enregistré dans « Notre Équipe »
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                Ajoutez les membres de votre équipe SERVI-DOX avec leur rôle, leur date de recrutement,
                leur timing de travail, leur adresse Gmail et leur numéro WhatsApp direct.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={openAddModal}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ajouter mon premier employé</span>
                </button>
                <button
                  onClick={() => {
                    setEmployees(SAMPLE_EMPLOYEES);
                    showToast(
                      'Exemples chargés',
                      '3 fiches employés exemples ont été ajoutées (vous pouvez les modifier ou les vider).',
                      'info'
                    );
                  }}
                  className="px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Charger 3 profils d'exemple (facultatif)</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-800">
                Aucun employé ne correspond à votre recherche
              </h3>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatutFilter('all');
                  setDeptFilter('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Réinitialiser les filtres
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Professional Employee Profile Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => {
            const initials = `${emp.prenom[0] || ''}${emp.nom[0] || ''}`.toUpperCase() || 'SD';
            const waUrl = getEmployeeWhatsAppUrl(
              emp.contact,
              `${emp.prenom} ${emp.nom}`,
              emp.role
            );

            return (
              <div
                key={emp.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top Header */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {emp.nom.toUpperCase()} {emp.prenom}
                        </h3>
                        <p className="text-xs font-semibold text-blue-700 truncate mt-0.5">
                          {emp.role}
                        </p>
                        <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1">
                          {emp.departement} · {emp.typeContrat}
                        </span>
                      </div>
                    </div>

                    {/* Direct Status Selector */}
                    <select
                      value={emp.statut}
                      onChange={(e) =>
                        handleQuickStatusChange(emp.id, e.target.value as StatutEmploye)
                      }
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border cursor-pointer ${getStatutStyle(
                        emp.statut
                      )}`}
                      title="Changer le statut en temps réel"
                    >
                      <option value="Actif">Actif</option>
                      <option value="En congé">En congé</option>
                      <option value="En mission">En mission</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>

                  {/* Work Timing & Recruitment Date */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Timing :</span>
                      </span>
                      <span className="font-semibold text-slate-900 text-right">
                        {emp.joursTravail} ({emp.heuresTravail})
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Recruté(e) le :</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {emp.dateRecrutement}
                      </span>
                    </div>

                    {emp.salaireMensuel > 0 && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Salaire :</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatDA(emp.salaireMensuel)} / mois
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Profile / Bio description */}
                  {emp.profilBio && (
                    <div className="text-xs text-slate-600 line-clamp-2 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100">
                      <span className="font-semibold text-slate-800">Profil : </span>
                      {emp.profilBio}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono font-medium">
                        {emp.contact || 'Non renseigné'}
                      </span>
                    </div>
                    {emp.adresse && (
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.adresse}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Direct WhatsApp, Gmail, Edit & Delete */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {emp.contact && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                        title={`Contacter ${emp.prenom} sur WhatsApp`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {emp.email && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSendEmployeeGmail) {
                            onSendEmployeeGmail(
                              emp.email,
                              `${emp.prenom} ${emp.nom}`,
                              emp.role
                            );
                          } else {
                            window.location.href = `mailto:${emp.email}`;
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        title={`Envoyer un Gmail à ${emp.prenom}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Gmail</span>
                      </button>
                    )}

                    {onNavigatePayroll && (
                      <button
                        type="button"
                        onClick={() => onNavigatePayroll(emp.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                        title={`Consulter & imprimer la fiche de paie de ${emp.prenom}`}
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        <span>Paie</span>
                      </button>
                    )}
                  </div>

                  {canModifyEmployees && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Modifier la fiche de cet employé"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(emp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer cet employé"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW: Full HR Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Employé & Profil</th>
                  <th className="py-3 px-4">Rôle & Département</th>
                  <th className="py-3 px-4">Date Recrutement</th>
                  <th className="py-3 px-4">Timing de Travail</th>
                  <th className="py-3 px-4">Contact, Email & WhatsApp</th>
                  <th className="py-3 px-4 text-right">Salaire (DA)</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const waUrl = getEmployeeWhatsAppUrl(
                    emp.contact,
                    `${emp.prenom} ${emp.nom}`,
                    emp.role
                  );

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {emp.nom.toUpperCase()} {emp.prenom}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">
                          {emp.profilBio || emp.adresse || `ID: ${emp.id}`}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-blue-700">{emp.role}</div>
                        <div className="text-[11px] text-slate-500">
                          {emp.departement} ({emp.typeContrat})
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {emp.dateRecrutement}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{emp.joursTravail}</div>
                        <div className="text-[11px] font-mono text-blue-700">
                          {emp.heuresTravail}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-slate-900">
                            {emp.contact}
                          </span>
                          {emp.contact && (
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
                          {emp.email && onSendEmployeeGmail && (
                            <button
                              type="button"
                              onClick={() =>
                                onSendEmployeeGmail(
                                  emp.email,
                                  `${emp.prenom} ${emp.nom}`,
                                  emp.role
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Gmail</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{emp.email}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {emp.salaireMensuel > 0 ? formatDA(emp.salaireMensuel) : '—'}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <select
                          value={emp.statut}
                          onChange={(e) =>
                            handleQuickStatusChange(emp.id, e.target.value as StatutEmploye)
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer ${getStatutStyle(
                            emp.statut
                          )}`}
                        >
                          <option value="Actif">Actif</option>
                          <option value="En congé">En congé</option>
                          <option value="En mission">En mission</option>
                          <option value="Inactif">Inactif</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {onNavigatePayroll && (
                            <button
                              onClick={() => onNavigatePayroll(emp.id)}
                              className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded flex items-center gap-1"
                              title="Consulter & imprimer la fiche de paie"
                            >
                              <FileText className="w-3 h-3 text-purple-600" />
                              <span>Fiche Paie</span>
                            </button>
                          )}
                          {canModifyEmployees && (
                            <>
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                                title="Modifier"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-sm font-bold">
                    {editingEmployee
                      ? `Modifier la fiche de ${editingEmployee.prenom} ${editingEmployee.nom}`
                      : 'Ajouter un Nouvel Employé à Notre Équipe'}
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Renseignez le rôle, la date de recrutement, le timing de travail et les contacts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Section 1: Identité & Rôle */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>1. Identité, Rôle & Département</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom de l'employé *
                    </label>
                    <input
                      type="text"
                      required
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Ex: BENALI"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prénom de l'employé *
                    </label>
                    <input
                      type="text"
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Ex: Karim"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rôle / Fonction au sein de SERVI-DOX *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Gestionnaire Dossiers RC & Entreprise"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ROLE_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setRole(sug)}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded border border-slate-200 transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Département
                    </label>
                    <select
                      value={departement}
                      onChange={(e) => setDepartement(e.target.value as DepartementEmploye)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Direction & Administration">Direction & Administration</option>
                      <option value="Dossiers RC & Entreprises">Dossiers RC & Entreprises</option>
                      <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                      <option value="Comptabilité & Finance">Comptabilité & Finance</option>
                      <option value="Accueil & Relation Client">Accueil & Relation Client</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Type de contrat
                    </label>
                    <select
                      value={typeContrat}
                      onChange={(e) => setTypeContrat(e.target.value as ContratEmploye)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Stage / Formation">Stage / Formation</option>
                      <option value="Consultant">Consultant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Statut actuel
                    </label>
                    <select
                      value={statut}
                      onChange={(e) => setStatut(e.target.value as StatutEmploye)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Actif">Actif (En poste)</option>
                      <option value="En congé">En congé</option>
                      <option value="En mission">En mission</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Date de recrutement, Timing de travail & Salaire (DA) */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>2. Date de Recrutement, Timing de Travail & Salaire (DA)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date de recrutement *
                    </label>
                    <input
                      type="date"
                      required
                      value={dateRecrutement}
                      onChange={(e) => setDateRecrutement(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Salaire mensuel en Dinars (DA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={salaireMensuel}
                      onChange={(e) => setSalaireMensuel(e.target.value)}
                      placeholder="Ex: 55000"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jours de travail *
                    </label>
                    <input
                      type="text"
                      required
                      value={joursTravail}
                      onChange={(e) => setJoursTravail(e.target.value)}
                      placeholder="Ex: Dimanche - Jeudi"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {JOURS_SUGGESTIONS.map((j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => setJoursTravail(j)}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded border border-slate-200"
                        >
                          {j}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horaires / Timing de travail *
                    </label>
                    <input
                      type="text"
                      required
                      value={heuresTravail}
                      onChange={(e) => setHeuresTravail(e.target.value)}
                      placeholder="Ex: 08h30 - 16h30"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {HEURES_SUGGESTIONS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHeuresTravail(h)}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded border border-slate-200"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Coordonnées, Mail, WhatsApp & Profil */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Email, Contact WhatsApp & Profil Détaillé</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Téléphone & Contact WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Ex: 0550 12 34 56"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse Email / Gmail *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employe@gmail.com"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse / Commune / Wilaya
                  </label>
                  <input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder="Ex: Bab Ezzouar, Alger"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Profil, Compétences & Dossiers pris en charge
                  </label>
                  <textarea
                    rows={3}
                    value={profilBio}
                    onChange={(e) => setProfilBio(e.target.value)}
                    placeholder="Décrivez les responsabilités, spécialités et dossiers gérés par cet employé..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {editingEmployee ? 'Enregistrer les modifications' : "Ajouter à l'équipe"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
