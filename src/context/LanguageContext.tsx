import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Globe } from 'lucide-react';

export type AppLanguage = 'fr' | 'ar';

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  isRTL: boolean;
}

const STORAGE_LANG_KEY = 'servidox_app_lang_v1';

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  toggleLang: () => {},
  isRTL: false,
});

export const useLanguage = () => useContext(LanguageContext);

/**
 * Dictionnaire complet Français -> Arabe (Exact Match, insensible à la casse de début/fin)
 */
const EXACT_FR_TO_AR: Record<string, string> = {
  // Navigation & Menu Latéral
  'Menu Principal SERVI-DOX': 'القائمة الرئيسية SERVI-DOX',
  'Espace Administrateur': 'فضاء المدير',
  'Profil Administrateur': 'الملف الشخصي للمدير',
  'Profil Administrateur Principal': 'الملف الشخصي للمدير الرئيسي',
  'Mon Profil Employé': 'ملفي الشخصي كموظف',
  'Rendez-vous Clients': 'مواعيد الزبائن',
  'Liste des Clients': 'قائمة الزبائن',
  'Ajouter un Client': 'إضافة زبون',
  'Auto-Entrepreneur': 'المقاول الذاتي',
  'Auto-entrepreneur': 'المقاول الذاتي',
  'SARL / EURL': 'شركة SARL / EURL',
  'Registre RC': 'السجل التجاري RC',
  'Hors Wilaya': 'خارج الولاية',
  'Suivi Bureau': 'متابعة بالمكتب',
  'Tarifs & Papiers (PDF)': 'الأسعار والوثائق (PDF)',
  'Notre Équipe': 'فريق العمل',
  'Fiches de Paie': 'كشوف الرواتب',
  'Tableau des Revenus': 'جدول المداخيل',
  'Messagerie Gmail': 'بريد Gmail',
  'Google Sheets': 'جداول Google Sheets',
  "Journal d'Activité": 'سجل النشاطات',
  'Déconnexion': 'تسجيل الخروج',
  'Se déconnecter': 'تسجيل الخروج',
  'Administrateur': 'مدير النظام',
  'Employé': 'موظف',

  // Titres des pages (Navbar)
  'Liste & Contrôle des Clients (Tous les dossiers)': 'قائمة ومراقبة الزبائن (جميع الملفات)',
  'Ajouter un Nouveau Dossier Client': 'إضافة ملف زبون جديد',
  'Dossiers Auto-Entrepreneurs — Suivi & CASNOS': 'ملفات المقاول الذاتي — المتابعة و CASNOS',
  'Dossiers SARL & EURL — Création d’Entreprise (100 000 DA)': 'ملفات SARL و EURL — تأسيس الشركات (100,000 د.ج)',
  'Dossiers Registre du Commerce RC (50 000 DA)': 'ملفات السجل التجاري RC (50,000 د.ج)',
  'Dossiers Clients Hors Wilaya — Suivi 58 Wilayas (15 000 DA)': 'ملفات الزبائن خارج الولاية — متابعة 58 ولاية (15,000 د.ج)',
  'Dossiers Inscription & Suivi au Bureau (12 000 DA)': 'ملفات التسجيل والمتابعة بالمكتب (12,000 د.ج)',
  'Guide des Tarifs & Papiers Nécessaires (PDF)': 'دليل الأسعار والوثائق المطلوبة (PDF)',
  'Notre Équipe — Gestion des Employés': 'فريقنا — تسيير الموظفين',
  'Fiches de Paie — Bulletins Mensuels & Bilans Annuels': 'كشوف الرواتب — البيانات الشهرية والحصيلة السنوية',
  'Tableau des Revenus (DA)': 'جدول المداخيل والأرباح (د.ج)',
  'Gestion des Rendez-vous Clients (Réservations)': 'إدارة مواعيد الزبائن (الحجوزات)',
  'Google Sheets — Tableurs & Synchronisation Cloud': 'Google Sheets — الجداول والمزامنة السحابية',

  // Page de Connexion & Accueil Public
  "CENTRE D'AFFAIRES": 'مركز الأعمال',
  'Accompagnement Administratif · Coworking · Auto-Entrepreneur': 'مرافقة إدارية · فضاء عمل مشترك · مقاول ذاتي',
  'Prendre RDV': 'حجز موعد',
  'Sam-Jeu': 'السبت-الخميس',
  'Nos Services': 'خدماتنا',
  'Contact & Devis': 'اتصل بنا وطلب عرض سعر',
  'Le Partenaire Stratégique de vos Démarches en Algérie': 'شريكك الاستراتيجي لجميع إجراءاتك الإدارية في الجزائر',
  'Votre réussite administrative commence avec': 'نجاحك الإداري والتجاري يبدأ مع',
  'Création de sociétés SARL/EURL, domiciliation commerciale 6 mois & 1 an, espace coworking ultra-équipé, école de langues, fiscalité auto-entrepreneur et assistance sur-mesure pour les résidents et la diaspora.':
    'تأسيس شركات SARL/EURL، توطين تجاري لمدة 6 أشهر أو سنة، فضاء عمل مشترك مجهز بالكامل، مدرسة لغات، ملفات المقاول الذاتي ومرافقة خاصة للمقيمين والجالية بالخارج.',
  'Explorer nos 9 Services': 'استكشف خدماتنا الـ 9',
  'Localisation Maps': 'الموقع على الخريطة',
  '4.9 / 5 (Évaluer)': '4.9 / 5 (تقييم)',
  'Rejoignez-nous :': 'تابعونا على:',
  'Espace Sécurisé': 'فضاء آمن',
  'Accès Administrateur & Portail Employés': 'دخول الإدارة وبوابة الموظفين',
  'Connexion': 'تسجيل الدخول',
  'Créer un compte': 'إنشاء حساب',
  'Continuer avec Google (Gmail)': 'المتابعة باستخدام حساب Google (Gmail)',
  'ou avec identifiants email': 'أو بواسطة البريد الإلكتروني',
  'Adresse Email (Admin ou Employé)': 'البريد الإلكتروني (مدير أو موظف)',
  'Votre adresse email': 'بريدك الإلكتروني',
  'Mot de passe': 'كلمة المرور',
  'Afficher': 'إظهار',
  'Masquer': 'إخفاء',
  "Accéder à l'espace de gestion": 'الدخول إلى فضاء التسيير',
  'Connexion en cours...': 'جاري تسجيل الدخول...',
  "Demande d'accès Collaborateur": 'طلب انضمام كموظف',
  'Nom et Prénom *': 'الاسم واللقب *',
  'Poste / Rôle souhaité *': 'المنصب / الدور المطلوب *',
  'Adresse Email *': 'البريد الإلكتروني *',
  'Téléphone / WhatsApp': 'الهاتف / واتساب',
  'Confirmer': 'تأكيد كلمة المرور',
  "Envoyer ma demande d'accès (Validation requise)": 'إرسال طلب الدخول (يتطلب موافقة الإدارة)',
  'Espace Clients SERVI-DOX': 'فضاء زبائن SERVI-DOX',
  'Vous souhaitez réserver un rendez-vous ?': 'هل ترغب في حجز موعد؟',
  'Prendre un Rendez-vous en Ligne': 'حجز موعد عبر الإنترنت',
  "SERVI-DOX · Centre d'Affaires & Assistance Administrative Agréé": 'SERVI-DOX · مركز أعمال ومرافقة إدارية معتمد',
  'Services': 'الخدمات',
  'Contact': 'اتصل بنا',
  'Maps & Réseaux': 'الموقع والشبكات',
  'Avis (4.9)': 'الآراء (4.9)',

  // Modal de Prise de Rendez-vous
  'Prise de Rendez-vous en Ligne': 'حجز موعد عبر الإنترنت',
  'Réserver un Créneau SERVI-DOX': 'حجز موعد لدى مكتب SERVI-DOX',
  'Choisissez votre motif, sélectionnez votre date et heure de passage. Votre demande est instantanément transmise à notre secrétariat.':
    'اختر موضوع الموعد، وحدد التاريخ والساعة المناسبة لك. يتم إرسال طلبك فوراً إلى مكتب الاستقبال.',
  '1. Vos Coordonnées': '1. معلوماتك الشخصية',
  'Nom': 'اللقب',
  'Nom de famille': 'اللقب العائلي',
  'Prénom': 'الاسم',
  'Téléphone (WhatsApp)': 'رقم الهاتف (واتساب)',
  'Email (Pour confirmation)': 'البريد الإلكتروني (للتأكيد)',
  '2. Motif du Rendez-vous (Prestations SERVI-DOX)': '2. موضوع الموعد (خدمات SERVI-DOX)',
  '3. Date & Heure Souhaitée': '3. التاريخ والساعة المطلوبة',
  'Fermé le Vendredi': 'مغلق يوم الجمعة',
  'Date du RDV': 'تاريخ الموعد',
  'Samedi à Jeudi uniquement': 'من السبت إلى الخميس فقط',
  'Sélectionnez un créneau horaire :': 'اختر التوقيت المناسب:',
  'Matinée (08h30 - 11h30)': 'الفترة الصباحية (08:30 - 11:30)',
  'Après-midi (13h30 - 15h30)': 'الفترة المسائية (13:30 - 15:30)',
  'Remarque ou document apporté (facultatif)': 'ملاحظة أو وثائق مرفقة (اختياري)',
  'Annuler': 'إلغاء',
  'Valider mon Rendez-vous': 'تأكيد الموعد',
  'Enregistrement en cours...': 'جاري الحفظ...',
  'Fermer': 'إغلاق',

  // Page Tarifs & Papiers Nécessaires (PDF)
  'Guide Officiel des Tarifs & Papiers Nécessaires': 'الدليل الرسمي للأسعار والوثائق المطلوبة',
  'Format A4 Imprimable & PDF': 'صيغة A4 قابلة للطباعة و PDF',
  'Barème détaillé SERVI-DOX : Registre de Commerce (Ambulant / Alger), Auto-Entrepreneur et Société (EURL / SARL) avec options de domiciliation.':
    'جدول الأسعار المفصل لمكتب SERVI-DOX: السجل التجاري (متنقل / الجزائر)، المقاول الذاتي وتأسيس الشركات (EURL / SARL) مع خيارات التوطين التجاري.',
  'Nom du client sur le PDF (optionnel)...': 'اسم الزبون في ملف PDF (اختياري)...',
  'Télécharger le PDF Complet (A4)': 'تحميل ملف PDF الكامل (A4)',
  'Génération...': 'جاري الإنشاء...',
  'Imprimer la Fiche': 'طباعة الوثيقة',
  'Réinitialiser': 'إعادة الضبط',
  'Papiers Nécessaires à Fournir (Pièces Administratives du Dossier)': 'الوثائق المطلوبة لتكوين الملف الإداري',
  'Documents obligatoires requis pour la constitution et le dépôt de votre dossier chez SERVI-DOX':
    'الوثائق الإلزامية المطلوبة لإعداد وإيداع ملفكم لدى مكتب SERVI-DOX',
  '04 Extraits de naissance': '04 شهادات ميلاد',
  '04 Certificats de résidence': '04 شهادات إقامة',
  '01 Casier judiciaire': '01 شهادة السوابق العدلية',
  '01 Extrait du Casier Judiciaire (Bulletin n°3)': '01 شهادة السوابق العدلية (الصحيفة رقم 3)',
  "01 Copie Carte d'Identité (CNI)": '01 نسخة من بطاقة التعريف الوطنية',
  "01 Copie de la Carte Nationale d'Identité (CNI)": '01 نسخة من بطاقة التعريف الوطنية',
  '1. Registre du Commerce (Ambulant / Alger)': '1. السجل التجاري (متنقل / الجزائر العاصمة)',
  'Création de Registre du Commerce sur Alger, affiliation CASNOS & formalités CNRC':
    'إنشاء سجل تجاري بالجزائر العاصمة، الانتساب إلى CASNOS وإجراءات المركز الوطني للسجل التجاري CNRC',
  'Frais de dossier SERVI-DOX (sur Alger)': 'مصاريف ملف ومرافقة SERVI-DOX (الجزائر)',
  'Cotisation CASNOS (Annuelle)': 'اشتراك CASNOS السنوي',
  "Code d'activité (CNRC)": 'رمز النشاط التجاري (CNRC)',
  'Quittance CNRC': 'وصل حقوق التسجيل CNRC',
  'Procuration notariale (Notaire)': 'وكالة توثيقية (الموثق)',
  'Domiciliation — Formule 6 Mois': 'توطين تجاري — صيغة 6 أشهر',
  'Domiciliation — Formule 1 An (12 Mois)': 'توطين تجاري — صيغة سنة كاملة (12 شهراً)',
  '2. Auto-Entrepreneur': '2. المقاول الذاتي (Auto-Entrepreneur)',
  'Inscription ANAE, accompagnement complet, affiliation CASNOS & procuration notariale':
    'التسجيل في الوكالة الوطنية للمقاول الذاتي ANAE، المرافقة الكاملة، اشتراك CASNOS والوكالة التوثيقية',
  'Frais de dossier & suivi SERVI-DOX': 'مصاريف الملف والمتابعة SERVI-DOX',
  'Cotisation CASNOS (Auto-Entrepreneur)': 'اشتراك CASNOS للمقاول الذاتي',
  'Frais de Poste (Algérie Poste)': 'رسوم بريد الجزائر (Algérie Poste)',
  'Frais de Notaire (Procuration notariale)': 'مصاريف الموثق (وكالة توثيقية)',
  '3. Création Société — EURL ou SARL': '3. تأسيس شركة — EURL أو SARL',
  'Constitution juridique, capital social, immatriculation CNRC, CASNOS & domiciliation':
    'التأسيس القانوني، رأس المال الاجتماعي، القيد في السجل التجاري CNRC، اشتراك CASNOS والتوطين',
  'Frais de dossier & honoraires SERVI-DOX (EURL / SARL)': 'مصاريف الملف وأتعاب SERVI-DOX (شركة EURL / SARL)',
  'Capital Social (Constitution société)': 'رأس المال الاجتماعي (تأسيس الشركة)',
  'Papiers nécessaires à fournir': 'الوثائق المطلوبة لتكوين الملف',
  'Détail des Tarifs & Frais': 'تفاصيل الأسعار والرسوم',
  'Montant (DA)': 'المبلغ (د.ج)',
  'Total de base (Hors Domiciliation)': 'المجموع الأساسي (بدون توطين)',
  'Total Global du Dossier': 'المجموع الكلي للملف',
  'Tous les frais inclus en Dinars Algériens': 'جميع الرسوم شاملة بالدينار الجزائري',
  'En cas de Domiciliation (6 Mois ou 1 An)': 'في حالة التوطين التجاري (6 أشهر أو سنة)',
  'Total complet avec cette domiciliation :': 'المجموع الكلي مع هذا التوطين:',
  'Tableau Récapitulatif Général des Tarifs SERVI-DOX (DA)': 'الجدول التلخيصي العام لأسعار SERVI-DOX (د.ج)',
  'Synthèse comparative des 3 formules et des options de domiciliation (6 mois / 1 an)':
    'مقارنة شاملة للصيغ الثلاث مع خيارات التوطين التجاري (6 أشهر / سنة)',
  'Exporter tout le tableau en PDF': 'تصدير الجدول الكامل بصيغة PDF',
  'Type de Dossier': 'نوع الملف',
  'Frais SERVI-DOX': 'مصاريف SERVI-DOX',
  'Autres Frais (CNRC / Notaire / Capital)': 'مصاريف أخرى (CNRC / موثق / رأس المال)',
  'Total Hors Domiciliation': 'المجموع بدون توطين',
  'Avec Domiciliation 6 Mois (+58 000 DA)': 'مع توطين 6 أشهر (+58,000 د.ج)',
  'Avec Domiciliation 1 An (+98 000 DA)': 'مع توطين سنة كاملة (+98,000 د.ج)',

  // Statuts & Types de Dossiers
  'En cours': 'قيد المعالجة',
  'Complété': 'مكتمل',
  'En attente': 'في الانتظار',
  'Archivé': 'مؤرشف',
  'Entreprise': 'مؤسسة / شركة (SARL/EURL)',
  'RC': 'سجل تجاري (RC)',
  'Inscription & Suivi (Bureau)': 'تسجيل ومتابعة (بالمكتب)',
  'Inscription & Suivi (Hors Wilaya)': 'تسجيل ومتابعة (خارج الولاية)',
  'Autre dossier': 'ملف آخر',

  // Rôles SERVI-DOX
  'Gérant': 'مسير / مدير',
  'PDG': 'الرئيس المدير العام',
  'Secrétaire': 'سكرتيرة / أمانة',
  'SECRETAIRE': 'سكرتيرة / أمانة',
  'Assistante Administrative': 'مساعدة إدارية',
  'ASSISTANTE ADMINISTRATIVE': 'مساعدة إدارية',
  'Responsable de Dossier': 'مسؤول الملفات',
  'RESPONSABLE DE DOSSIER': 'مسؤول الملفات',

  // Actions communes & Tableaux Clients
  'Rechercher...': 'بحث...',
  'Exporter CSV': 'تصدير CSV',
  'Exporter les clients (CSV)': 'تصدير قائمة الزبائن (CSV)',
  'Imprimer': 'طباعة',
  'Modifier': 'تعديل',
  'Supprimer': 'حذف',
  'Enregistrer': 'حفظ',
  'Sauvegarder': 'حفظ',
  'Ajouter': 'إضافة',
  'Voir détails': 'عرض التفاصيل',
  'Client': 'الزبون',
  'Dossier': 'الملف',
  'Statut': 'الحالة',
  'Total (DA)': 'المجموع (د.ج)',
  'Encaissé': 'المقبوض',
  'Reste à payer': 'الباقي للدفع',
  'Actions': 'الإجراءات',
  'Payé intégralement': 'مدفوع بالكامل',
  'Soldé': 'خالص',
};

