import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, ClientActivityLog, StatutDossier, TypeDossier } from '../types/client';
import { INITIAL_CLIENTS, INITIAL_LOGS, SAMPLE_CLIENTS } from '../data/mockClients';
import { useAuth } from './AuthContext';
import {
  subscribeToClients,
  persistClientToFirestore,
  updateClientInFirestore,
  deleteClientFromFirestore,
  subscribeToActivityLogs,
  persistActivityLogInFirestore,
} from '../services/firestoreSync';

interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface ClientDraft {
  nom: string;
  prenom: string;
  dateInscription: string;
  adresse: string;
  ville: string;
  codePostal: string;
  email: string;
  contact: string;
  typeDossier: TypeDossier;
  precisionAutre?: string;
  motifDossier: string;
  statut: StatutDossier;
  montantTotal: number;
  montantEncaisse: number;
  montantReste: number;
  notes?: string;
}

interface ClientContextType {
  clients: Client[];
  logs: ClientActivityLog[];
  toasts: ToastInfo[];
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: ToastInfo['type']) => void;
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => boolean;
  updateClientStatut: (id: string, newStatut: StatutDossier) => boolean;
  deleteClient: (id: string) => boolean;
  clearAllClients: () => void;
  loadSampleClients: () => void;
  getClientById: (id: string) => Client | undefined;
  resetToDemoData: () => void;
  exportCSV: () => void;
  lastUpdatedClientId: string | null;
  // Draft management for unadded client information
  clientDraft: ClientDraft | null;
  saveDraft: (draft: ClientDraft) => void;
  clearDraft: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

