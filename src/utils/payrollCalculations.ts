/**
 * Algorithmes de calcul de la paie selon la législation algérienne du travail
 * et barème officiel de l'IRG (Impôt sur le Revenu Global).
 */

import { PayslipMonthlyRecord } from '../types/payroll';
import { Employee } from '../types/client';

export const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

/**
 * Calcul de l'IRG mensuel selon le barème progressif de la Loi de Finances Algérienne :
 * Tranches d'imposition :
 * - De 0 à 20 000 DA : 0%
 * - De 20 001 à 40 000 DA : 23%
 * - De 40 001 à 80 000 DA : 27%
 * - De 80 001 à 160 000 DA : 30%
 * - De 160 001 à 320 000 DA : 33%
 * - Supérieur à 320 000 DA : 35%
 *
 * Exonération & Abattements légaux :
 * - Salaire imposable <= 30 000 DA : Exonération totale (IRG = 0 DA)
 * - Abattement général de 40% sur l'impôt brut (minimum 1 000 DA, maximum 1 500 DA)
 * - Pour salaires compris entre 30 000 et 35 000 DA : Formule d'abattement complémentaire
 */
export function calculateAlgerianIRG(salaireImposable: number): number {
  if (salaireImposable <= 30000) {
    return 0;
  }

  // Calcul par tranches
  let impotBrut = 0;

  // Tranche 1 : 0 à 20 000 DA (0%) -> 0
  // Tranche 2 : 20 001 à 40 000 DA (23%)
  if (salaireImposable > 20000) {
    const assietteT2 = Math.min(salaireImposable, 40000) - 20000;
    impotBrut += assietteT2 * 0.23;
  }

  // Tranche 3 : 40 001 à 80 000 DA (27%)
  if (salaireImposable > 40000) {
    const assietteT3 = Math.min(salaireImposable, 80000) - 40000;
    impotBrut += assietteT3 * 0.27;
  }

  // Tranche 4 : 80 001 à 160 000 DA (30%)
  if (salaireImposable > 80000) {
    const assietteT4 = Math.min(salaireImposable, 160000) - 80000;
    impotBrut += assietteT4 * 0.3;
  }

  // Tranche 5 : 160 001 à 320 000 DA (33%)
  if (salaireImposable > 160000) {
    const assietteT5 = Math.min(salaireImposable, 320000) - 160000;
    impotBrut += assietteT5 * 0.33;
  }

  // Tranche 6 : > 320 000 DA (35%)
  if (salaireImposable > 320000) {
    const assietteT6 = salaireImposable - 320000;
    impotBrut += assietteT6 * 0.35;
  }

  // Abattement général de 40% (avec min 1000 DA et max 1500 DA)
  let abattement = impotBrut * 0.4;
  if (abattement < 1000) abattement = 1000;
  if (abattement > 1500) abattement = 1500;

  let impotNet = Math.max(0, impotBrut - abattement);

  // Lissage pour les salaires compris entre 30 001 DA et 35 000 DA (Règle loi de finances)
  if (salaireImposable > 30000 && salaireImposable <= 35000) {
    const coefficientLissage = (salaireImposable - 30000) / 5000;
    impotNet = impotNet * coefficientLissage;
  }

  // Arrondi au Dinar le plus proche
  return Math.round(impotNet);
}

/**
 * Calcul d'un bulletin de paie complet pour un employé et un mois donné
 */