/**
 * Remplacements partiels / expressions récurrentes (triés par longueur décroissante à l'exécution)
 */
const PHRASE_REPLACEMENTS: Array<[string, string]> = [
  ['Synchroniser mon compte Google Gmail', 'مزامنة حسابي على Google Gmail'],
  ['Ajouter un Nouveau Dossier Client', 'إضافة ملف زبون جديد'],
  ['Inscription & Suivi (Hors Wilaya)', 'تسجيل ومتابعة (خارج الولاية)'],
  ['Inscription & Suivi (Bureau)', 'تسجيل ومتابعة (بالمكتب)'],
  ['Demande de Rendez-vous Enregistrée !', 'تم تسجيل طلب الموعد بنجاح!'],
  ['Valider mon Rendez-vous', 'تأكيد الموعد'],
  ['Prendre un Rendez-vous en Ligne', 'حجز موعد عبر الإنترنت'],
  ['Continuer avec Google (Gmail)', 'المتابعة عبر حساب Google (Gmail)'],
  ["Accéder à l'espace de gestion", 'الدخول إلى فضاء التسيير'],
  ['Exporter tout le tableau en PDF', 'تصدير الجدول الكامل بصيغة PDF'],
  ['Télécharger le PDF Complet (A4)', 'تحميل ملف PDF الكامل (A4)'],
  ['Imprimer la Fiche', 'طباعة الوثيقة'],
  ['Total Hors Domiciliation', 'المجموع بدون توطين'],
  ['Total de base (Hors Domiciliation)', 'المجموع الأساسي (بدون توطين)'],
  ['Total Global du Dossier', 'المجموع الكلي للملف'],
  ['Papiers nécessaires à fournir', 'الوثائق المطلوبة لتكوين الملف'],
  ['Détail des Tarifs & Frais', 'تفاصيل الأسعار والرسوم'],
  ['04 Extraits de naissance', '04 شهادات ميلاد'],
  ['04 Certificats de résidence', '04 شهادات إقامة'],
  ['01 Casier judiciaire', '01 شهادة السوابق العدلية'],
  ['Accompagnement Administratif', 'المرافقة الإدارية الشاملة'],
  ["Création d'Entreprise & RC", 'تأسيس الشركات والسجل التجاري'],
  ['Création d’Entreprise (SARL, EURL)', 'تأسيس الشركات (SARL, EURL)'],
  ['Registre de Commerce Personne Physique', 'سجل تجاري لشخص طبيعي'],
  ['Domiciliation Commerciale (6 mois ou 1 an)', 'التوطين التجاري (6 أشهر أو سنة)'],
  ['Espace Coworking Équipé', 'فضاء العمل المشترك المجهز'],
  ['Espace Coworking & Bureaux', 'فضاء العمل المشترك والمكاتب'],
  ['École de Langues Étrangères', 'مدرسة اللغات الأجنبية'],
  ['Stratégies Marketing & E-Commerce', 'استراتيجيات التسويق والتجارة الإلكترونية'],
  ['Formation & Développement Commercial', 'التكوين والتطوير التجاري'],
  ['Création Auto-Entrepreneur', 'إنشاء ملف المقاول الذاتي'],
  ['Représentation Clients Émigrés (Diaspora)', 'تمثيل الزبائن المغتربين (الجالية بالخارج)'],
  ['Représentation Diaspora (Émigrés)', 'تمثيل الجالية الجزائرية بالخارج'],
  ['Autre formalité administrative', 'إجراء إداري آخر'],
  ['Catalogue des Solutions & Services SERVI-DOX', 'دليل الحلول والخدمات لمكتب SERVI-DOX'],
  ['Contactez nos Conseillers', 'تواصل مع مستشارينا'],
  ['Votre Nom Complet', 'اسمك الكامل'],
  ['Numéro de Téléphone', 'رقم الهاتف'],
  ['Service concerné', 'الخدمة المطلوبة'],
  ['Votre Message / Détails du projet', 'رسالتك / تفاصيل مشروعك'],
  ['Envoyer directement sur WhatsApp', 'إرسال مباشرة عبر واتساب'],
  ['Appeler directement le', 'الاتصال مباشرة بالرقم'],
  ['Notre Localisation & Réseaux', 'موقعنا وشبكات التواصل'],
  ['Ouvrir dans Google Maps (Itinéraire)', 'فتح في خرائط Google (المسار)'],
  ['Réseaux Sociaux Officiels SERVI-DOX', 'الصفحات الرسمية لمكتب SERVI-DOX'],
  ['Évaluez nos Services', 'قيّم خدماتنا'],
  ['Votre Note Globale', 'تقييمك العام'],
  ['Votre Nom ou Entreprise', 'اسمك أو اسم مؤسستك'],
  ['Choisissez votre motif et réservez un créneau direct du', 'اختر موضوع موعدك واحجز توقيتك مباشرة من'],
  ['Aucun mot de passe requis.', 'بدون الحاجة إلى كلمة مرور.'],
  ['Contact direct :', 'اتصال مباشر:'],
  ['Alger, Algérie', 'الجزائر العاصمة، الجزائر'],
  ['Informations Personnelles', 'المعلومات الشخصية'],
  ['Informations du Dossier', 'معلومات الملف'],
  ['Suivi Financier', 'المتابعة المالية'],
  ['Situation Financière', 'الوضعية المالية'],
  ['Nouveau Dossier Client', 'ملف زبون جديد'],
  ['Liste des Dossiers', 'قائمة الملفات'],
  ['Tous les statuts', 'جميع الحالات'],
  ['Tous les types', 'جميع الأنواع'],
  ['Taux de recouvrement', 'نسبة التحصيل'],
  ['Dossiers en cours', 'ملفات قيد المعالجة'],
  ['Dossiers complétés', 'ملفات مكتملة'],
  ['Total Clients', 'إجمالي الزبائن'],
  ['Total Dossiers', 'إجمالي الملفات'],
  ['Créances à recouvrer', 'المستحقات المتبقية للتحصيل'],
  ['Ajouter un employé', 'إضافة موظف'],
  ['Nouveau Rendez-vous', 'موعد جديد'],
  ['Effacer uniquement les notifications', 'مسح الإشعارات فقط'],
  ['Synchronisé en temps réel', 'مزامنة فورية مباشرة'],
  ['Synchronisation Cloud', 'المزامنة السحابية'],
  ['Registre du Commerce', 'السجل التجاري'],
  ['Registre de Commerce', 'السجل التجاري'],
  ['Registre Commerce', 'السجل التجاري'],
  ['Auto-Entrepreneurs', 'المقاولين الذاتيين'],
  ['Auto-Entrepreneur', 'المقاول الذاتي'],
  ['Auto-entrepreneur', 'المقاول الذاتي'],
  ['Profil Administrateur Principal', 'الملف الشخصي للمدير الرئيسي'],
  ['Profil Administrateur', 'الملف الشخصي للمدير'],
  ['Mon Profil Employé', 'ملفي الشخصي كموظف'],
  ['Rendez-vous Clients', 'مواعيد الزبائن'],
  ['Liste des Clients', 'قائمة الزبائن'],
  ['Ajouter un Client', 'إضافة زبون'],
  ['Ajouter un client', 'إضافة زبون'],
  ['Nouveau Client', 'زبون جديد'],
  ['Tableau des Revenus', 'جدول المداخيل'],
  ['Fiches de Paie', 'كشوف الرواتب'],
  ['Fiche de Paie', 'كشف الراتب'],
  ['Bulletin de Paie', 'كشف الراتب'],
  ["Journal d'Activité", 'سجل النشاطات'],
  ["Historique d'Activité", 'سجل النشاطات'],
  ['Effacer les notifications', 'مسح الإشعارات'],
  ['Messagerie Gmail', 'بريد Gmail'],
  ['Notre Équipe', 'فريق العمل'],
  ['Hors Wilaya', 'خارج الولاية'],
  ['Suivi Bureau', 'متابعة بالمكتب'],
  ['Domiciliation Commerciale', 'التوطين التجاري'],
  ['Domiciliation', 'توطين تجاري'],
  ['Capital Social', 'رأس المال الاجتماعي'],
  ['Capital social', 'رأس المال الاجتماعي'],
  ['Procuration notariale', 'وكالة توثيقية'],
  ['Procuration', 'وكالة توثيقية'],
  ['Quittance CNRC', 'وصل حقوق CNRC'],
  ["Code d'activité", 'رمز النشاط'],
  ['Code act.', 'رمز النشاط'],
  ['Frais de Poste', 'رسوم البريد'],
  ['Frais de Notaire', 'مصاريف الموثق'],
  ['Montant Total', 'المبلغ الإجمالي'],
  ['Montant Encaissé', 'المبلغ المقبوض'],
  ['Reste à Payer', 'الباقي للدفع'],
  ['Reste à payer', 'الباقي للدفع'],
  ["Chiffre d'Affaires", 'رقم الأعمال'],
  ["Chiffre d'affaires", 'رقم الأعمال'],
  ['Total Encaissé', 'إجمالي المقبوضات'],
  ['Total Restant', 'إجمالي المتبقي'],
  ['Date d’inscription', 'تاريخ التسجيل'],
  ["Date d'inscription", 'تاريخ التسجيل'],
  ['Date de création', 'تاريخ الإنشاء'],
  ['Date de recrutement', 'تاريخ التوظيف'],
  ['Type de dossier', 'نوع الملف'],
  ['Type de contrat', 'نوع العقد'],
  ['Motif du dossier', 'موضوع الملف'],
  ['Salaire Mensuel', 'الراتب الشهري'],
  ['Salaire de Base', 'الراتب الأساسي'],
  ['Salaire Net', 'الراتب الصافي'],
  ['Net à Payer', 'الصافي للدفع'],
  ['À partir de', 'ابتداءً من'],
  ['En attente de validation', 'في انتظار الموافقة'],
  ['En attente', 'في الانتظار'],
  ['En cours', 'قيد المعالجة'],
  ['Complété', 'مكتمل'],
  ['Confirmé', 'مؤكد'],
  ['Annulé', 'ملغى'],
  ['Archivé', 'مؤرشف'],
  ['Payé intégralement', 'مدفوع بالكامل'],
  ['Non payé', 'غير مدفوع'],
  ['Prêt à payer', 'جاهز للدفع'],
  ['Payé', 'مدفوع'],
  ['Soldé', 'خالص'],
  ['Actif', 'نشط'],
  ['Inactif', 'غير نشط'],
  ['En congé', 'في عطلة'],
  ['Administrateur Principal', 'المدير الرئيسي'],
  ['Administrateur', 'مدير'],
  ['Collaborateur', 'موظف'],
  ['Employés', 'الموظفين'],
  ['Employé', 'موظف'],
  ['Clients', 'الزبائن'],
  ['Client', 'الزبون'],
  ['Dossiers', 'الملفات'],
  ['Dossier', 'الملف'],
  ['Téléphone', 'الهاتف'],
  ['Adresse', 'العنوان'],
  ['Ville / Wilaya', 'المدينة / الولاية'],
  ['Wilaya', 'الولاية'],
  ['Commune', 'البلدية'],
  ['Code Postal', 'الرمز البريدي'],
  ['Activité', 'النشاط'],
  ['Banque', 'البنك'],
  ['Statut', 'الحالة'],
  ['Montant', 'المبلغ'],
  ['Total', 'المجموع'],
  ['Encaissé', 'المقبوض'],
  ['Reste', 'الباقي'],
  ['Actions', 'الإجراءات'],
  ['Télécharger', 'تحميل'],
  ['Exporter', 'تصدير'],
  ['Imprimer', 'طباعة'],
  ['Rechercher', 'بحث'],
  ['Enregistrer', 'حفظ'],
  ['Sauvegarder', 'حفظ'],
  ['Supprimer', 'حذف'],
  ['Modifier', 'تعديل'],
  ['Ajouter', 'إضافة'],
  ['Valider', 'تأكيد'],
  ['Approuver', 'موافقة'],
  ['Refuser', 'رفض'],
  ['Annuler', 'إلغاء'],
  ['Fermer', 'إغلاق'],
  ['Retour', 'رجوع'],
  ['Tous', 'الكل'],
  ['Toutes', 'الكل'],
  ['Aucun', 'لا يوجد'],
  ['Aucune', 'لا توجد'],
  ['Mois', 'أشهر'],
  ['mois', 'أشهر'],
  ['An', 'سنة'],
  ['an', 'سنة'],
  ['ans', 'سنوات'],
  ['Aujourd’hui', 'اليوم'],
  ["Aujourd'hui", 'اليوم'],
  ['Hier', 'أمس'],
  ['Janvier', 'جانفي'],
  ['Février', 'فيفري'],
  ['Mars', 'مارس'],
  ['Avril', 'أفريل'],
  ['Mai', 'ماي'],
  ['Juin', 'جوان'],
  ['Juillet', 'جويلية'],
  ['Août', 'أوت'],
  ['Septembre', 'سبتمبر'],
  ['Octobre', 'أكتوبر'],
  ['Novembre', 'نوفمبر'],
  ['Décembre', 'ديسمبر'],
  ['Samedi', 'السبت'],
  ['Dimanche', 'الأحد'],
  ['Lundi', 'الإثنين'],
  ['Mardi', 'الثلاثاء'],
  ['Mercredi', 'الأربعاء'],
  ['Jeudi', 'الخميس'],
  ['Vendredi', 'الجمعة'],
  ['pièces', 'وثائق'],
  ['DA', 'د.ج'],
];

