# Plan d'Implémentation : Page Fiches de Paie des Employés (Mensuel & Annuel)

Ce plan décrit l'architecture et les étapes de développement pour ajouter la page complète de gestion et d'impression des fiches de paie pour le personnel du bureau d'affaires **SERVI-DOX**.

---

## 1. Contexte & Spécifications de la Demande
- **Nouvelle Page Dédiée** : "Fiches de Paie" accessible depuis le menu latéral (Sidebar) et la barre de navigation.
- **Sélection Employé & Employeur** :
  - Sélection de l'employé parmi la liste de l'équipe SERVI-DOX (`Employee`).
  - Coordonnées officielles de l'employeur SERVI-DOX (Raison sociale, NIF, NIS, RC, N° CNAS, Adresse, Représentant légal).
- **Consultation Mensuelle & Annuelle** :
  - **Fiche Mensuelle (Bulletin de Paie)** : Sélection du mois et de l'année, calcul des rubriques de paie selon la législation algérienne (Salaire de base, primes de panier et transport, retenue CNAS 9%, barème IRG officiel, Net à payer en DA et en toutes lettres).
  - **État Récapitulatif Annuel** : Tableau cumulé des 12 mois de l'année pour l'employé sélectionné (ou l'ensemble du personnel), utile pour la DAS (Déclaration Annuelle des Salaires) et le bilan comptable.
- **Identité Visuelle & Filigrane (Watermark)** :
  - **Logo SERVI-DOX en haut à gauche** de la fiche avec coordonnées du cabinet.
  - **Filigrane SERVI-DOX au milieu de la page** (logo semi-transparent centré en fond, préservant la lisibilité tout en sécurisant l'authenticité du document).
- **Impression & Export** :
  - Bouton d'impression directe (adapté au format A4 avec styles d'impression `@media print` masquant la barre latérale, les boutons et les contrôles pour un rendu officiel propre).

---

## 2. Architecture Technique

### A. Modèle de Données & Types (`src/types/payroll.ts`)
- Définition de l'interface `PayrollItem` (Rubrique de paie : code, libellé, base, taux, gain, retenue).
- Définition de l'interface `PayslipData` (Mois, année, employé, employeur, rubriques de salaire brut, cotisations CNAS, assiette IRG, impôt IRG, net à payer, mode de règlement, etc.).
- Définition de l'interface `AnnualPayrollSummary` (Cumul brut annuel, cumul CNAS, cumul IRG, cumul net versé, détail mois par mois).
- Coordonnées de l'employeur SERVI-DOX par défaut :
  - Raison sociale : **SERVI-DOX - Bureau d'Affaires & Assistance Administrative**
  - Adresse : Alger, Algérie
  - NIF / NIS / RC / N° Employeur CNAS
  - Téléphone & Email : contact@servidox.pro

### B. Moteur de Calcul de Paie Algérienne (`src/utils/payrollCalculations.ts`)
- Calcul de la cotisation de sécurité sociale salarié : **9% du salaire brut cotisable**.
- Calcul de la retenue à la source **IRG** (Impôt sur le Revenu Global) selon le barème algérien officiel en vigueur (abattement de 40% avec plancher et plafond légal, exonération pour salaires inférieurs ou égaux au seuil légal).
- Calcul du **Net à payer**.
- Conversion du montant net en **toutes lettres** en français et dinars algériens (ex: *"Cinquante-huit mille six cent cinquante Dinars Algériens et zéro centime"*).

### C. Composant Document Bulletin de Paie (`src/components/payroll/PayslipDocument.tsx`)
- Structure A4 standardisée pour l'impression :
  - **En-tête** : Logo officiel SERVI-DOX en haut à gauche, références juridiques de l'entreprise (NIF, NIS, RC, N° CNAS) et boîte d'identification de l'employé à droite (Nom, Prénom, Fonction, N° Sécurité Sociale, Date d'embauche, Ancienneté).
  - **Filigrane SERVI-DOX central** : Blason/logo SERVI-DOX en grand format, centré, en opacité subtile (`opacity-[0.06]` à `opacity-[0.08]`), visible à l'écran et à l'impression sans gêner la lecture des chiffres.
  - **Corps du bulletin** : Tableau structuré des rubriques (Salaire de base, Primes de transport, Panier, Rendement, Salaire Brut, Déduction CNAS 9%, Imposable IRG, Retenue IRG, Avances/Acomptes).
  - **Pied de bulletin** : Total Brut, Total Retenues, Net imposable, **Net à payer en gros caractères**, montant en toutes lettres, signatures (Cachet/Signature de l'Employeur SERVI-DOX à gauche, Signature du Salarié pour acquit à droite).

### D. Composant Vue Récapitulative Annuelle (`src/components/payroll/AnnualPayrollView.tsx`)
- Tableau de bord des 12 mois de l'année pour l'employé sélectionné :
  - Colonnes : Mois, Salaire de base, Primes, Brut, CNAS 9%, IRG, Net versé.
  - Totaux annuels cumulés.
  - Graphique récapitulatif ou fiches synthétiques pour la DAS et les déclarations sociales.
  - Impression du récapitulatif annuel au format A4 avec logo SERVI-DOX.

### E. Page Principale Fiches de Paie (`src/components/PayrollPage.tsx`)
- Barre d'action supérieure :
  - Sélecteur de l'employé (liste issue de l'équipe SERVI-DOX avec statut actif/contrat).
  - Sélecteur de période : Mois (Janvier à Décembre) et Année.
  - Commutateur de vue : **Fiche Mensuelle** vs **Récapitulatif Annuel**.
  - Possibilité d'ajuster les primes ponctuelles du mois (heures supp, prime exceptionnelle, acompte versé).
  - Boutons d'action : **Imprimer / Sauvegarder en PDF**, **Exporter récapitulatif**.

### F. Intégration Navigation (`src/components/Navbar.tsx` & `src/App.tsx`)
- Ajout de l'onglet `paie` dans `ActiveTab`.
- Ajout de l'entrée dans la barre latérale (Sidebar) avec icône `Receipt` ou `FileSpreadsheet` et sous-titre clair *"Fiches mensuelles, annuelles & impression"*.
- Rendu conditionnel dans `App.tsx`.

---

## 3. Plan de Réalisation Étape par Étape

1. **Création du module types & calculs** :
   - Créer `/src/types/payroll.ts`.
   - Créer `/src/utils/payrollCalculations.ts` (CNAS 9%, barème IRG, conversion en toutes lettres).
2. **Création des composants Fiches de Paie** :
   - Créer `/src/components/payroll/PayslipDocument.tsx` avec le logo officiel en haut à gauche et le filigrane central `SERVI-DOX`.
   - Créer `/src/components/payroll/AnnualPayrollView.tsx` pour le récapitulatif annuel sur 12 mois.
   - Créer `/src/components/PayrollPage.tsx` avec la gestion de la sélection d'employé, les réglages du mois/année et les boutons d'impression.
3. **Mise à jour de la navigation & du routage** :
   - Ajouter l'onglet `paie` dans `src/components/Navbar.tsx`.
   - Brancher la page dans `src/App.tsx`.
4. **Vérification & Validation** :
   - Compilation avec `compile_applet` pour garantir 0 erreur TypeScript/CSS.
   - Test des calculs, du rendu à l'écran, de l'aperçu avant impression et du rendu du filigrane.
