import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, TypeDossier } from '../types/client';

const formatMontantPDF = (amount: number): string => {
  const num = Number(amount) || 0;
  return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA`;
};

const getTodayFormatted = (): string => {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Exporte une liste de clients (globale, filtrée, Inscription Bureau ou Hors Wilaya) au format PDF A4 Paysage
 */
export const exportClientsListPDF = (
  clients: Client[],
  options?: {
    title?: string;
    subtitle?: string;
    filenamePrefix?: string;
  }
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const title = options?.title || 'LISTE OFFICIELLE DES DOSSIERS CLIENTS — SERVI-DOX';
  const subtitle =
    options?.subtitle ||
    'Calcul exclusif des Frais SERVI-DOX (Hors frais de dossier) en Dinars Algériens (DA)';
  const filenamePrefix = options?.filenamePrefix || 'SERVI-DOX_Liste_Clients';

  // Calcul des totaux (Frais SERVI-DOX hors frais de dossier)
  const totalFacture = clients.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
  const totalEncaisse = clients.reduce((acc, c) => acc + (c.montantEncaisse || 0), 0);
  const totalReste = clients.reduce(
    (acc, c) =>
      acc +
      (c.montantReste !== undefined
        ? c.montantReste
        : Math.max(0, (c.montantTotal || 0) - (c.montantEncaisse || 0))),
    0
  );

  // Bandeau d'en-tête SERVI-DOX
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 297, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SERVI-DOX  |  GESTION ADMINISTRATIVE & FINANCIÈRE', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(title, 14, 18.5);
  doc.text(subtitle, 14, 23.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Édité le : ${getTodayFormatted()}`, 283, 12, { align: 'right' });
  doc.text(`Domaine : servidox.pro`, 283, 18, { align: 'right' });

  // Cartes de synthèse financière (Frais SERVI-DOX hors frais de dossier)
  const cardY = 33;
  const cardHeight = 16;

  // Carte 1: Nombre de dossiers
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, cardY, 62, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NOMBRE DE DOSSIERS', 18, cardY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${clients.length} Dossier(s)`, 18, cardY + 13);

  // Carte 2: Total Frais SERVI-DOX
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(81, cardY, 66, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(29, 78, 216);
  doc.text('TOTAL FRAIS SERVI-DOX (HORS DOSSIER)', 85, cardY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMontantPDF(totalFacture), 85, cardY + 13);

  // Carte 3: Total Encaissé
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(152, cardY, 64, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL ENCAISSÉ (PERÇU)', 156, cardY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMontantPDF(totalEncaisse), 156, cardY + 13);

  // Carte 4: Reste à payer
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(221, cardY, 62, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text('RESTE À RECOUVRER', 225, cardY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMontantPDF(totalReste), 225, cardY + 13);

  // Tableau des clients
  const tableRows = clients.map((c, idx) => {
    const reste =
      c.montantReste !== undefined
        ? c.montantReste
        : Math.max(0, (c.montantTotal || 0) - (c.montantEncaisse || 0));
    return [
      `${idx + 1}`,
      `${c.nom.toUpperCase()} ${c.prenom}`,
      c.dateInscription || '—',
      c.ville || 'Alger',
      c.contact || '—',
      c.typeDossier,
      c.motifDossier || '—',
      c.statut,
      formatMontantPDF(c.montantTotal || 0),
      formatMontantPDF(c.montantEncaisse || 0),
      reste === 0 ? 'Soldé (0 DA)' : formatMontantPDF(reste),
    ];
  });

  autoTable(doc, {
    startY: 54,
    head: [
      [
        'N°',
        'Client (Nom & Prénom)',
        'Inscription',
        'Wilaya',
        'Téléphone',
        'Type de Dossier',
        'Motif / Prestation',
        'Statut',
        'Frais SERVI-DOX',
        'Encaissé',
        'Reste à Payer',
      ],
    ],
    body: tableRows,
    foot: [
      [
        '',
        'TOTAL GÉNÉRAL FRAIS SERVI-DOX',
        `${clients.length} client(s)`,
        '',
        '',
        '',
        '',
        '',
        formatMontantPDF(totalFacture),
        formatMontantPDF(totalEncaisse),
        formatMontantPDF(totalReste),
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [30, 64, 175], // Blue-800
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 34, fontStyle: 'bold' },
      2: { cellWidth: 21, halign: 'center' },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 38 },
      6: { cellWidth: 44 },
      7: { cellWidth: 19, halign: 'center' },
      8: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      9: { cellWidth: 24, halign: 'right' },
      10: { cellWidth: 24, halign: 'right' },
    },
  });

  // Pied de page officiel
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Barème Officiel Frais SERVI-DOX (Hors frais de dossier) : SARL/EURL 100 000 DA | RC 50 000 DA | Auto-entrepreneur 40 000 DA | Suivi Bureau 12 000 DA | Hors Wilaya 15 000 DA',
      14,
      203
    );
    doc.text(`Page ${i} / ${pageCount}`, 283, 203, { align: 'right' });
  }

  const dateSlug = new Date().toISOString().split('T')[0];
  doc.save(`${filenamePrefix}_${dateSlug}.pdf`);
};

