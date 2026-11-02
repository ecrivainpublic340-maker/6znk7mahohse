import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Client, ClientActivityLog, Employee } from '../types/client';
import { AutoEntrepreneurDossier } from '../types/autoEntrepreneur';
import { RegisteredUserRecord } from '../context/AuthContext';
import { Appointment } from '../types/appointment';
import { getDeletedAppointmentIds, markAppointmentAsDeleted } from './appointmentService';

/**
 * Service de synchronisation bidirectionnelle Firestore en temps réel pour SERVI-DOX CRM
 */

const DELETED_CLIENTS_KEY = 'servidox_deleted_clients_v1';
const DELETED_LOGS_KEY = 'servidox_deleted_logs_v1';
const DELETED_AE_KEY = 'servidox_deleted_ae_v1';

function getDeletedIds(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // Ignore
  }
  return new Set();
}

function markIdAsDeleted(storageKey: string, id: string): void {
  if (!id) return;
  try {
    const set = getDeletedIds(storageKey);
    set.add(id);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore
  }
}

function unmarkIdAsDeleted(storageKey: string, id: string): void {
  if (!id) return;
  try {
    const set = getDeletedIds(storageKey);
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
    }
  } catch {
    // Ignore
  }
}

/**
 * Supprime les propriétés ayant la valeur `undefined` avant écriture dans Firestore
 * (évite FirebaseError: Unsupported field value: undefined)
 */
function sanitizeForFirestore<T extends Record<string, any>>(data: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

export function getDeletedClientIds(): Set<string> {
  return getDeletedIds(DELETED_CLIENTS_KEY);
}

// --- CLIENTS ---
export function subscribeToClients(
  onSuccess: (clients: Client[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'clients');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const deletedIds = getDeletedIds(DELETED_CLIENTS_KEY);
      const items: Client[] = [];
      snapshot.forEach((docSnap) => {
        const c = docSnap.data() as Client;
        if (!c || !c.id) return;
        if (deletedIds.has(c.id)) {
          deleteDoc(doc(db, 'clients', c.id)).catch(() => {});
          return;
        }
        items.push(c);
      });
      // Trier par date décroissante
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onSuccess(items);
    },
    (error) => {
      console.warn('Erreur écoute Firestore clients:', error);
      if (onError) onError(error);
    }
  );
}

