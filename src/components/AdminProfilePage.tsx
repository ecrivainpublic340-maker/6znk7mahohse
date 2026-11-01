import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../context/ClientContext';
import { formatDA } from '../utils/format';
import { ActiveTab } from './Navbar';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  UserPlus,
  TrendingUp,
  History,
  Lock,
  Download,
  Trash2,
  ArrowRight,
  Calendar,
  LogOut,
  FolderKanban,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Clock,
  XCircle,
  MessageCircle,
  Briefcase,
  FileText,
} from 'lucide-react';
import { getEmployeeWhatsAppUrl } from '../utils/format';

interface AdminProfilePageProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const AdminProfilePage: React.FC<AdminProfilePageProps> = ({ onNavigate }) => {
  const {
    user,
    registeredUsers,
    pendingEmployeesCount,
    approveUserAccount,
    rejectUserAccount,
    deleteUserAccount,
    updateProfile,
    loginWithGoogle,
    logout,
    isMasterAdmin,
  } = useAuth();
  const { clients, logs: activityLogs, exportCSV, clearAllClients, showToast } = useClients();
  const isAdmin = user?.role === 'Administrateur';

  const employeeAccounts = useMemo(
    () => registeredUsers.filter((u) => u.role === 'Employé'),
    [registeredUsers]
  );

