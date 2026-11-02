import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Landmark,
  BadgeCheck,
  Building2,
  FolderCheck,
  Calculator,
  Clock,
  ShieldCheck,
  FileDown,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { loadLogoBase64 } from '../utils/payrollPdfExport';
import { formatDA } from '../utils/format';
import { useClients } from '../context/ClientContext';

export interface FeeLineItem {
  id: string;
  label: string;
  amount: number;
  amountPrefix?: string; // e.g., "À partir de"
  isOptional?: boolean;
  note?: string;
}

export interface DomiciliationOption {
  duration: string;
  amount: number;
}

export interface DossierTarifConfig {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  accentColor: 'blue' | 'emerald' | 'indigo';
  documentsRequired: string[];
  feeItems: FeeLineItem[];
  domiciliationOptions?: DomiciliationOption[];
  footerNote?: string;
}

const DEFAULT_DOSSIERS_TARIFS: DossierTarifConfig[] = [
  {
    id: 'rc_ambulant',
    code: 'DOSSIER 01 — CNRC',
    title: '1. Registre du Commerce (Ambulant / Alger)',
    subtitle: 'Création de Registre du Commerce sur Alger, affiliation CASNOS & formalités CNRC',
    accentColor: 'blue',
    documentsRequired: [
      '04 Extraits de naissance',
      '04 Certificats de résidence',
      '01 Extrait du Casier Judiciaire (Bulletin n°3)',
      "01 Copie de la Carte Nationale d'Identité (CNI)",
    ],
    feeItems: [
      {
        id: 'rc-1',
        label: 'Frais de dossier SERVI-DOX (sur Alger)',
        amount: 50000,
      },
      {
        id: 'rc-2',
        label: 'Cotisation CASNOS (Annuelle)',
        amount: 43200,
      },
      {
        id: 'rc-3',
        label: "Code d'activité (CNRC)",
        amount: 1000,
        amountPrefix: 'À partir de',
      },
      {
        id: 'rc-4',
        label: 'Quittance CNRC',
        amount: 4000,
      },
      {
        id: 'rc-5',
        label: 'Procuration notariale (Notaire)',
        amount: 5200,
      },
    ],
    domiciliationOptions: [
      { duration: 'Domiciliation — Formule 6 Mois', amount: 58000 },
      { duration: 'Domiciliation — Formule 1 An (12 Mois)', amount: 98000 },
    ],
    footerNote:
      "Le tarif du code d'activité commence à partir de 1 000 DA selon le nombre de codes sélectionnés au CNRC.",
  },
  {
    id: 'auto_entrepreneur',
    code: 'DOSSIER 02 — ANAE',
    title: '2. Auto-Entrepreneur',
    subtitle: 'Inscription ANAE, accompagnement complet, affiliation CASNOS & procuration notariale',
    accentColor: 'emerald',
    documentsRequired: [
      '04 Extraits de naissance',
      '04 Certificats de résidence',
      '01 Extrait du Casier Judiciaire (Bulletin n°3)',
      "01 Copie de la Carte Nationale d'Identité (CNI)",
    ],
    feeItems: [
      {
        id: 'ae-1',
        label: 'Frais de dossier & suivi SERVI-DOX',
        amount: 40000,
      },
      {
        id: 'ae-2',
        label: 'Cotisation CASNOS (Auto-Entrepreneur)',
        amount: 24000,
      },
      {
        id: 'ae-3',
        label: 'Frais de Poste (Algérie Poste)',
        amount: 1200,
      },
      {
        id: 'ae-4',
        label: 'Frais de Notaire (Procuration notariale)',
        amount: 5200,
      },
    ],
    footerNote:
      'Forfait clé en main incluant le traitement du dossier ANAE, la déclaration CASNOS et les frais administratifs.',
  },
  {
    id: 'eurl_sarl',
    code: 'DOSSIER 03 — SOCIÉTÉS',
    title: '3. Création Société — EURL ou SARL',
    subtitle: 'Constitution juridique, capital social, immatriculation CNRC, CASNOS & domiciliation',
    accentColor: 'indigo',
    documentsRequired: [
      '04 Extraits de naissance',
      '04 Certificats de résidence',
      '01 Extrait du Casier Judiciaire (Bulletin n°3)',
      "01 Copie de la Carte Nationale d'Identité (CNI)",
    ],
    feeItems: [
      {
        id: 'soc-1',
        label: 'Frais de dossier & honoraires SERVI-DOX (EURL / SARL)',
        amount: 100000,
      },
      {
        id: 'soc-2',
        label: 'Capital Social (Constitution société)',
        amount: 100000,
      },
      {
        id: 'soc-3',
        label: 'Cotisation CASNOS (Annuelle)',
        amount: 43200,
      },
      {
        id: 'soc-4',
        label: "Code d'activité (CNRC)",
        amount: 10000,
      },
      {
        id: 'soc-5',
        label: 'Quittance CNRC',
        amount: 4000,
      },
      {
        id: 'soc-6',
        label: 'Procuration notariale (Notaire)',
        amount: 5200,
      },
    ],
    domiciliationOptions: [
      { duration: 'Domiciliation — Formule 6 Mois', amount: 58000 },
      { duration: 'Domiciliation — Formule 1 An (12 Mois)', amount: 98000 },
    ],
    footerNote:
      'Inclut les démarches de constitution de société (EURL ou SARL). Options de domiciliation disponibles sur 6 mois ou 1 an.',
  },
];

