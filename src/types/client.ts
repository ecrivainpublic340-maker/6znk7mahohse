export type TypeDossier =
  | 'Entreprise'
  | 'RC'
  | 'Auto-entrepreneur'
  | 'Inscription & Suivi (Bureau)'
  | 'Inscription & Suivi (Hors Wilaya)'
  | 'Autre dossier';

export const TARIFS_SERVIDOX_DA: Record<TypeDossier, number> = {
  'Entreprise': 100000, // Création d'entreprise SARL / EURL : 100 000 DA (Frais SERVI-DOX hors frais de dossier)
  'RC': 50000, // Registre du Commerce (RC) : 50 000 DA (Frais SERVI-DOX hors frais de dossier)
  'Auto-entrepreneur': 40000, // Auto-entrepreneur : 40 000 DA (Frais SERVI-DOX hors frais de dossier)
  'Inscription & Suivi (Bureau)': 12000, // Inscription et suivi au bureau : 12 000 DA
  'Inscription & Suivi (Hors Wilaya)': 15000, // Clients Hors Wilaya (Inscription et suivi) : 15 000 DA
  'Autre dossier': 20000,
};

export const DOSSIER_TARIF_LABELS: Record<TypeDossier, { label: string; tarifDA: number; description: string }> = {
  'Entreprise': {
    label: 'Création Entreprise (SARL / EURL)',
    tarifDA: 100000,
    description: 'Frais SERVI-DOX : 100 000 DA (Hors frais de dossier)',
  },
  'RC': {
    label: 'Registre du Commerce (RC)',
    tarifDA: 50000,
    description: 'Frais SERVI-DOX : 50 000 DA (Hors frais de dossier)',
  },
  'Auto-entrepreneur': {
    label: 'Auto-entrepreneur',
    tarifDA: 40000,
    description: 'Frais SERVI-DOX : 40 000 DA (Hors frais de dossier)',
  },
  'Inscription & Suivi (Bureau)': {
    label: 'Inscription & Suivi (Bureau)',
    tarifDA: 12000,
    description: 'Frais SERVI-DOX : 12 000 DA (Au bureau)',
  },
  'Inscription & Suivi (Hors Wilaya)': {
    label: 'Inscription & Suivi (Hors Wilaya)',
    tarifDA: 15000,
    description: 'Frais SERVI-DOX : 15 000 DA (Client Hors Wilaya)',
  },
  'Autre dossier': {
    label: 'Autre dossier',
    tarifDA: 20000,
    description: 'Tarif personnalisé (Frais SERVI-DOX en DA)',
  },
};

export type StatutDossier = 'En cours' | 'Validé' | 'En attente' | 'Clôturé';

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  dateInscription: string; // YYYY-MM-DD
  adresse: string;
  ville: string;
  codePostal: string;
  email: string;
  contact: string; // Téléphone direct
  typeDossier: TypeDossier;
  precisionAutre?: string;
  motifDossier: string;
  statut: StatutDossier;
  // Montants en Dinars Algériens (DA) - Frais SERVI-DOX (hors frais de dossier)
  montantTotal: number; // Frais SERVI-DOX du dossier en DA
  montantEncaisse: number; // Montant encaissé en DA
  montantReste: number; // Montant reste à payer en DA
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientActivityLog {
  id: string;
  clientId: string;
  clientName: string;
  action: 'creation' | 'modification' | 'changement_statut' | 'suppression';
  details: string;
  timestamp: string;
  author: string;
}

export type AccountApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Administrateur' | 'Employé' | 'Gestionnaire Dossiers' | 'Conseiller Client';
  jobTitle?: string;
  accountStatus?: AccountApprovalStatus;
  avatarInitials: string;
  registeredAt?: string;
  phone?: string;
  cabinetName?: string;
  address?: string;
  authProvider?: 'local' | 'gmail';
}

export type StatutEmploye = 'Actif' | 'En congé' | 'En mission' | 'Inactif';

export type DepartementEmploye =
  | 'Direction & Administration'
  | 'Dossiers RC & Entreprises'
  | 'Auto-entrepreneur'
  | 'Comptabilité & Finance'
  | 'Accueil & Relation Client';

export type ContratEmploye = 'CDI' | 'CDD' | 'Stage / Formation' | 'Consultant';

export interface Employee {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  departement: DepartementEmploye;
  dateRecrutement: string; // YYYY-MM-DD
  joursTravail: string; // ex: Dimanche - Jeudi
  heuresTravail: string; // ex: 08h30 - 16h30
  typeContrat: ContratEmploye;
  statut: StatutEmploye;
  email: string;
  contact: string; // Téléphone & WhatsApp
  adresse: string;
  salaireMensuel: number; // en DA
  profilBio: string; // Profil, compétences, responsabilités
  createdAt: string;
  updatedAt: string;
}

