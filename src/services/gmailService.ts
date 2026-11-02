import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Provider pour l'authentification standard (Connexion rapide, sans avertissements de permissions sensibles)
const basicLoginProvider = new GoogleAuthProvider();
basicLoginProvider.setCustomParameters({ prompt: 'select_account' });
basicLoginProvider.addScope('email');
basicLoginProvider.addScope('profile');

// Provider étendu avec autorisations Google Workspace (Gmail, Sheets, Drive) pour les fonctionnalités avancées
const workspaceProvider = new GoogleAuthProvider();
workspaceProvider.setCustomParameters({ prompt: 'consent' });
workspaceProvider.addScope('email');
workspaceProvider.addScope('profile');
SCOPES.forEach((scope) => {
  try {
    workspaceProvider.addScope(scope);
  } catch {
    // Ignore scope duplication
  }
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory ONLY (do NOT store in localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (
  requestWorkspaceScopes: boolean = false
): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const targetProvider = requestWorkspaceScopes ? workspaceProvider : basicLoginProvider;
    const result = await signInWithPopup(auth, targetProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken || '' };
  } catch (error: any) {
    console.error('Erreur Firebase Auth signInWithPopup:', error?.code, error?.message);

    let friendlyMessage = 'Impossible de se connecter avec Google.';
    if (error?.code === 'auth/network-request-failed') {
      friendlyMessage = 'Erreur réseau Firebase (connexion instable ou service indisponible). Veuillez réessayer ou vous connecter avec votre identifiant et mot de passe.';
    } else if (error?.code === 'auth/popup-blocked') {
      friendlyMessage = 'La fenêtre de connexion Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up pour ce site.';
    } else if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      friendlyMessage = 'Connexion Google annulée par l\'utilisateur.';
    } else if (error?.code === 'auth/unauthorized-domain') {
      friendlyMessage = 'Ce domaine n\'est pas encore autorisé dans Firebase Authentication. Veuillez utiliser vos identifiants email/mot de passe pour vous connecter directement.';
    } else if (error?.message) {
      friendlyMessage = `Erreur de connexion : ${error.message}`;
    }

    const err = new Error(friendlyMessage);
    (err as any).code = error?.code;
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  isUnread: boolean;
}

function decodeBase64Url(base64Url: string): string {
  try {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function extractBody(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plainPart?.body?.data) {
      return decodeBase64Url(plainPart.body.data);
    }
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      return html.replace(/<[^>]*>?/gm, '');
    }
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return '';
}

export async function listGmailMessages(query: string = '', maxResults: number = 15): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Non authentifié à Gmail');

  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('maxResults', String(maxResults));
  if (query.trim()) {
    url.searchParams.set('q', query.trim());
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Erreur API Gmail (${res.status})`);
  }

  const data = await res.json();
  const messagesList = data.messages || [];

  const detailed = await Promise.all(
    messagesList.map(async (msg: { id: string; threadId: string }) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!msgRes.ok) return null;
        const full = await msgRes.json();
        const headers: Array<{ name: string; value: string }> = full.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        return {
          id: full.id,
          threadId: full.threadId,
          snippet: full.snippet || '',
          subject: getHeader('Subject') || '(Sans objet)',
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          body: extractBody(full.payload) || full.snippet || '',
          isUnread: Array.isArray(full.labelIds) && full.labelIds.includes('UNREAD'),
        } as GmailMessageSummary;
      } catch {
        return null;
      }
    })
  );

  return detailed.filter((m): m is GmailMessageSummary => m !== null);
}

export async function sendGmailMessage(to: string, subject: string, bodyText: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Non authentifié à Gmail');

  // Encode Subject in UTF-8 Base64 for French accents
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ];

  const rawMessage = encodeBase64Url(emailLines.join('\r\n'));

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Échec de l'envoi de l'e-mail (${res.status}): ${errText}`);
  }
}

export async function trashGmailMessage(messageId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Non authentifié à Gmail');

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Impossible de déplacer le message vers la corbeille (${res.status})`);
  }
}
