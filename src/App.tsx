/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClientProvider } from './context/ClientContext';
import { Navbar, Sidebar, ActiveTab } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { AdminProfilePage } from './components/AdminProfilePage';
import { ClientListPage } from './components/ClientListPage';
import { AddClientPage } from './components/AddClientPage';
import { AutoEntrepreneurPage } from './components/AutoEntrepreneurPage';
import { TeamPage } from './components/TeamPage';
import { PayrollPage } from './components/PayrollPage';
import { RevenuePage } from './components/RevenuePage';
import { AppointmentsPage } from './components/AppointmentsPage';
import { GmailPage } from './components/GmailPage';
import { GoogleSheetsPage } from './components/GoogleSheetsPage';
import { ActivityLogView } from './components/ActivityLogModal';
import { ToastContainer } from './components/Toast';
import { Client } from './types/client';

const MainApp: React.FC = () => {
  const { isAuthenticated, isMasterAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gmailTargetClient, setGmailTargetClient] = useState<Client | null>(null);
  const [targetPayrollEmployeeId, setTargetPayrollEmployeeId] = useState<string | undefined>(undefined);

  // Ensure user always lands on the Profile page right after logging in
  useEffect(() => {
    if (isAuthenticated) {
      setActiveTab('profile');
    }
  }, [isAuthenticated]);

  // If a non-master user somehow is on team or revenues, protect it
  useEffect(() => {
    if (isAuthenticated && !isMasterAdmin && (activeTab === 'team' || activeTab === 'revenues')) {
      setActiveTab('clients');
    }
  }, [isAuthenticated, isMasterAdmin, activeTab]);

  // If user is not authenticated, render the dedicated Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 print:bg-white print:block">
      {/* Lateral Sidebar Menu with all application pages */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Right Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 print:block">
        {/* Top Header Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto print:overflow-visible print:p-0 print:m-0">
          {activeTab === 'profile' && (
            <AdminProfilePage onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'clients' && (
            <ClientListPage
              onNavigateAdd={() => setActiveTab('add')}
              onSendGmail={(client) => {
                setGmailTargetClient(client);
                setActiveTab('gmail');
              }}
            />
          )}

          {activeTab === 'add' && (
            <AddClientPage onSuccessNavigate={() => setActiveTab('clients')} />
          )}

          {activeTab === 'autoentrepreneur' && (
            <AutoEntrepreneurPage
              onSendGmail={(clientInfo) => {
                setGmailTargetClient({
                  id: 'AE-GMAIL',
                  nom: clientInfo.name,
                  prenom: '',
                  dateInscription: new Date().toISOString().split('T')[0],
                  adresse: '',
                  ville: '',
                  codePostal: '',
                  email: clientInfo.email,
                  contact: '',
                  typeDossier: 'Auto-entrepreneur',
                  motifDossier: 'Communication dossier Auto-entrepreneur SERVI-DOX',
                  statut: 'En cours',
                  montantTotal: 0,
                  montantEncaisse: 0,
                  montantReste: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setActiveTab('gmail');
              }}
            />
          )}

          {activeTab === 'team' &&
            (isMasterAdmin ? (
              <TeamPage
                onNavigatePayroll={(empId) => {
                  setTargetPayrollEmployeeId(empId);
                  setActiveTab('paie');
                }}
                onSendEmployeeGmail={(email, fullName, role) => {
                  setGmailTargetClient({
                    id: 'EMP-GMAIL',
                    nom: fullName,
                    prenom: '',
                    dateInscription: new Date().toISOString().split('T')[0],
                    adresse: '',
                    ville: '',
                    codePostal: '',
                    email,
                    contact: '',
                    typeDossier: 'Autre dossier',
                    motifDossier: `Communication interne Équipe SERVI-DOX (${role})`,
                    statut: 'En cours',
                    montantTotal: 0,
                    montantEncaisse: 0,
                    montantReste: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                  setActiveTab('gmail');
                }}
              />
            ) : (
              <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">🔒</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Accès Restreint à l'Équipe</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conformément à la politique de confidentialité de <strong>SERVI-DOX</strong>, seul le compte Administrateur Principal autorisé (<strong>zinemoh106@gmail.com</strong>) dispose des droits d'accès pour voir l'équipe et modifier les employés.
                </p>
                <button
                  onClick={() => setActiveTab('clients')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Retourner à la gestion des clients
                </button>
              </div>
            ))}

          {activeTab === 'paie' && (
            <PayrollPage initialEmployeeId={targetPayrollEmployeeId} />
          )}

          {activeTab === 'revenues' &&
            (isMasterAdmin ? (
              <RevenuePage />
            ) : (
              <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">🔒</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Accès Restreint aux Revenus</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Le tableau des revenus et de chiffre d'affaires est strictement réservé à la Direction Principale (<strong>zinemoh106@gmail.com</strong>).
                </p>
                <button
                  onClick={() => setActiveTab('clients')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Retourner à la gestion des clients
                </button>
              </div>
            ))}

          {activeTab === 'appointments' && (
            <AppointmentsPage
              onSendGmail={(email, fullName, subject) => {
                setGmailTargetClient({
                  id: 'RDV-GMAIL',
                  nom: fullName,
                  prenom: '',
                  dateInscription: new Date().toISOString().split('T')[0],
                  adresse: '',
                  ville: '',
                  codePostal: '',
                  email,
                  contact: '',
                  typeDossier: 'Autre dossier',
                  motifDossier: subject,
                  statut: 'En cours',
                  montantTotal: 0,
                  montantEncaisse: 0,
                  montantReste: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setActiveTab('gmail');
              }}
            />
          )}

          {activeTab === 'gmail' && (
            <GmailPage
              initialRecipientClient={gmailTargetClient}
              onClearInitialClient={() => setGmailTargetClient(null)}
            />
          )}

          {activeTab === 'sheets' && <GoogleSheetsPage />}

          {activeTab === 'logs' && <ActivityLogView />}
        </main>
      </div>

      {/* Global Toast Notifications for real-time changes */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ClientProvider>
        <MainApp />
      </ClientProvider>
    </AuthProvider>
  );
}
