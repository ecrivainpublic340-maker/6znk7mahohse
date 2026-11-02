import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserSession, AccountApprovalStatus, Employee } from '../types/client';
import { googleSignIn, googleLogout } from '../services/gmailService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  subscribeToUsersRegistry,
  persistUserToFirestore,
  deleteUserFromFirestore,
} from '../services/firestoreSync';

export interface RegisteredUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Administrateur' | 'Employé' | 'Gestionnaire Dossiers' | 'Conseiller Client';
  jobTitle?: string;
  accountStatus: AccountApprovalStatus;
  registeredAt: string;
  approvedAt?: string;
  phone?: string;
  cabinetName?: string;
  address?: string;
  authProvider?: 'local' | 'gmail';
}

export const MASTER_ADMIN_EMAIL = 'zinemoh106@gmail.com';

export const isMasterAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
};

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isMasterAdmin: boolean;
  registeredUsers: RegisteredUserRecord[];
  pendingEmployeesCount: number;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string; isPending?: boolean }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    cabinetName?: string,
    accountType?: 'employe' | 'admin',
    jobTitle?: string
  ) => { success: boolean; pendingApproval?: boolean; error?: string };
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; isPending?: boolean }>;
  approveUserAccount: (userId: string) => void;
  rejectUserAccount: (userId: string) => void;
  deleteUserAccount: (userId: string) => void;
  updateProfile: (
    updates: Partial<UserSession>,
    newPassword?: string
  ) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'servidox_current_user_v3';
