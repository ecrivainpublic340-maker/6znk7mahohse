import React from 'react';
import { Employee } from '../../types/client';
import { EmployerInfo, AnnualPayrollSummary } from '../../types/payroll';
import { ServidoxLogo } from './ServidoxLogo';
import { formatDA } from '../../utils/format';
import { Printer, Download, Calendar, DollarSign, ShieldAlert, Award, FileSpreadsheet, FileDown } from 'lucide-react';
import { exportAnnualPayrollPDF } from '../../utils/payrollPdfExport';

interface AnnualPayrollViewProps {
  summary: AnnualPayrollSummary;
  employee: Employee;
  employer: EmployerInfo;
  onPrint: () => void;
}

export const AnnualPayrollView: React.FC<AnnualPayrollViewProps> = ({
  summary,
  employee,
  employer,
  onPrint,
}) => {
  const handleExportPDF = () => {
    exportAnnualPayrollPDF(summary, employee, employer);
  };

  const exportToCSV = () => {
    const headers = [
      'Mois',
      'Salaire Base (DA)',
      'Primes & Indemnites (DA)',
      'Salaire Brut (DA)',
      'CNAS 9% (DA)',
      'Salaire Imposable (DA)',
      'IRG (DA)',
      'Avances (DA)',
      'Net Paye (DA)',
    ];

    const rows = summary.monthlyDetails.map((m) => [
      m.moisNom,
      m.salaireBase,
      m.primePanier + m.primeTransport + m.primeRendement + m.primeResponsabilite + m.heuresSuppMontant + m.autresPrimes,
      m.salaireBrut,
      m.cnasSalarieMontant,
      m.salaireImposable,
      m.retenueIrg,
      m.avancesAcomptes,
      m.salaireNet,
    ]);

    // Ligne de total
    rows.push([
      'TOTAL ANNUEL',
      summary.totalSalaireBase,
      summary.totalPrimesIndemnites,
      summary.totalSalaireBrut,
      summary.totalCnasSalarie,
      summary.totalSalaireImposable,
      summary.totalIrg,
      summary.totalAvances,
      summary.totalSalaireNet,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Recapitulatif_Annuel_${summary.annee}_${employee.nom}_${employee.prenom}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Barre d'action supérieure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Récapitulatif Annuel des Salaires • {summary.annee}
          </h2>
          <p className="text-xs text-slate-500">
            Synthèse 12 mois pour {employee.prenom} {employee.nom} ({employee.role}) - Déclaration DAS & Bilan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Télécharger en PDF */}
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            title="Télécharger le récapitulatif annuel au format PDF officiel"
          >
            <FileDown className="w-4 h-4" />
            Télécharger le PDF
          </button>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Exporter CSV (Excel)
          </button>

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* DOCUMENT OFFICIEL DU BILAN ANNUEL (AVEC FILIGRANE & LOGO) */}
      <div className="relative bg-white text-slate-900 border border-slate-300 rounded-xl shadow-lg p-6 sm:p-10 max-w-5xl mx-auto printable-document overflow-hidden font-sans print:border-none print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none">
        {/* Filigrane central SERVI-DOX */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <ServidoxLogo variant="watermark" className="transform -rotate-6 scale-125 sm:scale-150" />
        </div>

        {/* Contenu du document au-dessus du filigrane */}
        <div className="relative z-10">
          {/* En-tête : Logo en haut à gauche */}
          <div className="flex flex-col md:flex-row md:items-start justify-between pb-5 border-b-2 border-slate-800 gap-4">
            <div className="flex-1">
              <ServidoxLogo size={46} className="mb-2" />
              <div className="text-[11px] leading-relaxed text-slate-700 pl-1">
                <p className="font-bold text-slate-900 uppercase tracking-wide">
                  {employer.raisonSociale}
                </p>
                <p className="text-slate-600">{employer.adresse} - {employer.wilaya}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 text-[10px] text-slate-600">
                  <p><span className="font-semibold text-slate-800">NIF :</span> {employer.nif}</p>
                  <p><span className="font-semibold text-slate-800">RC :</span> {employer.rc}</p>
                  <p><span className="font-semibold text-slate-800">N° CNAS :</span> {employer.numeroCnas}</p>
                  <p><span className="font-semibold text-slate-800">NIS :</span> {employer.nis}</p>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right min-w-[240px]">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-center shadow-sm">
                <h1 className="text-base font-black tracking-wider uppercase">
                  ÉTAT RÉCAPITULATIF ANNUEL
                </h1>
                <p className="text-[11px] font-medium text-blue-200">
                  Exercice Fiscal & Social : Année {summary.annee}
                </p>
              </div>

              <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>
                  <span className="font-semibold text-slate-800">Employé(e) :</span>{' '}
                  <span className="font-bold text-slate-900">{employee.nom.toUpperCase()} {employee.prenom}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Matricule :</span>{' '}
                  <span className="font-mono">{employee.id}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Poste :</span>{' '}
                  {employee.role}
                </p>
              </div>
            </div>
          </div>

          {/* Cartes Synthétiques Annuelles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
            <div className="border border-slate-200 bg-slate-50/80 rounded-lg p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Salaire Brut Cumulé
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-slate-900 mt-1">
                {formatDA(summary.totalSalaireBrut)} DA
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50/80 rounded-lg p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700">
                Total CNAS Salarié (9%)
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-amber-900 mt-1">
                {formatDA(summary.totalCnasSalarie)} DA
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50/80 rounded-lg p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-700">
                Total Retenue IRG
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-purple-900 mt-1">
                {formatDA(summary.totalIrg)} DA
              </p>
            </div>

            <div className="border-2 border-emerald-600 bg-emerald-50 rounded-lg p-3 text-center print:border-slate-800 print:bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-emerald-800">
                Total Net Versé au Salarié
              </span>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-700 print:text-slate-900 mt-1">
                {formatDA(summary.totalSalaireNet)} DA
              </p>
            </div>
          </div>

          {/* TABLEAU DES 12 MOIS */}
          <div className="border border-slate-400 rounded-lg overflow-x-auto my-4">
            <table className="w-full text-left text-[11px] border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider print:bg-slate-800 print:text-white">
                  <th className="py-2.5 px-3 font-bold">Mois</th>
                  <th className="py-2.5 px-2 font-bold text-right">Base</th>
                  <th className="py-2.5 px-2 font-bold text-right">Primes</th>
                  <th className="py-2.5 px-2 font-bold text-right">Brut</th>
                  <th className="py-2.5 px-2 font-bold text-right text-amber-300">CNAS 9%</th>
                  <th className="py-2.5 px-2 font-bold text-right">Imposable</th>
                  <th className="py-2.5 px-2 font-bold text-right text-purple-300">IRG</th>
                  <th className="py-2.5 px-3 font-bold text-right text-emerald-300">Net Payé (DA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summary.monthlyDetails.map((m, idx) => {
                  const primesTotal =
                    m.primePanier +
                    m.primeTransport +
                    m.primeRendement +
                    m.primeResponsabilite +
                    m.heuresSuppMontant +
                    m.autresPrimes;

                  return (
                    <tr
                      key={m.mois}
                      className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {m.moisNom}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">
                        {formatDA(m.salaireBase)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">
                        {formatDA(primesTotal)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                        {formatDA(m.salaireBrut)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-amber-800">
                        {formatDA(m.cnasSalarieMontant)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700">
                        {formatDA(m.salaireImposable)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-purple-800">
                        {formatDA(m.retenueIrg)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatDA(m.salaireNet)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900 text-[11px]">
                  <td className="py-3 px-3 uppercase tracking-wider">
                    TOTAL ANNUEL ({summary.moisCount} mois) :
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    {formatDA(summary.totalSalaireBase)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    {formatDA(summary.totalPrimesIndemnites)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-slate-900 font-black">
                    {formatDA(summary.totalSalaireBrut)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-amber-900 font-black">
                    {formatDA(summary.totalCnasSalarie)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    {formatDA(summary.totalSalaireImposable)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-purple-900 font-black">
                    {formatDA(summary.totalIrg)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800 font-black text-xs">
                    {formatDA(summary.totalSalaireNet)} DA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* DÉCLARATION SOCIALE & PATRONALE */}
          <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/80 my-4 text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 font-medium">Cotisation CNAS Patronale Annuelle (26%) :</span>
              <p className="font-bold text-slate-900 mt-0.5">{formatDA(summary.totalCnasPatronale)} DA</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Total Cotisations Sociales Annuel (35%) :</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {formatDA(summary.totalCnasSalarie + summary.totalCnasPatronale)} DA
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Coût Total Annuel Employeur SERVI-DOX :</span>
              <p className="font-bold text-blue-900 mt-0.5">{formatDA(summary.totalCoutEmployeur)} DA</p>
            </div>
          </div>

          {/* BLOC CACHET & CERTIFICATION ANNUELLE */}
          <div className="mt-8 pt-4 border-t-2 border-slate-300 flex justify-between items-end text-[11px]">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase">
                Certifié sincère et conforme aux livres de paie
              </p>
              <p className="text-slate-500">
                Fait à Alger, le 31 Décembre {summary.annee}
              </p>
              <p className="text-[10px] text-slate-400">
                SARL SERVI-DOX • Direction Administrative & Comptable
              </p>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 w-56 text-center bg-white">
              <p className="text-[10px] font-bold text-slate-800 uppercase">
                Cachet de l'Employeur & Signature
              </p>
              <div className="h-16 flex items-center justify-center border border-dashed border-slate-200 rounded my-1 text-[9px] text-slate-400 italic bg-slate-50/40 print:bg-white">
                (Espace réservé au cachet humide)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
