import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building2,
  Trash2,
  Check,
  Send,
  Plus,
  RefreshCw,
  Bell,
  Download,
} from 'lucide-react';
import { Appointment, StatutRendezVous, MOTIFS_RENDEZ_VOUS } from '../types/appointment';
import {
  APPOINTMENTS_STORAGE_KEY,
  sendAppointmentNotificationEmail,
} from '../services/appointmentService';
import {
  subscribeToAppointments,
  updateAppointmentInFirestore,
  deleteAppointmentFromFirestore,
  persistAppointmentToFirestore,
} from '../services/firestoreSync';
import { useClients } from '../context/ClientContext';
import { AppointmentBookingModal } from './AppointmentBookingModal';

interface AppointmentsPageProps {
  onSendGmail?: (recipientEmail: string, clientName: string, subject: string) => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ onSendGmail }) => {
  const { showToast } = useClients();

  // Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    } catch (e) {
      console.error(e);
    }
  }, [appointments]);

  // Firestore real-time listener (multi-ordinateurs)
  useEffect(() => {
    let hasReconciled = false;
    const unsubscribe = subscribeToAppointments((remoteAppointments) => {
      if (!hasReconciled) {
        hasReconciled = true;
        if (remoteAppointments && remoteAppointments.length > 0) {
          setAppointments(remoteAppointments);
        } else {
          try {
            const saved = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
            if (saved) {
              const parsed: Appointment[] = JSON.parse(saved);
              if (parsed && parsed.length > 0) {
                console.info(`Synchronisation de ${parsed.length} RDV vers Cloud Firestore...`);
                parsed.forEach((a) => persistAppointmentToFirestore(a));
              }
            }
          } catch (e) {
            console.error('Erreur téléversement initial RDV:', e);
          }
        }
      } else {
        setAppointments(remoteAppointments || []);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<'all' | StatutRendezVous | 'unread'>('all');
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.statut === 'en_attente').length;
    const confirmed = appointments.filter((a) => a.statut === 'confirme').length;
    const completed = appointments.filter((a) => a.statut === 'termine').length;
    const unread = appointments.filter((a) => a.notificationVue === false || !a.notificationVue).length;

    return { total, pending, confirmed, completed, unread };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Statut filter
      if (statutFilter === 'unread') {
        if (apt.notificationVue === true) return false;
      } else if (statutFilter !== 'all') {
        if (apt.statut !== statutFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = `${apt.nom} ${apt.prenom}`.toLowerCase().includes(q);
        const matchPhone = (apt.telephone || '').toLowerCase().includes(q);
        const matchEmail = (apt.email || '').toLowerCase().includes(q);
        const matchMotif = (apt.motif || '').toLowerCase().includes(q);
        const matchDate = (apt.date || '').toLowerCase().includes(q);
        const matchId = (apt.id || '').toLowerCase().includes(q);

        if (!matchName && !matchPhone && !matchEmail && !matchMotif && !matchDate && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statutFilter, searchQuery]);

  // Handlers
  const handleUpdateStatut = async (id: string, newStatut: StatutRendezVous) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;

    const now = new Date().toISOString();
    const updated = { ...apt, statut: newStatut, notificationVue: true, updatedAt: now };

    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));

    // Firestore update
    await updateAppointmentInFirestore(id, { statut: newStatut, notificationVue: true, updatedAt: now });

    const labels: Record<StatutRendezVous, string> = {
      en_attente: 'En attente',
      confirme: 'Confirmé',
      termine: 'Terminé / Honoré',
      annule: 'Annulé',
    };

    showToast('Statut mis à jour', `Rendez-vous de ${apt.prenom} ${apt.nom} marqué "${labels[newStatut]}".`, 'info');
  };

  const handleMarkAsRead = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, notificationVue: true } : a))
    );
    await updateAppointmentInFirestore(id, { notificationVue: true });
  };

  const handleMarkAllAsRead = async () => {
    const updated = appointments.map((a) => ({ ...a, notificationVue: true }));
    setAppointments(updated);
    for (const a of appointments) {
      if (!a.notificationVue) {
        await updateAppointmentInFirestore(a.id, { notificationVue: true });
      }
    }
    showToast('Notifications lues', 'Tous les rendez-vous ont été marqués comme vus.', 'success');
  };

  const handleDelete = async (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;

    if (confirm(`Confirmez-vous la suppression du rendez-vous ${apt.id} de ${apt.prenom} ${apt.nom} ?`)) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      await deleteAppointmentFromFirestore(id);
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(null);
      }
      showToast('Rendez-vous supprimé', 'Le rendez-vous a été retiré du système.', 'warning');
    }
  };

  const handleResendEmail = async (apt: Appointment) => {
    showToast('Envoi en cours', `Notification email en cours de renvoi pour ${apt.id}...`, 'info');
    const res = await sendAppointmentNotificationEmail(apt);
    if (res.success) {
      showToast('Notification envoyée', `Email transmis à l'administrateur (${apt.id}).`, 'success');
    }
  };

  const handleExportCSV = () => {
    if (appointments.length === 0) {
      showToast('Aucun rendez-vous', 'La liste des rendez-vous est vide.', 'warning');
      return;
    }

    const headers = ['ID', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Date RDV', 'Heure', 'Motif', 'Statut', 'Remarque', 'Date Création'];
    const rows = appointments.map((a) => [
      a.id,
      `"${a.nom}"`,
      `"${a.prenom}"`,
      `"${a.telephone}"`,
      `"${a.email || ''}"`,
      a.date,
      a.heure,
      `"${a.motif}"`,
      a.statut,
      `"${(a.remarque || '').replace(/"/g, '""')}"`,
      a.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `SERVIDOX_rendez_vous_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exportation réussie', `${appointments.length} rendez-vous exportés en CSV.`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Planning & Réservations Clients
            </span>
            {stats.unread > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                {stats.unread} nouveau(x) !
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Rendez-vous SERVI-DOX
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Suivi en temps réel des créneaux réservés depuis la page d'accueil (Samedi à Jeudi de 08h30 à 11h30 et 13h30 à 15h30).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.unread > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-sm"
              title="Marquer toutes les notifications comme lues"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Tout marquer comme vu
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter CSV
          </button>

          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nouveau Rendez-vous
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Rendez-vous</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Depuis l'ouverture du service</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>En attente de confirmation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{stats.pending}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">À valider par le secrétariat</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Créneaux Confirmés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{stats.confirmed}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Clients attendus au cabinet</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-medium">
            <span>Terminés / Honorés</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{stats.completed}</div>
          <div className="text-[11px] text-indigo-600/80 mt-0.5">Dossiers traités avec succès</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone, motif ou date..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>

        {/* Status Filters */}
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
            onClick={() => setStatutFilter('unread')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${
              statutFilter === 'unread'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Bell className="w-3 h-3" />
            Nouveaux ({stats.unread})
          </button>
          <button
            onClick={() => setStatutFilter('en_attente')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'en_attente'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            En attente ({stats.pending})
          </button>
          <button
            onClick={() => setStatutFilter('confirme')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'confirme'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Confirmés ({stats.confirmed})
          </button>
          <button
            onClick={() => setStatutFilter('termine')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              statutFilter === 'termine'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Terminés ({stats.completed})
          </button>
        </div>
      </div>

      {/* Appointments List / Table */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Aucun rendez-vous trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche. Essayez d\'autres mots-clés.'
              : 'Les rendez-vous réservés par les clients depuis la page de connexion s\'afficheront ici automatiquement en temps réel.'}
          </p>
          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Créer un premier rendez-vous
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Réf & Statut</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Date & Créneau</th>
                  <th className="py-3 px-4">Motif du Dossier</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Actions Directes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((apt) => {
                  const isUnread = !apt.notificationVue;
                  const isPending = apt.statut === 'en_attente';
                  const isConfirmed = apt.statut === 'confirme';
                  const isCompleted = apt.statut === 'termine';
                  const isCancelled = apt.statut === 'annule';

                  return (
                    <tr
                      key={apt.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isUnread ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => {
                        if (isUnread) handleMarkAsRead(apt.id);
                      }}
                    >
                      {/* Ref & Statut */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Nouveau" />
                          )}
                          <span className="font-mono font-bold text-slate-800">{apt.id}</span>
                        </div>
                        <div className="mt-1">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-2.5 h-2.5" /> En attente
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Confirmé
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <Check className="w-2.5 h-2.5" /> Honoré
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                              <XCircle className="w-2.5 h-2.5" /> Annulé
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {apt.nom} {apt.prenom}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {apt.telephone}
                        </div>
                      </td>

                      {/* Date & Heure */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {apt.date}
                        </div>
                        <div className="font-bold text-indigo-700 text-xs mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {apt.heure}
                        </div>
                      </td>

                      {/* Motif */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 line-clamp-1" title={apt.motif}>
                          {apt.motif}
                        </div>
                        {apt.remarque && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5" title={apt.remarque}>
                            "{apt.remarque}"
                          </div>
                        )}
                      </td>

                      {/* Contact Channels */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {/* WhatsApp */}
                          <a
                            href={`https://wa.me/${apt.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Bonjour ${apt.prenom} ${apt.nom}, nous confirmons votre rendez-vous SERVI-DOX du ${apt.date} à ${apt.heure} pour : ${apt.motif}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="Écrire sur WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Téléphone */}
                          <a
                            href={`tel:${apt.telephone}`}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            title="Appeler le client"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Email */}
                          {apt.email && (
                            <button
                              onClick={() => {
                                if (onSendGmail) {
                                  onSendGmail(
                                    apt.email,
                                    `${apt.nom} ${apt.prenom}`,
                                    `Confirmation de votre Rendez-vous SERVI-DOX (${apt.date} à ${apt.heure})`
                                  );
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                              title="Envoyer un e-mail Gmail"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Direct Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleUpdateStatut(apt.id, 'confirme')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                            >
                              Confirmer
                            </button>
                          )}

                          {isConfirmed && (
                            <button
                              onClick={() => handleUpdateStatut(apt.id, 'termine')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                            >
                              Honoré
                            </button>
                          )}

                          {apt.statut !== 'annule' && (
                            <button
                              onClick={() => handleUpdateStatut(apt.id, 'annule')}
                              className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-100 transition"
                              title="Annuler le rendez-vous"
                            >
                              Annuler
                            </button>
                          )}

                          <button
                            onClick={() => handleResendEmail(apt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Renvoyer l'email de notification"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(apt.id)}
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

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
      />
    </div>
  );
};