/**
 * Exporte la fiche individuelle & reçu financier d'un client au format PDF A4 Portrait
 */
export const exportSingleClientPDF = (client: Client) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const reste =
    client.montantReste !== undefined
      ? client.montantReste
      : Math.max(0, (client.montantTotal || 0) - (client.montantEncaisse || 0));

  // Bandeau supérieur
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SERVI-DOX — FICHE DOSSIER & REÇU CLIENT', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Référence Dossier : ${client.id.toUpperCase()}`, 14, 21);
  doc.text(`Édité le : ${getTodayFormatted()}  |  servidox.pro`, 14, 27);

  // Informations identité et coordonnées
  autoTable(doc, {
    startY: 40,
    head: [['1. IDENTITÉ & COORDONNÉES DU CLIENT', 'DÉTAILS ENREGISTRÉS']],
    body: [
      ['Nom & Prénom du Client', `${client.nom.toUpperCase()} ${client.prenom}`],
      ['Date d\'inscription', client.dateInscription || '—'],
      ['Téléphone / WhatsApp', client.contact || '—'],
      ['Adresse E-mail', client.email || '—'],
      ['Wilaya / Ville', `${client.ville || 'Alger'} (${client.codePostal || '16000'})`],
      ['Adresse Postale', client.adresse || '—'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 117 },
    },
  });

  const afterIdentityY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Qualification et règlement financier (Frais SERVI-DOX hors frais de dossier)
  autoTable(doc, {
    startY: afterIdentityY,
    head: [['2. QUALIFICATION DU DOSSIER & FRAIS SERVI-DOX (HORS FRAIS DE DOSSIER)', 'MONTANT / STATUT']],
    body: [
      [
        'Catégorie de Prestation',
        `${client.typeDossier}${client.precisionAutre ? ` (${client.precisionAutre})` : ''}`,
      ],
      ['Motif & Objet du Dossier', client.motifDossier || '—'],
      ['Statut de Traitement', client.statut],
      ['Frais SERVI-DOX (Hors frais de dossier)', formatMontantPDF(client.montantTotal || 0)],
      ['Montant Encaissé (Versé par le client)', formatMontantPDF(client.montantEncaisse || 0)],
      [
        'Reste à Payer (Solde restant dû)',
        reste === 0 ? 'DOSSIER SOLDÉ (0 DA)' : formatMontantPDF(reste),
      ],
      ['Notes & Observations', client.notes || 'Aucune note particulière.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 75, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 107 },
    },
  });

  const afterFinanceY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Zone Cachet et Signature
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, afterFinanceY, 85, 32, 2, 2, 'S');
  doc.roundedRect(111, afterFinanceY, 85, 32, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Signature du Client :', 18, afterFinanceY + 7);
  doc.text('Cachet & Signature SERVI-DOX :', 115, afterFinanceY + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'NB : Les montants indiqués ci-dessus correspondent exclusivement aux frais de prestation SERVI-DOX (hors frais de dossier).',
    14,
    284
  );

  const safeName = `${client.nom}_${client.prenom}`.replace(/\s+/g, '_');
  doc.save(`SERVI-DOX_Fiche_${safeName}.pdf`);
};

/**
 * Exporte le Rapport Financier Complet (Hebdomadaire, Mensuel, Annuel et Répartition par Prestation) au format PDF
 */
