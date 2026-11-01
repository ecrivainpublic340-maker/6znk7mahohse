import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutoEntrepreneurDossier, TARIFS_OFFRE_AE } from '../types/autoEntrepreneur';

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

const getStatusLabelInscription = (status: AutoEntrepreneurDossier['etatInscription']): string => {
  switch (status) {
    case 'inscrit':
      return 'Inscrit (ANAE Validé)';
    case 'carte_recue':
      return 'Carte Reçue';
    case 'en_cours':
      return 'En cours d\'inscription';
    case 'bloque':
      return 'Bloqué / Complément requis';
    default:
      return status;
  }
};

const getStatusLabelCasnos = (status: AutoEntrepreneurDossier['etatCasnos']): string => {
  switch (status) {
    case 'pret_a_payer':
      return 'Prêt à payer';
    case 'non_paye':
      return 'Non payé';
    case 'paye':
      return 'Payé (Quittance)';
    case 'non_inscrit':
      return 'Non inscrit CASNOS';
    default:
      return status;
  }
};

const getStatusLabelImpot = (status: AutoEntrepreneurDossier['etatImpot']): string => {
  switch (status) {
    case 'depose':
      return 'Déposé (Cachet Impôts)';
    case 'pret_a_deposer':
      return 'Prêt à déposer';
    case 'non_depose':
      return 'Non déposé';
    default:
      return status;
  }
};

const getStatusLabelCompte = (status: AutoEntrepreneurDossier['etatCompteBancaire']): string => {
  switch (status) {
    case 'pret':
      return 'Prêt (Compte ouvert & RIB)';
    case 'en_cours':
      return 'En cours d\'ouverture';
    case 'non_pret':
      return 'Pas prêt (Non entamé)';
    default:
      return status;
  }
};

const getStatusLabelAutorisation = (status: AutoEntrepreneurDossier['etatAutorisationGenerale']): string => {
  switch (status) {
    case 'prete':
      return 'Prête (Légalisée APC)';
    case 'en_cours':
      return 'En cours de légalisation';
    case 'non_prete':
      return 'Pas prête';
    default:
      return status;
  }
};

const getStatusLabelGriffe = (status: AutoEntrepreneurDossier['etatGriffe']): string => {
  switch (status) {
    case 'prete':
      return 'Prête (Disponible)';
    case 'en_confection':
      return 'En confection / Gravure';
    case 'non_prete':
      return 'Pas prête';
    default:
      return status;
  }
};

/**
 * Exporte la Fiche Officielle de Suivi Auto-Entrepreneur SERVI-DOX en PDF A4 Portrait
 */