  // Form states for editing admin profile
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cabinetName, setCabinetName] = useState(user?.cabinetName || 'SERVI-DOX');
  const [address, setAddress] = useState(user?.address || 'Alger, Algérie');
  const [newPassword, setNewPassword] = useState('');

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setCabinetName(user.cabinetName || 'SERVI-DOX');
      setAddress(user.address || 'Alger, Algérie');
    }
  }, [user]);

  const stats = useMemo(() => {
    const totalClients = clients.length;
    const dossiersEnCours = clients.filter((c) => c.statut === 'En cours').length;
    const dossiersValides = clients.filter((c) => c.statut === 'Validé').length;
    const totalFacture = clients.reduce((sum, c) => sum + (c.montantTotal || 0), 0);
    const totalEncaisse = clients.reduce((sum, c) => sum + (c.montantEncaisse || 0), 0);
    const totalReste = clients.reduce(
      (sum, c) =>
        sum +
        (c.montantReste !== undefined
          ? c.montantReste
          : Math.max(0, (c.montantTotal || 0) - (c.montantEncaisse || 0))),
      0
    );

    return {
      totalClients,
      dossiersEnCours,
      dossiersValides,
      totalFacture,
      totalEncaisse,
      totalReste,
    };
  }, [clients]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    setErrorMessage(null);

    if (newPassword && newPassword.trim().length > 0 && newPassword.trim().length < 4) {
      setErrorMessage('Le nouveau mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    const res = updateProfile(
      {
        name,
        email,
        phone,
        cabinetName,
        address,
      },
      newPassword.trim() || undefined
    );

    if (res.success) {
      setNewPassword('');
      setSaveMessage('Profil mis à jour en temps réel avec succès.');
      setTimeout(() => setSaveMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Erreur lors de la mise à jour du profil.');
    }
  };

  const formattedRegDate = user?.registeredAt
    ? new Date(user.registeredAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : "Aujourd'hui";

  const isGmailAccount =
    user?.authProvider === 'gmail' || (user?.email && user.email.toLowerCase().endsWith('@gmail.com'));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Hero Banner: Administrator or Employee Welcome */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center">
              <img
                src="/assets/aistudio/Sans_titre_b7fbb046.png"
                alt="SERVI-DOX"
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900"
              title="Connecté"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAdmin
                  ? 'Profil Administrateur Principal'
                  : `Compte Employé Validé · ${user?.jobTitle || 'Équipe SERVI-DOX'}`}
              </span>
              {isGmailAccount && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Mail className="w-3 h-3" />
                  Compte Gmail Vérifié
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5">
              Bienvenue, {user?.name || 'Administrateur SERVI-DOX'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {user?.email} · {user?.cabinetName || 'Cabinet SERVI-DOX'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('add')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4 text-blue-700" />
            <span>Ajouter un client</span>
          </button>

          <button
            onClick={() => onNavigate('clients')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Gérer les clients ({stats.totalClients})</span>
          </button>
        </div>
      </div>

      {/* EMPLOYEE ACCOUNT VALIDATION CENTER (STRICTLY FOR MASTER ADMINISTRATOR zinemoh106@gmail.com) */}
      {isMasterAdmin && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
            pendingEmployeesCount > 0
              ? 'bg-amber-50/90 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingEmployeesCount > 0
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Validation des Comptes Employés
                  </h2>
                  {pendingEmployeesCount > 0 ? (
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-500 text-white rounded-full animate-pulse">
                      {pendingEmployeesCount} demande{pendingEmployeesCount > 1 ? 's' : ''} en attente
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                      Aucune demande en attente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Lorsqu'un employé crée un compte sur la page de login, validez son inscription ici
                  pour lui autoriser l'accès à la plateforme et l'ajouter automatiquement à « Notre
                  Équipe ».
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('team')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>Voir Notre Équipe</span>
            </button>
          </div>

          {employeeAccounts.length === 0 ? (
            <div className="pt-4 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
              <span>
                Aucun compte employé n'a encore été demandé depuis la page de connexion (« Créer un
                compte » &rarr; « Compte Employé »).
              </span>
            </div>
          ) : (
            <div className="pt-4 space-y-2.5">
              {employeeAccounts.map((empUser) => {
                const isPending = empUser.accountStatus === 'pending';
                const isApproved = empUser.accountStatus === 'approved';
                const waUrl = empUser.phone
                  ? getEmployeeWhatsAppUrl(empUser.phone, empUser.name, empUser.jobTitle)
                  : '#';

                return (
                  <div
                    key={empUser.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      isPending
                        ? 'bg-white border-amber-400 shadow-xs'
                        : isApproved
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {empUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{empUser.name}</span>
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {empUser.jobTitle || 'Employé SERVI-DOX'}
                          </span>
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              En attente de votre validation
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Accès Validé
                            </span>
                          )}
                          {empUser.accountStatus === 'rejected' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" />
                              Accès Refusé / Suspendu
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {empUser.email}
                          </span>
                          {empUser.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {empUser.phone}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            Inscrit le{' '}
                            {new Date(empUser.registeredAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {empUser.phone && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            approveUserAccount(empUser.id);
                            showToast(
                              'Compte Employé validé !',
                              `${empUser.name} peut maintenant se connecter à la plateforme et a été ajouté à Notre Équipe.`,
                              'success'
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accepter & Valider l'accès</span>
                        </button>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            rejectUserAccount(empUser.id);
                            showToast(
                              'Accès suspendu',
                              `L'accès de ${empUser.name} a été suspendu.`,
                              'warning'
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Suspendre l'accès</span>
                        </button>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => {
                            rejectUserAccount(empUser.id);
                            showToast(
                              'Demande refusée',
                              `La demande de compte de ${empUser.name} a été refusée.`,
                              'warning'
                            );
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Refuser</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Supprimer définitivement le compte utilisateur de "${empUser.name}" ?`
                            )
                          ) {
                            deleteUserAccount(empUser.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer ce compte"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Real-time Cabinet KPIs in Algerian Dinars (DA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('clients')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Dossiers Clients</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {stats.totalClients}
            </span>
            <span className="text-[11px] font-semibold text-blue-600">
              {stats.dossiersEnCours} en cours
            </span>
          </div>
        </div>

        <div
          onClick={() => isMasterAdmin && onNavigate('revenues')}
          className={`bg-white border border-slate-200 rounded-xl p-4 shadow-xs transition-all ${
            isMasterAdmin ? 'hover:border-emerald-400 cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Total Encaissé (DA)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
              {formatDA(stats.totalEncaisse)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">C.A. perçu</span>
          </div>
        </div>

        <div
          onClick={() => isMasterAdmin && onNavigate('revenues')}
          className={`bg-white border border-slate-200 rounded-xl p-4 shadow-xs transition-all ${
            isMasterAdmin ? 'hover:border-amber-400 cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Reste à Payer (DA)</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums">
              {formatDA(stats.totalReste)}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">à recouvrer</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('logs')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Activités Récentes</span>
            <History className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {activityLogs.length}
            </span>
            <span className="text-[11px] text-slate-500">actions journalisées</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Edit Profile Form, Right = Quick Navigation & Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Edit Administrator Profile */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Informations du Profil Administrateur
              </h2>
              <p className="text-xs text-slate-500">
                Modifiez vos coordonnées administrateur et vos paramètres de compte en temps réel
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {user?.avatarInitials || 'SD'}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            {saveMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom complet de l'Administrateur *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom et prénom"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse Gmail / Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone / WhatsApp Administrateur
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 0550 12 34 56"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du Cabinet / Entreprise
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={cabinetName}
                    onChange={(e) => setCabinetName(e.target.value)}
                    placeholder="SERVI-DOX"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wilaya / Adresse du Cabinet
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alger, Algérie"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau mot de passe (optionnel)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Laisser vide pour conserver"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Membre depuis : {formattedRegDate}</span>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer mon profil</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: All Pages Directory & Database Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Access to all pages */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Accès Rapide aux Modules SERVI-DOX
            </h3>
            <p className="text-xs text-slate-500">
              Toutes vos pages sont également disponibles à tout moment dans le menu latéral gauche.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => onNavigate('clients')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Liste des Clients & Dossiers
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Recherche et modification en temps réel + WhatsApp
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>

              <button
                onClick={() => onNavigate('add')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      Ajouter un Nouveau Client
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Auto-entrepreneur, RC, Entreprise, Autre dossier (en DA)
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={() => onNavigate('autoentrepreneur')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                      Offre & Suivi Auto-Entrepreneur
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Suivi Bureau (12 000 DA), Hors Wilaya (15 000 DA), CASNOS, Impôts & Banques
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => onNavigate('team')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                      Notre Équipe (Employés & Horaires)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Rôles, dates de recrutement, timing de travail, emails & WhatsApp
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
              </button>

              <button
                onClick={() => onNavigate('paie')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Fiches de Paie (Mensuel & Annuel)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Bulletins de paie officiels A4 avec logo, filigrane SERVI-DOX & impression
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>

              <button
                onClick={() => onNavigate('revenues')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                      Tableau des Revenus (DA)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Bilan de la semaine, du mois et annuel en Dinars Algériens
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => onNavigate('gmail')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-rose-500 hover:bg-rose-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                      Messagerie Gmail Intégrée
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Consulter vos e-mails et envoyer des relances clients
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </button>
            </div>
          </div>

          {/* Administration & Session Controls */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Contrôle Administrateur & Base de Données
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Synchroniser mon compte Google Gmail</span>
              </button>

              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Exporter les clients (CSV)</span>
              </button>

              {clients.length > 0 && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'Confirmez-vous la remise à zéro vierge de toute la liste des clients ?'
                      )
                    ) {
                      clearAllClients();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Rendre la liste vierge</span>
                </button>
              )}

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors ml-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hostinger Domain Assistant Card: servidox.pro */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Assistant de Liaison Domaine Hostinger : <span className="font-mono text-blue-700">servidox.pro</span>
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Prêt dans le code
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Valeurs DNS prêtes à copier-coller dans votre espace <strong>Hostinger (hPanel &rarr; Domaines &rarr; servidox.pro &rarr; DNS)</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://console.cloud.google.com/run/domains?project=gen-lang-client-0873942829"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span>1. Activer servidox.pro sur Cloud Run</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0873942829/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <span>2. Autoriser servidox.pro dans Firebase Auth</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Nom (Host)</th>
                <th className="py-2.5 px-3">Valeur (Pointe vers / Cible)</th>
                <th className="py-2.5 px-3">TTL</th>
                <th className="py-2.5 px-3 text-right">Action rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {[
                { type: 'A', host: '@', value: '216.239.32.21', ttl: '3600' },
                { type: 'A', host: '@', value: '216.239.34.21', ttl: '3600' },
                { type: 'A', host: '@', value: '216.239.36.21', ttl: '3600' },
                { type: 'A', host: '@', value: '216.239.38.21', ttl: '3600' },
                { type: 'CNAME', host: 'www', value: 'ghs.googlehosted.com', ttl: '3600' },
              ].map((record, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-blue-700">{record.type}</td>
                  <td className="py-2 px-3 text-slate-800">{record.host}</td>
                  <td className="py-2 px-3 text-slate-900 font-semibold">{record.value}</td>
                  <td className="py-2 px-3 text-slate-500">{record.ttl}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleCopy(record.value)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
                    >
                      {copiedValue === record.value ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copier la valeur</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
