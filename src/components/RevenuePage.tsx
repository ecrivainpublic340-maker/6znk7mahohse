import React, { useState, useMemo } from 'react';
import { useClients } from '../context/ClientContext';
import { formatDA } from '../utils/format';
import { exportFinancialReportPDF } from '../utils/pdfExport';
import { 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  FileDown,
  DollarSign, 
  PieChart, 
  FolderKanban,
  ArrowUpRight
} from 'lucide-react';
import { TypeDossier, TARIFS_SERVIDOX_DA } from '../types/client';

export const RevenuePage: React.FC = () => {
  const { clients } = useClients();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeView, setActiveView] = useState<'semaine' | 'mois' | 'annuel' | 'tous'>('tous');

  // Date helpers
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Helper to get start of current week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Global totals in Algerian Dinars
  const globalFinancials = useMemo(() => {
    let weekTotal = 0;
    let weekEncaisse = 0;
    let weekReste = 0;
    let weekCount = 0;

    let monthTotal = 0;
    let monthEncaisse = 0;
    let monthReste = 0;
    let monthCount = 0;

    let yearTotal = 0;
    let yearEncaisse = 0;
    let yearReste = 0;
    let yearCount = 0;

    clients.forEach((c) => {
      const clientDate = new Date(c.dateInscription || c.createdAt);
      const total = c.montantTotal || 0;
      const encaisse = c.montantEncaisse || 0;
      const reste = c.montantReste !== undefined ? c.montantReste : Math.max(0, total - encaisse);

      // Annual
      if (clientDate.getFullYear() === selectedYear) {
        yearTotal += total;
        yearEncaisse += encaisse;
        yearReste += reste;
        yearCount++;

        // Monthly
        if (clientDate.getMonth() === currentMonth) {
          monthTotal += total;
          monthEncaisse += encaisse;
          monthReste += reste;
          monthCount++;
        }

        // Weekly
        if (clientDate >= startOfWeek) {
          weekTotal += total;
          weekEncaisse += encaisse;
          weekReste += reste;
          weekCount++;
        }
      }
    });

    const recoveryRate = yearTotal > 0 ? Math.round((yearEncaisse / yearTotal) * 100) : 0;

    return {
      week: { total: weekTotal, encaisse: weekEncaisse, reste: weekReste, count: weekCount },
      month: { total: monthTotal, encaisse: monthEncaisse, reste: monthReste, count: monthCount },
      year: { total: yearTotal, encaisse: yearEncaisse, reste: yearReste, count: yearCount },
      recoveryRate,
    };
  }, [clients, selectedYear, currentMonth, startOfWeek]);

  // Breakdown by type of dossier (Frais SERVI-DOX hors frais de dossier)
  const breakdownByType = useMemo(() => {
    const types: TypeDossier[] = [
      'Entreprise',
      'RC',
      'Auto-entrepreneur',
      'Inscription & Suivi (Bureau)',
      'Inscription & Suivi (Hors Wilaya)',
      'Autre dossier',
    ];
    return types.map((type) => {
      const matching = clients.filter((c) => c.typeDossier === type);
      const total = matching.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
      const encaisse = matching.reduce((acc, c) => acc + (c.montantEncaisse || 0), 0);
      const reste = matching.reduce((acc, c) => acc + (c.montantReste !== undefined ? c.montantReste : Math.max(0, (c.montantTotal || 0) - (c.montantEncaisse || 0))), 0);
      return {
        type,
        tarifOfficiel: TARIFS_SERVIDOX_DA[type] || 20000,
        count: matching.length,
        total,
        encaisse,
        reste,
      };
    });
  }, [clients]);

  // Monthly breakdown for selected year (12 months)
  const monthlyBreakdown = useMemo(() => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    return monthNames.map((name, idx) => {
      const matching = clients.filter((c) => {
        const d = new Date(c.dateInscription || c.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      const total = matching.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
      const encaisse = matching.reduce((acc, c) => acc + (c.montantEncaisse || 0), 0);
      const reste = matching.reduce((acc, c) => acc + (c.montantReste !== undefined ? c.montantReste : Math.max(0, (c.montantTotal || 0) - (c.montantEncaisse || 0))), 0);

      return {
        monthNumber: idx + 1,
        monthName: name,
        count: matching.length,
        total,
        encaisse,
        reste,
        isCurrentMonth: idx === currentMonth && selectedYear === currentYear,
      };
    });
  }, [clients, selectedYear, currentMonth, currentYear]);

  // Weekly breakdown: clients registered in the current week
  const currentWeekClients = useMemo(() => {
    return clients.filter((c) => {
      const d = new Date(c.dateInscription || c.createdAt);
      return d >= startOfWeek;
    });
  }, [clients, startOfWeek]);

  // Export financial report in CSV
  const handleExportFinancialReport = () => {
    if (clients.length === 0) {
      alert('Aucune donnée financière à exporter.');
      return;
    }

    const headers = [
      'Mois',
      'Dossiers',
      'Total Facturé (DA)',
      'Total Encaissé (DA)',
      'Reste à Payer (DA)',
    ];

    const rows = monthlyBreakdown.map((m) => [
      m.monthName,
      m.count,
      m.total,
      m.encaisse,
      m.reste,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SERVI-DOX_Rapport_Financier_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Comptabilité & Frais SERVI-DOX (Hors frais de dossier)
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Tableau des Revenus SERVI-DOX
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Calcul exclusif des Frais SERVI-DOX en Dinars Algériens (DA) : SARL/EURL 100 000 DA · RC 50 000 DA · Auto-entrepreneur 40 000 DA · Suivi Bureau 12 000 DA · Hors Wilaya 15 000 DA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value={2026}>Année 2026</option>
            <option value={2025}>Année 2025</option>
            <option value={2027}>Année 2027</option>
          </select>

          <button
            onClick={() =>
              exportFinancialReportPDF({
                selectedYear,
                globalFinancials,
                breakdownByType,
                monthlyBreakdown,
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
            title="Exporter le rapport financier complet au format PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exporter Rapport PDF</span>
          </button>

          <button
            onClick={handleExportFinancialReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Semaine, Mois, Année) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* REVENU SEMAINE */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Revenus de la Semaine
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {globalFinancials.week.count} dossier{globalFinancials.week.count > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500 block">Total facturé cette semaine</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                {formatDA(globalFinancials.week.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block font-medium">Encaissé</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {formatDA(globalFinancials.week.encaisse)}
                </span>
              </div>
              <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                <span className="text-[11px] text-amber-700 block font-medium">Reste dû</span>
                <span className="font-bold text-amber-800 font-mono">
                  {formatDA(globalFinancials.week.reste)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REVENU MOIS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-700" />
              Revenus du Mois en Cours
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {globalFinancials.month.count} dossier{globalFinancials.month.count > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500 block">Total facturé ce mois</span>
              <span className="text-2xl font-extrabold text-indigo-900 font-mono tabular-nums">
                {formatDA(globalFinancials.month.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block font-medium">Encaissé</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {formatDA(globalFinancials.month.encaisse)}
                </span>
              </div>
              <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                <span className="text-[11px] text-amber-700 block font-medium">Reste dû</span>
                <span className="font-bold text-amber-800 font-mono">
                  {formatDA(globalFinancials.month.reste)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REVENU ANNUEL */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
              Revenus Annuels ({selectedYear})
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {globalFinancials.year.count} dossier{globalFinancials.year.count > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500 block">Chiffre d'affaires annuel total</span>
              <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
                {formatDA(globalFinancials.year.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block font-medium">Total Encaissé</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {formatDA(globalFinancials.year.encaisse)}
                </span>
              </div>
              <div className="p-2 bg-rose-50/60 rounded-lg border border-rose-100">
                <span className="text-[11px] text-rose-700 block font-medium">Créances à recouvrer</span>
                <span className="font-bold text-rose-800 font-mono">
                  {formatDA(globalFinancials.year.reste)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Type de Dossier */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-blue-700" />
          <span>Répartition Financière par Type de Dossier</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-4">Type de Dossier</th>
                <th className="py-2.5 px-4 text-right">Barème Frais SERVI-DOX</th>
                <th className="py-2.5 px-4 text-center">Nombre de Dossiers</th>
                <th className="py-2.5 px-4 text-right">Total Frais SERVI-DOX (DA)</th>
                <th className="py-2.5 px-4 text-right">Montant Encaissé (DA)</th>
                <th className="py-2.5 px-4 text-right">Reste à Payer (DA)</th>
                <th className="py-2.5 px-4 text-center">Taux d'encaissement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breakdownByType.map((row) => {
                const rate = row.total > 0 ? Math.round((row.encaisse / row.total) * 100) : 0;
                return (
                  <tr key={row.type} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.type === 'Entreprise' ? 'Création Entreprise (SARL / EURL)' : row.type}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700 font-semibold">
                      {formatDA(row.tarifOfficiel)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{row.count}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatDA(row.total)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                      {formatDA(row.encaisse)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                      {formatDA(row.reste)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      <span className={rate === 100 ? 'text-emerald-700' : 'text-slate-700'}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Revenue Table: Monthly Analysis for the Year */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Tableau Mensuel & Annuel des Revenus ({selectedYear})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique complet mois par mois des montants facturés, perçus et soldes en attente
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Mois</th>
                <th className="py-3 px-4 text-center">Dossiers Enregistrés</th>
                <th className="py-3 px-4 text-right">Total Facturé (DA)</th>
                <th className="py-3 px-4 text-right">Montant Encaissé (DA)</th>
                <th className="py-3 px-4 text-right">Reste à Payer (DA)</th>
                <th className="py-3 px-4 text-center">Statut d'encaissement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBreakdown.map((m) => {
                const rate = m.total > 0 ? Math.round((m.encaisse / m.total) * 100) : 0;
                return (
                  <tr
                    key={m.monthNumber}
                    className={`hover:bg-slate-50 transition-colors ${
                      m.isCurrentMonth ? 'bg-blue-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {m.monthName} {m.isCurrentMonth && (
                        <span className="ml-2 text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-normal">
                          Mois actuel
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {m.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatDA(m.total)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                      {formatDA(m.encaisse)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                      {formatDA(m.reste)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.total === 0 ? (
                        <span className="text-[11px] text-slate-400">—</span>
                      ) : m.reste === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Soldé (100%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {rate}% perçu
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="py-3 px-4 uppercase text-xs">Total Annuel {selectedYear}</td>
                <td className="py-3 px-4 text-center font-mono">{globalFinancials.year.count}</td>
                <td className="py-3 px-4 text-right font-mono text-sm">{formatDA(globalFinancials.year.total)}</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-emerald-800">{formatDA(globalFinancials.year.encaisse)}</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-amber-800">{formatDA(globalFinancials.year.reste)}</td>
                <td className="py-3 px-4 text-center font-mono text-xs text-blue-800">{globalFinancials.recoveryRate}% global</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