const STORAGE_KEY_TARIFS = 'servidox_official_tarifs_pdf_v1';

export const TarifsDossiersPage: React.FC = () => {
  const { showToast } = useClients();
  const [dossiers, setDossiers] = useState<DossierTarifConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TARIFS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_DOSSIERS_TARIFS;
  });

  const [clientNameForQuote, setClientNameForQuote] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [editingDossierId, setEditingDossierId] = useState<string | null>(null);
  const [newDocText, setNewDocText] = useState('');

  const saveDossiers = (updated: DossierTarifConfig[]) => {
    setDossiers(updated);
    try {
      localStorage.setItem(STORAGE_KEY_TARIFS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleResetDefaults = () => {
    saveDossiers(DEFAULT_DOSSIERS_TARIFS);
    setEditingDossierId(null);
    showToast(
      'Barème réinitialisé',
      'Les tarifs officiels SERVI-DOX et les pièces à fournir ont été restaurés.',
      'info'
    );
  };

  const calculateBaseTotal = (dossier: DossierTarifConfig): number => {
    return dossier.feeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const handleUpdateFeeAmount = (dossierId: string, feeId: string, newAmount: number) => {
    const updated = dossiers.map((d) => {
      if (d.id !== dossierId) return d;
      return {
        ...d,
        feeItems: d.feeItems.map((f) =>
          f.id === feeId ? { ...f, amount: Math.max(0, newAmount) } : f
        ),
      };
    });
    saveDossiers(updated);
  };

  const handleAddDocument = (dossierId: string) => {
    if (!newDocText.trim()) return;
    const updated = dossiers.map((d) => {
      if (d.id !== dossierId) return d;
      return {
        ...d,
        documentsRequired: [...d.documentsRequired, newDocText.trim()],
      };
    });
    saveDossiers(updated);
    setNewDocText('');
  };

  const handleRemoveDocument = (dossierId: string, index: number) => {
    const updated = dossiers.map((d) => {
      if (d.id !== dossierId) return d;
      return {
        ...d,
        documentsRequired: d.documentsRequired.filter((_, idx) => idx !== index),
      };
    });
    saveDossiers(updated);
  };

  /**
   * Génère un PDF A4 officiel et parfaitement structuré (Catalogue complet ou fiche individuelle)
   */
  const generateTarifsPDF = async (targetDossierId?: string) => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const logoData = await loadLogoBase64();

      const targetList = targetDossierId
        ? dossiers.filter((d) => d.id === targetDossierId)
        : dossiers;

      const drawHeader = (pageNumber: number) => {
        // Filigrane discret au centre
        try {
          doc.saveGraphicsState();
          if (logoData && typeof (doc as any).setGState === 'function') {
            (doc as any).setGState(new (doc as any).GState({ opacity: 0.05 }));
            doc.addImage(logoData, 'PNG', (pageWidth - 70) / 2, 110, 70, 70);
          }
          doc.restoreGraphicsState();
        } catch {
          // ignore watermark fallback
        }

        // Bandeau supérieur bleu nuit SERVI-DOX
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(margin, 10, contentWidth, 24, 2.5, 2.5, 'F');

        if (logoData) {
          try {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(margin + 3, 12.5, 19, 19, 2, 2, 'F');
            doc.addImage(logoData, 'PNG', margin + 4, 13.5, 17, 17);
          } catch {
            // fallback
          }
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('CABINET SERVI-DOX — GUIDE OFFICIEL DES TARIFS & DOSSIERS', margin + 26, 19);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225);
        doc.text(
          'Barème détaillé des frais administratifs (DA) & Liste des pièces nécessaires par dossier',
          margin + 26,
          25
        );

        const dateStr = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Date : ${dateStr}`, pageWidth - margin - 4, 18, { align: 'right' });
        if (clientNameForQuote.trim()) {
          doc.setTextColor(255, 255, 255);
          doc.text(`Client : ${clientNameForQuote.trim()}`, pageWidth - margin - 4, 25, {
            align: 'right',
          });
        } else {
          doc.text(`Page ${pageNumber}`, pageWidth - margin - 4, 25, { align: 'right' });
        }
      };

      let pageNumber = 1;
      drawHeader(pageNumber);
      let currentY = 39;

      // Encadré récapitulatif des Papiers Nécessaires Communs
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('PIÈCES NÉCESSAIRES À FOURNIR (DOSSIER DE BASE) :', margin + 4, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        '• 04 Extraits de naissance     • 04 Certificats de résidence     • 01 Casier judiciaire     • 01 Copie Carte Nationale d’Identité (CNI)',
        margin + 4,
        currentY + 13.5
      );

      currentY += 25;

      for (let i = 0; i < targetList.length; i++) {
        const dossier = targetList[i];
        const baseTotal = calculateBaseTotal(dossier);

        // Vérifier s'il reste assez de place sur la page courante, sinon nouvelle page
        const estimatedHeight = 68 + (dossier.domiciliationOptions ? 18 : 0);
        if (currentY + estimatedHeight > pageHeight - 20) {
          doc.addPage();
          pageNumber += 1;
          drawHeader(pageNumber);
          currentY = 40;
        }

        // En-tête de section du dossier
        const headerRgb: [number, number, number] =
          dossier.accentColor === 'blue'
            ? [30, 64, 175]
            : dossier.accentColor === 'emerald'
            ? [6, 95, 70]
            : [55, 48, 163];

        doc.setFillColor(headerRgb[0], headerRgb[1], headerRgb[2]);
        doc.roundedRect(margin, currentY, contentWidth, 8.5, 1.5, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(dossier.title.toUpperCase(), margin + 3.5, currentY + 5.7);

        doc.setFontSize(8);
        doc.text(dossier.code, pageWidth - margin - 3.5, currentY + 5.7, { align: 'right' });

        currentY += 10.5;

        // Liste spécifique des papiers pour ce dossier
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `Papiers requis : ${dossier.documentsRequired.join('  |  ')}`,
          margin + 1,
          currentY + 3
        );
        currentY += 5;

        // Construction des lignes du tableau des frais
        const tableRows: any[] = dossier.feeItems.map((item, idx) => [
          String(idx + 1).padStart(2, '0'),
          item.label,
          item.amountPrefix
            ? `${item.amountPrefix} ${formatDA(item.amount)} DA`
            : `${formatDA(item.amount)} DA`,
        ]);

        // Ligne Total hors domiciliation
        tableRows.push([
          {
            content: dossier.domiciliationOptions
              ? 'TOTAL DE BASE (Hors Domiciliation)'
              : 'TOTAL GLOBAL DU DOSSIER',
            colSpan: 2,
            styles: {
              fontStyle: 'bold',
              fillColor: [241, 245, 249],
              textColor: [15, 23, 42],
            },
          },
          {
            content: `${formatDA(baseTotal)} DA`,
            styles: {
              fontStyle: 'bold',
              fillColor: [241, 245, 249],
              textColor: headerRgb,
              halign: 'right',
            },
          },
        ]);

        // Options de domiciliation s'il y en a
        if (dossier.domiciliationOptions && dossier.domiciliationOptions.length > 0) {
          dossier.domiciliationOptions.forEach((domOpt) => {
            const totalWithDom = baseTotal + domOpt.amount;
            tableRows.push([
              {
                content: `+ Option : ${domOpt.duration}`,
                colSpan: 2,
                styles: {
                  fontStyle: 'bold',
                  fillColor: [254, 249, 195],
                  textColor: [113, 63, 18],
                },
              },
              {
                content: `+ ${formatDA(domOpt.amount)} DA  (Total : ${formatDA(totalWithDom)} DA)`,
                styles: {
                  fontStyle: 'bold',
                  fillColor: [254, 249, 195],
                  textColor: [113, 63, 18],
                  halign: 'right',
                },
              },
            ]);
          });
        }

        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [['N°', 'Désignation des Frais & Formalités', 'Montant (DA)']],
          body: tableRows,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 8.2,
            cellPadding: 2.2,
            lineColor: [203, 213, 225],
            lineWidth: 0.2,
            textColor: [30, 41, 59],
          },
          headStyles: {
            fillColor: [248, 250, 252],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            lineColor: [203, 213, 225],
            lineWidth: 0.25,
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 114 },
            2: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 6;
      }

      // Pied de page officiel avec zone cachet & signature
      if (currentY + 26 <= pageHeight - 10) {
        const footerY = Math.max(currentY + 2, pageHeight - 32);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY, pageWidth - margin, footerY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(
          'SERVI-DOX — Cabinet de Conseil, Accompagnement Administratif & Création d’Entreprises',
          margin,
          footerY + 5
        );
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          'Tous les montants sont exprimés en Dinars Algériens (DA). Ce document tient lieu de fiche récapitulative des tarifs et pièces à fournir.',
          margin,
          footerY + 10
        );

        // Cadre Cachet & Signature
        doc.setDrawColor(148, 163, 184);
        doc.roundedRect(pageWidth - margin - 52, footerY + 2, 52, 18, 1.5, 1.5, 'D');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Cachet & Visa SERVI-DOX', pageWidth - margin - 26, footerY + 6.5, {
          align: 'center',
        });
      }

      const fileName = targetDossierId
        ? `SERVI-DOX_Tarifs_${targetDossierId}.pdf`
        : 'SERVI-DOX_Guide_Tarifs_et_Papiers_Necessaires.pdf';

      doc.save(fileName);
      showToast(
        'PDF généré avec succès',
        `Le document "${fileName}" a été téléchargé.`,
        'success'
      );
    } catch (err) {
      console.error('Erreur génération PDF tarifs:', err);
      showToast(
        'Erreur PDF',
        'Une erreur est survenue lors de la création du fichier PDF.',
        'error'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 print:p-2 print:max-w-none print:space-y-4">
      {/* Top Action & Print Bar (Hidden when printing) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Guide Officiel des Tarifs & Papiers Nécessaires
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                Format A4 Imprimable & PDF
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Barème détaillé SERVI-DOX : Registre de Commerce (Ambulant / Alger), Auto-Entrepreneur et Société (EURL / SARL) avec options de domiciliation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={clientNameForQuote}
            onChange={(e) => setClientNameForQuote(e.target.value)}
            placeholder="Nom du client sur le PDF (optionnel)..."
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
          />

          <button
            type="button"
            onClick={() => generateTarifsPDF()}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Génération...' : 'Télécharger le PDF Complet (A4)'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Imprimer la Fiche</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restaurer les tarifs officiels par défaut"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Print-Only Official Document Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/Sans_titre_b7fbb046.png"
            alt="SERVI-DOX"
            className="w-14 h-14 object-contain"
          />
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              CABINET SERVI-DOX — TARIFS OFFICIELS & PAPIERS NÉCESSAIRES
            </h1>
            <p className="text-xs text-slate-600">
              Création de Registre du Commerce, Auto-Entrepreneur, Constitution EURL / SARL & Domiciliation
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-700">
          <div className="font-bold">
            Date : {new Date().toLocaleDateString('fr-FR')}
          </div>
          {clientNameForQuote.trim() && (
            <div className="font-bold text-slate-900 mt-0.5">
              Client : {clientNameForQuote.trim()}
            </div>
          )}
        </div>
      </div>

      {/* Common Documents Required Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 print:hidden">
              <FolderCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white print:text-slate-900">
                Papiers Nécessaires à Fournir (Pièces Administratives du Dossier)
              </h2>
              <p className="text-xs text-slate-300 print:text-slate-600">
                Documents obligatoires requis pour la constitution et le dépôt de votre dossier chez SERVI-DOX
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full md:w-auto">
            {[
              '04 Extraits de naissance',
              '04 Certificats de résidence',
              '01 Casier judiciaire',
              "01 Copie Carte d'Identité (CNI)",
            ].map((docItem, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-100 print:bg-white print:text-slate-900 print:border-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 print:text-emerald-600" />
                <span>{docItem}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Detailed Dossier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1 print:gap-4">
        {dossiers.map((dossier) => {
          const baseTotal = calculateBaseTotal(dossier);
          const isEditing = editingDossierId === dossier.id;

          const headerStyles =
            dossier.accentColor === 'blue'
              ? 'bg-blue-700 text-white border-blue-800'
              : dossier.accentColor === 'emerald'
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-indigo-700 text-white border-indigo-800';

          const badgeStyles =
            dossier.accentColor === 'blue'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : dossier.accentColor === 'emerald'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200';

          const DossierIcon =
            dossier.accentColor === 'blue'
              ? Landmark
              : dossier.accentColor === 'emerald'
              ? BadgeCheck
              : Building2;

          return (
            <div
              key={dossier.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between overflow-hidden print:break-inside-avoid print:border-slate-300"
            >
              <div>
                {/* Card Header */}
                <div className={`p-4 border-b ${headerStyles}`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-white">
                      {dossier.code}
                    </span>

                    <div className="flex items-center gap-1.5 print:hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingDossierId(isEditing ? null : dossier.id)
                        }
                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                        title="Modifier les montants ou les pièces"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => generateTarifsPDF(dossier.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Télécharger uniquement ce dossier en PDF"
                      >
                        <FileDown className="w-3.5 h-3.5 text-blue-600" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <DossierIcon className="w-5 h-5 shrink-0 mt-0.5 opacity-95" />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold leading-snug">
                        {dossier.title}
                      </h3>
                      <p className="text-[11px] text-white/85 mt-0.5 leading-relaxed">
                        {dossier.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents Required Section */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                    <span>Papiers nécessaires à fournir</span>
                    <span className="text-slate-400 font-mono">
                      {dossier.documentsRequired.length} pièces
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {dossier.documentsRequired.map((docItem, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{docItem}</span>
                        </div>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(dossier.id, idx)}
                            className="text-rose-500 hover:text-rose-700 p-0.5 print:hidden"
                            title="Retirer cette pièce"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {isEditing && (
                    <div className="mt-2 flex items-center gap-1.5 print:hidden">
                      <input
                        type="text"
                        value={newDocText}
                        onChange={(e) => setNewDocText(e.target.value)}
                        placeholder="Ajouter une pièce..."
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddDocument(dossier.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Detailed Fee Breakdown */}
                <div className="p-4 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Détail des Tarifs & Frais</span>
                    <span>Montant (DA)</span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {dossier.feeItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2.5 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-medium text-slate-700 leading-snug">
                          {item.label}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) =>
                                handleUpdateFeeAmount(
                                  dossier.id,
                                  item.id,
                                  Number(e.target.value)
                                )
                              }
                              className="w-24 px-2 py-1 text-right font-mono font-bold text-xs border border-blue-400 rounded bg-blue-50/40"
                            />
                            <span className="text-[11px] font-bold text-slate-500">DA</span>
                          </div>
                        ) : (
                          <span
                            className={`font-mono font-bold shrink-0 px-2 py-0.5 rounded border ${badgeStyles}`}
                          >
                            {item.amountPrefix ? `${item.amountPrefix} ` : ''}
                            {formatDA(item.amount)} DA
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Base Total Box */}
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300 block">
                        {dossier.domiciliationOptions
                          ? 'Total de base (Hors Domiciliation)'
                          : 'Total Global du Dossier'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tous les frais inclus en Dinars Algériens
                      </span>
                    </div>
                    <span className="text-base font-extrabold font-mono text-emerald-400">
                      {formatDA(baseTotal)} DA
                    </span>
                  </div>

                  {/* Domiciliation Options if applicable */}
                  {dossier.domiciliationOptions &&
                    dossier.domiciliationOptions.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>En cas de Domiciliation (6 Mois ou 1 An)</span>
                        </div>

                        <div className="space-y-1.5">
                          {dossier.domiciliationOptions.map((dom, idx) => {
                            const totalWithDom = baseTotal + dom.amount;
                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex flex-col gap-1"
                              >
                                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                                  <span>{dom.duration}</span>
                                  <span className="font-mono text-amber-900">
                                    + {formatDA(dom.amount)} DA
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                                  <span>Total complet avec cette domiciliation :</span>
                                  <span className="font-mono font-extrabold text-slate-900">
                                    {formatDA(totalWithDom)} DA
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Card Footer Note */}
              {dossier.footerNote && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{dossier.footerNote}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparative Summary Table (Great for A4 Print & Quick Reference) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden print:border-slate-300">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tableau Récapitulatif Général des Tarifs SERVI-DOX (DA)
              </h3>
              <p className="text-[11px] text-slate-500">
                Synthèse comparative des 3 formules et des options de domiciliation (6 mois / 1 an)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => generateTarifsPDF()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer print:hidden"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter tout le tableau en PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 font-bold">Type de Dossier</th>
                <th className="py-3 px-4 font-bold">Frais SERVI-DOX</th>
                <th className="py-3 px-4 font-bold">CASNOS</th>
                <th className="py-3 px-4 font-bold">Autres Frais (CNRC / Notaire / Capital)</th>
                <th className="py-3 px-4 font-bold text-right">Total Hors Domiciliation</th>
                <th className="py-3 px-4 font-bold text-right">Avec Domiciliation 6 Mois (+58 000 DA)</th>
                <th className="py-3 px-4 font-bold text-right">Avec Domiciliation 1 An (+98 000 DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-blue-900">
                  1. Registre Commerce (Ambulant / Alger)
                </td>
                <td className="py-3 px-4 font-mono font-semibold">50 000 DA</td>
                <td className="py-3 px-4 font-mono font-semibold">43 200 DA</td>
                <td className="py-3 px-4 text-[11px] text-slate-600">
                  Code act. (dès 1 000 DA) + Quittance CNRC (4 000 DA) + Procuration (5 200 DA)
                </td>
                <td className="py-3 px-4 font-mono font-bold text-right text-slate-900">
                  103 400 DA
                </td>
                <td className="py-3 px-4 font-mono font-bold text-right text-amber-800 bg-amber-50/50">
                  161 400 DA
                </td>
                <td className="py-3 px-4 font-mono font-bold text-right text-amber-900 bg-amber-50/80">
                  201 400 DA
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-emerald-900">
                  2. Auto-Entrepreneur (ANAE)
                </td>
                <td className="py-3 px-4 font-mono font-semibold">40 000 DA</td>
                <td className="py-3 px-4 font-mono font-semibold">24 000 DA</td>
                <td className="py-3 px-4 text-[11px] text-slate-600">
                  Frais de Poste (1 200 DA) + Frais de Notaire (5 200 DA)
                </td>
                <td className="py-3 px-4 font-mono font-bold text-right text-emerald-700">
                  70 400 DA
                </td>
                <td className="py-3 px-4 font-mono text-right text-slate-400">—</td>
                <td className="py-3 px-4 font-mono text-right text-slate-400">—</td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-indigo-900">
                  3. Société EURL ou SARL
                </td>
                <td className="py-3 px-4 font-mono font-semibold">100 000 DA</td>
                <td className="py-3 px-4 font-mono font-semibold">43 200 DA</td>
                <td className="py-3 px-4 text-[11px] text-slate-600">
                  Capital social (100 000 DA) + Code act. (10 000 DA) + Quittance (4 000 DA) + Procuration (5 200 DA)
                </td>
                <td className="py-3 px-4 font-mono font-bold text-right text-slate-900">
                  262 400 DA
                </td>
                <td className="py-3 px-4 font-mono font-bold text-right text-amber-800 bg-amber-50/50">
                  320 400 DA
                </td>
                <td className="py-3 px-4 font-mono font-bold text-right text-amber-900 bg-amber-50/80">
                  360 400 DA
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
