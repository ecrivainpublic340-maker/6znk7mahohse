import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  LogIn,
  CheckCircle2,
  User,
  Phone,
  Briefcase,
  Clock,
  MapPin,
  MessageCircle,
  ExternalLink,
  Star,
  Send,
  Building2,
  GraduationCap,
  TrendingUp,
  ShoppingBag,
  Award,
  Globe,
  Share2,
  X,
  Menu,
  ChevronRight,
  Sparkles,
  Check,
  Calendar,
} from 'lucide-react';
import { InteractiveCloudBackground } from './InteractiveCloudBackground';
import { AppointmentBookingModal } from './AppointmentBookingModal';
import { MovingServicesShowcase } from './MovingServicesShowcase';

export const LoginPage: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDefaultMotif, setBookingDefaultMotif] = useState<string | undefined>(undefined);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regAccountType, setRegAccountType] = useState<'employe' | 'admin'>('employe');
  const [regName, setRegName] = useState('');
  const [regJobTitle, setRegJobTitle] = useState('Gestionnaire Dossiers RC & Entreprise');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<{
    name: string;
    email: string;
    jobTitle: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lateral Drawer State ('services' | 'contact' | 'reviews' | 'map' | null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'services' | 'contact' | 'reviews' | 'map'>('services');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactService, setContactService] = useState('Création d’Entreprise (SARL, EURL)');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Review / Rating State
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [recentReviews, setRecentReviews] = useState<Array<{ name: string; score: number; comment: string; date: string }>>(() => {
    try {
      const saved = localStorage.getItem('servidox_client_reviews');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        name: 'Mourad Khelifi',
        score: 5,
        comment: 'Dossier SARL finalisé en 48h chrono à Alger. Équipe ultra professionnelle et suivi irréprochable !',
        date: 'Hier',
      },
      {
        name: 'Yacine Bensalem (Diaspora)',
        score: 5,
        comment: 'Prise en charge de mes formalités depuis la France sans déplacement. Un gain de temps inestimable.',
        date: 'Il y a 3 jours',
      },
      {
        name: 'Amira Cherif',
        score: 5,
        comment: 'Domiciliation commerciale et carte auto-entrepreneur obtenues sans aucune complication. Bravo SERVI-DOX !',
        date: 'Il y a 1 semaine',
      },
    ];
  });

  const handleGoogleSignIn = async () => {
    setError(null);
    setPendingNotice(null);
    setIsLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setError(res.error || 'Erreur lors de la connexion Google.');
    }
    setIsLoading(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingNotice(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(loginEmail, loginPassword, true);
      if (!res.success) {
        setError(res.error || 'Identifiants invalides');
      }
      setIsLoading(false);
    }, 200);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setPendingNotice(null);

    if (regPassword !== regConfirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = register(
        regName,
        regEmail,
        regPassword,
        regPhone,
        'SERVI-DOX',
        'employe',
        regJobTitle
      );

      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Erreur lors de la création du compte');
      } else if (res.pendingApproval) {
        setPendingNotice({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          jobTitle: regJobTitle.trim(),
        });
        setLoginEmail(regEmail.trim().toLowerCase());
        setMode('login');
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setSuccessMsg('Compte Administrateur initialisé. Redirection...');
      }
    }, 250);
  };

  const handleSendContactWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = '213799679243';
    const textMsg = `Bonjour SERVI-DOX,\n\nJe souhaite des informations sur : *${contactService}*.\n\nNom: ${contactName || 'Client'}\nTél: ${contactPhone || 'Non renseigné'}\nEmail: ${contactEmail || 'Non renseigné'}\n\nMessage:\n${contactMessage || 'Pouvez-vous me recontacter ?'}`;
    const encoded = encodeURIComponent(textMsg);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    setContactSubmitted(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;
    const newRev = {
      name: reviewerName.trim(),
      score: ratingScore,
      comment: reviewComment.trim() || 'Service rapide, sérieux et efficace.',
      date: "Aujourd'hui",
    };
    const updated = [newRev, ...recentReviews];
    setRecentReviews(updated);
    try {
      localStorage.setItem('servidox_client_reviews', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewerName('');
      setReviewComment('');
    }, 3000);
  };

  // Liste complète des services SERVI-DOX demandés par le client
  const SERVICES_LIST = [
    {
      title: 'Accompagnement Administratif',
      desc: 'Prise en charge complète de vos démarches et formalités auprès des institutions algériennes.',
      icon: <Briefcase className="w-5 h-5 text-blue-600" />,
      tag: 'Formalités Globales',
    },
    {
      title: "Création d'Entreprise & RC",
      desc: 'Création de sociétés SARL, EURL, SPA, SNC et Registre de Commerce Personne Physique.',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
      tag: 'SARL / EURL / RC',
    },
    {
      title: 'Domiciliation Commerciale',
      desc: 'Formules flexibles de 6 mois ou 1 an avec contrat notarié officiel et adresse de prestige.',
      icon: <Award className="w-5 h-5 text-amber-600" />,
      tag: '6 Mois ou 1 An',
    },
    {
      title: 'Espace Coworking Équipé',
      desc: 'Bureaux partagés et privatifs, internet fibre très haut débit et salles de réunions.',
      icon: <Globe className="w-5 h-5 text-emerald-600" />,
      tag: 'Fibre & Salles Pro',
    },
    {
      title: 'École de Langues Étrangères',
      desc: 'Formations intensives en Français, Anglais d’affaires, Espagnol et Allemand.',
      icon: <GraduationCap className="w-5 h-5 text-purple-600" />,
      tag: 'Formations Pro',
    },
    {
      title: 'Stratégies Marketing & E-Commerce',
      desc: 'Lancement de boutiques en ligne, identité de marque, tunnels de vente et croissance digitale.',
      icon: <ShoppingBag className="w-5 h-5 text-pink-600" />,
      tag: 'Vente en Ligne',
    },
    {
      title: 'Formation & Développement Commercial',
      desc: 'Techniques de vente, négociation B2B, prospection moderne et gestion de clientèle.',
      icon: <TrendingUp className="w-5 h-5 text-cyan-600" />,
      tag: 'Coaching Vente',
    },
    {
      title: 'Création Auto-Entrepreneur',
      desc: 'Dossier complet ANAE, affiliation CASNOS, attestation fiscale IFU 0,5% et carte d’auto-entrepreneur.',
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      tag: 'Carte ANAE & CASNOS',
    },
    {
      title: 'Représentation Clients Émigrés (Diaspora)',
      desc: 'Prise en charge intégrale des démarches et procurations en Algérie pour la diaspora à l’étranger.',
      icon: <Globe className="w-5 h-5 text-rose-600" />,
      tag: 'Service Diaspora',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Fond vivant interactif avec nuages volumétriques réactifs au mouvement de la souris */}
      <InteractiveCloudBackground />

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/assets/aistudio/Sans_titre_b7fbb046.png"
              alt="Logo SERVI-DOX"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                SERVI-DOX
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white leading-none uppercase tracking-wide">
                CENTRE D'AFFAIRES
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Accompagnement Administratif · Coworking · Auto-Entrepreneur
            </p>
          </div>
        </div>

        {/* Action Buttons for Lateral Menu */}
        <div className="flex items-center gap-2">
          {/* Bouton Prise de Rendez-vous Client */}
          <button
            type="button"
            onClick={() => {
              setBookingDefaultMotif(undefined);
              setIsBookingModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg border border-blue-400/40 shadow-sm transition-all"
            title="Prendre un rendez-vous (Samedi à Jeudi · 08h30-11h30 & 13h30-15h30)"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>Prendre RDV</span>
            <span className="hidden xl:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-blue-100 font-semibold">Sam-Jeu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerTab('services');
              setIsDrawerOpen(true);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>Nos Services</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerTab('contact');
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Contact & Devis</span>
          </button>

          <a
            href="https://wa.me/213799679243"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
            title="Contacter directement sur WhatsApp au 0799679243"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="font-mono text-[11px]">0799679243</span>
          </a>

          {/* Lateral Menu Trigger Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center justify-center relative"
            aria-label="Ouvrir le menu latéral d'informations"
          >
            <Menu className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA : SPLIT VIEW (SHOWCASE & LOGIN FORM) */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full gap-8 lg:gap-12">
        {/* LEFT COLUMN: HERO SHOWCASE (VIBRANT & ENGAGING) */}
        <div className="flex-1 space-y-6 max-w-2xl text-center lg:text-left">
          {/* Badge officiel de confiance */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Le Partenaire Stratégique de vos Démarches en Algérie</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Votre réussite administrative commence avec{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              SERVI-DOX
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Création de sociétés SARL/EURL, domiciliation commerciale 6 mois & 1 an, espace coworking ultra-équipé, école de langues, fiscalité auto-entrepreneur et assistance sur-mesure pour les résidents et la diaspora.
          </p>

          {/* DYNAMIC MOVING SERVICES CAROUSEL ("Pages qui bougent") */}
          <div className="pt-1 text-left">
            <MovingServicesShowcase
              onSelectService={(motif) => {
                setBookingDefaultMotif(motif);
                setIsBookingModalOpen(true);
              }}
            />
          </div>

          {/* Quick Access Pills for Services & Contact */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setDrawerTab('services');
                setIsDrawerOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Explorer nos 9 Services</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <a
              href="https://maps.app.goo.gl/3N5bH1WtqAp9BVgQ6"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Localisation Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('reviews');
                setIsDrawerOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 rounded-xl border border-amber-800/60 transition-all flex items-center gap-1.5"
            >
              <div className="flex text-amber-400">
                {'★'.repeat(5)}
              </div>
              <span>4.9 / 5 (Évaluer)</span>
            </button>
          </div>

          {/* Reseaux Sociaux Officiels (Demande utilisateur) */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <span className="text-xs text-slate-400 font-medium">Rejoignez-nous :</span>
            
            {/* Facebook */}
            <a
              href="https://www.facebook.com/p/Servidox-61588283967931/?locale=fr_FR"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-800 hover:bg-[#1877F2] text-slate-300 hover:text-white transition-all border border-slate-700"
              title="Page Facebook Officielle SERVI-DOX"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@servidox"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-800 hover:bg-black text-slate-300 hover:text-white transition-all border border-slate-700"
              title="Compte TikTok Officiel @servidox"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/servi_dox/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-800 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 text-slate-300 hover:text-white transition-all border border-slate-700"
              title="Compte Instagram Officiel @servi_dox"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* WhatsApp direct */}
            <a
              href="https://wa.me/213799679243"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-800 hover:bg-[#25D366] text-slate-300 hover:text-white transition-all border border-slate-700"
              title="WhatsApp direct 0799679243"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN & AUTH CARD */}
        <div className="w-full max-w-md">
          <div className="bg-slate-900/80 border border-slate-700/60 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden p-6 sm:p-8 relative">
            {/* Logo Badge in Login Card */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white p-1.5 mx-auto mb-3 shadow-lg flex items-center justify-center">
                <img
                  src="/assets/aistudio/Sans_titre_b7fbb046.png"
                  alt="SERVI-DOX"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Espace Sécurisé</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Accès Administrateur & Portail Employés
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-slate-900/80 p-1 rounded-xl mb-5 border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connexion</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                  setPendingNotice(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Créer un compte</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {pendingNotice && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Demande d'accès transmise à la Direction !</span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  Votre compte (<strong>{pendingNotice.email}</strong> · <em>{pendingNotice.jobTitle}</em>) a bien été créé avec le statut <strong className="text-amber-400">EN ATTENTE DE VALIDATION</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-700/50 text-[11px] text-amber-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Sécurité SERVI-DOX active :</span>
                  </p>
                  <p className="text-slate-300">
                    Seul l'Administrateur Principal (<strong>zinemoh106@gmail.com</strong>) peut approuver et débloquer votre accès. Vous ne pouvez pas entrer dans le système sans cette validation préalable.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingNotice(null);
                  }}
                  className="w-full py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Retourner à l'écran de connexion
                </button>
              </div>
            )}

            {mode === 'login' ? (
              <>
                {/* Official Sign in with Google Button (Quick Connect) */}
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continuer avec Google (Gmail)</span>
                  </button>

                  <div className="relative mt-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-slate-800 px-2 text-slate-400 font-semibold">
                        ou avec identifiants email
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-semibold text-slate-300"
                    >
                      Adresse Email (Admin ou Employé)
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="zinemoh106@gmail.com"
                        className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-300"
                    >
                      Mot de passe
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password"
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg transition-colors disabled:opacity-60 mt-4 cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Connexion en cours...</span>
                    ) : (
                      <>
                        <span>Accéder à l'espace de gestion</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-blue-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Demande d'accès Collaborateur</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Toute création de compte est transmise avec le statut <strong>En attente</strong>. Seul l'Administrateur Principal (<strong>zinemoh106@gmail.com</strong>) est habilité à approuver votre accès.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Nom et Prénom *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Karim Benali"
                    className="mt-1 block w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-700 rounded-xl bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Poste / Rôle souhaité *</label>
                  <select
                    value={regJobTitle}
                    onChange={(e) => setRegJobTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-700 rounded-xl bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Gestionnaire Dossiers RC & Entreprise">Gestionnaire Dossiers RC & Entreprise</option>
                    <option value="Conseiller Auto-entrepreneur">Conseiller Auto-entrepreneur (ANAE & CASNOS)</option>
                    <option value="Chargé de Domiciliation Commerciale">Chargé de Domiciliation Commerciale</option>
                    <option value="Assistant Fiscalité & Déclarations G50">Assistant Fiscalité & Déclarations G50</option>
                    <option value="Accueil & Relations Clients">Accueil & Relations Clients</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Adresse Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="exemple@gmail.com"
                    className="mt-1 block w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-700 rounded-xl bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Téléphone / WhatsApp</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0550 12 34 56"
                    className="mt-1 block w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-700 rounded-xl bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Mot de passe</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 4 car."
                      className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Confirmer</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Retapez"
                      className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Envoyer ma demande d'accès (Validation requise)</span>
                </button>
              </form>
            )}
          </div>

          {/* DÉDIÉ AUX CLIENTS : CARTE PRISE DE RENDEZ-VOUS */}
          <div className="mt-4 p-4 rounded-3xl bg-slate-900/80 border border-blue-500/40 backdrop-blur-2xl shadow-xl text-center space-y-2.5">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Espace Clients SERVI-DOX</span>
            </div>

            <h3 className="text-sm font-bold text-white">
              Vous souhaitez réserver un rendez-vous ?
            </h3>

            <p className="text-[11px] text-slate-300 leading-snug">
              Choisissez votre motif et réservez un créneau direct du <strong className="text-white">Samedi au Jeudi</strong> (08h30-11h30 & 13h30-15h30). Aucun mot de passe requis.
            </p>

            <button
              type="button"
              onClick={() => {
                setBookingDefaultMotif(undefined);
                setIsBookingModalOpen(true);
              }}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-blue-400/40 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Prendre un Rendez-vous en Ligne</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/60 py-4 px-4 sm:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SERVI-DOX · Centre d'Affaires & Assistance Administrative Agréé</span>
        </div>
        <div>
          Contact direct : <strong className="text-slate-300 font-mono">0799679243</strong> · Alger, Algérie
        </div>
      </footer>

      {/* =========================================================================
          LATERAL SLIDING DRAWER (MENU LATÉRAL RICHE & INTERACTIF)
          Contient : Nos Services, Formulaire de Contact, Localisation Maps, Évaluation
          ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content Panel */}
          <div className="relative z-10 w-full max-w-lg bg-slate-900 text-slate-100 h-full border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Top Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                  <img
                    src="/assets/aistudio/Sans_titre_b7fbb046.png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">SERVI-DOX Algérie</h3>
                  <p className="text-[11px] text-slate-400">Portail Services, Contact & Localisation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Fermer le panneau latéral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs inside Drawer */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-center">
              <button
                type="button"
                onClick={() => setDrawerTab('services')}
                className={`py-2.5 px-1 transition-all border-b-2 flex flex-col items-center gap-1 ${
                  drawerTab === 'services'
                    ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Services</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('contact')}
                className={`py-2.5 px-1 transition-all border-b-2 flex flex-col items-center gap-1 ${
                  drawerTab === 'contact'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Contact</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('map')}
                className={`py-2.5 px-1 transition-all border-b-2 flex flex-col items-center gap-1 ${
                  drawerTab === 'map'
                    ? 'border-rose-500 text-rose-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Maps & Réseaux</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('reviews')}
                className={`py-2.5 px-1 transition-all border-b-2 flex flex-col items-center gap-1 ${
                  drawerTab === 'reviews'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Avis (4.9)</span>
              </button>
            </div>

            {/* Drawer Body Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* TAB 1: NOS SERVICES (9 SERVICES SERVI-DOX) */}
              {drawerTab === 'services' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Catalogue des Solutions & Services SERVI-DOX
                    </h4>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-700/50">
                      9 Pôles d'Expertise
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {SERVICES_LIST.map((srv, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 hover:border-blue-500/50 hover:bg-slate-800 transition-all flex items-start gap-3 group"
                      >
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/60 shrink-0">
                          {srv.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <h5 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                              {srv.title}
                            </h5>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                              {srv.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {srv.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bouton pour demander un devis pour un de ces services */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setDrawerTab('contact')}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Demander un devis ou une prise en charge</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: FORMULAIRE DE CONTACT CLIENT & WHATSAPP */}
              {drawerTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Contactez nos Conseillers</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Remplissez le formulaire ci-dessous pour nous joindre directement ou envoyer votre demande via WhatsApp au <strong>0799679243</strong>.
                    </p>
                  </div>

                  {contactSubmitted && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Votre demande a été transmise avec succès ! Nos conseillers vous répondront dans les plus brefs délais.
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSendContactWhatsApp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Votre Nom Complet *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ex: Mohamed Amine"
                        className="mt-1 block w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Numéro de Téléphone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Ex: 0550 12 34 56"
                        className="mt-1 block w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Adresse Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Ex: contact@client.com"
                        className="mt-1 block w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Service concerné *</label>
                      <select
                        value={contactService}
                        onChange={(e) => setContactService(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Création d’Entreprise (SARL, EURL)">Création d’Entreprise (SARL, EURL)</option>
                        <option value="Registre de Commerce Personne Physique">Registre de Commerce Personne Physique</option>
                        <option value="Domiciliation Commerciale (6 mois ou 1 an)">Domiciliation Commerciale (6 mois ou 1 an)</option>
                        <option value="Espace Coworking & Bureaux">Espace Coworking & Bureaux</option>
                        <option value="Auto-Entrepreneur (ANAE & CASNOS)">Auto-Entrepreneur (ANAE & CASNOS)</option>
                        <option value="École de Langues Étrangères">École de Langues Étrangères</option>
                        <option value="Stratégies Marketing & E-Commerce">Stratégies Marketing & E-Commerce</option>
                        <option value="Représentation Diaspora (Émigrés)">Représentation Diaspora (Émigrés)</option>
                        <option value="Autre formalité administrative">Autre formalité administrative</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Votre Message / Détails du projet</label>
                      <textarea
                        rows={3}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Précisez votre demande ou vos questions..."
                        className="mt-1 block w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Envoyer directement sur WhatsApp (0799679243)</span>
                      </button>

                      <a
                        href="tel:0799679243"
                        className="w-full py-2 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        <span>Appeler directement le 0799679243</span>
                      </a>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: LOCALISATION MAPS & RÉSEAUX SOCIAUX */}
              {drawerTab === 'map' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Notre Localisation & Réseaux</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Venez nous rendre visite à notre bureau d'affaires ou suivez nos actualités officielles.
                    </p>
                  </div>

                  {/* Google Maps Card with official link */}
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Bureau SERVI-DOX</h5>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          Alger, Algérie — Accueil du Dimanche au Jeudi de 08h30 à 16h30.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://maps.app.goo.gl/3N5bH1WtqAp9BVgQ6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Ouvrir dans Google Maps (Itinéraire)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Réseaux Sociaux Officiels */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Réseaux Sociaux Officiels SERVI-DOX
                    </span>

                    {/* Facebook */}
                    <a
                      href="https://www.facebook.com/p/Servidox-61588283967931/?locale=fr_FR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-800/60 hover:bg-[#1877F2]/20 border border-slate-700/80 hover:border-[#1877F2]/50 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-blue-300">
                            Facebook Officiel
                          </div>
                          <span className="text-[10px] text-slate-400">@Servidox</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-300" />
                    </a>

                    {/* TikTok */}
                    <a
                      href="https://www.tiktok.com/@servidox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/50 border border-slate-700/80 hover:border-slate-500 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 border border-slate-700">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-slate-200">
                            TikTok Vidéos
                          </div>
                          <span className="text-[10px] text-slate-400">@servidox</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                    </a>

                    {/* Instagram */}
                    <a
                      href="https://www.instagram.com/servi_dox/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-800/60 hover:bg-pink-600/10 border border-slate-700/80 hover:border-pink-500/40 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-pink-300">
                            Instagram
                          </div>
                          <span className="text-[10px] text-slate-400">@servi_dox</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-300" />
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href="https://wa.me/213799679243"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-800/60 hover:bg-[#25D366]/20 border border-slate-700/80 hover:border-[#25D366]/50 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                            WhatsApp Direct
                          </div>
                          <span className="text-[10px] text-slate-400">0799679243</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-300" />
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 4: AVIS & BOUTON D'ÉVALUATION */}
              {drawerTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Évaluez nos Services</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Votre satisfaction est notre priorité absolue.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-amber-400">4.9 / 5</span>
                      <div className="flex text-amber-400 text-xs justify-end">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>

                  {reviewSubmitted ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                      <p className="font-bold">Merci pour votre évaluation !</p>
                      <p className="text-slate-400 text-[11px]">Votre avis a bien été enregistré avec succès.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Votre Note Globale :
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingScore(star)}
                              onMouseEnter={() => setRatingHover(star)}
                              onMouseLeave={() => setRatingHover(0)}
                              className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                            >
                              <span
                                className={
                                  star <= (ratingHover || ratingScore)
                                    ? 'text-amber-400'
                                    : 'text-slate-600'
                                }
                              >
                                ★
                              </span>
                            </button>
                          ))}
                          <span className="text-xs font-bold text-amber-300 ml-2">
                            {ratingScore} / 5 étoiles
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300">Votre Nom ou Entreprise *</label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="Ex: Karim Hadj / SARL Tech"
                          className="mt-1 block w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300">Votre Témoignage / Commentaire</label>
                        <textarea
                          rows={2}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Partagez votre expérience avec le bureau SERVI-DOX..."
                          className="mt-1 block w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Publier mon Évaluation</span>
                      </button>
                    </form>
                  )}

                  {/* Témoignages récents */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Derniers Avis Vérifiés
                    </span>

                    {recentReviews.map((rev, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{rev.name}</span>
                          <span className="text-amber-400 font-mono text-[11px]">
                            {'★'.repeat(rev.score)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 italic">"{rev.comment}"</p>
                        <span className="text-[10px] text-slate-500 block text-right">{rev.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RÉSERVATION DE RENDEZ-VOUS CLIENT */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        defaultMotif={bookingDefaultMotif}
      />
    </div>
  );
};
