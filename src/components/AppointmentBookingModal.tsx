import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Send,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  Appointment,
  MOTIFS_RENDEZ_VOUS,
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  APPOINTMENT_DAYS_LABEL,
} from '../types/appointment';
import {
  validateAppointmentDateTime,
  sendAppointmentNotificationEmail,
  APPOINTMENTS_STORAGE_KEY,
} from '../services/appointmentService';
import { persistAppointmentToFirestore } from '../services/firestoreSync';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMotif?: string;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  defaultMotif,
}) => {
  // Form state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [motif, setMotif] = useState(defaultMotif || MOTIFS_RENDEZ_VOUS[0].title);
  const [remarque, setRemarque] = useState('');

  // Date state: tomorrow by default or closest valid day
  const getInitialDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    // If tomorrow is Friday (5), skip to Saturday
    if (d.getDay() === 5) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getInitialDate());
  const [heure, setHeure] = useState('09:00');

  // Submission & UI feedback state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAppointment, setSuccessAppointment] = useState<Appointment | null>(null);

  if (!isOpen) return null;

  // Compute minimum selectable date (today)
  const minDate = new Date().toISOString().split('T')[0];

  const handleDateChange = (newDateStr: string) => {
    setDate(newDateStr);
    setErrorMessage(null);

    // Instant validation for Friday
    const [y, m, d] = newDateStr.split('-').map(Number);
    if (y && m && d) {
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      if (dayOfWeek === 5) {
        setErrorMessage('Attention : Nos bureaux sont fermés le Vendredi. Les rendez-vous sont ouverts du Samedi au Jeudi.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nom.trim() || !prenom.trim()) {
      setErrorMessage('Veuillez renseigner votre nom et votre prénom.');
      return;
    }
    if (!telephone.trim()) {
      setErrorMessage('Veuillez renseigner votre numéro de téléphone (obligatoire pour confirmation).');
      return;
    }

    const validation = validateAppointmentDateTime(date, heure);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Date ou heure invalide.');
      return;
    }

    setSubmitting(true);

    try {
      const now = new Date().toISOString();
      const uniqueNum = Math.floor(100 + Math.random() * 900);
      const appointmentId = `RDV-${new Date().getFullYear()}-${uniqueNum}`;

      const newAppointment: Appointment = {
        id: appointmentId,
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        date,
        heure,
        motif,
        remarque: remarque.trim(),
        statut: 'en_attente',
        notificationVue: false,
        createdAt: now,
        updatedAt: now,
      };

      // 1. Sauvegarder dans le cache local
      try {
        const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(newAppointment);
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        console.error('Erreur sauvegarde locale rdv:', err);
      }

      // 2. Persister dans Cloud Firestore (collection appointments)
      await persistAppointmentToFirestore(newAppointment);

      // 3. Envoyer la notification par email (zinemoh106@gmail.com + confirmation client)
      await sendAppointmentNotificationEmail(newAppointment);

      setSuccessAppointment(newAppointment);
    } catch (err: any) {
      console.error('Erreur lors de la réservation:', err);
      setErrorMessage('Une erreur est survenue lors de la réservation. Veuillez réessayer ou contacter directement le cabinet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessAppointment(null);
    setNom('');
    setPrenom('');
    setTelephone('');
    setEmail('');
    setRemarque('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleResetAndClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8">
          <button
            onClick={handleResetAndClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-100 border border-blue-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Prise de Rendez-vous en Ligne
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              {APPOINTMENT_DAYS_LABEL}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Réserver un Créneau SERVI-DOX
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-blue-100/90 max-w-lg">
            Choisissez votre motif, sélectionnez votre date et heure de passage. Votre demande est instantanément transmise à notre secrétariat.
          </p>
        </div>

        {/* Content Body */}
        {successAppointment ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                Demande de Rendez-vous Enregistrée !
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Votre créneau a été transmis à la direction de <strong>SERVI-DOX Algérie</strong> et une notification e-mail a été envoyée.
              </p>
            </div>

            {/* Recap Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Référence dossier</span>
                <span className="font-mono font-bold text-blue-700">{successAppointment.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Client</span>
                <span className="font-semibold text-slate-900">
                  {successAppointment.prenom} {successAppointment.nom}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Date retenue</span>
                <span className="font-semibold text-slate-900">{successAppointment.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Créneau horaire</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {successAppointment.heure}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Motif</span>
                <span className="font-medium text-slate-900 truncate max-w-[200px]" title={successAppointment.motif}>
                  {successAppointment.motif}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Téléphone</span>
                <span className="font-semibold text-slate-900">{successAppointment.telephone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={`https://wa.me/213799679243?text=${encodeURIComponent(
                  `Bonjour SERVI-DOX, je viens de réserver le rendez-vous ${successAppointment.id} pour le ${successAppointment.date} à ${successAppointment.heure} (Motif: ${successAppointment.motif}). Merci de me confirmer mon créneau.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
              >
                Confirmer aussi sur WhatsApp
              </a>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* 1. Coordonnées */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                1. Vos Coordonnées
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="ex: BENALI"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
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
                    placeholder="ex: Karim"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="0550 12 34 56"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Pour confirmation)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Motif du Rendez-vous (issu du menu latéral SERVI-DOX) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                2. Motif du Rendez-vous (Prestations SERVI-DOX)
              </label>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              >
                {MOTIFS_RENDEZ_VOUS.map((m) => (
                  <option key={m.id} value={m.title}>
                    [{m.category}] — {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Choix de la Date & Créneaux Horaires */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  3. Date & Heure Souhaitée
                </h4>
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200">
                  Fermé le Vendredi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date du RDV <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium text-slate-800 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Samedi à Jeudi uniquement</p>
                </div>

                {/* Slots selection */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Sélectionnez un créneau horaire :
                  </label>

                  {/* Matinée: 08h30 - 11h30 */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" /> Matinée (08h30 - 11h30)
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MORNING_SLOTS.map((slot) => {
                        const isSelected = heure === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setHeure(slot)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Après-midi: 13h30 - 15h30 */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" /> Après-midi (13h30 - 15h30)
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AFTERNOON_SLOTS.map((slot) => {
                        const isSelected = heure === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setHeure(slot)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Précision complémentaire */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarque ou document apporté (facultatif)
              </label>
              <textarea
                rows={2}
                value={remarque}
                onChange={(e) => setRemarque(e.target.value)}
                placeholder="ex: Je souhaite créer une SARL dans l'import-export et domicilier mon siège social."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <>Enregistrement en cours...</>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Valider mon Rendez-vous
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