const SORTED_PHRASES = [...PHRASE_REPLACEMENTS].sort((a, b) => b[0].length - a[0].length);

const WORD_FR_TO_AR: Record<string, string> = {
  accueil: 'الاستقبال',
  acces: 'دخول',
  accès: 'دخول',
  accompagnement: 'مرافقة',
  actif: 'نشط',
  actifs: 'نشطين',
  action: 'إجراء',
  actions: 'إجراءات',
  activite: 'نشاط',
  activité: 'نشاط',
  activités: 'أنشطة',
  actuel: 'الحالي',
  actuelle: 'الحالية',
  admin: 'المدير',
  administrateur: 'المدير',
  administratif: 'إداري',
  administrative: 'إدارية',
  administratives: 'إدارية',
  administratifs: 'إدارية',
  adresse: 'العنوان',
  affaires: 'الأعمال',
  affichage: 'عرض',
  afficher: 'إظهار',
  affiliation: 'انتساب',
  ajouter: 'إضافة',
  ajoute: 'مضاف',
  ajouté: 'تمت إضافته',
  alger: 'الجزائر',
  algerie: 'الجزائر',
  algérie: 'الجزائر',
  algeriens: 'جزائري',
  algériens: 'جزائري',
  ambulant: 'متنقل',
  annee: 'السنة',
  année: 'السنة',
  annuel: 'سنوي',
  annuelle: 'سنوية',
  annuels: 'سنوية',
  annuler: 'إلغاء',
  apercu: 'معاينة',
  aperçu: 'معاينة',
  appeler: 'اتصال',
  approuver: 'موافقة',
  approuve: 'مقبول',
  approuvé: 'مقبول',
  apres: 'بعد',
  après: 'بعد',
  archive: 'مؤرشف',
  archivé: 'مؤرشف',
  archives: 'الأرشيف',
  assistance: 'مساعدة',
  attente: 'انتظار',
  aucun: 'لا يوجد',
  aucune: 'لا توجد',
  autre: 'آخر',
  autres: 'أخرى',
  avec: 'مع',
  avis: 'آراء',
  banque: 'البنك',
  bancaire: 'بنكي',
  bareme: 'جدول الأسعار',
  barème: 'جدول الأسعار',
  base: 'أساسي',
  bilan: 'حصيلة',
  bilans: 'حصائل',
  bonjour: 'مرحباً',
  bulletin: 'كشف',
  bulletins: 'كشوف',
  bureau: 'المكتب',
  bureaux: 'المكاتب',
  cabinet: 'مكتب',
  cachet: 'الختم',
  calcul: 'حساب',
  calendrier: 'الرزنامة',
  capital: 'رأس المال',
  carte: 'بطاقة',
  casier: 'صحيفة السوابق',
  categorie: 'الفئة',
  catégorie: 'الفئة',
  centre: 'مركز',
  certificat: 'شهادة',
  certificats: 'شهادات',
  changer: 'تغيير',
  chaque: 'كل',
  charger: 'تحميل',
  choisir: 'اختيار',
  choisissez: 'اختر',
  client: 'الزبون',
  clients: 'الزبائن',
  clientele: 'الزبائن',
  clientèle: 'الزبائن',
  code: 'رمز',
  collaborateur: 'موظف',
  collaborateurs: 'الموظفين',
  commerce: 'التجارة',
  commercial: 'تجاري',
  commerciale: 'تجارية',
  commune: 'البلدية',
  complet: 'كامل',
  complete: 'مكتمل',
  complète: 'كاملة',
  complété: 'مكتمل',
  comptabilite: 'المحاسبة',
  comptabilité: 'المحاسبة',
  compte: 'حساب',
  comptes: 'الحسابات',
  confirmer: 'تأكيد',
  confirmation: 'تأكيد',
  confirme: 'مؤكد',
  confirmé: 'مؤكد',
  conge: 'عطلة',
  congé: 'عطلة',
  connexion: 'تسجيل الدخول',
  conseil: 'استشارة',
  conseiller: 'مستشار',
  conseillers: 'مستشارين',
  constitution: 'تأسيس',
  contact: 'اتصال',
  contacter: 'التواصل',
  contrat: 'عقد',
  controle: 'مراقبة',
  contrôle: 'مراقبة',
  copie: 'نسخة',
  coordonnees: 'المعلومات',
  coordonnées: 'المعلومات',
  cotisation: 'اشتراك',
  cotisations: 'اشتراكات',
  creation: 'إنشاء',
  création: 'إنشاء',
  creer: 'إنشاء',
  créer: 'إنشاء',
  creneau: 'توقيت',
  créneau: 'توقيت',
  creneaux: 'مواعيد',
  créneaux: 'مواعيد',
  dans: 'في',
  date: 'التاريخ',
  deconnexion: 'تسجيل الخروج',
  déconnexion: 'تسجيل الخروج',
  demande: 'طلب',
  demarches: 'الإجراءات',
  démarches: 'الإجراءات',
  departement: 'القسم',
  département: 'القسم',
  depot: 'إيداع',
  dépôt: 'إيداع',
  depuis: 'منذ',
  detail: 'تفصيل',
  détail: 'تفصيل',
  details: 'التفاصيل',
  détails: 'التفاصيل',
  detaille: 'مفصل',
  détaillé: 'مفصل',
  devis: 'عرض سعر',
  dinars: 'دينار',
  direct: 'مباشر',
  directement: 'مباشرة',
  direction: 'الإدارة',
  disponible: 'متوفر',
  disponibles: 'متوفرة',
  document: 'وثيقة',
  documents: 'وثائق',
  domiciliation: 'التوطين التجاري',
  donnees: 'البيانات',
  données: 'البيانات',
  dossier: 'ملف',
  dossiers: 'ملفات',
  droits: 'حقوق',
  ecole: 'مدرسة',
  école: 'مدرسة',
  effacer: 'مسح',
  email: 'البريد الإلكتروني',
  employe: 'موظف',
  employé: 'موظف',
  employes: 'الموظفين',
  employés: 'الموظفين',
  employeur: 'صاحب العمل',
  encaisse: 'المقبوض',
  encaissé: 'المقبوض',
  encaissement: 'التحصيل',
  enregistrement: 'التسجيل',
  enregistrer: 'حفظ',
  enregistre: 'مسجل',
  enregistré: 'مسجل',
  entreprise: 'شركة / مؤسسة',
  entreprises: 'الشركات',
  envoyer: 'إرسال',
  envoye: 'مرسل',
  envoyé: 'مرسل',
  equipe: 'الفريق',
  équipe: 'الفريق',
  erreur: 'خطأ',
  espace: 'فضاء',
  etat: 'حالة',
  état: 'حالة',
  etape: 'مرحلة',
  étape: 'مرحلة',
  evaluer: 'تقييم',
  évaluer: 'تقييم',
  exporter: 'تصدير',
  extrait: 'شهادة مستخرجة',
  extraits: 'شهادات مستخرجة',
  facultatif: 'اختياري',
  famille: 'العائلة',
  ferme: 'مغلق',
  fermé: 'مغلق',
  fermer: 'إغلاق',
  fiche: 'بطاقة / وثيقة',
  fiches: 'بطاقات / كشوف',
  fichier: 'ملف',
  filtrer: 'تصفية',
  filtres: 'التصفية',
  financier: 'مالي',
  financiere: 'مالية',
  financière: 'مالية',
  fiscalite: 'الجبائية',
  fiscalité: 'الجبائية',
  fonction: 'الوظيفة',
  formalites: 'الإجراءات',
  formalités: 'الإجراءات',
  formation: 'تكوين',
  formations: 'تكوينات',
  formule: 'صيغة',
  formules: 'صيغ',
  fournir: 'تقديم',
  frais: 'مصاريف',
  general: 'عام',
  général: 'عام',
  generer: 'إنشاء',
  générer: 'إنشاء',
  gestion: 'تسيير وإدارة',
  gestionnaire: 'مسير',
  global: 'إجمالي',
  globale: 'إجمالية',
  guide: 'دليل',
  heure: 'الساعة',
  heures: 'ساعات',
  historique: 'السجل',
  honoraires: 'أتعاب',
  horaire: 'التوقيت',
  horaires: 'مواقيت',
  hors: 'خارج',
  identite: 'الهوية',
  identité: 'الهوية',
  immatriculation: 'القيد',
  impot: 'الضرائب',
  impôt: 'الضرائب',
  imprimer: 'طباعة',
  imprimable: 'قابل للطباعة',
  inclus: 'شامل',
  informations: 'معلومات',
  inscription: 'تسجيل',
  inscrit: 'مسجل',
  interne: 'داخلي',
  jour: 'يوم',
  journal: 'سجل',
  jours: 'أيام',
  judiciaire: 'العدلية',
  juridique: 'قانوني',
  langues: 'اللغات',
  ligne: 'الإنترنت',
  liste: 'قائمة',
  localisation: 'الموقع',
  masquer: 'إخفاء',
  matinee: 'الصباح',
  matinée: 'الصباح',
  membre: 'عضو',
  membres: 'أعضاء',
  mensuel: 'شهري',
  mensuelle: 'شهرية',
  mensuels: 'شهرية',
  menu: 'القائمة',
  merci: 'شكراً',
  message: 'رسالة',
  messagerie: 'المراسلة',
  metier: 'المهنة',
  métier: 'المهنة',
  modifier: 'تعديل',
  mois: 'أشهر',
  montant: 'المبلغ',
  montants: 'المبالغ',
  motif: 'الموضوع',
  naissance: 'ميلاد',
  nationale: 'الوطنية',
  necessaire: 'مطلوب',
  nécessaire: 'مطلوب',
  necessaires: 'المطلوبة',
  nécessaires: 'المطلوبة',
  net: 'الصافي',
  nom: 'اللقب',
  nombre: 'العدد',
  notaire: 'الموثق',
  notariale: 'توثيقية',
  note: 'ملاحظة',
  notes: 'ملاحظات',
  notre: 'لدينا',
  nouveau: 'جديد',
  nouvelle: 'جديدة',
  nouv: 'جديد',
  numero: 'رقم',
  numéro: 'رقم',
  obligatoire: 'إجباري',
  obligatoires: 'إجبارية',
  officiel: 'رسمي',
  officielle: 'رسمية',
  option: 'خيار',
  optionnel: 'اختياري',
  options: 'خيارات',
  ouvrir: 'فتح',
  page: 'صفحة',
  paiement: 'الدفع',
  paie: 'الراتب',
  papiers: 'الوثائق',
  par: 'حسب',
  partir: 'ابتداءً',
  passe: 'المرور',
  paye: 'مدفوع',
  payé: 'مدفوع',
  payer: 'الدفع',
  periode: 'الفترة',
  période: 'الفترة',
  personne: 'شخص',
  personnelles: 'الشخصية',
  physique: 'طبيعي',
  piece: 'وثيقة',
  pièce: 'وثيقة',
  pieces: 'وثائق',
  pièces: 'وثائق',
  plus: 'المزيد',
  portail: 'بوابة',
  postal: 'البريدي',
  poste: 'المنصب / البريد',
  pour: 'من أجل',
  precision: 'توضيح',
  précision: 'توضيح',
  prendre: 'حجز',
  prenom: 'الاسم',
  prénom: 'الاسم',
  prestations: 'الخدمات',
  principal: 'الرئيسي',
  principale: 'الرئيسية',
  procuration: 'وكالة',
  profil: 'الملف الشخصي',
  projet: 'المشروع',
  quittance: 'وصل',
  recapitulatif: 'ملخص',
  récapitulatif: 'ملخص',
  recherche: 'بحث',
  rechercher: 'بحث',
  recouvrement: 'التحصيل',
  recrutement: 'التوظيف',
  reference: 'المرجع',
  référence: 'المرجع',
  refuser: 'رفض',
  registre: 'السجل',
  reinitialiser: 'إعادة ضبط',
  réinitialiser: 'إعادة ضبط',
  remarque: 'ملاحظة',
  rendez: 'موعد',
  reseaux: 'شبكات',
  réseaux: 'شبكات',
  reservation: 'حجز',
  réservation: 'حجز',
  reservations: 'الحجوزات',
  réservations: 'الحجوزات',
  reserver: 'حجز',
  réserver: 'حجز',
  residence: 'إقامة',
  résidence: 'إقامة',
  responsable: 'مسؤول',
  restant: 'المتبقي',
  reste: 'الباقي',
  retour: 'رجوع',
  revenu: 'المدخول',
  revenus: 'المداخيل',
  role: 'الدور',
  rôle: 'الدور',
  salaire: 'الراتب',
  salaires: 'الرواتب',
  sans: 'بدون',
  sauvegarder: 'حفظ',
  securise: 'آمن',
  sécurisé: 'آمن',
  securite: 'الأمان',
  sécurité: 'الأمان',
  selectionner: 'اختيار',
  sélectionner: 'اختيار',
  selectionnez: 'اختر',
  sélectionnez: 'اختر',
  service: 'الخدمة',
  services: 'الخدمات',
  situation: 'الوضعية',
  social: 'الاجتماعي',
  sociale: 'الاجتماعية',
  sociaux: 'الاجتماعية',
  societe: 'شركة',
  société: 'شركة',
  societes: 'الشركات',
  sociétés: 'الشركات',
  solde: 'الرصيد',
  soldé: 'خالص',
  statut: 'الحالة',
  statuts: 'الحالات',
  suivi: 'المتابعة',
  supprimer: 'حذف',
  sur: 'على',
  synchronisation: 'المزامنة',
  synchroniser: 'مزامنة',
  tableau: 'جدول',
  tableaux: 'جداول',
  tarif: 'السعر',
  tarifs: 'الأسعار',
  taux: 'نسبة',
  telecharger: 'تحميل',
  télécharger: 'تحميل',
  telephone: 'الهاتف',
  téléphone: 'الهاتف',
  temps: 'الوقت',
  total: 'المجموع',
  totaux: 'المجاميع',
  tous: 'جميع',
  toutes: 'جميع',
  tout: 'الكل',
  toute: 'كل',
  traitement: 'معالجة',
  travail: 'العمل',
  type: 'نوع',
  types: 'أنواع',
  utilisateur: 'مستخدم',
  utilisateurs: 'المستخدمين',
  validation: 'الموافقة',
  valider: 'تأكيد',
  valide: 'مؤكد',
  validé: 'مؤكد',
  vente: 'البيع',
  verifier: 'التحقق',
  vérifier: 'التحقق',
  veuillez: 'يرجى',
  ville: 'المدينة',
  voir: 'عرض',
  vos: 'الخاصة بكم',
  votre: 'الخاص بكم',
  wilaya: 'الولاية',
  wilayas: 'الولايات',
};

