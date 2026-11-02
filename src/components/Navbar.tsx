import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../context/ClientContext';
import { LanguageSwitcherButton } from '../context/LanguageContext';
import {
  LogOut,
  Users,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  BadgeCheck,
  Calendar,
  Building2,
  Landmark,
  Globe2,
  Building,
  Briefcase,
  FileText,
  TrendingUp,
  Mail,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import { subscribeToAppointments } from '../services/firestoreSync';

export type ActiveTab =
  | 'profile'
  | 'clients'
  | 'add'
  | 'autoentrepreneur'
  | 'sarl_eurl'
  | 'registre_rc'
  | 'hors_wilaya'
  | 'suivi_bureau'
  | 'tarifs_dossiers'
  | 'team'
  | 'paie'
  | 'revenues'
  | 'appointments'
  | 'calendar'
  | 'gmail'
  | 'sheets'
  | 'logs';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const { user, logout, pendingEmployeesCount, isMasterAdmin } = useAuth();
  const { clients, logs: activityLogs } = useClients();
  const isAdmin = user?.role === 'Administrateur';

  // Live count for appointments & unread notifications
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0);
  const [unreadAppointmentsCount, setUnreadAppointmentsCount] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeToAppointments((list) => {
      setAppointmentsCount(list.length);
      const unread = list.filter((a) => !a.notificationVue).length;
      setUnreadAppointmentsCount(unread);
    });
    return () => unsub();
  }, []);

  const rawNavItems: Array<{
    id: ActiveTab;
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeAlert?: boolean;
    masterOnly?: boolean;
  }> = [
    {
      id: 'profile',
      label: isMasterAdmin ? 'Profil Administrateur' : 'Mon Profil Employé',
      icon: <UserCheck className="w-4 h-4" />,
      badge: isMasterAdmin && pendingEmployeesCount > 0 ? `${pendingEmployeesCount} att.` : undefined,
      badgeAlert: isMasterAdmin && pendingEmployeesCount > 0,
    },
    {
      id: 'appointments',
      label: 'Rendez-vous Clients',
      icon: <Calendar className="w-4 h-4" />,
      badge: unreadAppointmentsCount > 0 ? `${unreadAppointmentsCount} nouv.` : appointmentsCount > 0 ? appointmentsCount : undefined,
      badgeAlert: unreadAppointmentsCount > 0,
    },
    {
      id: 'clients',
      label: 'Liste des Clients',
      icon: <Users className="w-4 h-4" />,
      badge: clients.length,
    },
    {
      id: 'add',
      label: 'Ajouter un Client',
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      id: 'autoentrepreneur',
      label: 'Auto-Entrepreneur',
      icon: <BadgeCheck className="w-4 h-4" />,
      badge: clients.filter((c) => c.typeDossier === 'Auto-entrepreneur').length || undefined,
    },
    {
      id: 'sarl_eurl',
      label: 'SARL / EURL',
      icon: <Building2 className="w-4 h-4" />,
      badge: clients.filter((c) => c.typeDossier === 'Entreprise').length || undefined,
    },
    {
      id: 'registre_rc',
      label: 'Registre RC',
      icon: <Landmark className="w-4 h-4" />,
      badge: clients.filter((c) => c.typeDossier === 'RC').length || undefined,
    },
    {
      id: 'hors_wilaya',
      label: 'Hors Wilaya',
      icon: <Globe2 className="w-4 h-4" />,
      badge: clients.filter((c) => c.typeDossier === 'Inscription & Suivi (Hors Wilaya)').length || undefined,
    },
    {
      id: 'suivi_bureau',
      label: 'Suivi Bureau',
      icon: <Building className="w-4 h-4" />,
      badge: clients.filter((c) => c.typeDossier === 'Inscription & Suivi (Bureau)').length || undefined,
    },
    {
      id: 'tarifs_dossiers',
      label: 'Tarifs & Papiers (PDF)',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'team',
      label: 'Notre Équipe',
      icon: <Briefcase className="w-4 h-4" />,
      badge: isMasterAdmin && pendingEmployeesCount > 0 ? pendingEmployeesCount : undefined,
      badgeAlert: isMasterAdmin && pendingEmployeesCount > 0,
      masterOnly: true, // STRICTLY RESTRICTED TO zinemoh106@gmail.com
    },
    {
      id: 'paie',
      label: 'Fiches de Paie',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'revenues',
      label: 'Tableau des Revenus',
      icon: <TrendingUp className="w-4 h-4" />,
      masterOnly: true, // STRICTLY RESTRICTED TO zinemoh106@gmail.com
    },
    {
      id: 'calendar',
      label: 'Google Calendar',
      icon: <Calendar className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'gmail',
      label: 'Messagerie Gmail',
      icon: <Mail className="w-4 h-4" />,
    },
    {
      id: 'sheets',
      label: 'Google Sheets',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'logs',
      label: "Journal d'Activité",
      icon: <History className="w-4 h-4" />,
      badge: activityLogs.length > 0 ? activityLogs.length : undefined,
    },
  ];

  // Restrict 'team' and 'revenues' tabs exclusively to the Master Administrator email (zinemoh106@gmail.com)
  const navItems = rawNavItems.filter((item) => !item.masterOnly || isMasterAdmin);

  const handleSelect = (id: ActiveTab) => {
    setActiveTab(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 w-68 shrink-0 select-none border-r border-slate-800">
      {/* Brand Header with Official SERVI-DOX Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <button
          onClick={() => handleSelect('profile')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/assets/aistudio/Sans_titre_b7fbb046.png"
              alt="SERVI-DOX"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-white text-base block leading-none">
              SERVI-DOX
            </span>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Espace Administrateur
            </span>
          </div>
        </button>

        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Administrator Summary Pill */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => handleSelect('profile')}
          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
            activeTab === 'profile'
              ? 'bg-blue-600/20 border-blue-500/50 text-white'
              : 'bg-slate-800/70 border-slate-700/70 hover:bg-slate-800 text-slate-200'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-blue-400/40">
            {user?.avatarInitials || 'SD'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate">{user?.name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <span className="text-[11px] text-slate-400 truncate block">{user?.email}</span>
          </div>
        </button>
      </div>

      {/* Navigation Links (All pages) */}
      <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal SERVI-DOX
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:text-white'
                  }`}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate leading-tight">{item.label}</div>
                  {item.subtitle && (
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>

              {item.badge !== undefined ? (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                    item.badgeAlert
                      ? 'bg-amber-400 text-slate-950 animate-pulse'
                      : isActive
                      ? 'bg-white text-blue-700'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              ) : (
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Logout Action */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={logout}
          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/80 border border-rose-500/20 hover:border-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Lateral Menu */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 print:hidden">{sidebarContent}</aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};

export const Navbar: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  setMobileOpen,
}) => {
  const { user, logout, pendingEmployeesCount, isMasterAdmin } = useAuth();
  const isAdmin = user?.role === 'Administrateur';

  const tabTitles: Record<ActiveTab, string> = {
    profile: isMasterAdmin ? 'Profil Administrateur Principal' : 'Mon Profil Employé',
    clients: 'Liste & Contrôle des Clients (Tous les dossiers)',
    add: 'Ajouter un Nouveau Dossier Client',
    autoentrepreneur: 'Dossiers Auto-Entrepreneurs — Suivi & CASNOS',
    sarl_eurl: 'Dossiers SARL & EURL — Création d’Entreprise (100 000 DA)',
    registre_rc: 'Dossiers Registre du Commerce RC (50 000 DA)',
    hors_wilaya: 'Dossiers Clients Hors Wilaya — Suivi 58 Wilayas (15 000 DA)',
    suivi_bureau: 'Dossiers Inscription & Suivi au Bureau (12 000 DA)',
    tarifs_dossiers: 'Guide des Tarifs & Papiers Nécessaires (PDF)',
    team: 'Notre Équipe — Gestion des Employés',
    paie: 'Fiches de Paie — Bulletins Mensuels & Bilans Annuels',
    revenues: 'Tableau des Revenus (DA)',
    appointments: 'Gestion des Rendez-vous Clients (Réservations)',
    calendar: 'Google Calendar — Agenda du Cabinet & Synchronisation',
    gmail: 'Messagerie Gmail',
    sheets: 'Google Sheets — Tableurs & Synchronisation Cloud',
    logs: "Journal d'Activité",
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 h-15 px-4 sm:px-6 flex items-center justify-between gap-4 print:hidden">
      <div className="flex items-center gap-3">
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
            aria-label="Ouvrir le menu latéral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {tabTitles[activeTab]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcherButton variant="light" />

        {isMasterAdmin && pendingEmployeesCount > 0 && (
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold transition-colors shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
            <span>
              {pendingEmployeesCount} employé{pendingEmployeesCount > 1 ? 's' : ''} à valider
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          title="Accéder au Profil"
        >
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px]">
              {user?.name}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold leading-tight">
              {user?.jobTitle || user?.role || 'Administrateur'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {user?.avatarInitials || 'SD'}
          </div>
        </button>

        <button
          onClick={logout}
          title="Se déconnecter"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          aria-label="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