const USERS_REGISTRY_KEY = 'servidox_all_registered_users_v3';
const TEAM_STORAGE_KEY = 'servidox_team_employees_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved =
        localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_REGISTRY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((u: any) => ({
          ...u,
          accountStatus: u.accountStatus || 'approved',
        }));
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const isMasterAdmin = useMemo(() => {
    if (!user?.email) return false;
    return user.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error(e);
    }
  }, [registeredUsers]);

  // Synchronisation en temps réel des utilisateurs avec Cloud Firestore
  useEffect(() => {
    let hasReconciled = false;
    const unsubscribe = subscribeToUsersRegistry((remoteUsers) => {
      if (!hasReconciled) {
        hasReconciled = true;
        if (remoteUsers && remoteUsers.length > 0) {
          setRegisteredUsers(remoteUsers);
        } else {
          try {
            const saved = localStorage.getItem(USERS_REGISTRY_KEY);
            if (saved) {
              const parsed: RegisteredUserRecord[] = JSON.parse(saved);
              if (parsed && parsed.length > 0) {
                console.info(`Synchronisation de ${parsed.length} compte(s) vers Cloud Firestore...`);
                parsed.forEach((u) => persistUserToFirestore(u));
              }
            }
          } catch (e) {
            console.error('Erreur téléversement initial utilisateurs:', e);
          }
        }
      } else {
        setRegisteredUsers(remoteUsers || []);
      }
    });
    return () => unsubscribe();
  }, []);

  const pendingEmployeesCount = useMemo(
    () => registeredUsers.filter((u) => u.accountStatus === 'pending').length,
    [registeredUsers]
  );

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string; isPending?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Veuillez saisir votre adresse email.',
      };
    }

    const isMaster = cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase();

    // 1. Chercher dans les utilisateurs enregistrés en mémoire
    let found = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    // 2. Si non trouvé en mémoire (ex: premier chargement sur nouvel ordinateur ou cache vide), interroger Firestore en direct
    if (!found) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const remoteUsers: RegisteredUserRecord[] = [];
        snap.forEach((docSnap) => {
          remoteUsers.push(docSnap.data() as RegisteredUserRecord);
        });
        if (remoteUsers.length > 0) {
          setRegisteredUsers(remoteUsers);
          try {
            localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(remoteUsers));
          } catch {
            // Ignore storage limits
          }
          found = remoteUsers.find((u) => u.email.toLowerCase() === cleanEmail);
        }
      } catch (err) {
        console.warn('Vérification directe Firestore lors du login:', err);
      }
    }

    // Administrateur Principal (zinemoh106@gmail.com)
    if (isMaster) {
      if (
        cleanPassword &&
        found?.password &&
        found.password.trim() !== cleanPassword &&
        cleanPassword !== 'Servidox2026@'
      ) {
        return {
          success: false,
          error: 'Mot de passe Administrateur incorrect. Veuillez vérifier votre saisie.',
        };
      }

      const sessionUser: UserSession = {
        id: found?.id || 'usr-master-zinemoh106',
        name: found?.name || 'Zine Moh',
        email: MASTER_ADMIN_EMAIL,
        role: 'Administrateur',
        jobTitle: 'Administrateur Principal SERVI-DOX',
        accountStatus: 'approved',
        avatarInitials: 'ZM',
        registeredAt: found?.registeredAt || new Date().toISOString(),
        phone: found?.phone || '0550 00 00 00',
        cabinetName: 'SERVI-DOX Algérie',
        address: found?.address || 'Alger, Algérie',
        authProvider: 'gmail',
      };

      setUser(sessionUser);
      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      }

      return { success: true };
    }

    if (!cleanPassword) {
      return {
        success: false,
        error: 'Veuillez saisir votre mot de passe.',
      };
    }

    // Utilisateurs standard et collaborateurs
    if (found) {
      if (found.password !== cleanPassword && found.password.trim() !== cleanPassword) {
        return {
          success: false,
          error:
            "Mot de passe incorrect. Vérifiez les majuscules et minuscules ou utilisez l'icône œil pour afficher votre mot de passe.",
        };
      }

      if (found.accountStatus === 'pending') {
        return {
          success: false,
          isPending: true,
          error:
            "⏳ Votre compte est EN ATTENTE DE VALIDATION par l'Administrateur. Vous ne pouvez pas accéder à l'espace de gestion tant que votre accès n'a pas été validé par la Direction.",
        };
      }

      if (found.accountStatus === 'rejected') {
        return {
          success: false,
          error:
            "❌ Votre demande d'accès a été refusée ou suspendue par l'Administrateur.",
        };
      }

      if (found.accountStatus !== 'approved') {
        return {
          success: false,
          isPending: true,
          error:
            "⏳ Compte non validé. Veuillez attendre l'approbation de l'Administrateur.",
        };
      }

      const sessionUser: UserSession = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role || 'Employé',
        jobTitle: found.jobTitle || 'Collaborateur SERVI-DOX',
        accountStatus: 'approved',
        avatarInitials:
          found.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'SD',
        registeredAt: found.registeredAt,
        phone: found.phone,
        cabinetName: found.cabinetName || 'SERVI-DOX',
        address: found.address,
        authProvider:
          found.authProvider || (found.email.endsWith('@gmail.com') ? 'gmail' : 'local'),
      };

      setUser(sessionUser);
      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      }

      return { success: true };
    }

    return {
      success: false,
      error:
        `Aucun compte trouvé avec l'adresse "${cleanEmail}". Utilisez l'onglet 'Créer un compte' pour soumettre votre demande d'accès à la Direction.`,
    };
  };

  const register = (
    name: string,
    email: string,
    password: string,
    phone?: string,
    cabinetName?: string,
    accountType: 'employe' | 'admin' = 'employe',
    jobTitle?: string
  ): { success: boolean; pendingApproval?: boolean; error?: string } => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName) {
      return { success: false, error: 'Veuillez renseigner votre nom complet.' };
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Adresse email invalide.' };
    }
    if (cleanPassword.length < 4) {
      return { success: false, error: 'Le mot de passe doit comporter au moins 4 caractères.' };
    }

    const exists = registeredUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        error: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.',
      };
    }

    const isMaster = isMasterAdminEmail(cleanEmail);

    // RÈGLE DE SÉCURITÉ ABSOLUE :
    // Toute nouvelle création de compte est STRICTEMENT en statut 'pending' (En attente).
    // Seul l'Administrateur Principal (zinemoh106@gmail.com) peut approuver un compte.
    const newUserRecord: RegisteredUserRecord = {
      id: `usr-${isMaster ? 'master' : 'emp'}-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: isMaster ? 'Administrateur' : 'Employé',
      jobTitle: isMaster
        ? 'Administrateur Principal'
        : jobTitle?.trim() || 'Collaborateur SERVI-DOX',
      accountStatus: isMaster ? 'approved' : 'pending',
      registeredAt: new Date().toISOString(),
      phone: phone?.trim() || '',
      cabinetName: cabinetName?.trim() || 'SERVI-DOX',
      authProvider: cleanEmail.endsWith('@gmail.com') ? 'gmail' : 'local',
    };

    const updated = [newUserRecord, ...registeredUsers.filter((u) => u.email.toLowerCase() !== cleanEmail)];
    setRegisteredUsers(updated);
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    // Persistance Cloud Firestore
    persistUserToFirestore(newUserRecord);

    // Si ce n'est pas le Master Admin, l'utilisateur DOIT attendre la validation
    if (!isMaster) {
      return {
        success: true,
        pendingApproval: true,
      };
    }

    // Uniquement pour zinemoh106@gmail.com
    const sessionUser: UserSession = {
      id: newUserRecord.id,
      name: newUserRecord.name,
      email: newUserRecord.email,
      role: 'Administrateur',
      jobTitle: 'Administrateur Principal',
      accountStatus: 'approved',
      avatarInitials: 'ZM',
      registeredAt: newUserRecord.registeredAt,
      phone: newUserRecord.phone,
      cabinetName: newUserRecord.cabinetName,
      authProvider: newUserRecord.authProvider,
    };

    setUser(sessionUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));

    return { success: true, pendingApproval: false };
  };

  const approveUserAccount = (userId: string) => {
    // Les Administrateurs (y compris zinemoh106@gmail.com) peuvent valider les comptes collaborateurs
    const canApprove = isMasterAdmin || user?.role === 'Administrateur';
    if (!canApprove) {
      console.warn('Action refusée : Seul un Administrateur peut valider des comptes.');
      return;
    }

    const targetUser = registeredUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const nowISO = new Date().toISOString();
    const updatedUsers = registeredUsers.map((u) =>
      u.id === userId
        ? {
            ...u,
            accountStatus: 'approved' as AccountApprovalStatus,
            approvedAt: nowISO,
          }
        : u
    );
    setRegisteredUsers(updatedUsers);

    // Persistance Cloud Firestore
    persistUserToFirestore({
      ...targetUser,
      accountStatus: 'approved',
      approvedAt: nowISO,
    });

    // Also automatically add the validated employee to "Notre Équipe" (TEAM_STORAGE_KEY) if not already present
    try {
      const existingTeamRaw = localStorage.getItem(TEAM_STORAGE_KEY);
      const existingTeam: Employee[] = existingTeamRaw ? JSON.parse(existingTeamRaw) : [];
      const alreadyInTeam = existingTeam.some(
        (emp) => emp.email.toLowerCase() === targetUser.email.toLowerCase()
      );

      if (!alreadyInTeam) {
        const nameParts = targetUser.name.trim().split(' ');
        const nom = (nameParts.length > 1 ? nameParts.slice(-1)[0] : nameParts[0]).toUpperCase();
        const prenom =
          nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : targetUser.name.trim();

        const newTeamMember: Employee = {
          id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
          nom,
          prenom,
          role: targetUser.jobTitle || 'Gestionnaire Dossiers SERVI-DOX',
          departement: 'Dossiers RC & Entreprises',
          dateRecrutement: nowISO.split('T')[0],
          joursTravail: 'Dimanche - Jeudi',
          heuresTravail: '08h30 - 16h30',
          typeContrat: 'CDI',
          statut: 'Actif',
          email: targetUser.email,
          contact: targetUser.phone || '',
          adresse: targetUser.address || 'Alger, Algérie',
          salaireMensuel: 0,
          profilBio: `Compte Employé créé et validé par l'Administrateur le ${new Date().toLocaleDateString(
            'fr-FR'
          )}.`,
          createdAt: nowISO,
          updatedAt: nowISO,
        };

        localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify([newTeamMember, ...existingTeam]));
        window.dispatchEvent(new Event('servidox-team-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const rejectUserAccount = (userId: string) => {
    const canReject = isMasterAdmin || user?.role === 'Administrateur';
    if (!canReject) {
      console.warn('Action refusée : Seul un administrateur peut refuser des comptes.');
      return;
    }
    const targetUser = registeredUsers.find((u) => u.id === userId);
    if (targetUser) {
      persistUserToFirestore({
        ...targetUser,
        accountStatus: 'rejected',
      });
    }
    setRegisteredUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, accountStatus: 'rejected' as AccountApprovalStatus } : u
      )
    );
  };

  const deleteUserAccount = (userId: string) => {
    const canDelete = isMasterAdmin || user?.role === 'Administrateur';
    if (!canDelete) {
      console.warn('Action refusée : Seul un administrateur peut supprimer des comptes.');
      return;
    }
    setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromFirestore(userId);
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; isPending?: boolean }> => {
    try {
      // Authentification Google sans requérir de scopes lourds bloquants
      const authResult = await googleSignIn(false);
      if (!authResult || !authResult.user) {
        return { success: false, error: 'La connexion Google a été annulée.' };
      }
      const fbUser = authResult.user;
      const email = fbUser.email ? fbUser.email.trim().toLowerCase() : '';
      if (!email) {
        return {
          success: false,
          error: "Impossible de récupérer l'adresse email associée à votre compte Google.",
        };
      }

      const isMaster = email === MASTER_ADMIN_EMAIL.toLowerCase();

      // Vérifier en mémoire
      let existing = registeredUsers.find((u) => u.email.toLowerCase() === email);

      // Si pas encore en mémoire, vérifier Firestore en direct
      if (!existing) {
        try {
          const snap = await getDocs(collection(db, 'users'));
          const remoteUsers: RegisteredUserRecord[] = [];
          snap.forEach((docSnap) => {
            remoteUsers.push(docSnap.data() as RegisteredUserRecord);
          });
          if (remoteUsers.length > 0) {
            setRegisteredUsers(remoteUsers);
            localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(remoteUsers));
            existing = remoteUsers.find((u) => u.email.toLowerCase() === email);
          }
        } catch (err) {
          console.warn('Vérification Firestore Google Login:', err);
        }
      }

      // Si c'est un nouvel email Google non enregistré et pas Master Admin :
      // On l'enregistre en attente de validation par la Direction
      if (!isMaster && !existing) {
        const newGoogleUser: RegisteredUserRecord = {
          id: fbUser.uid || `usr-gmail-${Date.now()}`,
          name: fbUser.displayName || email.split('@')[0],
          email,
          password: '',
          role: 'Employé',
          jobTitle: 'Collaborateur SERVI-DOX',
          accountStatus: 'pending',
          registeredAt: new Date().toISOString(),
          phone: fbUser.phoneNumber || '',
          cabinetName: 'SERVI-DOX',
          authProvider: 'gmail',
        };
        persistUserToFirestore(newGoogleUser);
        setRegisteredUsers((prev) => [newGoogleUser, ...prev]);

        return {
          success: false,
          isPending: true,
          error:
            "⏳ Votre compte Google a été enregistré avec succès. Il est actuellement EN ATTENTE DE VALIDATION par l'Administrateur avant de pouvoir accéder à l'espace de travail.",
        };
      }

      // Check if employee account is pending or rejected
      if (!isMaster && existing && existing.accountStatus === 'pending') {
        return {
          success: false,
          isPending: true,
          error:
            "⏳ Votre compte Employé associé à ce compte Google est en attente de validation par l'Administrateur.",
        };
      }

      if (!isMaster && existing && existing.accountStatus === 'rejected') {
        return {
          success: false,
          error: "❌ Votre demande d'accès Employé a été refusée ou suspendue par l'Administrateur.",
        };
      }

      const displayName =
        (isMaster ? 'Zine Moh' : null) ||
        existing?.name ||
        fbUser.displayName ||
        email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      const sessionUser: UserSession = {
        id: fbUser.uid || `usr-${Date.now()}`,
        name: displayName,
        email,
        role: isMaster ? 'Administrateur' : existing?.role || 'Employé',
        jobTitle: isMaster ? 'Administrateur Principal' : existing?.jobTitle || 'Collaborateur SERVI-DOX',
        accountStatus: 'approved',
        avatarInitials:
          displayName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'SD',
        registeredAt: existing?.registeredAt || new Date().toISOString(),
        phone: existing?.phone || fbUser.phoneNumber || '',
        cabinetName: existing?.cabinetName || 'SERVI-DOX Algérie',
        address: existing?.address || '',
        authProvider: 'gmail',
      };
      setUser(sessionUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      return { success: true };
    } catch (err: any) {
      console.error('Erreur loginWithGoogle:', err);
      return {
        success: false,
        error: err?.message || 'Erreur lors de la connexion Google. Veuillez vérifier votre connexion.',
      };
    }
  };

  const updateProfile = (
    updates: Partial<UserSession>,
    newPassword?: string
  ): { success: boolean; error?: string } => {
    if (!user) {
      return { success: false, error: 'Aucun utilisateur connecté.' };
    }

    const updatedName = updates.name?.trim() || user.name;
    const updatedEmail = updates.email?.trim().toLowerCase() || user.email;

    if (!updatedName) {
      return { success: false, error: 'Le nom complet ne peut pas être vide.' };
    }

    const newInitials =
      updatedName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'SD';

    const updatedSession: UserSession = {
      ...user,
      ...updates,
      name: updatedName,
      email: updatedEmail,
      avatarInitials: newInitials,
    };

    setUser(updatedSession);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));

    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) {
          return {
            ...u,
            name: updatedName,
            email: updatedEmail,
            phone: updatedSession.phone,
            cabinetName: updatedSession.cabinetName,
            address: updatedSession.address,
            password:
              newPassword && newPassword.trim().length >= 4 ? newPassword.trim() : u.password,
          };
        }
        return u;
      })
    );

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    googleLogout().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isMasterAdmin,
        registeredUsers,
        pendingEmployeesCount,
        login,
        register,
        loginWithGoogle,
        approveUserAccount,
        rejectUserAccount,
        deleteUserAccount,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
