export interface EmployerInfo {
  raisonSociale: string;
  nomCommercial: string;
  activite: string;
  adresse: string;
  wilaya: string;
  telephone: string;
  email: string;
  siteWeb: string;
  nif: string;
  nis: string;
  rc: string;
  numeroCnas: string;
  banqueRib: string;
  gerant: string;
}

export const DEFAULT_SERVIDOX_EMPLOYER: EmployerInfo = {
  raisonSociale: 'SARL SERVI-DOX CONSULTING & GESTION',
  nomCommercial: 'SERVI-DOX',
  activite: "Bureau d'Affaires & Assistance Administrative aux Entreprises",
  adresse: '04 Rue des Frères Bouadou, Bir Mourad Raïs',
  wilaya: 'Alger, Algérie',
  telephone: '+213 (0) 550 23 45 67',
  email: 'contact@servidox.pro',
  siteWeb: 'https://servidox.pro',
  nif: '002016098765432',
  nis: '198716010045231',
  rc: '16/00-0984321B20',
  numeroCnas: '16-89452109-77',
  banqueRib: 'BNA 001 00234 0300123456 89',
  gerant: 'Directeur Général SERVI-DOX',
};

export interface PayrollRubric {
  code: string;
  designation: string;
  base: number;
  taux?: number;
  gain?: number;
  retenue?: number;
}

export interface PayslipMonthlyRecord {
  id: string;
  employeeId: string;
  mois: number; // 1 to 12
  annee: number;
  moisNom: string;
  datePaiement: string;
  modePaiement: 'Virement Bancaire' | 'CCP' | 'Chèque' | 'Espèces';
  referencePaiement?: string;
  
  // Paramètres du mois
  joursTravailles: number;
  joursConges: number;
  joursAbsence: number;
  heuresSupplementaires: number;

  // Rubriques Gains
  salaireBase: number;
  primePanier: number; // Indemnité de panier
  primeTransport: number; // Indemnité de transport
  primeRendement: number; // Prime de rendement/assiduité
  primeResponsabilite: number;
  heuresSuppMontant: number;
  autresPrimes: number;

  // Totaux calculés
  salaireBrut: number;
  cotisableCnas: number;
  cnasSalarieTaux: number; // 9%
  cnasSalarieMontant: number; // Brut * 9%
  salaireImposable: number; // Brut - CNAS 9%
  retenueIrg: number; // IRG Barème officiel algérien
  avancesAcomptes: number;
  autresRetenues: number;
  
  totalGains: number;
  totalRetenues: number;
  salaireNet: number; // Net à payer en DA
  salaireNetLettres: string;

  // Cotisations Patronales (pour information légale)
  cnasPatronaleTaux: number; // 26%
  cnasPatronaleMontant: number;
  coutTotalEmployeur: number; // Brut + CNAS Patronale
}

export interface AnnualPayrollSummary {
  employeeId: string;
  annee: number;
  moisCount: number;
  totalSalaireBase: number;
  totalPrimesIndemnites: number;
  totalSalaireBrut: number;
  totalCnasSalarie: number;
  totalSalaireImposable: number;
  totalIrg: number;
  totalAvances: number;
  totalSalaireNet: number;
  totalCnasPatronale: number;
  totalCoutEmployeur: number;
  monthlyDetails: PayslipMonthlyRecord[];
}