export async function persistClientToFirestore(client: Client): Promise<void> {
  unmarkIdAsDeleted(DELETED_CLIENTS_KEY, client.id);
  const path = `clients/${client.id}`;
  try {
    const docRef = doc(db, 'clients', client.id);
    await setDoc(docRef, sanitizeForFirestore(client), { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function updateClientInFirestore(id: string, updates: Partial<Client>): Promise<void> {
  const path = `clients/${id}`;
  try {
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteClientFromFirestore(id: string): Promise<void> {
  markIdAsDeleted(DELETED_CLIENTS_KEY, id);
  const path = `clients/${id}`;
  try {
    const docRef = doc(db, 'clients', id);
    await deleteDoc(docRef);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

// --- ACTIVITY LOGS ---
export function subscribeToActivityLogs(
  onSuccess: (logs: ClientActivityLog[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'activityLogs');
  const q = query(colRef, limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const deletedLogIds = getDeletedIds(DELETED_LOGS_KEY);
      const items: ClientActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        const l = docSnap.data() as ClientActivityLog;
        if (!l || !l.id) return;
        if (deletedLogIds.has(l.id)) {
          deleteDoc(doc(db, 'activityLogs', l.id)).catch(() => {});
          return;
        }
        items.push(l);
      });
      items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      onSuccess(items);
    },
    (error) => {
      console.warn('Erreur écoute Firestore activityLogs:', error);
      if (onError) onError(error);
    }
  );
}

export async function persistActivityLogInFirestore(log: ClientActivityLog): Promise<void> {
  const path = `activityLogs/${log.id}`;
  try {
    const docRef = doc(db, 'activityLogs', log.id);
    await setDoc(docRef, sanitizeForFirestore(log), { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.CREATE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteActivityLogFromFirestore(id: string): Promise<void> {
  markIdAsDeleted(DELETED_LOGS_KEY, id);
  const path = `activityLogs/${id}`;
  try {
    const docRef = doc(db, 'activityLogs', id);
    await deleteDoc(docRef);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function clearActivityLogsFromFirestore(logIds: string[]): Promise<void> {
  for (const id of logIds) {
    markIdAsDeleted(DELETED_LOGS_KEY, id);
    deleteActivityLogFromFirestore(id).catch(() => {});
  }
}

// --- AUTO-ENTREPRENEURS ---
export function subscribeToAutoEntrepreneurs(
  onSuccess: (dossiers: AutoEntrepreneurDossier[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'autoEntrepreneurs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const deletedAeIds = getDeletedIds(DELETED_AE_KEY);
      const items: AutoEntrepreneurDossier[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as AutoEntrepreneurDossier;
        if (!d || !d.id) return;
        if (deletedAeIds.has(d.id)) {
          deleteDoc(doc(db, 'autoEntrepreneurs', d.id)).catch(() => {});
          return;
        }
        items.push(d);
      });
      items.sort(
        (a, b) =>
          new Date(b.dateCreation || b.updatedAt || 0).getTime() -
          new Date(a.dateCreation || a.updatedAt || 0).getTime()
      );
      onSuccess(items);
    },
    (error) => {
      console.warn('Erreur écoute Firestore autoEntrepreneurs:', error);
      if (onError) onError(error);
    }
  );
}

export async function persistAutoEntrepreneurToFirestore(dossier: AutoEntrepreneurDossier): Promise<void> {
  unmarkIdAsDeleted(DELETED_AE_KEY, dossier.id);
  const path = `autoEntrepreneurs/${dossier.id}`;
  try {
    const docRef = doc(db, 'autoEntrepreneurs', dossier.id);
    await setDoc(docRef, sanitizeForFirestore(dossier), { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteAutoEntrepreneurFromFirestore(id: string): Promise<void> {
  markIdAsDeleted(DELETED_AE_KEY, id);
  const path = `autoEntrepreneurs/${id}`;
  try {
    const docRef = doc(db, 'autoEntrepreneurs', id);
    await deleteDoc(docRef);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

// --- EMPLOYEES ---
export function subscribeToEmployees(
  onSuccess: (employees: Employee[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'employees');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Employee[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Employee);
      });
      items.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      onSuccess(items);
    },
    (error) => {
      console.warn('Erreur écoute Firestore employees:', error);
      if (onError) onError(error);
    }
  );
}

export async function persistEmployeeToFirestore(employee: Employee): Promise<void> {
  const path = `employees/${employee.id}`;
  try {
    const docRef = doc(db, 'employees', employee.id);
    await setDoc(docRef, sanitizeForFirestore(employee), { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteEmployeeFromFirestore(id: string): Promise<void> {
  const path = `employees/${id}`;
  try {
    const docRef = doc(db, 'employees', id);
    await deleteDoc(docRef);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

// --- USERS REGISTRY ---
export function subscribeToUsersRegistry(
  onSuccess: (users: RegisteredUserRecord[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: RegisteredUserRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as RegisteredUserRecord);
      });
      onSuccess(items);
    },
    (error) => {
      console.warn('Erreur écoute Firestore users:', error);
      if (onError) onError(error);
    }
  );
}

export async function persistUserToFirestore(userRecord: RegisteredUserRecord): Promise<void> {
  const path = `users/${userRecord.id}`;
  try {
    const docRef = doc(db, 'users', userRecord.id);
    await setDoc(docRef, sanitizeForFirestore(userRecord), { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

// --- APPOINTMENTS / RENDEZ-VOUS ---
export function subscribeToAppointments(
  onSuccess: (appointments: Appointment[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'appointments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const deletedIds = getDeletedAppointmentIds();
      const items: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const apt = docSnap.data() as Appointment;
        if (!apt || !apt.id) return;
        
        // Si l'élément a été supprimé localement, on ne l'affiche pas
        // et on s'assure qu'il est purgé de Firestore s'il y subsiste
        if (deletedIds.has(apt.id)) {
          deleteDoc(doc(db, 'appointments', apt.id)).catch(() => {});
          return;
        }

        items.push(apt);
      });
      // Trier par date puis heure
      items.sort((a, b) => {
        const dateDiff = new Date(`${b.date}T${b.heure || '00:00'}`).getTime() - new Date(`${a.date}T${a.heure || '00:00'}`).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      onSuccess(items);
    },
    (error) => {
      console.warn('Erreur écoute Firestore appointments:', error);
      if (onError) onError(error);
    }
  );
}

export async function persistAppointmentToFirestore(appointment: Appointment): Promise<void> {
  const path = `appointments/${appointment.id}`;
  try {
    const docRef = doc(db, 'appointments', appointment.id);
    await setDoc(docRef, sanitizeForFirestore(appointment), { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function updateAppointmentInFirestore(id: string, updates: Partial<Appointment>): Promise<void> {
  const path = `appointments/${id}`;
  try {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<void> {
  // Enregistrer immédiatement dans la liste des RDV supprimés
  markAppointmentAsDeleted(id);
  const path = `appointments/${id}`;
  try {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

