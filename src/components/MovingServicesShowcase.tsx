import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Building2,
  Briefcase,
  Award,
  FileCheck2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Pause,
  Play,
  ShieldCheck,
  Star,
} from 'lucide-react';

export interface ServiceCardData {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  motifTitle: string;
  accentColor: {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    glow: string;
    gradient: string;
    buttonBg: string;
    buttonHover: string;
    iconBg: string;
    iconText: string;
  };
  icon: React.ReactNode;
  whatsAppText: string;
}

interface MovingServicesShowcaseProps {
  onSelectService: (motifTitle: string) => void;
}

export const MovingServicesShowcase: React.FC<MovingServicesShowcaseProps> = ({
  onSelectService,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const SERVICES: ServiceCardData[] = [
    {
      id: 'auto_entrepreneur',
      tabLabel: 'Auto-Entrepreneur',
      badge: 'Loi n° 22-23 · ANAE Algérie',
      title: 'Statut Auto-Entrepreneur',
      subtitle: 'Obtenez votre carte ANAE officielle & lancez votre activité',
      description:
        'Le statut idéal pour les freelances, développeurs, formateurs, artisans et consultants en Algérie avec avantages fiscaux inédits.',
      features: [
        'Carte officielle d’auto-entrepreneur délivrée rapidement',
        'Régime fiscal allégé : Impôt Forfaitaire Unique (IFU) à seulement 0,5%',
        'Couverture sociale complète CASNOS & Carte Chifa',
        'Ouverture d’un compte bancaire commercial sans registre de commerce',
        'Facturation légale des entreprises algériennes et étrangères',
      ],
      motifTitle: 'Création Auto-Entrepreneur (Carte ANAE & CASNOS)',
      accentColor: {
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-500/30',
        glow: 'from-emerald-600/20 via-teal-600/10 to-transparent',
        gradient: 'from-emerald-500 to-teal-600',
        buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
        buttonHover: 'hover:border-emerald-400',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        iconText: 'text-emerald-400',
      },
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      whatsAppText:
        'Bonjour SERVI-DOX, je souhaite créer ma carte Auto-Entrepreneur ANAE et mon affiliation CASNOS.',
    },
    {
      id: 'registre_commerce',
      tabLabel: 'Registre de Commerce',
      badge: 'CNRC · Immatriculation Officielle',
      title: 'Registre de Commerce (CNRC)',
      subtitle: 'Personne Physique ou Morale avec prise en charge complète',
      description:
        'Formalités administratives sans tracas : création, modification de codes d’activités, renouvellement et mise en conformité au CNRC.',
      features: [
        'Immatriculation express au Centre National du Registre de Commerce',
        'Sélection et validation des codes d’activité réglementés et libres',
        'Attribution rapide des identifiants NIS, NIF et Extrait de Rôle',
        'Modifications des statuts, adjonction d’activités et changement de gérant',
        'Radiation ou mise en sommeil selon la réglementation algérienne',
      ],
      motifTitle: "Création d'Entreprise & RC (SARL, EURL, SPA)",
      accentColor: {
        badgeBg: 'bg-blue-500/15',
        badgeText: 'text-blue-300',
        badgeBorder: 'border-blue-500/30',
        glow: 'from-blue-600/20 via-indigo-600/10 to-transparent',
        gradient: 'from-blue-500 to-indigo-600',
        buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
        buttonHover: 'hover:border-blue-400',
        iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        iconText: 'text-blue-400',
      },
      icon: <FileCheck2 className="w-6 h-6 text-blue-400" />,
      whatsAppText:
        'Bonjour SERVI-DOX, je souhaite faire une démarche de Registre de Commerce CNRC (création/modification).',
    },
    {
      id: 'creation_entreprise',
      tabLabel: 'Création Entreprise',
      badge: 'Pack Société Clé en Main',
      title: "Création d'Entreprise (SARL / EURL / SPA)",
      subtitle: 'Structurez votre société avec conformité juridique totale',
      description:
        'Prise en charge intégrale de l’acte notarié jusqu’au retrait du registre définitif et aux démarches fiscales et bancaires.',
      features: [
        'Rédaction des statuts notariés et blocage de capital en banque',
        'Parution légale obligatoire au Bulletin Officiel (BOAL) et journaux',
        'Dépôt au CNRC et obtention de l’extrait de registre définitif',
        'Immatriculation auprès des impôts (NIF), statistiques (NIS) et CASNOS/CNAS',
        'Assistance pour résidents et membres de la Diaspora algérienne',
      ],
      motifTitle: "Création d'Entreprise & RC (SARL, EURL, SPA)",
      accentColor: {
        badgeBg: 'bg-indigo-500/15',
        badgeText: 'text-indigo-300',
        badgeBorder: 'border-indigo-500/30',
        glow: 'from-indigo-600/20 via-purple-600/10 to-transparent',
        gradient: 'from-indigo-500 to-purple-600',
        buttonBg: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500',
        buttonHover: 'hover:border-indigo-400',
        iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        iconText: 'text-indigo-400',
      },
      icon: <Building2 className="w-6 h-6 text-indigo-400" />,
      whatsAppText:
        'Bonjour SERVI-DOX, je souhaite créer une entreprise (SARL / EURL / SPA) et connaître les étapes.',
    },
    {
      id: 'domiciliation_commerciale',
      tabLabel: 'Domiciliation Commerciale',
      badge: 'Formules Agréées 6 Mois & 1 An',
      title: 'Domiciliation Commerciale Agréée',
      subtitle: 'Une adresse de prestige à Alger pour votre siège social',
      description:
        'Idéal pour enregistrer votre registre de commerce ou société sans avoir à louer un local commercial coûteux.',
      features: [
        'Contrat de domiciliation notarié 100% conforme et agréé par l’État',
        'Adresse stratégique à Alger valorisant l’image de marque de votre société',
        'Accepté sans réserve par le CNRC, l’inspection des impôts et banques',
        'Réception et réexpédition confidentielle de vos courriers & colis',
        'Accès à nos salles de réunion et espaces professionnels pour vos rendez-vous',
      ],
      motifTitle: 'Domiciliation Commerciale (Formule 6 mois ou 1 an)',
      accentColor: {
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/30',
        glow: 'from-amber-600/20 via-orange-600/10 to-transparent',
        gradient: 'from-amber-500 to-orange-600',
        buttonBg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
        buttonHover: 'hover:border-amber-400',
        iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        iconText: 'text-amber-400',
      },
      icon: <Award className="w-6 h-6 text-amber-400" />,
      whatsAppText:
        'Bonjour SERVI-DOX, je souhaite des informations sur votre contrat de domiciliation commerciale (6 mois / 1 an).',
    },
    {
      id: 'fiscalite_casnos',
      tabLabel: 'Fiscalité & CASNOS',
      badge: 'G50 · Télé-Déclarations · Bilan',
      title: 'Déclarations Fiscales & CASNOS',
      subtitle: 'Sécurité et conformité fiscale pour votre activité',
      description:
        'Évitez tout retard, pénalité ou blocage administratif grâce à notre suivi rigoureux de vos échéances fiscales et sociales.',
      features: [
        'Établissement et dépôt de vos déclarations mensuelles G50',
        'Gestion des déclarations annuelles IFU et régularisations',
        'Affiliation, mise à jour des cotisations CASNOS et CNAS',
        'Obtention rapide des attestations d’apurement et de mise à jour',
        'Assistance et conseil pour optimiser votre fiscalité en Algérie',
      ],
      motifTitle: 'Déclarations Fiscales & Impôts (G50 / Bilan IFU)',
      accentColor: {
        badgeBg: 'bg-cyan-500/15',
        badgeText: 'text-cyan-300',
        badgeBorder: 'border-cyan-500/30',
        glow: 'from-cyan-600/20 via-blue-600/10 to-transparent',
        gradient: 'from-cyan-500 to-blue-600',
        buttonBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
        buttonHover: 'hover:border-cyan-400',
        iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        iconText: 'text-cyan-400',
      },
      icon: <Briefcase className="w-6 h-6 text-cyan-400" />,
      whatsAppText:
        'Bonjour SERVI-DOX, je souhaite un accompagnement pour mes déclarations fiscales (G50 / CASNOS).',
    },
  ];

  const currentService = SERVICES[currentIndex];

  // Auto-play animation every 4 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % SERVICES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, SERVICES.length]);

  const handlePrev = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev === 0 ? SERVICES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % SERVICES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const handleWhatsAppInquiry = (service: ServiceCardData) => {
    const cleanPhone = '213799679243';
    const encoded = encodeURIComponent(service.whatsAppText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div
      className="w-full relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* HEADER SECTION: Interactive Tabs & Auto-Play Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPaused ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isPaused ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
            Nos Services Phares
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            ({currentIndex + 1} / {SERVICES.length})
          </span>
        </div>

        {/* Carousel Micro Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1 shadow-sm backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            title={isPaused ? 'Relancer le défilement automatique' : 'Mettre en pause'}
            aria-label="Pause / Lecture du défilement"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={handlePrev}
            className="p-1 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            title="Service précédent"
            aria-label="Service précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="p-1 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            title="Service suivant"
            aria-label="Service suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK SELECTOR PILLS (Click to jump immediately to any service) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {SERVICES.map((s, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setDirection(index > currentIndex ? 'next' : 'prev');
                setCurrentIndex(index);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-slate-800 text-white border-blue-500/80 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-blue-400' : 'bg-slate-600'
                }`}
              />
              <span>{s.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* DYNAMIC MOVING CARD (The "Page qui bouge") */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-slate-600">
        {/* Glow ambient background responsive to service color */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${currentService.accentColor.glow} pointer-events-none transition-all duration-700 opacity-60`}
        />

        {/* Top Progress Bar showing auto-slide cycle */}
        <div className="relative h-1 w-full bg-slate-800 overflow-hidden">
          <div
            key={currentIndex}
            className={`h-full bg-gradient-to-r ${currentService.accentColor.gradient} transition-all duration-[4000ms] ease-linear`}
            style={{
              width: isPaused ? '100%' : '100%',
              animation: isPaused ? 'none' : 'showcaseProgress 4s linear',
            }}
          />
        </div>

        {/* Card Content with entrance animation */}
        <div
          key={currentService.id}
          className="p-5 sm:p-6 space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-300"
        >
          {/* Header row: Badge, Icon & Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentService.accentColor.badgeBg} ${currentService.accentColor.badgeText} ${currentService.accentColor.badgeBorder}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentService.badge}</span>
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {currentService.title}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {currentService.subtitle}
              </p>
            </div>

            {/* Glowing Icon */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${currentService.accentColor.iconBg}`}
            >
              {currentService.icon}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
            {currentService.description}
          </p>

          {/* Feature Checkmarks */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Avantages & Prestations incluses :
            </span>
            <ul className="space-y-1.5">
              {currentService.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${currentService.accentColor.iconText}`}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ACTIONS: 1-Click RDV Booking & WhatsApp */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Primary Action Button: Opens Appointment Modal with service pre-selected */}
            <button
              type="button"
              onClick={() => onSelectService(currentService.motifTitle)}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] cursor-pointer ${currentService.accentColor.buttonBg}`}
              title={`Prendre un rendez-vous direct pour : ${currentService.title}`}
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Prendre RDV pour ce Service</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            {/* Secondary Action: Direct WhatsApp consultation */}
            <button
              type="button"
              onClick={() => handleWhatsAppInquiry(currentService)}
              className="py-3 px-4 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 transition-all flex items-center justify-center gap-2 hover:text-white cursor-pointer"
              title="Discuter de cette formalité sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Direct</span>
            </button>
          </div>
        </div>

        {/* BOTTOM PAGINATION DOTS */}
        <div className="py-2.5 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="text-[11px] text-slate-400 font-medium">
              Horaires : <strong className="text-slate-200">Samedi à Jeudi</strong> (08h30-11h30 & 13h30-15h30)
            </span>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {SERVICES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDirection(i > currentIndex ? 'next' : 'prev');
                  setCurrentIndex(i);
                }}
                className={`transition-all rounded-full ${
                  i === currentIndex
                    ? 'w-6 h-2 bg-blue-500'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Aller au service ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
