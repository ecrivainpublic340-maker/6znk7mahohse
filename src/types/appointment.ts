export type StatutRendezVous = 'en_attente' | 'confirme' | 'termine' | 'annule';

export interface Appointment {
  id: string; // ex: RDV-2026-001
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  date: string; // YYYY-MM-DD
  heure: string; // '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:30', '14:00', '14:30', '15:00'
  motif: string;
  remarque?: string;
  statut: StatutRendezVous;
  notificationVue?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const APPOINTMENT_DAYS_LABEL = 'Samedi au Jeudi (Fermé le Vendredi)';

export const MORNING_SLOTS = [
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
];

export const AFTERNOON_SLOTS = [
  '13:30',
  '14:00',
  '14:30',
  '15:00',
];

export const ALL_TIME_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

export const MOTIFS_RENDEZ_VOUS = [
  {
    id: 'creation_entreprise',
    title: "Création d'Entreprise & RC (SARL, EURL, SPA)",
    category: 'Entreprise & Registre de Commerce',
  },
  {
    id: 'auto_entrepreneur',
    title: 'Création Auto-Entrepreneur (Carte ANAE & CASNOS)',
    category: 'Auto-Entrepreneur',
  },
  {
    id: 'domiciliation',
    title: 'Domiciliation Commerciale (Formule 6 mois ou 1 an)',
    category: 'Domiciliation',
  },
  {
    id: 'casnos_cnas',
    title: 'Dossier CASNOS & CNAS (Affiliation & Cotisation)',
    category: 'Sécurité Sociale',
  },
  {
    id: 'impots_g50',
    title: 'Déclarations Fiscales & Impôts (G50 / Bilan IFU)',
    category: 'Fiscalité & Comptabilité',
  },
  {
    id: 'accompagnement_admin',
    title: 'Accompagnement Administratif & Formalités Générales',
    category: 'Démarches Administratives',
  },
  {
    id: 'coworking',
    title: 'Espace Coworking Équipé & Salles de Réunion',
    category: 'Espace de Travail',
  },
  {
    id: 'langues',
    title: 'École de Langues Étrangères (Anglais, Français, Espagnol)',
    category: 'Formation',
  },
  {
    id: 'marketing_ecommerce',
    title: 'Stratégies Marketing & E-Commerce',
    category: 'Digital & Vente',
  },
  {
    id: 'developpement_commercial',
    title: 'Formation & Développement Commercial B2B',
    category: 'Coaching Vente',
  },
  {
    id: 'autre_formalite',
    title: 'Autre Formalité / Consultation Spécifique',
    category: 'Consultation Personnalisée',
  },
];
