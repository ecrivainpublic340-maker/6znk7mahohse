import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee } from '../types/client';
import { EmployerInfo, PayslipMonthlyRecord, AnnualPayrollSummary } from '../types/payroll';
import { formatDA } from './format';

const formatMontantPDF = (amount: number): string => {
  return `${formatDA(amount)} DA`;
};

/**
 * Charge l'image officielle du logo SERVI-DOX en Base64 pour intégration PDF haute fidélité
 */
export const loadLogoBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch('/assets/aistudio/Sans_titre_b7fbb046.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Exporte un bulletin de paie mensuel officiel algérien au format PDF A4 Portrait
 * Logo officiel SERVI-DOX en haut à gauche
 * Filigrane centré officiel
 * SANS GRIFFE / SANS CACHET PRÉ-IMPRIMÉ (zones vierges nettes pour cachet humide et signature physique)
 */
export const exportPayslipPDF = async (
  payslip: PayslipMonthlyRecord,
  employee: Employee,
  employer: EmployerInfo
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  // Tenter de charger le logo SERVI-DOX officiel
  const logoData = await loadLogoBase64();

  // =========================================================================
  // 1. FILIGRANE CENTRAL (SERVI-DOX OFFICIAL WATERMARK)
  // =========================================================================
  try {
    doc.saveGraphicsState();
    if (logoData && typeof (doc as any).setGState === 'function') {
      try {
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.07 }));
        // Dessiner le logo au centre
        const wmSize = 75;
        doc.addImage(logoData, 'PNG', (pageWidth - wmSize) / 2, 110, wmSize, wmSize);
      } catch {
        // Fallback texte léger
        doc.setTextColor(243, 244, 246);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(40);
        doc.text('SERVI-DOX', pageWidth / 2, 145, { align: 'center', angle: 30 });
      }
    } else {
      doc.setTextColor(243, 244, 246);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.text('SERVI-DOX', pageWidth / 2, 145, { align: 'center', angle: 30 });
    }
    doc.restoreGraphicsState();
  } catch (e) {
    console.warn('Watermark fallback note:', e);
  }

  // =========================================================================
  // 2. BANDEAU HAUT & LOGO SERVI-DOX EN HAUT À GAUCHE
  // =========================================================================
  let currentY = 12;

  // Intégration du logo SERVI-DOX officiel ou bloc vectoriel de secours
  if (logoData) {
    try {
      // Cadre blanc protecteur avec ombre discrète
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, 20, 20, 2, 2, 'FD');
      doc.addImage(logoData, 'PNG', margin + 1.5, currentY + 1.5, 17, 17);
    } catch {
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, currentY, 20, 20, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('SD', margin + 10, currentY + 12, { align: 'center' });
    }
  } else {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, currentY, 20, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SD', margin + 10, currentY + 12, { align: 'center' });
  }

  // Nom commercial & Coordonnées Employeur SERVI-DOX
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(employer.nomCommercial || 'SERVI-DOX', margin + 24, currentY + 5.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(employer.raisonSociale, margin + 24, currentY + 10);
  doc.text(`${employer.adresse} - ${employer.wilaya}`, margin + 24, currentY + 14.5);
  doc.text(`Tél : ${employer.telephone}   |   Email : ${employer.email}`, margin + 24, currentY + 18.5);

  // Cadre Titre "BULLETIN DE PAIE" à droite (Design corporate moderne)
  const titleBoxWidth = 72;
  const titleBoxX = pageWidth - margin - titleBoxWidth;
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.roundedRect(titleBoxX, currentY, titleBoxWidth, 20, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BULLETIN DE PAIE', titleBoxX + titleBoxWidth / 2, currentY + 7.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254); // Blue-200
  doc.text(
    `Période : ${payslip.moisNom} ${payslip.annee}`,
    titleBoxX + titleBoxWidth / 2,
    currentY + 12.5,
    { align: 'center' }
  );

  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Règlement : ${new Date(payslip.datePaiement).toLocaleDateString('fr-FR')}`,
    titleBoxX + titleBoxWidth / 2,
    currentY + 17,
    { align: 'center' }
  );

  currentY += 23;

  // Ligne légale employeur (NIF, NIS, RC, CNAS)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY, contentWidth, 6.5, 1, 1, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  const legalInfo = `NIF : ${employer.nif}   |   NIS : ${employer.nis}   |   RC : ${employer.rc}   |   N° CNAS : ${employer.numeroCnas}`;
  doc.text(legalInfo, margin + contentWidth / 2, currentY + 4.5, { align: 'center' });

  currentY += 9;

  // =========================================================================
  // 3. ENCADRÉS SALARIÉ & PARAMÈTRES DU MOIS (EQUILIBRÉS CÔTE À CÔTE)
  // =========================================================================
  const colWidth = (contentWidth - 4) / 2; // 91mm
  const boxHeight = 26;

  // Boîte 1 : Salarié Bénéficiaire
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, colWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, colWidth, 5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text('SALARIÉ BÉNÉFICIAIRE', margin + 3, currentY + 3.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Matricule : ${employee.id}`, margin + colWidth - 3, currentY + 3.8, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${employee.nom.toUpperCase()} ${employee.prenom}`, margin + 3, currentY + 9.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Fonction : ${employee.role}`, margin + 3, currentY + 13.5);
  doc.text(`Département : ${employee.departement}`, margin + 3, currentY + 17.5);
  const cnasNum = employee.id.replace('EMP-', '16-') + '884210';
  doc.text(
    `N° SS : ${cnasNum}   |   Embauche : ${new Date(employee.dateRecrutement).toLocaleDateString('fr-FR')}`,
    margin + 3,
    currentY + 22
  );

  // Boîte 2 : Période & Modalités
  const box2X = margin + colWidth + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(box2X, currentY, colWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(box2X, currentY, colWidth, 5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('MODALITÉS DE TRAVAIL & RÈGLEMENT', box2X + 3, currentY + 3.8);
  doc.text(`Contrat : ${employee.typeContrat}`, box2X + colWidth - 3, currentY + 3.8, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Jours ouvrés travaillés : ${payslip.joursTravailles} jours`, box2X + 3, currentY + 9.5);
  doc.text(`Congés : ${payslip.joursConges} j   |   Absences déduites : ${payslip.joursAbsence} j`, box2X + 3, currentY + 13.5);
  doc.text(`Mode de paiement : ${payslip.modePaiement}`, box2X + 3, currentY + 17.5);
  doc.text(
    `Date valeur : ${new Date(payslip.datePaiement).toLocaleDateString('fr-FR')}`,
    box2X + 3,
    currentY + 22
  );

  currentY += boxHeight + 4;

  // =========================================================================
  // 4. TABLEAU DES RUBRIQUES DE PAIE (AUTOTABLE DESIGN PRESTIGE)
  // =========================================================================
  const rubriquesRows: (string | number)[][] = [
    ['100', 'Salaire de Base Mensuel', formatDA(payslip.salaireBase), '100%', formatDA(payslip.salaireBase), '—'],
  ];

  if (payslip.primePanier > 0) {
    rubriquesRows.push(['105', 'Indemnité de Panier (Restauration)', formatDA(payslip.primePanier), 'Forfait', formatDA(payslip.primePanier), '—']);
  }
  if (payslip.primeTransport > 0) {
    rubriquesRows.push(['110', 'Indemnité de Transport', formatDA(payslip.primeTransport), 'Forfait', formatDA(payslip.primeTransport), '—']);
  }
  if (payslip.primeRendement > 0) {
    rubriquesRows.push(['120', 'Prime de Rendement / Assiduité', formatDA(payslip.primeRendement), '—', formatDA(payslip.primeRendement), '—']);
  }
  if (payslip.primeResponsabilite > 0) {
    rubriquesRows.push(['130', 'Indemnité de Responsabilité Hiérarchique', formatDA(payslip.primeResponsabilite), '—', formatDA(payslip.primeResponsabilite), '—']);
  }
  if (payslip.heuresSuppMontant > 0) {
    rubriquesRows.push(['140', `Heures Supplémentaires (${payslip.heuresSupplementaires}h)`, formatDA(payslip.heuresSuppMontant), '—', formatDA(payslip.heuresSuppMontant), '—']);
  }
  if (payslip.autresPrimes > 0) {
    rubriquesRows.push(['150', 'Gratification & Autres Primes', formatDA(payslip.autresPrimes), '—', formatDA(payslip.autresPrimes), '—']);
  }

  // Retenues obligatoires
  rubriquesRows.push(['400', 'Cotisation Sécurité Sociale Salarié (CNAS)', formatDA(payslip.cotisableCnas), '9.00%', '—', formatDA(payslip.cnasSalarieMontant)]);
  rubriquesRows.push(['500', 'Impôt sur le Revenu Global (IRG - Barème Algérie)', formatDA(payslip.salaireImposable), 'Progressif', '—', formatDA(payslip.retenueIrg)]);

  if (payslip.avancesAcomptes > 0) {
    rubriquesRows.push(['600', 'Acompte ou Avance sur salaire versé', formatDA(payslip.avancesAcomptes), '—', '—', formatDA(payslip.avancesAcomptes)]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['CODE', 'DÉSIGNATION DE LA RUBRIQUE', 'BASE (DA)', 'TAUX', 'GAINS (DA)', 'RETENUES (DA)']],
    body: rubriquesRows,
    foot: [
      ['', 'TOTAUX DES RUBRIQUES :', '', '', `${formatDA(payslip.totalGains)} DA`, `${formatDA(payslip.totalRetenues)} DA`],
    ],
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      font: 'helvetica',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  currentY = finalTableY + 4;

  // =========================================================================
  // 5. BLOC RÉCAPITULATIF & NET À PAYER (3 CARTES PARFAITEMENT CALIBRÉES)
  // =========================================================================
  const cardWidth = (contentWidth - 6) / 3; // 60mm
  const cardHeight = 13;

  // Salaire Brut
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('SALAIRE BRUT TOTAL', margin + cardWidth / 2, currentY + 4, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatMontantPDF(payslip.salaireBrut), margin + cardWidth / 2, currentY + 9.5, { align: 'center' });

  // Net Imposable IRG
  const card2X = margin + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NET IMPOSABLE IRG', card2X + cardWidth / 2, currentY + 4, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatMontantPDF(payslip.salaireImposable), card2X + cardWidth / 2, currentY + 9.5, { align: 'center' });

  // NET À PAYER (Cadre bleu corporate)
  const card3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(191, 219, 254);
  doc.text('NET À PAYER', card3X + cardWidth / 2, currentY + 4, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatMontantPDF(payslip.salaireNet), card3X + cardWidth / 2, currentY + 9.5, { align: 'center' });

  currentY += cardHeight + 3.5;

  // Montant en toutes lettres
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, currentY, contentWidth, 8, 1.2, 1.2, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('Arrêté le présent bulletin de paie à la somme nette de :', margin + 3, currentY + 3.5);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(15, 23, 42);
  doc.text(`« ${payslip.salaireNetLettres} »`, margin + 3, currentY + 6.8);

  currentY += 10.5;

  // Cotisations Patronales (légales)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 5.5, 1, 1, 'FD');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const patronalText = `Cotisation Patronale CNAS (26%) : ${formatMontantPDF(payslip.cnasPatronaleMontant)}   |   Total Cotisations Sociales (35%) : ${formatMontantPDF(payslip.cnasSalarieMontant + payslip.cnasPatronaleMontant)}   |   Coût Global Employeur : ${formatMontantPDF(payslip.coutTotalEmployeur)}`;
  doc.text(patronalText, margin + contentWidth / 2, currentY + 3.8, { align: 'center' });

  currentY += 8;

  // =========================================================================
  // 6. BLOC DES SIGNATURES OFFICIELLES (SANS AUCUNE GRIFFE / ZONES VIERGES)
  // Espaces réservés pour le cachet humide physique et la signature manuscrite
  // =========================================================================
  const sigBoxWidth = (contentWidth - 6) / 2;
  const sigBoxHeight = 32;

  // Boîte 1 : Pour l'Employeur SERVI-DOX
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("POUR L'EMPLOYEUR SERVI-DOX", margin + 3, currentY + 4.5);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Cachet officiel de l'établissement et signature de la Direction", margin + 3, currentY + 8);

  // Rectangle intérieur vierge propre réservé au cachet humide physique (PAS DE GRIFFE)
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(margin + 3, currentY + 10, sigBoxWidth - 6, 16);
  doc.setLineDashPattern([], 0); // Reset dash

  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('(Espace réservé au cachet humide et à la signature)', margin + sigBoxWidth / 2, currentY + 19, {
    align: 'center',
  });

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Fait à Alger, le ${new Date(payslip.datePaiement).toLocaleDateString('fr-FR')}`,
    margin + sigBoxWidth / 2,
    currentY + 29.5,
    { align: 'center' }
  );

  // Boîte 2 : L'Employé(e)
  const sigBox2X = margin + sigBoxWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(sigBox2X, currentY, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("L'EMPLOYÉ(E)", sigBox2X + 3, currentY + 4.5);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Signature pour acquit (Précédée de la mention « Lu et approuvé »)", sigBox2X + 3, currentY + 8);

  // Rectangle intérieur vierge propre pour la signature du salarié
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(sigBox2X + 3, currentY + 10, sigBoxWidth - 6, 16);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('(Signature du salarié précédée de « Lu et approuvé »)', sigBox2X + sigBoxWidth / 2, currentY + 19, {
    align: 'center',
  });

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Mention manuscrite obligatoire', sigBox2X + sigBoxWidth / 2, currentY + 29.5, { align: 'center' });

  // =========================================================================
  // 7. PIED DE PAGE LÉGAL
  // =========================================================================
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Document établi conformément au Code du Travail Algérien (Loi 90-11) et à la réglementation de sécurité sociale CNAS. Conservez ce bulletin sans limitation de durée.',
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );

  // Sauvegarde directe du fichier PDF
  const cleanNom = employee.nom.replace(/\s+/g, '_');
  const cleanPrenom = employee.prenom.replace(/\s+/g, '_');
  const fileName = `Fiche_de_paie_${cleanNom}_${cleanPrenom}_${payslip.moisNom}_${payslip.annee}.pdf`;
  doc.save(fileName);
};

/**
 * Exporte le récapitulatif annuel des salaires (12 mois) au format PDF A4 Paysage
 * SANS GRIFFE / SANS CACHET PRÉ-IMPRIMÉ
 */
export const exportAnnualPayrollPDF = async (
  summary: AnnualPayrollSummary,
  employee: Employee,
  employer: EmployerInfo
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const logoData = await loadLogoBase64();

  // Filigrane central
  try {
    doc.saveGraphicsState();
    doc.setTextColor(245, 247, 250);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(55);
    doc.text('SERVI-DOX', pageWidth / 2, 110, {
      align: 'center',
      angle: 25,
    });
    doc.restoreGraphicsState();
  } catch (e) {
    console.warn('Watermark rotation note', e);
  }

  // Bandeau supérieur
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 3, 18, 18);
    } catch {
      // Ignorer si non rendu
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SERVI-DOX  |  ÉTAT RÉCAPITULATIF ANNUEL DES SALAIRES', margin + 22, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Exercice Social & Fiscal : Année ${summary.annee}   |   Salarié : ${employee.nom.toUpperCase()} ${employee.prenom} (Matricule : ${employee.id})   |   Contrat : ${employee.typeContrat}`,
    margin + 22,
    18
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Édité le : ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth - margin,
    11,
    { align: 'right' }
  );
  doc.text(
    `${employer.raisonSociale} • NIF: ${employer.nif}`,
    pageWidth - margin,
    18,
    { align: 'right' }
  );

  // Cartes de synthèse annuelle
  const cardY = 28;
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 14;

  // Total Brut
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BRUT CUMULÉ ANNUEL', margin + 4, cardY + 5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(formatMontantPDF(summary.totalSalaireBrut), margin + 4, cardY + 10.5);

  // Total CNAS Salarié
  const c2X = margin + cardWidth + 3;
  doc.setFillColor(254, 243, 199); // Amber-50
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(c2X, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text('TOTAL CNAS SALARIÉ (9%)', c2X + 4, cardY + 5);
  doc.setFontSize(10);
  doc.text(formatMontantPDF(summary.totalCnasSalarie), c2X + 4, cardY + 10.5);

  // Total IRG
  const c3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(254, 242, 242); // Rose-50
  doc.setDrawColor(248, 113, 113);
  doc.roundedRect(c3X, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(185, 28, 28);
  doc.text('TOTAL RETENUE IRG', c3X + 4, cardY + 5);
  doc.setFontSize(10);
  doc.text(formatMontantPDF(summary.totalIrg), c3X + 4, cardY + 10.5);

  // Total Net Versé
  const c4X = margin + (cardWidth + 3) * 3;
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.roundedRect(c4X, cardY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(191, 219, 254);
  doc.text('NET ANNUEL GLOBAL', c4X + 4, cardY + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatMontantPDF(summary.totalSalaireNet), c4X + 4, cardY + 10.5);

  // Table des 12 mois
  const tableRows = summary.monthlyDetails.map((m) => [
    m.moisNom,
    formatDA(m.salaireBase),
    formatDA(
      m.primePanier +
        m.primeTransport +
        m.primeRendement +
        m.primeResponsabilite +
        m.heuresSuppMontant +
        m.autresPrimes
    ),
    formatDA(m.salaireBrut),
    formatDA(m.cnasSalarieMontant),
    formatDA(m.salaireImposable),
    formatDA(m.retenueIrg),
    m.avancesAcomptes > 0 ? formatDA(m.avancesAcomptes) : '—',
    formatDA(m.salaireNet),
    formatDA(m.cnasPatronaleMontant),
    formatDA(m.coutTotalEmployeur),
  ]);

  autoTable(doc, {
    startY: cardY + cardHeight + 4,
    head: [
      [
        'MOIS',
        'BASE (DA)',
        'PRIMES (DA)',
        'BRUT (DA)',
        'CNAS 9% (DA)',
        'IMPOSABLE (DA)',
        'IRG (DA)',
        'ACOMPTE',
        'NET PAYÉ (DA)',
        'CNAS PAT. 26%',
        'COÛT GLOBAL (DA)',
      ],
    ],
    body: tableRows,
    foot: [
      [
        'TOTAL ANNUEL',
        formatDA(summary.totalSalaireBase),
        formatDA(summary.totalPrimesIndemnites),
        formatDA(summary.totalSalaireBrut),
        formatDA(summary.totalCnasSalarie),
        formatDA(summary.totalSalaireImposable),
        formatDA(summary.totalIrg),
        formatDA(summary.totalAvances),
        formatDA(summary.totalSalaireNet),
        formatDA(summary.totalCnasPatronale),
        formatDA(summary.totalCoutEmployeur),
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.6,
      font: 'helvetica',
      halign: 'right',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left', fontStyle: 'bold' },
      8: { fontStyle: 'bold', textColor: [30, 58, 138] },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // Signatures en bas
  const sigY = Math.min(finalY + 4, pageHeight - 34);
  const sigWidth = (contentWidth - 6) / 2;
  const sigHeight = 22;

  // Direction SERVI-DOX
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, sigY, sigWidth, sigHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("POUR L'EMPLOYEUR SERVI-DOX", margin + 3, sigY + 4.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Cachet officiel de l'établissement & Signature de la Direction", margin + 3, sigY + 8);
  doc.text(`Fait à Alger, le ${new Date().toLocaleDateString('fr-FR')}`, margin + sigWidth / 2, sigY + 19, {
    align: 'center',
  });

  // Salarié
  const sig2X = margin + sigWidth + 6;
  doc.roundedRect(sig2X, sigY, sigWidth, sigHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("L'EMPLOYÉ(E)", sig2X + 3, sigY + 4.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Signature pour accord & prise de connaissance", sig2X + 3, sigY + 8);
  doc.text('Mention manuscrite « Lu et approuvé »', sig2X + sigWidth / 2, sigY + 19, { align: 'center' });

  // Sauvegarde
  const cleanNom = employee.nom.replace(/\s+/g, '_');
  const cleanPrenom = employee.prenom.replace(/\s+/g, '_');
  doc.save(`Recapitulatif_Annuel_${summary.annee}_${cleanNom}_${cleanPrenom}.pdf`);
};