// Bumped storage keys to v3 so the user starts with a completely blank / virgin client list
const CLIENTS_STORAGE_KEY = 'servidox_clients_data_v3';
const LOGS_STORAGE_KEY = 'servidox_logs_data_v3';
const DRAFT_STORAGE_KEY = 'servidox_client_unadded_draft_v3';

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [lastUpdatedClientId, setLastUpdatedClientId] = useState<string | null>(null);

  // Clean, virgin list by default
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_CLIENTS; // empty []
  });

  const [logs, setLogs] = useState<ClientActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_LOGS;
  });

  const [clientDraft, setClientDraft] = useState<ClientDraft | null>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  }, [logs]);

  // Synchronisation en temps réel avec Cloud Firestore (multi-ordinateurs)
  useEffect(() => {
    let hasReconciled = false;

    const unsubscribeClients = subscribeToClients((remoteClients) => {
      if (!hasReconciled) {
        hasReconciled = true;
        if (remoteClients && remoteClients.length > 0) {
          setClients(remoteClients);
        } else {
          // Si le Cloud est vierge mais que la machine locale possède des clients existants, les téléverser
          try {
            const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
            if (saved) {
              const parsed: Client[] = JSON.parse(saved);
              if (parsed && parsed.length > 0) {
                console.info(`Synchronisation de ${parsed.length} client(s) locaux vers Firestore...`);
                parsed.forEach((c) => persistClientToFirestore(c));
              }
            }
          } catch (e) {
            console.error('Erreur téléversement initial clients:', e);
          }
        }
      } else {
        setClients(remoteClients || []);
      }
    });

    let logsReconciled = false;
    const unsubscribeLogs = subscribeToActivityLogs((remoteLogs) => {
      if (!logsReconciled) {
        logsReconciled = true;
        if (remoteLogs && remoteLogs.length > 0) {
          setLogs(remoteLogs);
        } else {
          try {
            const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
            if (savedLogs) {
              const parsed: ClientActivityLog[] = JSON.parse(savedLogs);
              if (parsed && parsed.length > 0) {
                parsed.forEach((l) => persistActivityLogInFirestore(l));
              }
            }
          } catch (e) {
            console.error('Erreur téléversement initial logs:', e);
          }
        }
      } else {
        setLogs(remoteLogs || []);
      }
    });

    return () => {
      unsubscribeClients();
      unsubscribeLogs();
    };
  }, []);

  const saveDraft = (draft: ClientDraft) => {
    setClientDraft(draft);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error(e);
    }
  };

  const clearDraft = () => {
    setClientDraft(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    showToast('Formulaire effacé', 'Les renseignements du client non encore ajouté ont été effacés avec succès.', 'info');
  };

  const showToast = (title: string, message: string, type: ToastInfo['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client => {
    const now = new Date().toISOString();
    const newId = `cli-${Date.now().toString().slice(-5)}`;
    const newClient: Client = {
      ...clientData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setClients((prev) => [newClient, ...prev]);

    // Clear draft once added
    setClientDraft(null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);

    const authorName = user?.name || 'Gestionnaire SERVIDOX';
    const newLog: ClientActivityLog = {
      id: `log-${Date.now()}`,
      clientId: newId,
      clientName: `${newClient.nom} ${newClient.prenom}`,
      action: 'creation',
      details: `Nouveau dossier [${newClient.typeDossier}] ajouté : ${newClient.motifDossier}`,
      timestamp: now,
      author: authorName,
    };
    setLogs((prev) => [newLog, ...prev]);

    // Persistance Cloud Firestore
    persistClientToFirestore(newClient);
    persistActivityLogInFirestore(newLog);

    setLastUpdatedClientId(newId);
    showToast('Client enregistré', `Le dossier de ${newClient.nom} ${newClient.prenom} (${newClient.typeDossier}) a été créé.`);

    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>): boolean => {
    let clientName = '';
    const now = new Date().toISOString();

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates, updatedAt: now };
          clientName = `${updated.nom} ${updated.prenom}`;
          return updated;
        }
        return c;
      })
    );

    setLastUpdatedClientId(id);

    const authorName = user?.name || 'Gestionnaire SERVIDOX';
    const newLog: ClientActivityLog = {
      id: `log-${Date.now()}`,
      clientId: id,
      clientName: clientName || 'Client',
      action: 'modification',
      details: `Mise à jour en temps réel des données du dossier`,
      timestamp: now,
      author: authorName,
    };
    setLogs((prev) => [newLog, ...prev]);

    // Persistance Cloud Firestore
    updateClientInFirestore(id, { ...updates, updatedAt: now });
    persistActivityLogInFirestore(newLog);

    showToast('Données synchronisées', `Modifications en direct enregistrées pour ${clientName || 'le client'}.`, 'info');

    setTimeout(() => {
      setLastUpdatedClientId((curr) => (curr === id ? null : curr));
    }, 2500);

    return true;
  };

  const updateClientStatut = (id: string, newStatut: StatutDossier): boolean => {
    const client = clients.find((c) => c.id === id);
    if (!client) return false;

    if (client.statut === newStatut) return true;

    const now = new Date().toISOString();
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, statut: newStatut, updatedAt: now } : c))
    );

    setLastUpdatedClientId(id);

    const authorName = user?.name || 'Gestionnaire SERVIDOX';
    const newLog: ClientActivityLog = {
      id: `log-${Date.now()}`,
      clientId: id,
      clientName: `${client.nom} ${client.prenom}`,
      action: 'changement_statut',
      details: `Statut modifié : ${client.statut} → ${newStatut}`,
      timestamp: now,
      author: authorName,
    };
    setLogs((prev) => [newLog, ...prev]);

    // Persistance Cloud Firestore
    updateClientInFirestore(id, { statut: newStatut, updatedAt: now });
    persistActivityLogInFirestore(newLog);

    showToast('Statut mis à jour', `Le dossier de ${client.nom} ${client.prenom} est maintenant "${newStatut}".`);

    setTimeout(() => {
      setLastUpdatedClientId((curr) => (curr === id ? null : curr));
    }, 2500);

    return true;
  };

  const deleteClient = (id: string): boolean => {
    const client = clients.find((c) => c.id === id);
    if (!client) return false;

    setClients((prev) => prev.filter((c) => c.id !== id));

    const authorName = user?.name || 'Gestionnaire SERVIDOX';
    const newLog: ClientActivityLog = {
      id: `log-${Date.now()}`,
      clientId: id,
      clientName: `${client.nom} ${client.prenom}`,
      action: 'suppression',
      details: `Suppression du dossier ${client.typeDossier} (${client.motifDossier})`,
      timestamp: new Date().toISOString(),
      author: authorName,
    };
    setLogs((prev) => [newLog, ...prev]);

    // Persistance Cloud Firestore
    deleteClientFromFirestore(id);
    persistActivityLogInFirestore(newLog);

    showToast('Client supprimé', `Le dossier de ${client.nom} ${client.prenom} a été supprimé.`, 'warning');
    return true;
  };

  const clearAllClients = () => {
    const clientsToDelete = [...clients];
    setClients([]);
    setLogs([]);
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    // Propager la suppression vers Cloud Firestore
    clientsToDelete.forEach((c) => {
      deleteClientFromFirestore(c.id).catch(() => {});
    });
    showToast('Liste vierge', 'La liste des clients est maintenant entièrement vierge.', 'info');
  };

  const loadSampleClients = () => {
    setClients(SAMPLE_CLIENTS);
    SAMPLE_CLIENTS.forEach((c) => {
      persistClientToFirestore(c);
    });
    showToast('Exemples chargés', `${SAMPLE_CLIENTS.length} dossiers de démonstration ont été ajoutés.`);
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);

  const resetToDemoData = () => {
    clearAllClients();
  };

  const exportCSV = () => {
    if (clients.length === 0) {
      showToast('Export impossible', 'Aucun dossier client à exporter (liste vierge).', 'error');
      return;
    }

    const headers = [
      'ID Dossier',
      'Nom',
      'Prénom',
      'Date d\'inscription',
      'Adresse',
      'Code Postal',
      'Ville',
      'Email',
      'Contact Téléphonique',
      'Type de Dossier',
      'Précision Autre',
      'Motif du Dossier',
      'Statut Dossier',
      'Montant Total (DA)',
      'Montant Encaissé (DA)',
      'Reste à Payer (DA)',
      'Date Enregistrement',
    ];

    const rows = clients.map((c) => [
      c.id,
      `"${c.nom.replace(/"/g, '""')}"`,
      `"${c.prenom.replace(/"/g, '""')}"`,
      c.dateInscription,
      `"${c.adresse.replace(/"/g, '""')}"`,
      `"${c.codePostal.replace(/"/g, '""')}"`,
      `"${c.ville.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.contact.replace(/"/g, '""')}"`,
      `"${c.typeDossier.replace(/"/g, '""')}"`,
      `"${(c.precisionAutre || '').replace(/"/g, '""')}"`,
      `"${c.motifDossier.replace(/"/g, '""')}"`,
      c.statut,
      c.montantTotal || 0,
      c.montantEncaisse || 0,
      c.montantReste || 0,
      c.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SERVIDOX_dossiers_clients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exportation effectuée', `${clients.length} dossiers clients exportés avec succès.`);
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        logs,
        toasts,
        dismissToast,
        showToast,
        addClient,
        updateClient,
        updateClientStatut,
        deleteClient,
        clearAllClients,
        loadSampleClients,
        getClientById,
        resetToDemoData,
        exportCSV,
        lastUpdatedClientId,
        clientDraft,
        saveDraft,
        clearDraft,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};
