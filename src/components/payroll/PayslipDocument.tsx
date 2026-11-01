import React from 'react';
import { Employee } from '../../types/client';
import { EmployerInfo, PayslipMonthlyRecord } from '../../types/payroll';
import { ServidoxLogo } from './ServidoxLogo';
import { formatDA } from '../../utils/format';

interface PayslipDocumentProps {
  payslip: PayslipMonthlyRecord;
  employee: Employee;
  employer: EmployerInfo;
  onUpdateEmployer?: (field: keyof EmployerInfo, value: string) => void;
  editable?: boolean;
}

export const PayslipDocument: React.FC<PayslipDocumentProps> = ({
  payslip,
  employee,
  employer,
  onUpdateEmployer,
  editable = true,
}) => {
  return (
    <div className="relative bg-white text-slate-900 border border-slate-300/80 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 max-w-[820px] mx-auto printable-document overflow-hidden font-sans print:border-none print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none">
      {/* =========================================================================
          FILIGRANE CENTRAL (SERVI-DOX OFFICIAL WATERMARK)
          Positionné au centre absolu de la page avec opacité très douce
          ========================================================================= */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center justify-center opacity-[0.05] sm:opacity-[0.06] transform -rotate-12 scale-110">
          <img
            src="/assets/aistudio/Sans_titre_b7fbb046.png"
            alt="SERVI-DOX Filigrane"
            className="w-80 h-80 object-contain"
          />
          <div className="text-center mt-2">
            <span className="font-black text-4xl tracking-[0.25em] text-slate-900 block">
              SERVI-DOX
            </span>
            <span className="text-xs font-bold tracking-widest text-slate-700 block uppercase mt-1">
              Document Officiel Certifié · Alger
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTENU DU BULLETIN (AU-DESSUS DU FILIGRANE)
          ========================================================================= */}
      <div className="relative z-10">
        {/* EN-TÊTE : LOGO EN HAUT À GAUCHE & TITRE OFFICIEL */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-slate-800 gap-4">
          {/* Logo SERVI-DOX en haut à gauche avec informations de l'employeur */}
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200/90 shadow-2xs p-1 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Sans_titre_b7fbb046.png"
                alt="Logo SERVI-DOX"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-[11px] leading-relaxed text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-sm tracking-tight uppercase">
                  {employer.nomCommercial || 'SERVI-DOX'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                  SARL
                </span>
              </div>
              <p className="font-semibold text-slate-800 text-[11px]">{employer.raisonSociale}</p>
              <p className="text-slate-600 text-[10px]">{employer.adresse} - {employer.wilaya}</p>
              <p className="text-slate-500 text-[10px]">Tél : {employer.telephone} · Email : {employer.email}</p>
            </div>
          </div>

          {/* Titre officiel & Période */}
          <div className="flex flex-col items-start sm:items-end justify-start min-w-[220px]">
            <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-center w-full sm:w-auto shadow-sm print:bg-slate-900 print:text-white">
              <h1 className="text-sm font-black tracking-wider uppercase">
                BULLETIN DE PAIE
              </h1>
              <p className="text-[11px] font-medium text-blue-200">
                Période : {payslip.moisNom} {payslip.annee}
              </p>
            </div>

            <div className="mt-2 text-left sm:text-right w-full text-[10px] space-y-0.5 text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Date de règlement :</span>{' '}
                {new Date(payslip.datePaiement).toLocaleDateString('fr-FR')}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Mode de paiement :</span>{' '}
                <span className="font-medium text-slate-900">{payslip.modePaiement}</span>
              </p>
              {payslip.referencePaiement && (
                <p>
                  <span className="font-semibold text-slate-800">Réf. :</span>{' '}
                  <span className="font-mono text-slate-900">{payslip.referencePaiement}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* LIGNE LÉGALE EMPLOYEUR (MODIFIABLE DIRECTEMENT SUR LE BULLETIN AVANT IMPRESSION) */}
        <div className="mt-3 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 print:bg-slate-50 print:border-slate-300 print:py-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 shrink-0">NIF :</span>
            {editable ? (
              <input
                type="text"
                value={employer.nif}
                onChange={(e) => onUpdateEmployer?.('nif', e.target.value)}
                placeholder="NIF..."
                title="Cliquer pour modifier le NIF avant impression"
                className="px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-300 rounded shadow-2xs hover:border-blue-400 focus:bg-blue-50/50 focus:border-blue-600 focus:outline-hidden transition-all w-32 sm:w-36 print:border-none print:bg-transparent print:p-0 print:shadow-none print:w-auto"
              />
            ) : (
              <span className="font-mono font-semibold text-slate-900">{employer.nif}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 shrink-0">NIS :</span>
            {editable ? (
              <input
                type="text"
                value={employer.nis}
                onChange={(e) => onUpdateEmployer?.('nis', e.target.value)}
                placeholder="NIS..."
                title="Cliquer pour modifier le NIS avant impression"
                className="px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-300 rounded shadow-2xs hover:border-blue-400 focus:bg-blue-50/50 focus:border-blue-600 focus:outline-hidden transition-all w-32 sm:w-36 print:border-none print:bg-transparent print:p-0 print:shadow-none print:w-auto"
              />
            ) : (
              <span className="font-mono font-semibold text-slate-900">{employer.nis}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 shrink-0">RC :</span>
            {editable ? (
              <input
                type="text"
                value={employer.rc}
                onChange={(e) => onUpdateEmployer?.('rc', e.target.value)}
                placeholder="RC..."
                title="Cliquer pour modifier le RC avant impression"
                className="px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-300 rounded shadow-2xs hover:border-blue-400 focus:bg-blue-50/50 focus:border-blue-600 focus:outline-hidden transition-all w-28 sm:w-32 print:border-none print:bg-transparent print:p-0 print:shadow-none print:w-auto"
              />
            ) : (
              <span className="font-mono font-semibold text-slate-900">{employer.rc}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 shrink-0">N° CNAS :</span>
            {editable ? (
              <input
                type="text"
                value={employer.numeroCnas}
                onChange={(e) => onUpdateEmployer?.('numeroCnas', e.target.value)}
                placeholder="N° CNAS..."
                title="Cliquer pour modifier le N° CNAS avant impression"
                className="px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-300 rounded shadow-2xs hover:border-blue-400 focus:bg-blue-50/50 focus:border-blue-600 focus:outline-hidden transition-all w-28 sm:w-32 print:border-none print:bg-transparent print:p-0 print:shadow-none print:w-auto"
              />
            ) : (
              <span className="font-mono font-semibold text-slate-900">{employer.numeroCnas}</span>
            )}
          </div>
        </div>

        {/* ENCADRÉ SALARIÉ & PARAMÈTRES DU MOIS (CÔTE À CÔTE) */}
        <div className="my-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Bloc Salarié */}
          <div className="border border-slate-300 rounded-xl p-3 bg-white text-[11px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                Salarié Bénéficiaire
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                Matricule: {employee.id}
              </span>
            </div>

            <p className="font-extrabold text-slate-900 text-sm">
              {employee.nom.toUpperCase()} {employee.prenom}
            </p>
            <p className="text-slate-700">
              <span className="text-slate-500 font-medium">Fonction :</span>{' '}
              <span className="font-semibold text-slate-900">{employee.role}</span>
            </p>
            <p className="text-slate-700">
              <span className="text-slate-500 font-medium">Département :</span>{' '}
              {employee.departement}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-600 border-t border-slate-100 mt-1">
              <p>
                <span className="font-medium">N° SS :</span>{' '}
                <span className="font-mono font-semibold text-slate-800">
                  {employee.id.replace('EMP-', '16-') + '884210'}
                </span>
              </p>
              <p>
                <span className="font-medium">Embauche :</span>{' '}
                {new Date(employee.dateRecrutement).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Bloc Période & Temps de travail */}
          <div className="border border-slate-300 rounded-xl p-3 bg-white text-[11px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Modalités & Temps de Travail
              </span>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Contrat : {employee.typeContrat}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px]">
              <div>
                <span className="text-slate-500">Jours ouvrés / mois :</span>
                <p className="font-bold text-slate-900">{payslip.joursTravailles} jours</p>
              </div>
              <div>
                <span className="text-slate-500">Heures hebdo :</span>
                <p className="font-bold text-slate-900">40h ({employee.heuresTravail || '08h30 - 16h30'})</p>
              </div>
              <div>
                <span className="text-slate-500">Congés pris :</span>
                <p className="font-semibold text-slate-800">{payslip.joursConges} jour(s)</p>
              </div>
              <div>
                <span className="text-slate-500">Absences :</span>
                <p className="font-semibold text-slate-800">{payslip.joursAbsence} jour(s)</p>
              </div>
            </div>

            {payslip.heuresSupplementaires > 0 && (
              <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold">
                + {payslip.heuresSupplementaires} heures supplémentaires validées
              </div>
            )}
          </div>
        </div>

        {/* TABLEAU DES RUBRIQUES DE PAIE */}
        <div className="border border-slate-300 rounded-xl overflow-hidden my-3 shadow-2xs">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider print:bg-slate-900 print:text-white">
                <th className="py-2 px-2.5 font-bold w-12 text-center">Code</th>
                <th className="py-2 px-2.5 font-bold">Désignation de la Rubrique</th>
                <th className="py-2 px-2.5 font-bold text-right w-22">Base (DA)</th>
                <th className="py-2 px-2.5 font-bold text-center w-14">Taux</th>
                <th className="py-2 px-2.5 font-bold text-right w-24">Gains (DA)</th>
                <th className="py-2 px-2.5 font-bold text-right w-24">Retenues (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Salaire de base */}
              <tr className="hover:bg-slate-50/70">
                <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">100</td>
                <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                  Salaire de Base Mensuel
                </td>
                <td className="py-1.5 px-2.5 text-right font-mono">{formatDA(payslip.salaireBase)}</td>
                <td className="py-1.5 px-2.5 text-center text-slate-500">100%</td>
                <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                  {formatDA(payslip.salaireBase)}
                </td>
                <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
              </tr>

              {/* Indemnité de panier */}
              {payslip.primePanier > 0 && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">105</td>
                  <td className="py-1.5 px-2.5 text-slate-800">
                    Indemnité de Panier (Restauration)
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                    {formatDA(payslip.primePanier)}
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">Forfait</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-800">
                    {formatDA(payslip.primePanier)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                </tr>
              )}

              {/* Indemnité de transport */}
              {payslip.primeTransport > 0 && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">110</td>
                  <td className="py-1.5 px-2.5 text-slate-800">
                    Indemnité de Transport
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                    {formatDA(payslip.primeTransport)}
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">Forfait</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-800">
                    {formatDA(payslip.primeTransport)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                </tr>
              )}

              {/* Prime de Rendement */}
              {payslip.primeRendement > 0 && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">120</td>
                  <td className="py-1.5 px-2.5 text-slate-800">
                    Prime de Rendement / Assiduité
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                    {formatDA(payslip.primeRendement)}
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">—</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-800">
                    {formatDA(payslip.primeRendement)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                </tr>
              )}

              {/* Prime de Responsabilité */}
              {payslip.primeResponsabilite > 0 && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">130</td>
                  <td className="py-1.5 px-2.5 text-slate-800">
                    Indemnité de Responsabilité Hiérarchique
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                    {formatDA(payslip.primeResponsabilite)}
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">—</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-800">
                    {formatDA(payslip.primeResponsabilite)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                </tr>
              )}

              {/* Heures supplémentaires */}
              {payslip.heuresSuppMontant > 0 && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">140</td>
                  <td className="py-1.5 px-2.5 text-slate-800">
                    Heures Supplémentaires ({payslip.heuresSupplementaires}h majorées)
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                    {formatDA(payslip.heuresSuppMontant)}
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">—</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-800">
                    {formatDA(payslip.heuresSuppMontant)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                </tr>
              )}

              {/* Autres primes */}
              {payslip.autresPrimes > 0 && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">150</td>
                  <td className="py-1.5 px-2.5 text-slate-800">
                    Gratification Exceptionnelle & Autres Primes
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                    {formatDA(payslip.autresPrimes)}
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">—</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-800">
                    {formatDA(payslip.autresPrimes)}
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                </tr>
              )}

              {/* Cotisation CNAS Salarié 9% */}
              <tr className="bg-amber-50/40 print:bg-slate-50">
                <td className="py-1.5 px-2.5 font-mono text-center text-amber-900 font-bold">400</td>
                <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                  Cotisation Sécurité Sociale Salarié (CNAS)
                </td>
                <td className="py-1.5 px-2.5 text-right font-mono">{formatDA(payslip.cotisableCnas)}</td>
                <td className="py-1.5 px-2.5 text-center font-bold text-amber-900">9.00%</td>
                <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-900">
                  {formatDA(payslip.cnasSalarieMontant)}
                </td>
              </tr>

              {/* Retenue IRG */}
              <tr className="bg-amber-50/40 print:bg-slate-50">
                <td className="py-1.5 px-2.5 font-mono text-center text-amber-900 font-bold">500</td>
                <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                  Impôt sur le Revenu Global (IRG - Barème Algérie)
                </td>
                <td className="py-1.5 px-2.5 text-right font-mono">{formatDA(payslip.salaireImposable)}</td>
                <td className="py-1.5 px-2.5 text-center text-slate-600">Progressif</td>
                <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-900">
                  {formatDA(payslip.retenueIrg)}
                </td>
              </tr>

              {/* Avance sur salaire */}
              {payslip.avancesAcomptes > 0 && (
                <tr className="bg-amber-50/40 print:bg-slate-50">
                  <td className="py-1.5 px-2.5 font-mono text-center text-slate-600 font-semibold">600</td>
                  <td className="py-1.5 px-2.5 text-slate-800">
                    Acompte ou Avance sur salaire versé
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                    {formatDA(payslip.avancesAcomptes)}
                  </td>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">—</td>
                  <td className="py-1.5 px-2.5 text-right text-slate-300">—</td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-amber-900">
                    {formatDA(payslip.avancesAcomptes)}
                  </td>
                </tr>
              )}
            </tbody>

            {/* TOTAUX */}
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-[11px]">
                <td colSpan={4} className="py-2 px-2.5 uppercase tracking-wider text-right">
                  Totaux des Rubriques :
                </td>
                <td className="py-2 px-2.5 text-right font-mono text-slate-900">
                  {formatDA(payslip.totalGains)} DA
                </td>
                <td className="py-2 px-2.5 text-right font-mono text-amber-900">
                  {formatDA(payslip.totalRetenues)} DA
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* CADRE RECAPITULATIF & NET À PAYER (3 CARTES) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3">
          <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/80 text-[11px] text-center">
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Salaire Brut Total</span>
            <p className="text-sm sm:text-base font-extrabold font-mono text-slate-900 mt-0.5">
              {formatDA(payslip.salaireBrut)} DA
            </p>
          </div>

          <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/80 text-[11px] text-center">
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Net Imposable IRG</span>
            <p className="text-sm sm:text-base font-extrabold font-mono text-slate-900 mt-0.5">
              {formatDA(payslip.salaireImposable)} DA
            </p>
          </div>

          <div className="border-2 border-slate-900 bg-slate-900 text-white rounded-xl p-2.5 text-center shadow-xs">
            <span className="text-[10px] text-blue-200 uppercase font-extrabold tracking-wider">
              NET À PAYER
            </span>
            <p className="text-base sm:text-lg font-black font-mono tracking-tight mt-0.5 text-white">
              {formatDA(payslip.salaireNet)} DA
            </p>
          </div>
        </div>

        {/* MONTANT EN TOUTES LETTRES */}
        <div className="border-l-4 border-blue-700 bg-blue-50/70 p-2.5 rounded-r-xl my-2.5 text-[11px] print:border-slate-800 print:bg-slate-50">
          <p className="font-bold text-slate-900">
            Arrêté le présent bulletin de paie à la somme nette de :
          </p>
          <p className="font-semibold italic text-blue-950 mt-0.5">
            « {payslip.salaireNetLettres} »
          </p>
        </div>

        {/* INFORMATIONS PATRONALES */}
        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/60 my-2 text-[9.5px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
          <span>
            <strong className="text-slate-700">Cotisation Patronale CNAS (26%) :</strong>{' '}
            {formatDA(payslip.cnasPatronaleMontant)} DA
          </span>
          <span>
            <strong className="text-slate-700">Total Cotisations Sociales (35%) :</strong>{' '}
            {formatDA(payslip.cnasSalarieMontant + payslip.cnasPatronaleMontant)} DA
          </span>
          <span>
            <strong className="text-slate-700">Coût Global Employeur :</strong>{' '}
            <strong className="text-slate-900">{formatDA(payslip.coutTotalEmployeur)} DA</strong>
          </span>
        </div>

        {/* BLOC DES SIGNATURES OFFICIELLES & CACHET (SANS GRIFFE - ZONES VIERGES NETTES) */}
        <div className="mt-5 pt-3 border-t-2 border-slate-300 grid grid-cols-2 gap-4 text-[11px]">
          {/* Signature de l'employeur */}
          <div className="flex flex-col justify-between min-h-[125px] border border-slate-300 rounded-xl p-3 bg-white shadow-2xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                Pour l'Employeur SERVI-DOX
              </p>
              <p className="text-[9px] text-slate-500">
                Cachet Officiel & Signature de la Direction
              </p>
            </div>
            
            {/* Zone vierge propre pour apposer le cachet humide et la signature manuelle (AUCUNE GRIFFE) */}
            <div className="my-1.5 h-16 flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-[9px] text-slate-400 italic bg-slate-50/40 print:bg-white text-center px-2">
              (Emplacement réservé au cachet humide officiel et à la signature)
            </div>

            <div className="text-[9px] text-slate-500 text-center">
              Fait à Alger, le {new Date(payslip.datePaiement).toLocaleDateString('fr-FR')}
            </div>
          </div>

          {/* Signature du salarié */}
          <div className="flex flex-col justify-between min-h-[125px] border border-slate-300 rounded-xl p-3 bg-white shadow-2xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                L'Employé(e)
              </p>
              <p className="text-[9px] text-slate-500">
                Signature pour acquit (Mention « Lu et approuvé »)
              </p>
            </div>

            {/* Zone vierge pour la signature manuscrite du salarié */}
            <div className="my-1.5 h-16 flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-[9px] text-slate-400 italic bg-slate-50/40 print:bg-white text-center px-2">
              (Signature du salarié précédée de la mention manuscrite)
            </div>

            <div className="text-[9px] text-slate-500 text-center">
              Mention manuscrite obligatoire
            </div>
          </div>
        </div>

        {/* PIED DE PAGE LÉGAL */}
        <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[8.5px] text-slate-400">
          Document établi conformément au Code du Travail Algérien (Loi 90-11) et à la réglementation de sécurité sociale CNAS. 
          Conservez ce bulletin de paie sans limitation de durée.
        </div>
      </div>
    </div>
  );
};