const PRESERVED_ACRONYMS = new Set([
  'SERVI',
  'DOX',
  'SARL',
  'EURL',
  'SPA',
  'SNC',
  'CNRC',
  'CASNOS',
  'ANAE',
  'CNAS',
  'IRG',
  'IFU',
  'G50',
  'NIF',
  'NIS',
  'RIB',
  'CNI',
  'PDF',
  'CSV',
  'Gmail',
  'Google',
  'Sheets',
  'WhatsApp',
  'Maps',
  'Facebook',
  'TikTok',
  'Instagram',
]);

/**
 * Traduit une chaîne française en arabe
 */
export function translateStringToArabic(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;

  // Ignorer les chaînes purement numériques, emails ou URLs
  if (/^[\d\s.,+\-/():%]+$/.test(trimmed)) return input;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return input;

  // 1. Correspondance exacte dans le dictionnaire
  if (EXACT_FR_TO_AR[trimmed]) {
    const leadingSpaces = input.match(/^\s*/)?.[0] || '';
    const trailingSpaces = input.match(/\s*$/)?.[0] || '';
    return `${leadingSpaces}${EXACT_FR_TO_AR[trimmed]}${trailingSpaces}`;
  }

  // 2. Remplacement des expressions et termes connus
  let result = input;
  for (const [fr, ar] of SORTED_PHRASES) {
    if (result.includes(fr)) {
      result = result.split(fr).join(ar);
    }
  }

  // 3. Remplacement mot à mot pour tout mot français restant
  result = result.replace(/[A-Za-zÀ-ÿ]+/g, (word) => {
    if (PRESERVED_ACRONYMS.has(word) || PRESERVED_ACRONYMS.has(word.toUpperCase())) {
      return word;
    }
    const lower = word.toLowerCase();
    if (WORD_FR_TO_AR[lower]) {
      return WORD_FR_TO_AR[lower];
    }
    return word;
  });

  return result;
}

