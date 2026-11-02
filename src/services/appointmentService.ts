import { Appointment, MORNING_SLOTS, AFTERNOON_SLOTS } from '../types/appointment';
import { sendGmailMessage, getAccessToken } from './gmailService';
import { MASTER_ADMIN_EMAIL } from '../context/AuthContext';

export const APPOINTMENTS_STORAGE_KEY = 'servidox_appointments_v1';
export const APPOINTMENT_OUTBOX_KEY = 'servidox_appointment_emails_outbox_v1';
export const DELETED_APPOINTMENTS_KEY = 'servidox_deleted_appointments_v1';

/**
 * Récupère l'ensemble des identifiants de rendez-vous supprimés par l'utilisateur
 */
export function getDeletedAppointmentIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_APPOINTMENTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {
    console.error('Erreur lecture rendez-vous supprimés:', e);
  }
  return new Set();
}

/**
 * Enregistre un identifiant de rendez-vous comme définitivement supprimé (Tombstone)
 */
export function markAppointmentAsDeleted(id: string): void {
  if (!id) return;
  try {
    const ids = getDeletedAppointmentIds();
    ids.add(id);
    localStorage.setItem(DELETED_APPOINTMENTS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error('Erreur enregistrement suppression RDV:', e);
  }
}

/**
 * Retire un identifiant de la liste des supprimés (ex: lors de la création d'un nouveau RDV)
 */
export function unmarkAppointmentAsDeleted(id: string): void {
  if (!id) return;
  try {
    const ids = getDeletedAppointmentIds();
    if (ids.has(id)) {
      ids.delete(id);
      localStorage.setItem(DELETED_APPOINTMENTS_KEY, JSON.stringify(Array.from(ids)));
    }
  } catch (e) {
    console.error('Erreur retrait tombstone RDV:', e);
  }
}


/**
 * Valide une date et une heure de rendez-vous :
 * - Jours autorisés : Samedi à Jeudi (Vendredi fermé)
 * - Créneaux autorisés : 08h30-11h30 et 13h30-15h30
 */
export function validateAppointmentDateTime(dateStr: string, timeStr: string): { isValid: boolean; error?: string } {
  if (!dateStr) {
    return { isValid: false, error: 'Veuillez sélectionner une date.' };
  }
  if (!timeStr) {
    return { isValid: false, error: 'Veuillez choisir un créneau horaire.' };
  }

  // Parse date
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    return { isValid: false, error: 'Format de date invalide.' };
  }

  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { isValid: false, error: 'La date choisie ne peut pas être dans le passé.' };
  }

  // En JavaScript, getDay() renvoie : 0 = Dimanche, 1 = Lundi, ..., 5 = Vendredi, 6 = Samedi
  const dayOfWeek = selectedDate.getDay();
  if (dayOfWeek === 5) {
    return {
      isValid: false,
      error: 'Nos bureaux sont fermés le Vendredi. Les rendez-vous sont ouverts du Samedi au Jeudi.',
    };
  }

  // Vérification de l'heure
  const isMorning = MORNING_SLOTS.includes(timeStr);
  const isAfternoon = AFTERNOON_SLOTS.includes(timeStr);

  if (!isMorning && !isAfternoon) {
    return {
      isValid: false,
      error: 'Créneau non valide. Veuillez choisir entre 08h30-11h30 ou 13h30-15h30.',
    };
  }

  return { isValid: true };
}

/**
 * Envoie un email de notification à l'administrateur et au client
 */
export async function sendAppointmentNotificationEmail(
  appointment: Appointment
): Promise<{ success: boolean; adminNotified: boolean; clientNotified: boolean; error?: string }> {
  const adminEmail = MASTER_ADMIN_EMAIL;
  let adminNotified = false;
  let clientNotified = false;

  const subject = `[SERVI-DOX] Nouveau Rendez-vous : ${appointment.nom} ${appointment.prenom} (${appointment.date} à ${appointment.heure})`;
  const bodyAdmin = `
==================================================
NOUVEAU RENDEZ-VOUS ENREGISTRÉ - SERVI-DOX ALGER
==================================================

RÉFÉRENCE : ${appointment.id}
DATE : ${appointment.date} (Du Samedi au Jeudi)
HEURE DU CRÉNEAU : ${appointment.heure}
MOTIF DU DOSSIER : ${appointment.motif}

COORDONNÉES DU CLIENT :
- Nom & Prénom : ${appointment.nom} ${appointment.prenom}
- Téléphone : ${appointment.telephone}
- Email : ${appointment.email || 'Non renseigné'}
- Précisions / Remarques : ${appointment.remarque || 'Aucune précision complémentaire'}

STATUT ACTUEL : En attente de confirmation
ENREGISTRÉ LE : ${new Date(appointment.createdAt).toLocaleString('fr-FR')}

Ce rendez-vous est consultable directement dans votre espace de gestion interne :
Onglet "Rendez-vous" du menu latéral SERVI-DOX.
==================================================
  `.trim();

  try {
    const token = await getAccessToken();
    if (token) {
      // 1. Notification par email à l'administrateur
      await sendGmailMessage(adminEmail, subject, bodyAdmin);
      adminNotified = true;

      // 2. Email de confirmation automatique au client si une adresse a été fournie
      if (appointment.email && appointment.email.includes('@')) {
        const clientSubject = `Confirmation de votre demande de rendez-vous - SERVI-DOX Algérie`;
        const bodyClient = `
Bonjour ${appointment.prenom} ${appointment.nom},

Nous avons bien reçu votre demande de rendez-vous auprès du cabinet SERVI-DOX :

- Réf : ${appointment.id}
- Date : ${appointment.date}
- Heure : ${appointment.heure}
- Motif : ${appointment.motif}

Notre secrétariat vérifie vos coordonnées et vous contactera au ${appointment.telephone} pour confirmer définitivement votre créneau.

Adresse du cabinet :
SERVI-DOX - Conseil Juridique, Création d'Entreprises & Domiciliation
Bab Ezzouar, Alger - Algérie
Téléphone : +213 799 67 92 43 / +213 550 23 45 67

Cordialement,
L'équipe SERVI-DOX Algérie
        `.trim();

        try {
          await sendGmailMessage(appointment.email, clientSubject, bodyClient);
          clientNotified = true;
        } catch (e) {
          console.warn('Notification client optionnelle non délivrée:', e);
        }
      }
    } else {
      // Si l'utilisateur n'est pas encore connecté à l'API Google dans sa session courante,
      // on enregistre la demande dans la boîte d'envoi locale pour traçabilité
      queueEmailNotification(appointment);
    }
  } catch (error) {
    console.warn('Erreur envoi notification Gmail directe:', error);
    queueEmailNotification(appointment);
  }

  return {
    success: true,
    adminNotified,
    clientNotified,
  };
}

/**
 * File d'attente d'envoi local si le token n'est pas actif à l'instant t
 */
function queueEmailNotification(appointment: Appointment) {
  try {
    const raw = localStorage.getItem(APPOINTMENT_OUTBOX_KEY);
    const outbox = raw ? JSON.parse(raw) : [];
    outbox.push({
      appointment,
      queuedAt: new Date().toISOString(),
    });
    localStorage.setItem(APPOINTMENT_OUTBOX_KEY, JSON.stringify(outbox));
  } catch (err) {
    console.error('Erreur file d\'attente notifications:', err);
  }
}
