export type TypeSuiviAE =
  | 'hors_wilaya' // Suivi hors wilaya (15 000 DA)
  | 'bureau' // Inscription et suivi dans le bureau (12 000 DA)
  | 'prise_en_charge'; // Prise en charge de dossier (40 000 DA)

export type EtatInscriptionAE =
  | 'inscrit' // Inscrit (Validation ANAE confirmée)
  | 'en_cours' // En cours d'inscription
  | 'carte_recue' // Carte Auto-entrepreneur reçue
  | 'bloque'; // Bloqué / Documents à compléter

export type EtatCasnosAE =
  | 'pret_a_payer' // Prêt à payer
  | 'non_paye' // Non payé
  | 'paye' // Payé (Quittance reçue)
  | 'non_inscrit'; // Non inscrit CASNOS

export type EtatImpotAE =
  | 'depose' // Déposé
  | 'pret_a_deposer' // Prêt à déposer
  | 'non_depose'; // Non déposé

export type EtatCompteBancaireAE =
  | 'pret' // Prêt (Compte ouvert & RIB disponible)
  | 'non_pret' // Pas prêt (Non entamé ou en cours)
  | 'en_cours'; // En cours d'ouverture à la banque

export type EtatAutorisationGeneraleAE =
  | 'prete' // Prête (Légalisée & Validée)
  | 'non_prete' // Pas prête (En attente)
  | 'en_cours'; // En cours de légalisation APC

export type EtatGriffeAE =
  | 'prete' // Prête (Cachet gravé et disponible)
  | 'non_prete' // Pas prête (Non commandée)
  | 'en_confection'; // En cours de confection / gravure

export interface AutoEntrepreneurDossier {
  id: string; // ex: AE-2026-001
  clientId?: string; // ID client SERVI-DOX si relié
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  wilaya: string; // ex: '16 - Alger', '31 - Oran'
  commune?: string;
  activiteMetier: string; // ex: 'Développeur Web & Mobile', 'Designer Graphique', 'Consultant'
  numeroANAE?: string; // ex: 'AE-16-003892'
  dateCreation: string; // YYYY-MM-DD

  // Prestation / Offre
  typeSuivi: TypeSuiviAE;

  // Les 6 piliers administratifs spécifiés par le client :
  etatInscription: EtatInscriptionAE;
  etatCasnos: EtatCasnosAE;
  etatImpot: EtatImpotAE;
  etatCompteBancaire: EtatCompteBancaireAE;
  banqueChoisie?: string; // BNA, CPA, BEA, BADR, BDL, CNEP, Al Baraka
  ribBancaire?: string;
  etatAutorisationGenerale: EtatAutorisationGeneraleAE;
  etatGriffe: EtatGriffeAE;

  // Tarification de l'offre en DA
  tarifServidoxDA: number;
  montantEncaisseDA: number;
  montantResteDA: number;

  notes?: string;
  updatedAt: string;
}

export const TARIFS_OFFRE_AE: Record<TypeSuiviAE, { label: string; tarifDA: number; badgeColor: string }> = {
  hors_wilaya: {
    label: 'Suivi Hors Wilaya',
    tarifDA: 15000,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  bureau: {
    label: 'Inscription & Suivi (Bureau)',
    tarifDA: 12000,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  prise_en_charge: {
    label: 'Prise en charge de dossier',
    tarifDA: 40000,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

export const BANQUES_ALGERIE = [
  'BNA (Banque Nationale d\'Algérie)',
  'CPA (Crédit Populaire d\'Algérie)',
  'BEA (Banque Extérieure d\'Algérie)',
  'BDL (Banque de Développement Local)',
  'BADR (Banque de l\'Agriculture et du Développement Rural)',
  'CNEP-Banque',
  'Al Baraka Bank Algérie',
  'Gulf Bank Algérie (AGB)',
  'Natixis Algérie',
  'Société Générale Algérie',
  'Arab Banking Corporation (ABC)',
  'Autre banque / CCP',
];
