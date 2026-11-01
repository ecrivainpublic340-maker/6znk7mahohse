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

/**
 * Service de synchronisation bidirectionnelle Firestore en temps réel pour SERVI-DOX CRM
 */

// --- CLIENTS ---
export function subscribeToClients(
  onSuccess: (clients: Client[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'clients');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Client[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Client);
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
  const path = `clients/${client.id}`;
  try {
    const docRef = doc(db, 'clients', client.id);
    await setDoc(docRef, client, { merge: true });
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
    await updateDoc(docRef, updates);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteClientFromFirestore(id: string): Promise<void> {
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
      const items: ClientActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ClientActivityLog);
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
    await setDoc(docRef, log, { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.CREATE, path);
    } catch {
      // Préserver la résilience UI
    }
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
      const items: AutoEntrepreneurDossier[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AutoEntrepreneurDossier);
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
  const path = `autoEntrepreneurs/${dossier.id}`;
  try {
    const docRef = doc(db, 'autoEntrepreneurs', dossier.id);
    await setDoc(docRef, dossier, { merge: true });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteAutoEntrepreneurFromFirestore(id: string): Promise<void> {
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
    await setDoc(docRef, employee, { merge: true });
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
    await setDoc(docRef, userRecord, { merge: true });
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
      const items: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Appointment);
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
    await setDoc(docRef, appointment, { merge: true });
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
    await updateDoc(docRef, updates);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } catch {
      // Préserver la résilience UI
    }
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<void> {
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
