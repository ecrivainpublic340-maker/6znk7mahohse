import React, { useState, useMemo, useEffect } from 'react';
import { useClients } from '../context/ClientContext';
import {
  AutoEntrepreneurDossier,
  TypeSuiviAE,
  EtatInscriptionAE,
  EtatCasnosAE,
  EtatImpotAE,
  EtatCompteBancaireAE,
  EtatAutorisationGeneraleAE,
  EtatGriffeAE,
  TARIFS_OFFRE_AE,
  BANQUES_ALGERIE,
} from '../types/autoEntrepreneur';
import { INITIAL_AE_DOSSIERS } from '../data/mockAutoEntrepreneur';
import { formatDA, getWhatsAppUrl } from '../utils/format';
import {
  exportSingleAutoEntrepreneurPDF,
  exportAutoEntrepreneursListPDF,
} from '../utils/autoEntrepreneurPdfExport';
import { syncAutoEntrepreneursToGoogleSheet } from '../services/googleSheetsService';
import { getAccessToken } from '../services/gmailService';
import {
  subscribeToAutoEntrepreneurs,
  persistAutoEntrepreneurToFirestore,
  deleteAutoEntrepreneurFromFirestore,
} from '../services/firestoreSync';
import {
  Search,
  Plus,
  FileDown,
  FileSpreadsheet,
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Filter,
  X,
  CreditCard,
  Stamp,
  FileCheck2,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Briefcase,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';

const STORAGE_KEY = 'servidox_autoentrepreneur_dossiers_v2';

const WILAYAS_58 = [
  '01 - Adrar',
  '02 - Chlef',
  '03 - Laghouat',
  '04 - Oum El Bouaghi',
  '05 - Batna',
  '06 - Béjaïa',
  '07 - Biskra',
  '08 - Béchar',
  '09 - Blida',
  '10 - Bouira',
  '11 - Tamanrasset',
  '12 - Tébessa',
  '13 - Tlemcen',
  '14 - Tiaret',
  '15 - Tizi Ouzou',
  '16 - Alger',
  '17 - Djelfa',
  '18 - Jijel',
  '19 - Sétif',
  '20 - Saïda',
  '21 - Skikda',
  '22 - Sidi Bel Abbès',
  '23 - Annaba',
  '24 - Guelma',
  '25 - Constantine',
  '26 - Médéa',
  '27 - Mostaganem',
  '28 - M\'Sila',
  '29 - Mascara',
  '30 - Ouargla',
  '31 - Oran',
  '32 - El Bayadh',
  '33 - Illizi',
  '34 - Bordj Bou Arreridj',
  '35 - Boumerdès',
  '36 - El Tarf',
  '37 - Tindouf',
  '38 - Tissemsilt',
  '39 - El Oued',
  '40 - Khenchela',
  '41 - Souk Ahras',
  '42 - Tipaza',
  '43 - Mila',
  '44 - Aïn Defla',
  '45 - Naâma',
  '46 - Aïn Témouchent',
  '47 - Ghardaïa',
  '48 - Relizane',
  '49 - Timimoun',
  '50 - Bordj Badji Mokhtar',
  '51 - Ouled Djellal',
  '52 - Béni Abbès',
  '53 - In Salah',
  '54 - In Guezzam',
  '55 - Touggourt',
  '56 - Djanet',
  '57 - El M\'Ghair',
  '58 - El Meniaa',
];

interface AutoEntrepreneurPageProps {
  onSendGmail?: (clientInfo: { email: string; name: string }) => void;
}

export const AutoEntrepreneurPage: React.FC<AutoEntrepreneurPageProps> = ({ onSendGmail }) => {
  const { clients, deleteClient, showToast } = useClients();

  // Load dossiers from localStorage or initialize with mock data
  const [dossiers, setDossiers] = useState<AutoEntrepreneurDossier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading dossiers:', e);
    }
    return INITIAL_AE_DOSSIERS;
  });

  // Save to localStorage whenever dossiers change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dossiers));
    } catch (e) {
      console.error('Error saving dossiers:', e);
    }
  }, [dossiers]);

  // Synchronisation en temps réel avec Cloud Firestore (multi-ordinateurs)
  useEffect(() => {
    let hasReconciled = false;
    const unsubscribe = subscribeToAutoEntrepreneurs((remoteDossiers) => {
      if (!hasReconciled) {
        hasReconciled = true;
        if (remoteDossiers && remoteDossiers.length > 0) {
          setDossiers(remoteDossiers);
        } else {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsed: AutoEntrepreneurDossier[] = JSON.parse(saved);
              if (parsed && parsed.length > 0) {
                console.info(`Synchronisation de ${parsed.length} dossier(s) AE vers Cloud Firestore...`);
                parsed.forEach((d) => persistAutoEntrepreneurToFirestore(d));
              }
            }
          } catch (e) {
            console.error('Erreur téléversement initial dossiers AE:', e);
          }
        }
      } else {
        setDossiers(remoteDossiers || []);
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronisation automatique : intégrer immédiatement tout client enregistré comme 'Auto-entrepreneur'
  useEffect(() => {
    const aeClients = clients.filter((c) => c.typeDossier === 'Auto-entrepreneur');
    if (aeClients.length === 0) return;

    setDossiers((prevDossiers) => {
      const existingKeys = new Set(prevDossiers.map((d) => d.clientId || d.id));
      const missing: AutoEntrepreneurDossier[] = [];

      aeClients.forEach((c) => {
        const generatedId = `AE-${c.id.replace('cli-', '')}`;
        if (!existingKeys.has(c.id) && !existingKeys.has(generatedId)) {
          const newDossier: AutoEntrepreneurDossier = {
            id: generatedId,
            clientId: c.id,
            nom: c.nom,
            prenom: c.prenom,
            telephone: c.contact,
            email: c.email,
            wilaya: c.ville || '16 - Alger',
            activiteMetier: c.motifDossier || 'Auto-entrepreneur',
            dateCreation: c.dateInscription || new Date().toISOString().split('T')[0],
            typeSuivi: 'prise_en_charge',
            etatInscription: c.statut === 'Validé' ? 'inscrit' : 'en_cours',
            etatCasnos: 'non_inscrit',
            etatImpot: 'non_depose',
            etatCompteBancaire: 'non_pret',
            etatAutorisationGenerale: 'non_prete',
            etatGriffe: 'non_prete',
            tarifServidoxDA: c.montantTotal || 40000,
            montantEncaisseDA: c.montantEncaisse || 0,
            montantResteDA: c.montantReste || 0,
            notes: c.notes || '',
            updatedAt: new Date().toISOString(),
          };
          missing.push(newDossier);
          persistAutoEntrepreneurToFirestore(newDossier);
        }
      });

      if (missing.length > 0) {
        return [...missing, ...prevDossiers];
      }
      return prevDossiers;
    });
  }, [clients]);

  // View state & search/filters
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeSuiviFilter, setTypeSuiviFilter] = useState<'all' | TypeSuiviAE>('all');
  const [casnosFilter, setCasnosFilter] = useState<'all' | EtatCasnosAE>('all');
  const [impotFilter, setImpotFilter] = useState<'all' | EtatImpotAE>('all');
  const [banqueFilter, setBanqueFilter] = useState<'all' | EtatCompteBancaireAE>('all');
  const [griffeFilter, setGriffeFilter] = useState<'all' | EtatGriffeAE>('all');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<AutoEntrepreneurDossier | null>(null);
  const [viewingDossier, setViewingDossier] = useState<AutoEntrepreneurDossier | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [confirmSheetsOpen, setConfirmSheetsOpen] = useState(false);

  // Form State for Add / Edit
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formWilaya, setFormWilaya] = useState('16 - Alger');
  const [formCommune, setFormCommune] = useState('');
  const [formActiviteMetier, setFormActiviteMetier] = useState('');
  const [formNumeroANAE, setFormNumeroANAE] = useState('');
  const [formTypeSuivi, setFormTypeSuivi] = useState<TypeSuiviAE>('bureau');

  // The 6 specific status items requested by user
  const [formEtatInscription, setFormEtatInscription] = useState<EtatInscriptionAE>('inscrit');
  const [formEtatCasnos, setFormEtatCasnos] = useState<EtatCasnosAE>('pret_a_payer');
  const [formEtatImpot, setFormEtatImpot] = useState<EtatImpotAE>('non_depose');
  const [formEtatCompteBancaire, setFormEtatCompteBancaire] = useState<EtatCompteBancaireAE>('non_pret');
  const [formBanqueChoisie, setFormBanqueChoisie] = useState(BANQUES_ALGERIE[0]);
  const [formRibBancaire, setFormRibBancaire] = useState('');
  const [formEtatAutorisation, setFormEtatAutorisation] = useState<EtatAutorisationGeneraleAE>('prete');
  const [formEtatGriffe, setFormEtatGriffe] = useState<EtatGriffeAE>('non_prete');

  // Financial fields
  const [formTarifDA, setFormTarifDA] = useState<number>(12000);
  const [formEncaisseDA, setFormEncaisseDA] = useState<number>(12000);
  const [formNotes, setFormNotes] = useState('');

  // Auto-fill price when changing type of follow-up in form
  const handleTypeSuiviChange = (type: TypeSuiviAE) => {
    setFormTypeSuivi(type);
    const standardTarif = TARIFS_OFFRE_AE[type].tarifDA;
    setFormTarifDA(standardTarif);
    setFormEncaisseDA(standardTarif);
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingDossier(null);
    setFormNom('');
    setFormPrenom('');
    setFormTelephone('');
    setFormEmail('');
    setFormWilaya('16 - Alger');
    setFormCommune('');
    setFormActiviteMetier('');
    setFormNumeroANAE('');
    setFormTypeSuivi('bureau');
    setFormEtatInscription('inscrit');
    setFormEtatCasnos('pret_a_payer');
    setFormEtatImpot('non_depose');
    setFormEtatCompteBancaire('non_pret');
    setFormBanqueChoisie(BANQUES_ALGERIE[0]);
    setFormRibBancaire('');
    setFormEtatAutorisation('prete');
    setFormEtatGriffe('non_prete');
    setFormTarifDA(12000);
    setFormEncaisseDA(12000);
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (dossier: AutoEntrepreneurDossier) => {
    setEditingDossier(dossier);
    setFormNom(dossier.nom);
    setFormPrenom(dossier.prenom);
    setFormTelephone(dossier.telephone);
    setFormEmail(dossier.email || '');
    setFormWilaya(dossier.wilaya);
    setFormCommune(dossier.commune || '');
    setFormActiviteMetier(dossier.activiteMetier);
    setFormNumeroANAE(dossier.numeroANAE || '');
    setFormTypeSuivi(dossier.typeSuivi);
    setFormEtatInscription(dossier.etatInscription);
    setFormEtatCasnos(dossier.etatCasnos);
    setFormEtatImpot(dossier.etatImpot);
    setFormEtatCompteBancaire(dossier.etatCompteBancaire);
    setFormBanqueChoisie(dossier.banqueChoisie || BANQUES_ALGERIE[0]);
    setFormRibBancaire(dossier.ribBancaire || '');
    setFormEtatAutorisation(dossier.etatAutorisationGenerale);
    setFormEtatGriffe(dossier.etatGriffe);
    setFormTarifDA(dossier.tarifServidoxDA);
    setFormEncaisseDA(dossier.montantEncaisseDA);
    setFormNotes(dossier.notes || '');
    setIsModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom.trim() || !formPrenom.trim() || !formTelephone.trim()) {
      showToast('Champs obligatoires manquants', 'Veuillez saisir au moins le Nom, Prénom et Téléphone.', 'warning');
      return;
    }

    const calculatedReste = Math.max(0, formTarifDA - formEncaisseDA);

    if (editingDossier) {
      // Update
      let updatedDossier: AutoEntrepreneurDossier | null = null;
      const updatedList = dossiers.map((d) => {
        if (d.id === editingDossier.id) {
          updatedDossier = {
            ...d,
            nom: formNom.trim(),
            prenom: formPrenom.trim(),
            telephone: formTelephone.trim(),
            email: formEmail.trim(),
            wilaya: formWilaya,
            commune: formCommune.trim(),
            activiteMetier: formActiviteMetier.trim(),
            numeroANAE: formNumeroANAE.trim(),
            typeSuivi: formTypeSuivi,
            etatInscription: formEtatInscription,
            etatCasnos: formEtatCasnos,
            etatImpot: formEtatImpot,
            etatCompteBancaire: formEtatCompteBancaire,
            banqueChoisie: formBanqueChoisie,
            ribBancaire: formRibBancaire.trim(),
            etatAutorisationGenerale: formEtatAutorisation,
            etatGriffe: formEtatGriffe,
            tarifServidoxDA: formTarifDA,
            montantEncaisseDA: formEncaisseDA,
            montantResteDA: calculatedReste,
            notes: formNotes.trim(),
            updatedAt: new Date().toISOString(),
          };
          return updatedDossier;
        }
        return d;
      });
      setDossiers(updatedList);
      if (updatedDossier) {
        persistAutoEntrepreneurToFirestore(updatedDossier);
      }
      showToast('Dossier mis à jour', `Le dossier de ${formNom} ${formPrenom} a été actualisé avec succès.`, 'success');
    } else {
      // Create new
      const nextNum = dossiers.length + 1;
      const newId = `AE-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      const newDossier: AutoEntrepreneurDossier = {
        id: newId,
        nom: formNom.trim(),
        prenom: formPrenom.trim(),
        telephone: formTelephone.trim(),
        email: formEmail.trim(),
        wilaya: formWilaya,
        commune: formCommune.trim(),
        activiteMetier: formActiviteMetier.trim() || 'Activité de services indépendante',
        numeroANAE: formNumeroANAE.trim(),
        dateCreation: new Date().toISOString().split('T')[0],
        typeSuivi: formTypeSuivi,
        etatInscription: formEtatInscription,
        etatCasnos: formEtatCasnos,
        etatImpot: formEtatImpot,
        etatCompteBancaire: formEtatCompteBancaire,
        banqueChoisie: formBanqueChoisie,
        ribBancaire: formRibBancaire.trim(),
        etatAutorisationGenerale: formEtatAutorisation,
        etatGriffe: formEtatGriffe,
        tarifServidoxDA: formTarifDA,
        montantEncaisseDA: formEncaisseDA,
        montantResteDA: calculatedReste,
        notes: formNotes.trim(),
        updatedAt: new Date().toISOString(),
      };
      setDossiers([newDossier, ...dossiers]);
      persistAutoEntrepreneurToFirestore(newDossier);
      showToast('Nouveau dossier créé', `Le dossier ${newId} (${formNom} ${formPrenom}) a été enregistré.`, 'success');
    }

    setIsModalOpen(false);
  };

  // Delete
  const handleDeleteDossier = (id: string) => {
    const target = dossiers.find((d) => d.id === id);
    setDossiers(dossiers.filter((d) => d.id !== id));
    deleteAutoEntrepreneurFromFirestore(id);
    if (target?.clientId) {
      deleteClient(target.clientId);
    }
    setDeleteConfirmId(null);
    if (viewingDossier?.id === id) {
      setViewingDossier(null);
    }
    showToast('Dossier supprimé', 'Le dossier Auto-Entrepreneur a été retiré.', 'info');
  };

  // Quick inline status changers (Cycle through status in 1 click)
  const cycleCasnos = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<EtatCasnosAE, EtatCasnosAE> = {
      pret_a_payer: 'paye',
      paye: 'non_paye',
      non_paye: 'pret_a_payer',
      non_inscrit: 'pret_a_payer',
    };
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = cycleMap[d.etatCasnos] || 'pret_a_payer';
          const updated = { ...d, etatCasnos: nextState, updatedAt: new Date().toISOString() };
          persistAutoEntrepreneurToFirestore(updated);
          return updated;
        }
        return d;
      })
    );
    showToast('CASNOS Actualisé', 'Le statut CASNOS a été mis à jour.', 'info');
  };

  const cycleImpot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<EtatImpotAE, EtatImpotAE> = {
      non_depose: 'pret_a_deposer',
      pret_a_deposer: 'depose',
      depose: 'non_depose',
    };
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = cycleMap[d.etatImpot] || 'pret_a_deposer';
          const updated = { ...d, etatImpot: nextState, updatedAt: new Date().toISOString() };
          persistAutoEntrepreneurToFirestore(updated);
          return updated;
        }
        return d;
      })
    );
    showToast('Impôts Actualisés', 'Le statut fiscal (Impôts / G50) a été mis à jour.', 'info');
  };

  const cycleCompte = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<EtatCompteBancaireAE, EtatCompteBancaireAE> = {
      non_pret: 'en_cours',
      en_cours: 'pret',
      pret: 'non_pret',
    };
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = cycleMap[d.etatCompteBancaire] || 'pret';
          const updated = { ...d, etatCompteBancaire: nextState, updatedAt: new Date().toISOString() };
          persistAutoEntrepreneurToFirestore(updated);
          return updated;
        }
        return d;
      })
    );
    showToast('Compte Bancaire Actualisé', 'L\'état du compte bancaire a été mis à jour.', 'info');
  };

  const cycleGriffe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<EtatGriffeAE, EtatGriffeAE> = {
      non_prete: 'en_confection',
      en_confection: 'prete',
      prete: 'non_prete',
    };
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = cycleMap[d.etatGriffe] || 'prete';
          const updated = { ...d, etatGriffe: nextState, updatedAt: new Date().toISOString() };
          persistAutoEntrepreneurToFirestore(updated);
          return updated;
        }
        return d;
      })
    );
    showToast('Griffe Actualisée', 'L\'état de confection de la griffe a été mis à jour.', 'info');
  };

  const cycleAutorisation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<EtatAutorisationGeneraleAE, EtatAutorisationGeneraleAE> = {
      non_prete: 'en_cours',
      en_cours: 'prete',
      prete: 'non_prete',
    };
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = cycleMap[d.etatAutorisationGenerale] || 'prete';
          return { ...d, etatAutorisationGenerale: nextState, updatedAt: new Date().toISOString() };
        }
        return d;
      })
    );
    showToast('Autorisation Actualisée', 'L\'autorisation générale a été mise à jour.', 'info');
  };

  // Filter logic
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          d.nom.toLowerCase().includes(q) ||
          d.prenom.toLowerCase().includes(q) ||
          d.telephone.includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.wilaya.toLowerCase().includes(q) ||
          d.activiteMetier.toLowerCase().includes(q) ||
          d.numeroANAE?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Type suivi
      if (typeSuiviFilter !== 'all' && d.typeSuivi !== typeSuiviFilter) return false;
      // Casnos
      if (casnosFilter !== 'all' && d.etatCasnos !== casnosFilter) return false;
      // Impots
      if (impotFilter !== 'all' && d.etatImpot !== impotFilter) return false;
      // Banque
      if (banqueFilter !== 'all' && d.etatCompteBancaire !== banqueFilter) return false;
      // Griffe
      if (griffeFilter !== 'all' && d.etatGriffe !== griffeFilter) return false;
      // Wilaya
      if (wilayaFilter !== 'all' && !d.wilaya.startsWith(wilayaFilter)) return false;

      return true;
    });
  }, [
    dossiers,
    searchQuery,
    typeSuiviFilter,
    casnosFilter,
    impotFilter,
    banqueFilter,
    griffeFilter,
    wilayaFilter,
  ]);

  // Global KPIs & Statistics
  const kpis = useMemo(() => {
    const total = dossiers.length;
    const horsWilaya = dossiers.filter((d) => d.typeSuivi === 'hors_wilaya').length;
    const bureau = dossiers.filter((d) => d.typeSuivi === 'bureau').length;
    const priseEnCharge = dossiers.filter((d) => d.typeSuivi === 'prise_en_charge').length;

    // Specific requested statuses
    const inscrits = dossiers.filter((d) => d.etatInscription === 'inscrit').length;
    const casnosPretPayer = dossiers.filter((d) => d.etatCasnos === 'pret_a_payer').length;
    const casnosNonPaye = dossiers.filter((d) => d.etatCasnos === 'non_paye').length;
    const casnosPaye = dossiers.filter((d) => d.etatCasnos === 'paye').length;

    const impotsDepose = dossiers.filter((d) => d.etatImpot === 'depose').length;
    const impotsPretDeposer = dossiers.filter((d) => d.etatImpot === 'pret_a_deposer').length;
    const impotsNonDepose = dossiers.filter((d) => d.etatImpot === 'non_depose').length;

    const comptePret = dossiers.filter((d) => d.etatCompteBancaire === 'pret').length;
    const compteNonPret = dossiers.filter((d) => d.etatCompteBancaire !== 'pret').length;

    const autorisationPrete = dossiers.filter((d) => d.etatAutorisationGenerale === 'prete').length;
    const griffePrete = dossiers.filter((d) => d.etatGriffe === 'prete').length;
    const griffeEnCours = dossiers.filter((d) => d.etatGriffe !== 'prete').length;

    const totalFactureDA = dossiers.reduce((acc, d) => acc + (d.tarifServidoxDA || 0), 0);
    const totalEncaisseDA = dossiers.reduce((acc, d) => acc + (d.montantEncaisseDA || 0), 0);
    const totalResteDA = dossiers.reduce((acc, d) => acc + (d.montantResteDA || 0), 0);

    return {
      total,
      horsWilaya,
      bureau,
      priseEnCharge,
      inscrits,
      casnosPretPayer,
      casnosNonPaye,
      casnosPaye,
      impotsDepose,
      impotsPretDeposer,
      impotsNonDepose,
      comptePret,
      compteNonPret,
      autorisationPrete,
      griffePrete,
      griffeEnCours,
      totalFactureDA,
      totalEncaisseDA,
      totalResteDA,
    };
  }, [dossiers]);

  // Reset to demo data
  const handleResetDemoData = () => {
    if (window.confirm('Voulez-vous réinitialiser les dossiers Auto-Entrepreneur avec les exemples types ?')) {
      setDossiers(INITIAL_AE_DOSSIERS);
      showToast('Données réinitialisées', 'Les dossiers Auto-Entrepreneur de démonstration ont été restaurés.', 'success');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800">
              OFFRE OFFICIELLE SERVI-DOX
            </span>
            <span className="text-xs text-slate-500 font-medium">Algérie • Plateforme ANAE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-blue-600 shrink-0" />
            <span>Gestion & Suivi des Auto-Entrepreneurs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Suivi complet des prestations : Inscription & Suivi Bureau (12 000 DA), Suivi Hors Wilaya (15 000 DA) et Prise en Charge (40 000 DA). Suivi en temps réel de l'état CASNOS, Impôts, Compte Bancaire, Autorisation Générale et Griffe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportAutoEntrepreneursListPDF(filteredDossiers)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            title="Exporter la liste filtrée au format PDF"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Exporter PDF</span>
          </button>

          <button
            onClick={() => setConfirmSheetsOpen(true)}
            disabled={isExportingSheets}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Exporter les dossiers vers Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{isExportingSheets ? 'Exportation...' : 'Google Sheets'}</span>
          </button>

          <button
            onClick={handleResetDemoData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all shadow-2xs"
            title="Réinitialiser les données types"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Dossier Auto-Entrepreneur</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total & Prestations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Dossiers Auto-Entrepreneurs</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {kpis.total}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              {kpis.inscrits} Inscrits
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-2 border-t border-slate-100 pt-2">
            <span className="text-indigo-600 font-semibold">{kpis.horsWilaya} Hors Wilaya</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">{kpis.bureau} Bureau</span>
            <span>•</span>
            <span className="text-blue-700 font-semibold">{kpis.priseEnCharge} P.E.C</span>
          </div>
        </div>

        {/* KPI 2: CASNOS Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sécurité Sociale CASNOS</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
              {kpis.casnosPretPayer}
            </span>
            <span className="text-xs text-amber-600 font-medium">prêts à payer</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-emerald-600 font-medium">{kpis.casnosPaye} payés</span>
            <span className="text-rose-600 font-semibold">{kpis.casnosNonPaye} non payés</span>
          </div>
        </div>

        {/* KPI 3: Impôts (G50 / Fiscalité) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Déclaration Fiscale (Impôts)</span>
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
              {kpis.impotsDepose}
            </span>
            <span className="text-xs text-emerald-600 font-medium">déposés</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-blue-600 font-medium">{kpis.impotsPretDeposer} prêts à déposer</span>
            <span className="text-rose-600 font-semibold">{kpis.impotsNonDepose} non déposés</span>
          </div>
        </div>

        {/* KPI 4: Compte Bancaire & Griffe */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Banques & Griffes Disponibles</span>
            <Stamp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-mono">
              {kpis.griffePrete}
            </span>
            <span className="text-xs text-purple-600 font-medium">griffes prêtes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-emerald-700 font-semibold">{kpis.comptePret} comptes prêts</span>
            <span className="text-indigo-600 font-medium">{kpis.autorisationPrete} autorisations</span>
          </div>
        </div>
      </div>

      {/* Financial Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-300 font-medium">
              Chiffre d'Affaires Prestations Auto-Entrepreneur SERVI-DOX
            </div>
            <div className="text-lg font-extrabold font-mono text-white">
              {formatDA(kpis.totalFactureDA)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400 block text-[11px]">Encaissé :</span>
            <span className="font-extrabold font-mono text-emerald-400">
              {formatDA(kpis.totalEncaisseDA)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Reste à recouvrer :</span>
            <span className="font-extrabold font-mono text-amber-400">
              {formatDA(kpis.totalResteDA)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, wilaya, métier, n° ANAE, téléphone..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue Cartes avec Checklist Interactive"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cartes</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue Tableau Synthétique"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tableau</span>
            </button>
          </div>
        </div>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Offre :
          </span>

          <button
            onClick={() => setTypeSuiviFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              typeSuiviFilter === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({dossiers.length})
          </button>

          <button
            onClick={() => setTypeSuiviFilter('hors_wilaya')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              typeSuiviFilter === 'hors_wilaya'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Suivi Hors Wilaya (15 000 DA)
          </button>

          <button
            onClick={() => setTypeSuiviFilter('bureau')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              typeSuiviFilter === 'bureau'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Inscription & Suivi Bureau (12 000 DA)
          </button>

          <button
            onClick={() => setTypeSuiviFilter('prise_en_charge')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              typeSuiviFilter === 'prise_en_charge'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Prise en charge de dossier (40 000 DA)
          </button>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* CASNOS */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              CASNOS :
            </label>
            <select
              value={casnosFilter}
              onChange={(e) => setCasnosFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tous les états CASNOS</option>
              <option value="pret_a_payer">Prêt à payer</option>
              <option value="non_paye">Non payé</option>
              <option value="paye">Payé (Quittance)</option>
              <option value="non_inscrit">Non inscrit</option>
            </select>
          </div>

          {/* Impôts */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Impôts :
            </label>
            <select
              value={impotFilter}
              onChange={(e) => setImpotFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tous les états Impôts</option>
              <option value="depose">Déposé</option>
              <option value="pret_a_deposer">Prêt à déposer</option>
              <option value="non_depose">Non déposé</option>
            </select>
          </div>

          {/* Compte Bancaire */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Compte Bancaire :
            </label>
            <select
              value={banqueFilter}
              onChange={(e) => setBanqueFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tous les états Bancaires</option>
              <option value="pret">Prêt (RIB obtenu)</option>
              <option value="non_pret">Pas prêt</option>
              <option value="en_cours">En cours</option>
            </select>
          </div>

          {/* La Griffe */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              La Griffe :
            </label>
            <select
              value={griffeFilter}
              onChange={(e) => setGriffeFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="all">Toutes les griffes</option>
              <option value="prete">Griffe prête</option>
              <option value="en_confection">En confection</option>
              <option value="non_prete">Pas prête</option>
            </select>
          </div>

          {/* Wilaya Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Wilaya :
            </label>
            <select
              value={wilayaFilter}
              onChange={(e) => setWilayaFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="all">Toutes les 58 Wilayas</option>
              {WILAYAS_58.map((w) => (
                <option key={w} value={w.split(' - ')[0]}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Cards View or Table View */}
      {filteredDossiers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Aucun dossier Auto-Entrepreneur trouvé</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aucun dossier ne correspond à vos critères de recherche. Essayez de réinitialiser vos filtres ou créez un nouveau dossier.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeSuiviFilter('all');
              setCasnosFilter('all');
              setImpotFilter('all');
              setBanqueFilter('all');
              setGriffeFilter('all');
              setWilayaFilter('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            Effacer tous les filtres
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View with Interactive Checklist for the 6 Statuses */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDossiers.map((dossier) => {
            const offreInfo = TARIFS_OFFRE_AE[dossier.typeSuivi];
            const isSolded = dossier.montantResteDA === 0;

            return (
              <div
                key={dossier.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top: Header & Client Info */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${offreInfo.badgeColor}`}
                    >
                      {offreInfo.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {dossier.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {dossier.nom.toUpperCase()} {dossier.prenom}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                      {dossier.activiteMetier || 'Activité non renseignée'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{dossier.wilaya}{dossier.commune ? ` (${dossier.commune})` : ''}</span>
                    </div>
                  </div>

                  {/* Identifiant ANAE */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">N° ANAE :</span>
                    <span className="font-mono font-bold text-slate-800">
                      {dossier.numeroANAE || 'En cours'}
                    </span>
                  </div>

                  {/* Interactive Status Checklist for the 6 User Requested Pillars */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Statuts & Avancement (Cliquez pour changer) :
                    </div>

                    {/* 1. État Dossier Inscription */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const next: Record<EtatInscriptionAE, EtatInscriptionAE> = {
                          inscrit: 'carte_recue',
                          carte_recue: 'en_cours',
                          en_cours: 'inscrit',
                          bloque: 'inscrit',
                        };
                        setDossiers((prev) =>
                          prev.map((d) =>
                            d.id === dossier.id
                              ? { ...d, etatInscription: next[d.etatInscription] }
                              : d
                          )
                        );
                      }}
                      className="p-1.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                      title="Cliquer pour changer l'état d'inscription"
                    >
                      <span className="text-slate-600 font-medium text-[11px]">1. Inscription :</span>
                      {dossier.etatInscription === 'inscrit' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Inscrit
                        </span>
                      )}
                      {dossier.etatInscription === 'carte_recue' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          ✓ Carte Reçue
                        </span>
                      )}
                      {dossier.etatInscription === 'en_cours' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          ⏳ En cours
                        </span>
                      )}
                      {dossier.etatInscription === 'bloque' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          ✕ Bloqué
                        </span>
                      )}
                    </div>

                    {/* 2. CASNOS (Prêt à payer, Non payé, Payé) */}
                    <div
                      onClick={(e) => cycleCasnos(dossier.id, e)}
                      className="p-1.5 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                      title="Cliquer pour changer : Prêt à payer ➔ Payé ➔ Non payé"
                    >
                      <span className="text-slate-600 font-medium text-[11px]">2. CASNOS :</span>
                      {dossier.etatCasnos === 'pret_a_payer' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          ⚡ Prêt à payer
                        </span>
                      )}
                      {dossier.etatCasnos === 'non_paye' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          ✕ Non payé
                        </span>
                      )}
                      {dossier.etatCasnos === 'paye' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Payé (Quittance)
                        </span>
                      )}
                      {dossier.etatCasnos === 'non_inscrit' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Non inscrit
                        </span>
                      )}
                    </div>

                    {/* 3. Impôts (Déposé, Non déposé, Prêt à déposer) */}
                    <div
                      onClick={(e) => cycleImpot(dossier.id, e)}
                      className="p-1.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                      title="Cliquer pour changer : Non déposé ➔ Prêt à déposer ➔ Déposé"
                    >
                      <span className="text-slate-600 font-medium text-[11px]">3. Impôts :</span>
                      {dossier.etatImpot === 'depose' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Déposé
                        </span>
                      )}
                      {dossier.etatImpot === 'pret_a_deposer' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          📄 Prêt à déposer
                        </span>
                      )}
                      {dossier.etatImpot === 'non_depose' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          ✕ Non déposé
                        </span>
                      )}
                    </div>

                    {/* 4. Compte Bancaire (Prêt ou pas prêt) */}
                    <div
                      onClick={(e) => cycleCompte(dossier.id, e)}
                      className="p-1.5 rounded-lg border border-slate-100 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                      title="Cliquer pour changer : Pas prêt ➔ En cours ➔ Prêt"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-slate-600 font-medium text-[11px]">4. Compte Bancaire :</span>
                        {dossier.banqueChoisie && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            {dossier.banqueChoisie.split(' (')[0]}
                          </span>
                        )}
                      </div>
                      {dossier.etatCompteBancaire === 'pret' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Prêt (RIB actif)
                        </span>
                      ) : dossier.etatCompteBancaire === 'en_cours' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          ⏳ En cours
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          ✕ Pas prêt
                        </span>
                      )}
                    </div>

                    {/* 5. Autorisation Générale (Prête ou pas prête) */}
                    <div
                      onClick={(e) => cycleAutorisation(dossier.id, e)}
                      className="p-1.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                      title="Cliquer pour changer : Pas prête ➔ En cours ➔ Prête"
                    >
                      <span className="text-slate-600 font-medium text-[11px]">5. Autorisation :</span>
                      {dossier.etatAutorisationGenerale === 'prete' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Prête (Légalisée)
                        </span>
                      ) : dossier.etatAutorisationGenerale === 'en_cours' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          ⏳ En cours APC
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          ✕ Pas prête
                        </span>
                      )}
                    </div>

                    {/* 6. La Griffe (Prête ou pas prête) */}
                    <div
                      onClick={(e) => cycleGriffe(dossier.id, e)}
                      className="p-1.5 rounded-lg border border-slate-100 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                      title="Cliquer pour changer : Pas prête ➔ En confection ➔ Prête"
                    >
                      <span className="text-slate-600 font-medium text-[11px]">6. La Griffe :</span>
                      {dossier.etatGriffe === 'prete' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          ★ Prête (Disponible)
                        </span>
                      ) : dossier.etatGriffe === 'en_confection' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          ⚙ En confection
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          ✕ Pas prête
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial summary for dossier */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Tarif SERVI-DOX :</span>
                    <span className="font-mono font-extrabold text-slate-900">
                      {formatDA(dossier.tarifServidoxDA)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Paiement :</span>
                    {isSolded ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        100% Encaissé
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                        Reste : {formatDA(dossier.montantResteDA)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Quick Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* WhatsApp */}
                    <a
                      href={getWhatsAppUrl(
                        dossier.telephone,
                        `Bonjour ${dossier.prenom},\nCabinet SERVI-DOX concernant votre dossier Auto-Entrepreneur (${dossier.id}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Envoyer un message WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    {/* Direct Call */}
                    <a
                      href={`tel:${dossier.telephone}`}
                      className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Appeler le client"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    {/* Print / Export Individual Sheet */}
                    <button
                      onClick={() => exportSingleAutoEntrepreneurPDF(dossier)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Télécharger la Fiche Officielle de Suivi Auto-Entrepreneur en PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(dossier)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier les détails"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === dossier.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteDossier(dossier.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(dossier.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer le dossier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3 font-bold">ID & Nom</th>
                  <th className="p-3 font-bold">Wilaya & Métier</th>
                  <th className="p-3 font-bold">Prestation</th>
                  <th className="p-3 font-bold">1. Inscription</th>
                  <th className="p-3 font-bold">2. CASNOS</th>
                  <th className="p-3 font-bold">3. Impôts</th>
                  <th className="p-3 font-bold">4. Banque</th>
                  <th className="p-3 font-bold">5. Autorisation</th>
                  <th className="p-3 font-bold">6. Griffe</th>
                  <th className="p-3 font-bold">Tarif DA</th>
                  <th className="p-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDossiers.map((dossier) => (
                  <tr key={dossier.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-medium">
                      <div className="font-mono text-[11px] text-slate-400">{dossier.id}</div>
                      <div className="font-bold text-slate-900">
                        {dossier.nom} {dossier.prenom}
                      </div>
                      <div className="text-[11px] text-slate-500">{dossier.telephone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{dossier.wilaya}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {dossier.activiteMetier}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${TARIFS_OFFRE_AE[dossier.typeSuivi].badgeColor}`}
                      >
                        {TARIFS_OFFRE_AE[dossier.typeSuivi].label}
                      </span>
                    </td>
                    <td className="p-3">
                      {dossier.etatInscription === 'inscrit' && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          ✓ Inscrit
                        </span>
                      )}
                      {dossier.etatInscription === 'carte_recue' && (
                        <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                          ✓ Carte
                        </span>
                      )}
                      {dossier.etatInscription === 'en_cours' && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          En cours
                        </span>
                      )}
                    </td>
                    <td className="p-3 cursor-pointer" onClick={(e) => cycleCasnos(dossier.id, e)}>
                      {dossier.etatCasnos === 'pret_a_payer' && (
                        <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          Prêt à payer
                        </span>
                      )}
                      {dossier.etatCasnos === 'non_paye' && (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                          Non payé
                        </span>
                      )}
                      {dossier.etatCasnos === 'paye' && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          Payé
                        </span>
                      )}
                    </td>
                    <td className="p-3 cursor-pointer" onClick={(e) => cycleImpot(dossier.id, e)}>
                      {dossier.etatImpot === 'depose' && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          Déposé
                        </span>
                      )}
                      {dossier.etatImpot === 'pret_a_deposer' && (
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          Prêt à déposer
                        </span>
                      )}
                      {dossier.etatImpot === 'non_depose' && (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                          Non déposé
                        </span>
                      )}
                    </td>
                    <td className="p-3 cursor-pointer" onClick={(e) => cycleCompte(dossier.id, e)}>
                      {dossier.etatCompteBancaire === 'pret' ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          Prêt
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Pas prêt
                        </span>
                      )}
                    </td>
                    <td className="p-3 cursor-pointer" onClick={(e) => cycleAutorisation(dossier.id, e)}>
                      {dossier.etatAutorisationGenerale === 'prete' ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          Prête
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Pas prête
                        </span>
                      )}
                    </td>
                    <td className="p-3 cursor-pointer" onClick={(e) => cycleGriffe(dossier.id, e)}>
                      {dossier.etatGriffe === 'prete' ? (
                        <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                          Prête
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Pas prête
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {formatDA(dossier.tarifServidoxDA)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => exportSingleAutoEntrepreneurPDF(dossier)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Fiche PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(dossier)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDossier(dossier.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Auto-Entrepreneur Dossier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">
                  {editingDossier
                    ? `Modifier le Dossier Auto-Entrepreneur (${editingDossier.id})`
                    : 'Nouveau Dossier Auto-Entrepreneur'}
                </h2>
                <p className="text-xs text-slate-400">
                  Renseignez les coordonnées et mettez à jour les statuts de suivi administratif
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDossier} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Type d'Offre SERVI-DOX (Prestation) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Type d'Offre SERVI-DOX Sélectionnée * :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTypeSuiviChange('hors_wilaya')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTypeSuivi === 'hors_wilaya'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Suivi Hors Wilaya</div>
                    <div className="text-[11px] text-indigo-700 font-extrabold mt-0.5">15 000 DA</div>
                    <div className="text-[10px] text-slate-500 mt-1">À distance (58 wilayas)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSuiviChange('bureau')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTypeSuivi === 'bureau'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Inscription & Suivi Bureau</div>
                    <div className="text-[11px] text-emerald-700 font-extrabold mt-0.5">12 000 DA</div>
                    <div className="text-[10px] text-slate-500 mt-1">Accueil au bureau SERVI-DOX</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSuiviChange('prise_en_charge')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTypeSuivi === 'prise_en_charge'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Prise en charge complète</div>
                    <div className="text-[11px] text-blue-700 font-extrabold mt-0.5">40 000 DA</div>
                    <div className="text-[10px] text-slate-500 mt-1">Dossier intégral clés en main</div>
                  </button>
                </div>
              </div>

              {/* Coordonnées Auto-Entrepreneur */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1">
                  1. Coordonnées de l'Auto-Entrepreneur
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formNom}
                      onChange={(e) => setFormNom(e.target.value)}
                      placeholder="ex: BENALI"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formPrenom}
                      onChange={(e) => setFormPrenom(e.target.value)}
                      placeholder="ex: Karim"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTelephone}
                      onChange={(e) => setFormTelephone(e.target.value)}
                      placeholder="ex: 0550 12 34 56"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="ex: karim.benali@gmail.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Wilaya *
                    </label>
                    <select
                      value={formWilaya}
                      onChange={(e) => setFormWilaya(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      {WILAYAS_58.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Commune
                    </label>
                    <input
                      type="text"
                      value={formCommune}
                      onChange={(e) => setFormCommune(e.target.value)}
                      placeholder="ex: Bab Ezzouar"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      N° Identifiant ANAE
                    </label>
                    <input
                      type="text"
                      value={formNumeroANAE}
                      onChange={(e) => setFormNumeroANAE(e.target.value)}
                      placeholder="ex: ANAE-16-00842"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activité / Métier Auto-Entrepreneur
                  </label>
                  <input
                    type="text"
                    value={formActiviteMetier}
                    onChange={(e) => setFormActiviteMetier(e.target.value)}
                    placeholder="ex: Développeur Web, Graphiste, Consultant, E-commerce, Photographe..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Les 6 statuts demandés */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1">
                  2. Statuts des 6 Étapes Administratives Clés
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* État Inscription */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      État du Dossier (Inscription) *
                    </label>
                    <select
                      value={formEtatInscription}
                      onChange={(e) => setFormEtatInscription(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="inscrit">Inscrit (ANAE Validé)</option>
                      <option value="carte_recue">Carte d'Auto-entrepreneur reçue</option>
                      <option value="en_cours">En cours d'inscription</option>
                      <option value="bloque">Bloqué / Complément requis</option>
                    </select>
                  </div>

                  {/* État CASNOS */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      État CASNOS (Sécurité Sociale) *
                    </label>
                    <select
                      value={formEtatCasnos}
                      onChange={(e) => setFormEtatCasnos(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="pret_a_payer">Prêt à payer</option>
                      <option value="non_paye">Non payé</option>
                      <option value="paye">Payé (Quittance obtenue)</option>
                      <option value="non_inscrit">Non inscrit CASNOS</option>
                    </select>
                  </div>

                  {/* État Impôts */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      État Impôts (Déclaration Fiscale) *
                    </label>
                    <select
                      value={formEtatImpot}
                      onChange={(e) => setFormEtatImpot(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="depose">Déposé (Cachet Recette des Impôts)</option>
                      <option value="pret_a_deposer">Prêt à déposer</option>
                      <option value="non_depose">Non déposé</option>
                    </select>
                  </div>

                  {/* État Compte Bancaire */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      État du Compte Bancaire *
                    </label>
                    <select
                      value={formEtatCompteBancaire}
                      onChange={(e) => setFormEtatCompteBancaire(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="pret">Prêt (Compte ouvert & RIB généré)</option>
                      <option value="non_pret">Pas prêt (Non entamé)</option>
                      <option value="en_cours">En cours d'ouverture</option>
                    </select>
                  </div>

                  {/* Banque Choisie */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Banque Choisie
                    </label>
                    <select
                      value={formBanqueChoisie}
                      onChange={(e) => setFormBanqueChoisie(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      {BANQUES_ALGERIE.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* RIB Bancaire */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Numéro de Compte / RIB (20 chiffres)
                    </label>
                    <input
                      type="text"
                      value={formRibBancaire}
                      onChange={(e) => setFormRibBancaire(e.target.value)}
                      placeholder="ex: 001 00234 1234567890 44"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  {/* Autorisation Générale */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Autorisation Générale (Mandat) *
                    </label>
                    <select
                      value={formEtatAutorisation}
                      onChange={(e) => setFormEtatAutorisation(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="prete">Prête (Légalisée & Signée)</option>
                      <option value="non_prete">Pas prête (En attente)</option>
                      <option value="en_cours">En cours de légalisation</option>
                    </select>
                  </div>

                  {/* La Griffe */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      La Griffe (Cachet Professionnel) *
                    </label>
                    <select
                      value={formEtatGriffe}
                      onChange={(e) => setFormEtatGriffe(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="prete">Prête (Disponible au bureau)</option>
                      <option value="en_confection">En confection / Gravure</option>
                      <option value="non_prete">Pas prête (Non commandée)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Suivi Financier */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1">
                  3. Tarifs & Règlement de l'Offre (en Dinars Algériens DA)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tarif SERVI-DOX (DA) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={formTarifDA}
                      onChange={(e) => setFormTarifDA(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Montant Encaissé (DA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={formEncaisseDA}
                      onChange={(e) => setFormEncaisseDA(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reste à Payer (DA)
                    </label>
                    <div className="px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-lg font-mono font-bold text-amber-700">
                      {formatDA(Math.max(0, formTarifDA - formEncaisseDA))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes & Remarques Internes
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Instructions particulières, détails de la griffe, envoi postal Yalidine, etc."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20"
                >
                  {editingDossier ? 'Enregistrer les modifications' : 'Créer le dossier Auto-Entrepreneur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal pour Google Sheets */}
      {confirmSheetsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Exporter les Auto-Entrepreneurs vers Google Sheets
                </h3>
                <p className="text-[11px] text-slate-500">
                  Création d'un classeur officiel sur Google Drive
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Voulez-vous synchroniser les <strong>{filteredDossiers.length} dossiers d'auto-entrepreneurs</strong> dans un nouveau classeur Google Sheets ? Les colonnes contiendront les statuts CASNOS, impôts, compte bancaire, autorisations et griffes.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSheetsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmSheetsOpen(false);
                  setIsExportingSheets(true);
                  try {
                    const token = (await getAccessToken()) || 'token-sandbox-zinemoh106';
                    const res = await syncAutoEntrepreneursToGoogleSheet(token, filteredDossiers);
                    showToast(
                      'Exportation réussie',
                      `Le suivi "${res.name}" a été créé sur Google Sheets avec succès.`,
                      'success'
                    );
                  } catch (e) {
                    console.error(e);
                    showToast('Erreur', 'Impossible de synchroniser avec Google Sheets.', 'error');
                  } finally {
                    setIsExportingSheets(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmer l'exportation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
