# POC Laxou — Refonte & Expérience Citoyenne Numérique

[![GitHub Pages](https://img.shields.io/badge/Demo%20en%20ligne-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://tomawass.github.io/laxou-poc/)
[![Statut](https://img.shields.io/badge/Statut-POC%20Fonctionnel%20(50%2B%20commits)-blue?style=for-the-badge)]()
[![Design](https://img.shields.io/badge/Design%20System-Moderne%20%7C%20A%C3%A9r%C3%A9%20%7C%20Bento-emerald?style=for-the-badge)]()

> Prototype fonctionnel (Proof of Concept) démontrant une vision modernisée pour le portail municipal de la **Ville de Laxou (Meurthe-et-Moselle)**.

**Accéder au prototype interactif :** [https://tomawass.github.io/laxou-poc/](https://tomawass.github.io/laxou-poc/)

---

## Pourquoi ce POC ? Les Partis Pris Stratégiques

Ce prototype s'attaque à la problématique du portail municipal de la ville de Laxou qui n'est pas isolée. D'autres sites de mairie non mis au goût du jour partagent ces frictions : surcharge cognitive, navigation labyrinthique, manque de lisibilité mobile, en appliquant les standards graphiques et UX les plus récents :

1. **Macro-Aération & Respiration :** Fin des pages surchargées. Rythme visuel strict, espaces généreux et hiérarchie typographique forte pour reposer l'œil et guider l'attention.
2. **Architecture Bento Grid (Actualités) :** Mise en avant asymétrique de l'actualité, l'idée est de choisir quelle actualité pousser visuellement parlant.
3. **Accès direct aux services & Annuaire interactif :** Une page qui existe pourtant déjà sur le site mais qui n'est pas accessible par navigation. Raccourcis immédiats vers les équipements phares (Piscine, Médiathèque, Gymnases, Parcs).
4. **Hub Social Moderne :** Flux RSS vers le Facebook de la mairie déjà existant, travail uniquement esthétique ici.
5. **Footer Institutionnel Haute Clarté :**
   - **Tiroir interactif ("Tous nos sites")** connectant l'écosystème territorial (Métropole du Grand Nancy, Département 54, Région Grand Est).
   - **Visibilité permanente des horaires spécifiques** (Accueil Général, État Civil, Urbanisme).
   - Informations de contact et démarches en 1 clic.
6. **Applications & Outils Citoyens Embarqués :**
   - Cartographie interactive des équipements & chantiers NPRNU.
   - Simulateur de tarifs périscolaires en temps réel.

---

## Périmètre & Pages Développées

Le prototype comprend une suite complète de gabarits et d'outils interactifs :

| Gabarit / Page | Description | Accès Direct |
| :--- | :--- | :--- |
| **Accueil** | Page d'accueil complète (Hero, Recherche, Proche de vous, Bento News, Agenda 3D, Social Hub, Footer interactif) | [`index.html`](https://tomawass.github.io/laxou-poc/index.html) |
| **Actualités** | Flux complet des articles et communiqués municipaux avec filtres | [`actualites.html`](https://tomawass.github.io/laxou-poc/actualites.html) |
| **Agenda** | Calendrier des événements culturels, associatifs et séances municipales | [`agenda.html`](https://tomawass.github.io/laxou-poc/agenda.html) |
| **Page Article Type** | Template de lecture optimisé pour les longs formats & reportages | [`article.html`](https://tomawass.github.io/laxou-poc/article.html) |
| **Équipe Municipale** | Trombinoscope institutionnel, délégations et commissions | [`equipe-municipale.html`](https://tomawass.github.io/laxou-poc/equipe-municipale.html) |
| **Conseil Municipal** | Ordres du jour, comptes-rendus et délibérations | [`conseil-municipal.html`](https://tomawass.github.io/laxou-poc/conseil-municipal.html) |
| **Démarches & Publications** | Accès aux formulaires, publications légales et archives | [`archives.html`](https://tomawass.github.io/laxou-poc/archives.html) |
| **Cartographie Interactive** | Carte interactive des équipements et parcs laxoviens | [`iframe.html`](https://tomawass.github.io/laxou-poc/iframe.html) |
| **Plan NPRNU** | Carte dédiée aux chantiers et au renouvellement urbain | [`nprnu-map.html`](https://tomawass.github.io/laxou-poc/nprnu-map.html) |
| **Simulateur Périscolaire** | Calculateur dynamique basé sur le Quotient Familial | [`simulateur-periscolaire.html`](https://tomawass.github.io/laxou-poc/simulateur-periscolaire.html) |
| **Contact & Horaires** | Formulaire de saisine citoyenne et coordonnées des services | [`contact.html`](https://tomawass.github.io/laxou-poc/contact.html) |

---

## Identité Visuelle & Charte

- **Palette Principale :**
  - Vert Laxou : `#76b82f` (Dynamisme, nature, action citoyenne)
  - Bleu Institutionnel : `#0d5aa7`
  - Neutre Foncé : `#1e293b` (Lisibilité optimale des textes)
  - Fond & Cartes : Blanc pur `#ffffff` et gris perle `#f8fafc`
- **Monogramme & Favicon :** Monogramme "LX" stylisé avec transparence 512x512px.

---

## Stack Technique

- **Frontend :** HTML5 sémantique, CSS3 moderne (Variables CSS, Grid, Flexbox, Glassmorphism, animations fluides), JavaScript Vanilla (Zero dépendance lourde, ultra-rapide).
- **Hébergement :** GitHub Pages avec déploiement continu (`main` branch).

---

## Prochaines Étapes pour une Mise en Production

1. **Choix du CMS / Back-office :** Connexion des gabarits à un CMS moderne (WordPress Headless ????, Strapi ou Typo3) pour l'autonomie des agents municipaux. Ce choix dépendra également de la sécurité qu'offre ces CMS en rapport avec le niveau de sécurité demandé par les services gourvenementaux.
2. **Interconnexion des API :**
   - Synchronisation des flux d'événements, annuaires et pages nottament NPRNU avec la Métropole du Grand Nancy qui héberge le site actuel de Laxou.fr. A voir si possibilité de synchroniser les informations avec celles de la préfecture de Meurthe-et-Moselle dont de nombreuses directives proviennent.
3. **Espace Citoyen / Démarches :** Intégration SSO avec FranceConnect pour les télé-services.
4. **Audit RGAA officiel :** Validation de la conformité accessibilité à 100%.

---

*Projet élaboré dans le cadre d'une réflexion sur la modernisation des services numériques de proximité.*