export const exportSingleAutoEntrepreneurPDF = (dossier: AutoEntrepreneurDossier) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // slate-900
  const blueColor = [37, 99, 235]; // blue-600
  const grayColor = [100, 116, 139]; // slate-500

  // 1. Cadre général de la page
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, 194, 281);

  // 2. En-tête SERVI-DOX
  doc.setFillColor(15, 23, 42);
  doc.rect(8, 8, 194, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SERVI-DOX — SERVICES ADMINISTRATIFS', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Conseil Juridique, Fiscal & Accompagnement des Auto-Entrepreneurs en Algérie', 14, 24);

  // 3. Titre du document
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FICHE DE SUIVI DU DOSSIER AUTO-ENTREPRENEUR', 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Identifiant Dossier : ${dossier.id}  |  Date : ${getTodayFormatted()}`, 14, 46);

  // 4. Cartouche Offre SERVI-DOX & Auto-Entrepreneur
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 182, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Auto-Entrepreneur : ${dossier.nom.toUpperCase()} ${dossier.prenom}`, 18, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Activité / Métier : ${dossier.activiteMetier || 'Non spécifiée'}`, 18, 63);
  doc.text(`Wilaya : ${dossier.wilaya}${dossier.commune ? ' (' + dossier.commune + ')' : ''}`, 18, 68);
  doc.text(`Téléphone : ${dossier.telephone}  |  Email : ${dossier.email || 'N/A'}`, 18, 73);
  doc.text(`N° Identifiant ANAE : ${dossier.numeroANAE || 'En cours d\'attribution'}`, 18, 78);

  // Offre choisie à droite
  const offreInfo = TARIFS_OFFRE_AE[dossier.typeSuivi];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text(`Offre SERVI-DOX : ${offreInfo.label}`, 115, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tarif de l'offre : ${formatMontantPDF(dossier.tarifServidoxDA)}`, 115, 63);
  doc.text(`Montant Encaissé : ${formatMontantPDF(dossier.montantEncaisseDA)}`, 115, 68);
  
  if (dossier.montantResteDA > 0) {
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reste à payer : ${formatMontantPDF(dossier.montantResteDA)}`, 115, 73);
  } else {
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(`Statut paiement : Soldé (100% Réglé)`, 115, 73);
  }

  // 5. Tableau d'avancement des 6 étapes administratives
  const milestones = [
    {
      num: '1',
      etape: 'Inscription Dossier (ANAE)',
      statut: getStatusLabelInscription(dossier.etatInscription),
      details: dossier.numeroANAE ? `Numéro ANAE : ${dossier.numeroANAE}` : 'Plateforme nationale anaep.dz',
    },
    {
      num: '2',
      etape: 'Sécurité Sociale (CASNOS)',
      statut: getStatusLabelCasnos(dossier.etatCasnos),
      details:
        dossier.etatCasnos === 'pret_a_payer'
          ? 'Bordereau prêt pour règlement CASNOS'
          : dossier.etatCasnos === 'paye'
          ? 'Cotisation payée & quittance obtenue'
          : 'En attente de paiement',
    },
    {
      num: '3',
      etape: 'Déclaration Fiscale (Impôts)',
      statut: getStatusLabelImpot(dossier.etatImpot),
      details:
        dossier.etatImpot === 'depose'
          ? 'Déclarations fiscales déposées à l\'Inspection'
          : dossier.etatImpot === 'pret_a_deposer'
          ? 'Dossier fiscal prêt à déposer'
          : 'Non déposé',
    },
    {
      num: '4',
      etape: 'Compte Bancaire Professionnel',
      statut: getStatusLabelCompte(dossier.etatCompteBancaire),
      details: `${dossier.banqueChoisie || 'Banque non choisie'}${dossier.ribBancaire ? ' - RIB : ' + dossier.ribBancaire : ''}`,
    },
    {
      num: '5',
      etape: 'Autorisation Générale (Mandat)',
      statut: getStatusLabelAutorisation(dossier.etatAutorisationGenerale),
      details: 'Autorisation générale de représentation SERVI-DOX (Légalisée)',
    },
    {
      num: '6',
      etape: 'La Griffe Professionnelle',
      statut: getStatusLabelGriffe(dossier.etatGriffe),
      details: 'Cachet nominatif / Griffe officielle SERVI-DOX',
    },
  ];

  autoTable(doc, {
    startY: 94,
    margin: { left: 14, right: 14 },
    head: [['N°', 'Étape Administrative & Réglementaire', 'État Actuel', 'Détails & Observations']],
    body: milestones.map((m) => [m.num, m.etape, m.statut, m.details]),
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 45, fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
    },
  });

  // 6. Notes & Instructions Particulières
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, finalY, 182, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Notes Internes & Remarques du Conseiller SERVI-DOX :', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const noteLines = doc.splitTextToSize(
    dossier.notes || 'Aucune observation particulière enregistrée pour ce dossier.',
    174
  );
  doc.text(noteLines, 18, finalY + 12);

  // 7. Cadres de Signature (Physiques, sans fausse signature dessinée)
  const signY = finalY + 40;

  // Boîte Client
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, signY, 86, 38, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Signature de l\'Auto-Entrepreneur', 18, signY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('« Bon pour accord et accusé de suivi »', 18, signY + 11);

  // Boîte SERVI-DOX
  doc.roundedRect(110, signY, 86, 38, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Cachet & Visa SERVI-DOX', 114, signY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Département Suivi Auto-Entrepreneurs', 114, signY + 11);

  // 8. Pied de page légal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'SERVI-DOX — Bureau d\'assistance et de gestion administrative — Algérie — Document de suivi officiel',
    105,
    284,
    { align: 'center' }
  );

  // Téléchargement sécurisé
  const safeName = `${dossier.nom}_${dossier.prenom}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`SERVI-DOX_Suivi_AutoEntrepreneur_${safeName}_${dossier.id}.pdf`);
};

/**
 * Exporte la liste récapitulative des Auto-Entrepreneurs au format PDF Paysage
 */
export const exportAutoEntrepreneursListPDF = (
  dossiers: AutoEntrepreneurDossier[],
  titre: string = 'SUIVI DES DOSSIERS AUTO-ENTREPRENEURS — SERVI-DOX'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // En-tête
  doc.setFillColor(15, 23, 42);
  doc.rect(8, 8, 281, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(titre, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Généré le ${getTodayFormatted()} — Total : ${dossiers.length} dossiers`, 14, 24);

  const tableRows = dossiers.map((d) => [
    d.id,
    `${d.nom} ${d.prenom}`,
    d.wilaya.split(' - ')[1] || d.wilaya,
    d.activiteMetier,
    TARIFS_OFFRE_AE[d.typeSuivi]?.label || d.typeSuivi,
    getStatusLabelInscription(d.etatInscription),
    getStatusLabelCasnos(d.etatCasnos),
    getStatusLabelImpot(d.etatImpot),
    getStatusLabelCompte(d.etatCompteBancaire),
    getStatusLabelAutorisation(d.etatAutorisationGenerale),
    getStatusLabelGriffe(d.etatGriffe),
    formatMontantPDF(d.tarifServidoxDA),
    formatMontantPDF(d.montantResteDA),
  ]);

  autoTable(doc, {
    startY: 32,
    margin: { left: 8, right: 8 },
    head: [
      [
        'ID',
        'Auto-Entrepreneur',
        'Wilaya',
        'Activité',
        'Offre',
        'Inscription',
        'CASNOS',
        'Impôts',
        'Banque',
        'Autoris.',
        'Griffe',
        'Tarif DA',
        'Reste',
      ],
    ],
    body: tableRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`SERVI-DOX_Liste_AutoEntrepreneurs_${new Date().toISOString().split('T')[0]}.pdf`);
};