export const exportFinancialReportPDF = (params: {
  selectedYear: number;
  globalFinancials: {
    week: { total: number; encaisse: number; reste: number; count: number };
    month: { total: number; encaisse: number; reste: number; count: number };
    year: { total: number; encaisse: number; reste: number; count: number };
    recoveryRate: number;
  };
  breakdownByType: Array<{
    type: TypeDossier;
    tarifOfficiel: number;
    count: number;
    total: number;
    encaisse: number;
    reste: number;
  }>;
  monthlyBreakdown: Array<{
    monthNumber: number;
    monthName: string;
    count: number;
    total: number;
    encaisse: number;
    reste: number;
  }>;
}) => {
  const { selectedYear, globalFinancials, breakdownByType, monthlyBreakdown } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // En-tête officiel
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`RAPPORT FINANCIER OFFICIEL SERVI-DOX — ANNÉE ${selectedYear}`, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Comptabilité des Frais SERVI-DOX (Hors frais de dossier) en Dinars Algériens (DA)',
    14,
    19
  );
  doc.text(`Édité le : ${getTodayFormatted()}  |  Domaine : servidox.pro`, 14, 25);

  // Section 1 : Synthèse Hebdomadaire, Mensuelle et Annuelle
  autoTable(doc, {
    startY: 36,
    head: [
      [
        'PÉRIODE COMPTABLE',
        'DOSSIERS',
        'TOTAL FRAIS SERVI-DOX',
        'TOTAL ENCAISSÉ (DA)',
        'RESTE À PAYER (DA)',
      ],
    ],
    body: [
      [
        'Revenus de la Semaine en cours',
        `${globalFinancials.week.count}`,
        formatMontantPDF(globalFinancials.week.total),
        formatMontantPDF(globalFinancials.week.encaisse),
        formatMontantPDF(globalFinancials.week.reste),
      ],
      [
        'Revenus du Mois en cours',
        `${globalFinancials.month.count}`,
        formatMontantPDF(globalFinancials.month.total),
        formatMontantPDF(globalFinancials.month.encaisse),
        formatMontantPDF(globalFinancials.month.reste),
      ],
      [
        `Bilan Annuel Global (${selectedYear})`,
        `${globalFinancials.year.count}`,
        formatMontantPDF(globalFinancials.year.total),
        formatMontantPDF(globalFinancials.year.encaisse),
        formatMontantPDF(globalFinancials.year.reste),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });

  const afterSummaryY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // Section 2 : Répartition par Type de Dossier (Barème Frais SERVI-DOX hors frais de dossier)
  autoTable(doc, {
    startY: afterSummaryY,
    head: [
      [
        'PRESTATION (HORS FRAIS DE DOSSIER)',
        'TARIF UNITAIRE',
        'DOSSIERS',
        'TOTAL FACTURÉ',
        'ENCAISSÉ',
        'RESTE DÛ',
      ],
    ],
    body: breakdownByType.map((b) => [
      b.type === 'Entreprise' ? 'Création Entreprise (SARL / EURL)' : b.type,
      formatMontantPDF(b.tarifOfficiel),
      `${b.count}`,
      formatMontantPDF(b.total),
      formatMontantPDF(b.encaisse),
      formatMontantPDF(b.reste),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  const afterTypeY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // Section 3 : Détail Mensuel (12 Mois)
  autoTable(doc, {
    startY: afterTypeY,
    head: [
      [
        `MOIS (${selectedYear})`,
        'DOSSIERS',
        'FRAIS SERVI-DOX (DA)',
        'MONTANT ENCAISSÉ (DA)',
        'RESTE À RECOUVRER (DA)',
        'TAUX PERÇU',
      ],
    ],
    body: monthlyBreakdown.map((m) => {
      const rate = m.total > 0 ? Math.round((m.encaisse / m.total) * 100) : 0;
      return [
        m.monthName,
        `${m.count}`,
        formatMontantPDF(m.total),
        formatMontantPDF(m.encaisse),
        formatMontantPDF(m.reste),
        m.total === 0 ? '—' : `${rate}%`,
      ];
    }),
    foot: [
      [
        `TOTAL ANNUEL ${selectedYear}`,
        `${globalFinancials.year.count}`,
        formatMontantPDF(globalFinancials.year.total),
        formatMontantPDF(globalFinancials.year.encaisse),
        formatMontantPDF(globalFinancials.year.reste),
        `${globalFinancials.recoveryRate}%`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' },
    },
  });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Document comptable généré par SERVI-DOX — Tous les montants sont calculés sur la base des Frais SERVI-DOX hors frais de dossier.',
    14,
    290
  );

  doc.save(`SERVI-DOX_Rapport_Financier_${selectedYear}.pdf`);
};