const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'PATH']);

/**
 * Applique ou restaure la traduction sur l'ensemble du DOM (#root)
 */
function applyDomTranslation(lang: AppLanguage) {
  const root = document.getElementById('root');
  if (!root) return;

  // 1. Parcourir tous les nœuds texte
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (IGNORED_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.dataset && parent.dataset.noTranslate === 'true') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const anyNode = textNode as any;
    const currentVal = textNode.nodeValue || '';

    if (lang === 'ar') {
      // Si React a mis à jour le nœud avec un nouveau texte français
      if (anyNode.__servidoxOrigFr === undefined || (anyNode.__servidoxLastAr !== undefined && currentVal !== anyNode.__servidoxLastAr)) {
        anyNode.__servidoxOrigFr = currentVal;
      }
      const translated = translateStringToArabic(anyNode.__servidoxOrigFr);
      if (translated !== currentVal) {
        anyNode.__servidoxLastAr = translated;
        textNode.nodeValue = translated;
      } else {
        anyNode.__servidoxLastAr = currentVal;
      }
    } else {
      // Restauration immédiate du français original
      if (anyNode.__servidoxOrigFr !== undefined) {
        if (currentVal === anyNode.__servidoxLastAr) {
          textNode.nodeValue = anyNode.__servidoxOrigFr;
        }
        delete anyNode.__servidoxOrigFr;
        delete anyNode.__servidoxLastAr;
      }
    }
  }

  // 2. Parcourir les attributs placeholder, title et aria-label
  const elements = root.querySelectorAll('[placeholder], [title], [aria-label]');
  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.dataset?.noTranslate === 'true') return;

    (['placeholder', 'title', 'aria-label'] as const).forEach((attr) => {
      const dataKey = `orig_${attr.replace('-', '_')}`;
      const val = htmlEl.getAttribute(attr);
      if (!val) return;

      if (lang === 'ar') {
        const lastArKey = `lastar_${attr.replace('-', '_')}`;
        if (!htmlEl.dataset[dataKey] || (htmlEl.dataset[lastArKey] && val !== htmlEl.dataset[lastArKey])) {
          htmlEl.dataset[dataKey] = val;
        }
        const translated = translateStringToArabic(htmlEl.dataset[dataKey] || val);
        htmlEl.dataset[lastArKey] = translated;
        if (translated !== val) {
          htmlEl.setAttribute(attr, translated);
        }
      } else {
        if (htmlEl.dataset[dataKey]) {
          htmlEl.setAttribute(attr, htmlEl.dataset[dataKey]!);
          delete htmlEl.dataset[dataKey];
          delete htmlEl.dataset[`lastar_${attr.replace('-', '_')}`];
        }
      }
    });
  });
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'ar' || saved === 'fr') return saved;
    } catch {
      // ignore
    }
    return 'fr';
  });

  const setLang = useCallback((newLang: AppLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'fr' ? 'ar' : 'fr';
      try {
        localStorage.setItem(STORAGE_LANG_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (lang === 'ar') {
      html.classList.add('lang-ar');
    } else {
      html.classList.remove('lang-ar');
    }

    let isApplying = false;
    const runTranslation = () => {
      if (isApplying) return;
      isApplying = true;
      try {
        applyDomTranslation(lang);
      } finally {
        isApplying = false;
      }
    };

    runTranslation();

    if (lang === 'ar') {
      const root = document.getElementById('root');
      if (!root) return;

      let rafId: number | null = null;
      const observer = new MutationObserver(() => {
        if (isApplying) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          runTranslation();
        });
      });

      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Bouton universel de changement de langue (Français <-> العربية)
 */
export const LanguageSwitcherButton: React.FC<{ variant?: 'light' | 'dark' }> = ({
  variant = 'light',
}) => {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      data-no-translate="true"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-2xs shrink-0 ${
        variant === 'dark'
          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
      }`}
      title={lang === 'fr' ? 'تحويل الموقع بالكامل إلى اللغة العربية' : 'Basculer tout le site en Français'}
    >
      <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span>{lang === 'fr' ? 'العربية (AR)' : 'Français (FR)'}</span>
    </button>
  );
};
