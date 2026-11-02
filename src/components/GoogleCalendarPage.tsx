import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  CalendarDays,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../context/ClientContext';
import {
  CalendarEvent,
  fetchCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  exportAppointmentToCalendar,
  CALENDAR_STORAGE_KEY,
} from '../services/googleCalendarService';
import { getAccessToken, googleSignIn } from '../services/gmailService';
import { Appointment } from '../types/appointment';
import { APPOINTMENTS_STORAGE_KEY, getDeletedAppointmentIds } from '../services/appointmentService';

interface GoogleCalendarPageProps {
  onNavigateAppointments?: () => void;
}

export const GoogleCalendarPage: React.FC<GoogleCalendarPageProps> = ({ onNavigateAppointments }) => {
  const { user } = useAuth();
  const { showToast } = useClients();

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [isAuthenticatedWithGoogle, setIsAuthenticatedWithGoogle] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Appointments from Cabinet
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modal State for New / Edit Event
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalLocation, setModalLocation] = useState('Cabinet SERVI-DOX, Bab Ezzouar, Alger');
  const [modalDate, setModalDate] = useState('');
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalEndTime, setModalEndTime] = useState('09:45');
  const [modalAttendee, setModalAttendee] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  // Mandatory confirmation dialog for destructive or modifying operations
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    impactDetails?: string[];
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    action: async () => {},
  });

  // Bulk sync state
  const [bulkSyncing, setBulkSyncing] = useState(false);

  // Load appointments
  useEffect(() => {
    try {
      const deletedIds = getDeletedAppointmentIds();
      const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setAppointments(parsed.filter((a) => !deletedIds.has(a.id)));
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Check auth and load events on mount
  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setIsAuthenticatedWithGoogle(true);
        await loadEvents(token);
      } else {
        setIsAuthenticatedWithGoogle(false);
      }
    } catch {
      setIsAuthenticatedWithGoogle(false);
    }
  };

  const loadEvents = async (tokenOverride?: string) => {
    setLoading(true);
    try {
      const token = tokenOverride || (await getAccessToken());
      if (!token) {
        setIsAuthenticatedWithGoogle(false);
        return;
      }
      setIsAuthenticatedWithGoogle(true);
      const items = await fetchCalendarEvents(token);
      setEvents(items);
      showToast('Google Calendar', `${items.length} événement(s) synchronisé(s).`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Information Calendar', err?.message || 'Erreur lors du chargement du calendrier Google.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setLoading(true);
      const res = await googleSignIn(true);
      if (res?.accessToken) {
        setIsAuthenticatedWithGoogle(true);
        await loadEvents(res.accessToken);
        showToast('Connexion Google', 'Accès Google Calendar autorisé avec succès.', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Erreur de connexion', err?.message || 'Impossible de se connecter à Google.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setModalTitle('');
    setModalDescription('');
    setModalLocation('Cabinet SERVI-DOX, Bab Ezzouar, Alger');
    const today = new Date().toISOString().split('T')[0];
    setModalDate(today);
    setModalStartTime('10:00');
    setModalEndTime('10:45');
    setModalAttendee('');
    setIsEventModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setModalTitle(event.summary || '');
    setModalDescription(event.description || '');
    setModalLocation(event.location || '');

    if (event.start?.dateTime) {
      const startDate = new Date(event.start.dateTime);
      setModalDate(startDate.toISOString().split('T')[0]);
      setModalStartTime(startDate.toTimeString().slice(0, 5));
    } else if (event.start?.date) {
      setModalDate(event.start.date);
      setModalStartTime('09:00');
    }

    if (event.end?.dateTime) {
      const endDate = new Date(event.end.dateTime);
      setModalEndTime(endDate.toTimeString().slice(0, 5));
    } else {
      setModalEndTime('09:45');
    }

    const firstAttendee = event.attendees?.[0]?.email || '';
    setModalAttendee(firstAttendee);
    setIsEventModalOpen(true);
  };

  // Submit Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalDate || !modalStartTime || !modalEndTime) {
      showToast('Validation', 'Veuillez remplir le titre, la date et les horaires.', 'warning');
      return;
    }

    const startIso = new Date(`${modalDate}T${modalStartTime}:00`).toISOString();
    const endIso = new Date(`${modalDate}T${modalEndTime}:00`).toISOString();

    setSavingEvent(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        showToast('Authentification requise', 'Veuillez vous connecter à Google pour enregistrer.', 'warning');
        return;
      }

      if (editingEvent) {
        // Update existing event
        const updated = await updateGoogleCalendarEvent(token, editingEvent.id, {
          summary: modalTitle,
          description: modalDescription,
          location: modalLocation,
          startIso,
          endIso,
          attendeeEmail: modalAttendee,
        });

        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
        showToast('Google Calendar', 'Événement mis à jour sur Google Calendar.', 'success');
      } else {
        // Create new event
        const created = await createGoogleCalendarEvent(token, {
          summary: modalTitle,
          description: modalDescription,
          location: modalLocation,
          startIso,
          endIso,
          attendeeEmail: modalAttendee,
        });

        setEvents((prev) => [created, ...prev]);
        showToast('Google Calendar', 'Nouvel événement ajouté à votre Google Calendar.', 'success');
      }

      setIsEventModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast('Erreur Google Calendar', err?.message || "Impossible d'enregistrer l'événement.", 'error');
    } finally {
      setSavingEvent(false);
    }
  };

  // Request Delete Event (With required explicit confirmation dialog)
  const handleRequestDelete = (event: CalendarEvent) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer cet événement Google Calendar ?',
      description: `Êtes-vous sûr de vouloir supprimer définitivement "${event.summary}" de votre agenda Google Calendar ? Cette action retirera également le créneau de votre calendrier.`,
      impactDetails: [
        `Titre : ${event.summary}`,
        `Date : ${formatDateDisplay(event)}`,
        `Lieu : ${event.location || 'Non précisé'}`,
      ],
      action: async () => {
        try {
          const token = await getAccessToken();
          if (!token) throw new Error('Non connecté à Google Calendar.');
          await deleteGoogleCalendarEvent(token, event.id);
          setEvents((prev) => prev.filter((e) => e.id !== event.id));
          showToast('Google Calendar', 'Événement supprimé avec succès.', 'info');
        } catch (err: any) {
          showToast('Erreur', err?.message || 'Échec de la suppression.', 'error');
        }
      },
    });
  };

  // Sync all appointments to Google Calendar
  const handleSyncAllAppointments = async () => {
    if (appointments.length === 0) {
      showToast('Aucun rendez-vous', 'Aucun rendez-vous client trouvé dans la base du cabinet.', 'info');
      return;
    }

    setConfirmModal({
      open: true,
      title: 'Synchroniser les rendez-vous avec Google Calendar',
      description: `Voulez-vous synchroniser ${appointments.length} rendez-vous clients vers votre agenda Google Calendar ?`,
      impactDetails: appointments.slice(0, 4).map((a) => `• ${a.prenom} ${a.nom} - ${a.date} à ${a.heure} (${a.motif})`),
      action: async () => {
        setBulkSyncing(true);
        try {
          const token = await getAccessToken();
          if (!token) throw new Error('Veuillez vous connecter à Google avec le compte du cabinet.');

          let successCount = 0;
          for (const apt of appointments) {
            try {
              await exportAppointmentToCalendar(token, apt);
              successCount++;
            } catch (err) {
              console.warn(`Erreur sync rdv ${apt.id}:`, err);
            }
          }

          await loadEvents(token);
          showToast(
            'Synchronisation Terminée',
            `${successCount} rendez-vous exporté(s) dans Google Calendar.`,
            'success'
          );
        } catch (err: any) {
          showToast('Erreur Synchronisation', err?.message || 'Échec du transfert.', 'error');
        } finally {
          setBulkSyncing(false);
        }
      },
    });
  };

  // Helper date format display
  const formatDateDisplay = (event: CalendarEvent): string => {
    if (event.start?.dateTime) {
      const dt = new Date(event.start.dateTime);
      return dt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (event.start?.date) {
      const dt = new Date(event.start.date);
      return dt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return 'Date non spécifiée';
  };

  // Filtered & Searched events
  const filteredEvents = useMemo(() => {
    let list = [...events];

    // Filter by date
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (activeFilter === 'today') {
      list = list.filter((e) => {
        const s = e.start?.dateTime || e.start?.date || '';
        return s.startsWith(todayStr);
      });
    } else if (activeFilter === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      list = list.filter((e) => {
        const s = e.start?.dateTime || e.start?.date;
        if (!s) return false;
        const d = new Date(s);
        return d >= now && d <= weekFromNow;
      });
    } else if (activeFilter === 'month') {
      const month = now.getMonth();
      const year = now.getFullYear();
      list = list.filter((e) => {
        const s = e.start?.dateTime || e.start?.date;
        if (!s) return false;
        const d = new Date(s);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.attendees && e.attendees.some((a) => a.email.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [events, activeFilter, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Google Calendar API v3 Officielle</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Google Calendar & Agenda SERVI-DOX
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consultez vos rendez-vous, synchronisez l'agenda du cabinet en temps réel et partagez vos créneaux avec vos clients et collaborateurs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticatedWithGoogle ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Compte Google Connecté</span>
              </div>
            ) : (
              <button
                onClick={handleGoogleConnect}
                disabled={loading}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Connexion Google Calendar</span>
              </button>
            )}

            <button
              onClick={() => loadEvents()}
              disabled={loading}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Rafraîchir les événements"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Bar & Appointments Bridge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Événements Google
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {events.length}
            </div>
            <span className="text-[11px] text-slate-400">sur votre calendrier principal</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Rendez-vous Cabinet
            </span>
            <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">
              {appointments.length}
            </div>
            <span className="text-[11px] text-slate-400">enregistrés dans SERVI-DOX</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Synchronisation Rapide</span>
            <button
              onClick={handleSyncAllAppointments}
              disabled={bulkSyncing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className={`w-3.5 h-3.5 ${bulkSyncing ? 'animate-pulse' : ''}`} />
              <span>{bulkSyncing ? 'Synchronisation...' : 'Exporter les RDV'}</span>
            </button>
          </div>
          <p className="text-[11px] text-indigo-700/80 mt-2">
            Transférez les rendez-vous clients vers votre compte Google Calendar en un clic.
          </p>
        </div>
      </div>

      {/* Main Events Dashboard */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50">
          {/* Period Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({events.length})
            </button>
            <button
              onClick={() => setActiveFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setActiveFilter('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'week'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Prochains Jours
            </button>
            <button
              onClick={() => setActiveFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'month'
                  ? 'bg-white text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ce Mois
            </button>
          </div>

          {/* Search & Add Event Button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Événement</span>
            </button>
          </div>
        </div>

        {/* Events Content List */}
        <div className="divide-y divide-slate-100">
          {loading && events.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Chargement des événements depuis Google Calendar...
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {searchQuery ? 'Aucun résultat correspondant' : 'Aucun événement trouvé'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery
                    ? 'Essayez une autre recherche ou réinitialisez le filtre.'
                    : 'Créez un nouvel événement ou synchronisez les rendez-vous du cabinet ci-dessus.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Ajouter un Événement
                </button>
                {onNavigateAppointments && (
                  <button
                    onClick={onNavigateAppointments}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Voir Rendez-vous Cabinet
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isServidoxApt =
                event.summary.includes('[SERVI-DOX]') || (event.location && event.location.includes('SERVI-DOX'));

              return (
                <div
                  key={event.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 text-blue-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {event.start?.dateTime
                          ? new Date(event.start.dateTime).toLocaleDateString('fr-FR', { month: 'short' })
                          : 'JOUR'}
                      </span>
                      <span className="text-xl font-extrabold leading-none font-mono">
                        {event.start?.dateTime
                          ? new Date(event.start.dateTime).getDate()
                          : event.start?.date?.split('-')[2] || '--'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{event.summary}</h4>
                        {isServidoxApt && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                            SERVI-DOX
                          </span>
                        )}
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateDisplay(event)}</span>
                        </span>
                      </div>

                      {event.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{event.location}</span>
                        </p>
                      )}

                      {event.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 whitespace-pre-line font-mono text-[11px]">
                          {event.description}
                        </p>
                      )}

                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-600">
                            Invité : {event.attendees.map((a) => a.email).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                        title="Ouvrir dans Google Calendar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(event)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Modifier cet événement"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRequestDelete(event)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Supprimer définitivement de Google Calendar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Create or Edit Calendar Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingEvent ? "Modifier l'Événement" : 'Nouvel Événement Google Calendar'}
                  </h3>
                  <p className="text-xs text-slate-500">Agenda principal du Cabinet SERVI-DOX</p>
                </div>
              </div>

              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titre du Rendez-vous / Événement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="ex: RDV Consultation SARL - Client X"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heure Début <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heure Fin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lieu du rendez-vous
                </label>
                <input
                  type="text"
                  value={modalLocation}
                  onChange={(e) => setModalLocation(e.target.value)}
                  placeholder="Cabinet SERVI-DOX, Bab Ezzouar, Alger"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email du Client / Invité (Optionnel)
                </label>
                <input
                  type="email"
                  value={modalAttendee}
                  onChange={(e) => setModalAttendee(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Une invitation Google Calendar sera envoyée automatiquement à cette adresse.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Consignes
                </label>
                <textarea
                  rows={3}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Précisions sur les documents à fournir, motif du dossier..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {savingEvent ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>{editingEvent ? 'Mettre à jour' : 'Ajouter au Calendrier'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Explicit User Confirmation Dialog for Destructive & Mutating Operations */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.description}</p>
            </div>

            {confirmModal.impactDetails && confirmModal.impactDetails.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                {confirmModal.impactDetails.map((detail, idx) => (
                  <div key={idx} className="font-mono">
                    {detail}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const act = confirmModal.action;
                  setConfirmModal((prev) => ({ ...prev, open: false }));
                  await act();
                }}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmer l'opération
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
