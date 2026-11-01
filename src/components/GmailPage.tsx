import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  listGmailMessages,
  sendGmailMessage,
  trashGmailMessage,
  GmailMessageSummary,
} from '../services/gmailService';
import { useClients } from '../context/ClientContext';
import { Client } from '../types/client';
import { formatDA } from '../utils/format';
import {
  Mail,
  Send,
  RefreshCw,
  Trash2,
  Search,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  FileText,
  Sparkles,
  LogOut,
  Inbox,
} from 'lucide-react';

interface GmailPageProps {
  initialRecipientClient?: Client | null;
  onClearInitialClient?: () => void;
}

export const GmailPage: React.FC<GmailPageProps> = ({
  initialRecipientClient,
  onClearInitialClient,
}) => {
  const { clients, showToast } = useClients();

  const [needsAuth, setNeedsAuth] = useState(true);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Messages list state
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  // Mandatory Explicit Confirmation Modal State for Sending or Deleting
  const [confirmSendModal, setConfirmSendModal] = useState(false);
  const [confirmTrashMessage, setConfirmTrashMessage] = useState<GmailMessageSummary | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setGoogleUser(user);
        setNeedsAuth(false);
        fetchMessages('');
      },
      () => {
        setGoogleUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  // Pre-populate compose when opened from a specific client row
  useEffect(() => {
    if (initialRecipientClient) {
      applyClientTemplate(initialRecipientClient, 'suivi');
      setSelectedClientId(initialRecipientClient.id);
      setIsComposeOpen(true);
      if (onClearInitialClient) onClearInitialClient();
    }
  }, [initialRecipientClient]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setNeedsAuth(false);
        showToast('Compte Gmail connecté', `Connecté avec ${result.user.email}`);
        await fetchMessages('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible de se connecter à Google Gmail.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnectGmail = async () => {
    await googleLogout();
    setGoogleUser(null);
    setNeedsAuth(true);
    setMessages([]);
    setSelectedMessage(null);
    showToast('Déconnecté de Gmail', 'Votre session Gmail a été fermée.', 'info');
  };

  const fetchMessages = async (q: string = searchQuery) => {
    setIsLoadingMessages(true);
    setErrorMsg(null);
    try {
      const list = await listGmailMessages(q, 15);
      setMessages(list);
      if (list.length > 0 && !selectedMessage) {
        setSelectedMessage(list[0]);
      }
    } catch (err: any) {
      if (err?.message?.includes('Non authentifié') || err?.message?.includes('401')) {
        setNeedsAuth(true);
      } else {
        setErrorMsg(err?.message || 'Erreur lors du chargement des e-mails.');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const applyClientTemplate = (
    client: Client,
    templateType: 'suivi' | 'relance_paiement' | 'dossier_valide'
  ) => {
    setToEmail(client.email);
    const reste =
      client.montantReste !== undefined
        ? client.montantReste
        : Math.max(0, (client.montantTotal || 0) - (client.montantEncaisse || 0));

    if (templateType === 'suivi') {
      setSubject(`SERVI-DOX — Suivi de votre dossier ${client.typeDossier} (${client.nom} ${client.prenom})`);
      setBodyText(
        `Bonjour ${client.prenom} ${client.nom},\n\n` +
          `Nous vous contactons depuis le cabinet SERVI-DOX concernant l'avancement de votre dossier :\n` +
          `- Type de dossier : ${client.typeDossier}\n` +
          `- Motif : ${client.motifDossier}\n` +
          `- Statut actuel : ${client.statut}\n` +
          `- Montant total : ${formatDA(client.montantTotal)}\n` +
          `- Montant encaissé : ${formatDA(client.montantEncaisse)}\n` +
          `- Reste à payer : ${formatDA(reste)}\n\n` +
          `Nous restons à votre entière disposition pour toute information complémentaire.\n\n` +
          `Cordialement,\n` +
          `L'équipe SERVI-DOX`
      );
    } else if (templateType === 'relance_paiement') {
      setSubject(`SERVI-DOX — Rappel de règlement dossier ${client.typeDossier}`);
      setBodyText(
        `Bonjour ${client.prenom} ${client.nom},\n\n` +
          `Sauf erreur de notre part, un solde reste à régler concernant votre dossier "${client.motifDossier}" :\n` +
          `- Montant total convenu : ${formatDA(client.montantTotal)}\n` +
          `- Montant déjà réglé : ${formatDA(client.montantEncaisse)}\n` +
          `- Solde restant à payer : ${formatDA(reste)}\n\n` +
          `Nous vous remercions de bien vouloir procéder au règlement afin de finaliser les démarches.\n\n` +
          `Cordialement,\n` +
          `Le service comptabilité SERVI-DOX`
      );
    } else {
      setSubject(`SERVI-DOX — Votre dossier ${client.typeDossier} est validé`);
      setBodyText(
        `Bonjour ${client.prenom} ${client.nom},\n\n` +
          `Nous avons le plaisir de vous informer que votre dossier (${client.motifDossier}) est désormais validé et prêt.\n\n` +
          `Vous pouvez passer à notre bureau SERVI-DOX pour récupérer vos documents officiels.\n\n` +
          `Cordialement,\n` +
          `L'équipe SERVI-DOX`
      );
    }
  };

  const handleClientSelectChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      applyClientTemplate(found, 'suivi');
    }
  };

  const handleRequestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !bodyText.trim()) {
      alert('Veuillez remplir le destinataire, l\'objet et le message.');
      return;
    }
    // Open mandatory explicit user confirmation modal before sending email
    setConfirmSendModal(true);
  };

  const executeConfirmedSend = async () => {
    setConfirmSendModal(false);
    setIsSending(true);
    try {
      await sendGmailMessage(toEmail.trim(), subject.trim(), bodyText);
      showToast('E-mail envoyé via Gmail', `Message transmis avec succès à ${toEmail}`);
      setIsComposeOpen(false);
      setToEmail('');
      setSubject('');
      setBodyText('');
      setSelectedClientId('');
      await fetchMessages(searchQuery);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de l\'envoi de l\'e-mail.');
    } finally {
      setIsSending(false);
    }
  };

  const executeConfirmedTrash = async () => {
    if (!confirmTrashMessage) return;
    const target = confirmTrashMessage;
    setConfirmTrashMessage(null);
    try {
      await trashGmailMessage(target.id);
      setMessages((prev) => prev.filter((m) => m.id !== target.id));
      if (selectedMessage?.id === target.id) {
        setSelectedMessage(null);
      }
      showToast('Message supprimé', `L'e-mail "${target.subject}" a été placé dans la corbeille Gmail.`, 'info');
    } catch (err: any) {
      alert(err?.message || 'Impossible de supprimer cet e-mail.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Messagerie Google Workspace Intégrée
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-700" />
            <span>Espace Gmail SERVI-DOX</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consultez vos e-mails clients et envoyez des notifications de suivi ou de règlement directement depuis votre compte Gmail
          </p>
        </div>

        {!needsAuth && googleUser && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-medium truncate max-w-[180px]">{googleUser.email}</span>
            </div>

            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau message client</span>
            </button>

            <button
              onClick={handleDisconnectGmail}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-lg transition-colors"
              title="Déconnecter le compte Gmail"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnecter Gmail</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Notification Gmail</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Official Sign in with Google Prompt if not authenticated */}
      {needsAuth ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-8 shadow-xs space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              Connectez votre compte Gmail à SERVI-DOX
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Autorisez l'accès avec votre compte Google pour lire vos courriels professionnels, rechercher les échanges avec vos clients et envoyer des notifications de suivi de dossier ou de reste à payer en Dinars Algériens (DA).
            </p>
          </div>

          <div className="flex justify-center pt-2">
            {/* Official Sign in with Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-300 rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <div className="w-5 h-5 shrink-0">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-full h-full block"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span>{isLoggingIn ? 'Connexion à Google...' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Authenticated Gmail Workspace View */
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchMessages(searchQuery);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans votre boîte Gmail (email client, nom, dossier, sujet)..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      fetchMessages('');
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoadingMessages}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                Rechercher
              </button>
            </form>

            {/* Quick filter by existing client email */}
            <div className="flex items-center gap-2">
              {clients.length > 0 && (
                <select
                  onChange={(e) => {
                    const email = e.target.value;
                    setSearchQuery(email);
                    fetchMessages(email);
                  }}
                  value=""
                  className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
                >
                  <option value="">Filtrer par client SERVI-DOX...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.nom.toUpperCase()} {c.prenom} ({c.email})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => fetchMessages(searchQuery)}
                disabled={isLoadingMessages}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Actualiser la boîte de réception"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Split Inbox & Message Reader */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Message List (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5 text-blue-700" />
                  Messages Gmail ({messages.length})
                </span>
              </div>

              {isLoadingMessages ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <RefreshCw className="w-5 h-5 text-blue-700 animate-spin mx-auto" />
                  <p>Synchronisation de vos messages Gmail en cours...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  Aucun e-mail trouvé pour cette recherche.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
                  {messages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70 border-l-2 border-blue-700'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-xs truncate ${
                              msg.isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                            }`}
                          >
                            {msg.from}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {msg.date ? new Date(msg.date).toLocaleDateString('fr-FR') : ''}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                          {msg.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {msg.snippet}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Message Reader (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs min-h-[420px] flex flex-col">
              {selectedMessage ? (
                <>
                  <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-900 leading-snug">
                        {selectedMessage.subject}
                      </h2>
                      <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                        <p>
                          <span className="text-slate-400">De :</span>{' '}
                          <strong className="text-slate-800">{selectedMessage.from}</strong>
                        </p>
                        <p>
                          <span className="text-slate-400">À :</span> {selectedMessage.to}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {selectedMessage.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const replyTo = selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from;
                          setToEmail(replyTo);
                          setSubject(
                            selectedMessage.subject.startsWith('Re:')
                              ? selectedMessage.subject
                              : `Re: ${selectedMessage.subject}`
                          );
                          setBodyText(`\n\n--- En réponse à ${selectedMessage.from} ---\n${selectedMessage.snippet}`);
                          setIsComposeOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Répondre</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmTrashMessage(selectedMessage)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Mettre à la corbeille"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto">
                    <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedMessage.body}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                  <Mail className="w-10 h-10 mb-2 stroke-1" />
                  <p className="text-xs">Sélectionnez un e-mail dans la liste pour afficher son contenu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Nouveau Courriel Gmail · SERVI-DOX
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Envoyer un e-mail à un client
                </h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSendEmail} className="p-6 space-y-4">
              {/* Select existing client & quick templates */}
              {clients.length > 0 && (
                <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                      <span>Sélectionner un client SERVI-DOX :</span>
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleClientSelectChange(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-blue-300 rounded-lg bg-white text-slate-900 font-medium"
                    >
                      <option value="">-- Choisir un dossier client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom.toUpperCase()} {c.prenom} — {c.typeDossier} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClientId && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-600">Modèles rapides :</span>
                      <button
                        type="button"
                        onClick={() => {
                          const c = clients.find((cl) => cl.id === selectedClientId);
                          if (c) applyClientTemplate(c, 'suivi');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md"
                      >
                        État du dossier
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const c = clients.find((cl) => cl.id === selectedClientId);
                          if (c) applyClientTemplate(c, 'relance_paiement');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md"
                      >
                        Relance reste à payer (DA)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const c = clients.find((cl) => cl.id === selectedClientId);
                          if (c) applyClientTemplate(c, 'dossier_valide');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md"
                      >
                        Dossier prêt / validé
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destinataire (Email) *
                </label>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="client@exemple.dz"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objet *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="SERVI-DOX — Suivi de votre dossier"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message *
                </label>
                <textarea
                  rows={8}
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Rédigez votre message..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Envoi en cours...' : 'Vérifier & Envoyer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Confirmation Modal before Sending Email */}
      {confirmSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-blue-700">
              <Send className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Confirmer l'envoi de l'e-mail Gmail
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vous êtes sur le point d'envoyer un e-mail réel depuis votre compte Gmail (<strong>{googleUser?.email}</strong>) :
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <p>
                <span className="text-slate-500">Destinataire :</span>{' '}
                <strong className="text-slate-900">{toEmail}</strong>
              </p>
              <p>
                <span className="text-slate-500">Objet :</span>{' '}
                <strong className="text-slate-900">{subject}</strong>
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeConfirmedSend}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Confirmer l'envoi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Confirmation Modal before Moving Email to Trash */}
      {confirmTrashMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Supprimer cet e-mail Gmail ?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirmez-vous le déplacement de cet e-mail vers la corbeille de votre compte Gmail ?
            </p>
            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{confirmTrashMessage.subject}</p>
              <p className="text-slate-500">De : {confirmTrashMessage.from}</p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTrashMessage(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeConfirmedTrash}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
