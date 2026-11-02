/**
 * Service d'intégration Google Calendar API v3 officiel pour SERVI-DOX
 * Gère la synchronisation bidirectionnelle des rendez-vous et agendas du cabinet.
 */

import { Appointment } from '../types/appointment';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  creator?: {
    email?: string;
    displayName?: string;
  };
}

export interface CreateCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  startIso: string;
  endIso: string;
  attendeeEmail?: string;
}

export const CALENDAR_STORAGE_KEY = 'servidox_google_calendar_cached_events_v1';

/**
 * Récupère les événements depuis l'API Google Calendar v3
 */
export async function fetchCalendarEvents(
  token: string,
  timeMin?: string,
  maxResults: number = 50
): Promise<CalendarEvent[]> {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');

  if (timeMin) {
    url.searchParams.set('timeMin', timeMin);
  } else {
    // Par défaut : depuis le début du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    url.searchParams.set('timeMin', startOfMonth.toISOString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Google Calendar (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const items: CalendarEvent[] = (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || '(Sans titre)',
    description: item.description || '',
    location: item.location || '',
    htmlLink: item.htmlLink || '',
    status: item.status || 'confirmed',
    start: item.start || {},
    end: item.end || {},
    attendees: item.attendees || [],
    creator: item.creator || {},
  }));

  // Sauvegarder dans le cache local
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Erreur mise en cache locale calendrier:', e);
  }

  return items;
}

/**
 * Crée un nouvel événement sur le calendrier principal de l'utilisateur
 */
export async function createGoogleCalendarEvent(
  token: string,
  payload: CreateCalendarEventPayload
): Promise<CalendarEvent> {
  const body: any = {
    summary: payload.summary,
    description: payload.description,
    location: payload.location,
    start: {
      dateTime: payload.startIso,
      timeZone: 'Africa/Algiers',
    },
    end: {
      dateTime: payload.endIso,
      timeZone: 'Africa/Algiers',
    },
  };

  if (payload.attendeeEmail && payload.attendeeEmail.includes('@')) {
    body.attendees = [{ email: payload.attendeeEmail.trim() }];
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Échec de création de l'événement Calendar (${response.status}): ${errorText}`);
  }

  const created = await response.json();
  return created;
}

/**
 * Met à jour un événement existant dans Google Calendar
 */
export async function updateGoogleCalendarEvent(
  token: string,
  eventId: string,
  payload: Partial<CreateCalendarEventPayload>
): Promise<CalendarEvent> {
  const body: any = {};
  if (payload.summary !== undefined) body.summary = payload.summary;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.location !== undefined) body.location = payload.location;
  if (payload.startIso) {
    body.start = { dateTime: payload.startIso, timeZone: 'Africa/Algiers' };
  }
  if (payload.endIso) {
    body.end = { dateTime: payload.endIso, timeZone: 'Africa/Algiers' };
  }
  if (payload.attendeeEmail) {
    body.attendees = [{ email: payload.attendeeEmail }];
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Échec de modification de l'événement (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Supprime un événement de Google Calendar
 */
export async function deleteGoogleCalendarEvent(token: string, eventId: string): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const errorText = await response.text();
    throw new Error(`Échec de suppression de l'événement (${response.status}): ${errorText}`);
  }
}

/**
 * Convertit un rendez-vous SERVI-DOX en événement Google Calendar et l'enregistre
 */
export async function exportAppointmentToCalendar(
  token: string,
  appointment: Appointment
): Promise<CalendarEvent> {
  // Formatage de la date et de l'heure
  // appointment.date format: "YYYY-MM-DD"
  // appointment.heure format: "HH:mm" ou "09h30" ou "14:00"
  let formattedTime = appointment.heure.replace('h', ':').trim();
  if (formattedTime.length === 4) {
    formattedTime = '0' + formattedTime;
  }
  if (!formattedTime.includes(':')) {
    formattedTime = `${formattedTime}:00`;
  }

  const [hours, minutes] = formattedTime.split(':').map(Number);
  const [year, month, day] = appointment.date.split('-').map(Number);

  const startDate = new Date(year, month - 1, day, hours || 9, minutes || 0, 0);
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000); // Durée 45 minutes

  const summary = `[SERVI-DOX] RDV : ${appointment.prenom} ${appointment.nom} (${appointment.motif})`;
  const description = [
    `Rendez-vous client officiel - Cabinet SERVI-DOX`,
    `------------------------------------------------`,
    `Référence : ${appointment.id}`,
    `Client : ${appointment.prenom} ${appointment.nom}`,
    `Téléphone : ${appointment.telephone}`,
    `Email : ${appointment.email || 'Non renseigné'}`,
    `Motif du rendez-vous : ${appointment.motif}`,
    `Statut interne : ${appointment.statut}`,
    `Remarques : ${appointment.remarque || 'Aucune consigne particulière'}`,
    `------------------------------------------------`,
    `Lieu : Cabinet SERVI-DOX - Bab Ezzouar, Alger`,
    `Contact Cabinet : +213 799 67 92 43 / +213 550 23 45 67`,
  ].join('\n');

  return await createGoogleCalendarEvent(token, {
    summary,
    description,
    location: 'SERVI-DOX Cabinet, Bab Ezzouar, Alger, Algérie',
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    attendeeEmail: appointment.email,
  });
}