export function generatePayslip(params: {
  employee: Employee;
  mois: number;
  annee: number;
  primePanier?: number;
  primeTransport?: number;
  primeRendement?: number;
  primeResponsabilite?: number;
  heuresSupplementaires?: number;
  heuresSuppTauxHoraire?: number;
  autresPrimes?: number;
  avancesAcomptes?: number;
  autresRetenues?: number;
  modePaiement?: 'Virement Bancaire' | 'CCP' | 'Chèque' | 'Espèces';
  referencePaiement?: string;
  joursTravailles?: number;
  joursConges?: number;
  joursAbsence?: number;
}): PayslipMonthlyRecord {
  const {
    employee,
    mois,
    annee,
    primePanier = 4500, // Forfait panier usuel en Algérie (non cotisable ou exonéré selon barème, généralement inclus dans gains)
    primeTransport = 3500, // Forfait transport
    primeRendement = 0,
    primeResponsabilite = 0,
    heuresSupplementaires = 0,
    heuresSuppTauxHoraire = 0,
    autresPrimes = 0,
    avancesAcomptes = 0,
    autresRetenues = 0,
    modePaiement = 'Virement Bancaire',
    referencePaiement = 'VIR-SDX-' + annee + '-' + String(mois).padStart(2, '0'),
    joursTravailles = 22,
    joursConges = 0,
    joursAbsence = 0,
  } = params;

  const base = employee.salaireMensuel && employee.salaireMensuel > 0 ? employee.salaireMensuel : 40000;
  const heuresSuppMontant = Math.round(heuresSupplementaires * heuresSuppTauxHoraire);

  // Total Gains & Brut
  const salaireBrut = Math.round(
    base +
      primePanier +
      primeTransport +
      primeRendement +
      primeResponsabilite +
      heuresSuppMontant +
      autresPrimes
  );

  // Cotisation CNAS Salarié : 9% sur l'assiette cotisable
  const cotisableCnas = salaireBrut;
  const cnasSalarieTaux = 9;
  const cnasSalarieMontant = Math.round(cotisableCnas * 0.09);

  // Cotisation CNAS Patronale : 26%
  const cnasPatronaleTaux = 26;
  const cnasPatronaleMontant = Math.round(cotisableCnas * 0.26);
  const coutTotalEmployeur = salaireBrut + cnasPatronaleMontant;

  // Salaire Imposable
  const salaireImposable = Math.max(0, salaireBrut - cnasSalarieMontant);

  // Retenue IRG
  const retenueIrg = calculateAlgerianIRG(salaireImposable);

  // Retenues totales
  const totalRetenues = cnasSalarieMontant + retenueIrg + avancesAcomptes + autresRetenues;

  // Salaire Net
  const salaireNet = Math.max(0, salaireBrut - totalRetenues);
  const salaireNetLettres = numberToFrenchWordsDA(salaireNet);

  return {
    id: `PAY-${employee.id}-${annee}-${String(mois).padStart(2, '0')}`,
    employeeId: employee.id,
    mois,
    annee,
    moisNom: MONTH_NAMES_FR[mois - 1] || `Mois ${mois}`,
    datePaiement: `${annee}-${String(mois).padStart(2, '0')}-28`,
    modePaiement,
    referencePaiement,
    joursTravailles,
    joursConges,
    joursAbsence,
    heuresSupplementaires,
    salaireBase: base,
    primePanier,
    primeTransport,
    primeRendement,
    primeResponsabilite,
    heuresSuppMontant,
    autresPrimes,
    salaireBrut,
    cotisableCnas,
    cnasSalarieTaux,
    cnasSalarieMontant,
    salaireImposable,
    retenueIrg,
    avancesAcomptes,
    autresRetenues,
    totalGains: salaireBrut,
    totalRetenues,
    salaireNet,
    salaireNetLettres,
    cnasPatronaleTaux,
    cnasPatronaleMontant,
    coutTotalEmployeur,
  };
}

/**
 * Convertit un nombre entier en Dinars Algériens en toutes lettres en français
 */
export function numberToFrenchWordsDA(montant: number): string {
  if (montant === 0) return 'Zéro Dinar Algérien';

  const unites = [
    '',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'dix-sept',
    'dix-huit',
    'dix-neuf',
  ];

  const dizaines = [
    '',
    'dix',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante-dix',
    'quatre-vingt',
    'quatre-vingt-dix',
  ];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n < 20) return unites[n];

    const c = Math.floor(n / 100);
    const r = n % 100;

    let res = '';
    if (c > 0) {
      if (c === 1) res += 'cent';
      else res += unites[c] + ' cent' + (r === 0 ? 's' : '');
    }

    if (r === 0) return res.trim();
    if (res !== '') res += ' ';

    if (r < 20) {
      res += unites[r];
    } else if (r >= 70 && r < 80) {
      const u = r - 60;
      res += 'soixante' + (u === 11 ? ' et onze' : '-' + unites[u]);
    } else if (r >= 90 && r < 100) {
      const u = r - 80;
      res += 'quatre-vingt' + (u === 0 ? 's' : '-' + unites[u]);
    } else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      if (u === 1 && d !== 8) {
        res += dizaines[d] + ' et un';
      } else if (u > 0) {
        res += dizaines[d] + '-' + unites[u];
      } else {
        res += dizaines[d] + (d === 8 ? 's' : '');
      }
    }

    return res.trim();
  }

  const millions = Math.floor(montant / 1000000);
  const milliers = Math.floor((montant % 1000000) / 1000);
  const reste = Math.floor(montant % 1000);

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push('un million');
    else parts.push(convertGroup(millions) + ' millions');
  }

  if (milliers > 0) {
    if (milliers === 1) parts.push('mille');
    else parts.push(convertGroup(milliers) + ' mille');
  }

  if (reste > 0) {
    parts.push(convertGroup(reste));
  }

  let finalStr = parts.join(' ').trim();
  // Capitaliser la première lettre
  if (finalStr.length > 0) {
    finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
  }

  return `${finalStr} Dinars Algériens et zéro centime`;
}
