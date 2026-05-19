# PROJECT_CONTEXT

## Projet
- **Nom** : Calendar OBR (Calendrier vivant pour Owlbear Rodeo)
- **Type** : Extension Owlbear Rodeo (frontend web + manifest Owlbear)
- **Objectif** : Permettre au MJ de gérer un calendrier de campagne vivant (date/heure, événements, affichages Aujourd’hui/Mois/Événements, import/export), avec une base propre pour les évolutions futures (saisons, météo, lunes, packs).

## Stack
- **Front** : React + TypeScript + Vite
- **Back** : Aucun backend dédié
- **BDD** : Aucune BDD serveur ; stockage local navigateur (avec scope room OBR quand disponible)
- **Outils / infra** :
  - npm
  - Vitest
  - Owlbear Rodeo SDK (`@owlbear-rodeo/sdk`)

## Décisions validées
- Architecture modulaire (date engine, logique événements, formatage, stockage, import/export, UI).
- Fonctions de calcul de date pures et testables.
- MVP sans météo avancée, sans lunes avancées, sans récurrence complexe, sans packs Patreon.
- Tout texte visible passe par i18n FR/EN.
- Les exports incluent `schemaVersion` et `appVersion`.
- Itérations petites et ciblées (pas de refonte globale inutile).

## État actuel
### Ce qui fonctionne
- Extension frontend fonctionnelle avec navigation : **Aujourd’hui / Mois / Événements / Paramètres**.
- Moteur calendrier :
  - conversion date interne ↔ date calendrier,
  - gestion mois personnalisés / jours / offset semaine,
  - ajout/retrait de minutes/heures/jours.
- Gestion des événements :
  - création,
  - édition,
  - suppression,
  - tri,
  - filtrage jour courant / jour donné,
  - all-day,
  - date de fin optionnelle.
- Affichage événements :
  - liste complète dans l’onglet Événements,
  - événements du jour dans Aujourd’hui,
  - icône dans la grille Mois + tooltip des noms d’événements.
- Icônes événement :
  - support emoji/texte,
  - support URL image (png/jpg/jpeg/gif/webp/svg),
  - fallback en cas d’échec image.
- Stockage et import/export :
  - stockage local,
  - scope OBR room si disponible,
  - import/export JSON validé/sanitisé.
- i18n FR/EN active.
- Suite de tests unitaires (calendar engine, events, formatters, month view, settings, storage, import/export, OBR scope).

### Ce qui est en cours
- Stabilisation incrémentale UX dans le popover OBR (densité et lisibilité des blocs UI).

### Ce qui bloque / limites connues
- Pas encore de récurrence événementielle avancée.
- Pas encore de notifications automatiques de déclenchement.
- Pas encore de modules météo/saisons/lunes fonctionnels au-delà des placeholders.

## Architecture du projet
- `src/domain/types.ts`
  - Types centraux (`CalendarProject`, `CalendarSystem`, `CalendarEvent`, etc.).
- `src/calendar/dateEngine.ts`
  - Logique pure de date/heure interne et conversions.
- `src/calendar/eventsLogic.ts`
  - Logique pure événements (CRUD logique, tri, helpers all-day/fin, image URL, etc.).
- `src/calendar/formatEvent.ts`
  - Formatage partagé des événements (date/heure/visibilité, formats courts/longs).
- `src/calendar/formatDisplayDate.ts`
  - Formatage date principale affichée.
- `src/calendar/monthView.ts`
  - Helpers de construction de la vue mensuelle.
- `src/calendar/settingsLogic.ts`
  - Normalisation/gestion structure calendrier.
- `src/components/TodayView.tsx`
  - Vue principale : date courante, actions de temps, événements du jour.
- `src/components/MonthView.tsx`
  - Grille du mois + icône du premier événement par jour + tooltip.
- `src/components/EventsView.tsx`
  - Liste des événements + actions modifier/supprimer.
- `src/components/events/EventForm.tsx`
  - Formulaire partagé création/édition d’événement.
- `src/components/EventIcon.tsx`
  - Affichage unifié icône texte/image avec taille configurable.
- `src/components/SettingsView.tsx` et `src/components/settings/*`
  - Paramétrage du calendrier et données.
- `src/storage/calendarStorage.ts`
  - Chargement/sauvegarde/reset localStorage.
- `src/obr/roomScope.ts`
  - Détection scope room OBR / fallback local.
- `src/importExport/calendarImportExport.ts`
  - Import/export + validation/sanitation.
- `src/i18n/messages.ts`
  - Dictionnaires FR/EN + helper de traduction.

## Bugs / points de vigilance connus
- Le rendu compact du popover OBR demande de rester vigilant sur toute évolution UI (éviter débordements et surcharge).
- Les changements UI doivent rester localisés pour ne pas casser la lisibilité globale.

## Fonctionnalités
### Déjà faites
- [x] Socle TypeScript/React/Vite + manifest
- [x] Moteur calendrier interne (dates/heures)
- [x] Vue Aujourd’hui
- [x] Vue Mois
- [x] Vue Événements
- [x] Création d’événement
- [x] Édition d’événement
- [x] Suppression d’événement
- [x] Événement all-day
- [x] Date de fin optionnelle
- [x] Affichage icône événement (texte/image)
- [x] Affichage événements du jour (Aujourd’hui)
- [x] Marqueur événement en grille Mois (icône + tooltip)
- [x] i18n FR/EN
- [x] Stockage local + scope OBR
- [x] Import/export JSON validé
- [x] Tests unitaires principaux

### En cours
- [ ] Polish UI compact popover OBR
- [ ] Consolidation ergonomique de l’onglet Événements

### À faire ensuite
- [ ] Récurrence événements
- [ ] Notifications automatiques
- [ ] Saisons fonctionnelles
- [ ] Météo fonctionnelle
- [ ] Lunes fonctionnelles
- [ ] Outillage packs / compatibilité avancée

## Décisions techniques à ne pas re-discuter à chaque reprise
- Conserver le principe de date interne absolue + conversion affichée.
- Conserver la séparation logique métier / UI.
- Garder les fonctions de calcul en pur/facilement testable.
- Préférer des étapes MVP petites et validées plutôt que des lots massifs.

## État actuel précis
Le MVP calendrier est déjà utilisable avec gestion complète d’événements simples (CRUD), affichage dans Aujourd’hui, repères en Mois, et base technique propre (tests, i18n, stockage, import/export). Les prochaines étapes prioritaires concernent la récurrence/automatisation et les modules hors-scope MVP initial (météo/lunes/saisons) sans casser la simplicité actuelle.

## Journal de session
### Session du 19 mai 2026
- **sujets traités :**
  - Implémentation de la logique métier événements (fichier dédié) : création, ajout, mise à jour, suppression, occurrence sur un jour, récupération par jour/jour courant, tri.
  - Ajout des tests unitaires de la logique événements (cas CRUD + tri + filtres + projet vide).
  - Ajout de l’onglet **Événements** en lecture seule dans la navigation principale.
  - Ajout d’un formulaire minimal de création d’événement dans l’onglet Événements (nom, icône, résumé, date/heure, visibilité) avec validations de base.
  - Enrichissement des événements avec :
    - icône image (détection URL image + fallback),
    - option **toute la journée**,
    - date de fin optionnelle.
  - Mise à jour de l’affichage événements :
    - formats date/heure adaptés (normal, all-day, avec fin même jour / autre jour),
    - affichage des événements du jour dans **Aujourd’hui**,
    - affichage des événements dans **Mois**.
  - Factorisation du formatage d’événements dans un module partagé (`formatEvent`) pour éviter la duplication entre vues.
  - Évolution de la grille **Mois** : passage du marqueur `• N` à l’icône du premier événement + tooltip détaillant les noms d’événements.
  - Ajout des actions **Modifier** / **Supprimer** sur les cartes d’événements avec confirmation de suppression.
  - Extraction d’un formulaire partagé **create/edit** (`EventForm`) et correction d’un bug critique d’édition (id régénéré par erreur).
  - Refonte de `PROJECT_CONTEXT.md` vers un format structuré demandé + normalisation du journal de session.

- **fichiers modifiés :**
  - `PROJECT_CONTEXT.md`
  - `src/domain/types.ts`
  - `src/calendar/eventsLogic.ts`
  - `src/calendar/formatEvent.ts`
  - `src/calendar/__tests__/eventsLogic.test.ts`
  - `src/calendar/__tests__/formatEvent.test.ts`
  - `src/components/App.tsx`
  - `src/components/EventIcon.tsx`
  - `src/components/EventsView.tsx`
  - `src/components/TodayView.tsx`
  - `src/components/MonthView.tsx`
  - `src/components/events/EventForm.tsx`
  - `src/i18n/messages.ts`

- **décisions prises :**
  - Avancer en petites étapes MVP, sans implémenter récurrence/notifications/météo/lunes/packs.
  - Garder la logique métier dans `src/calendar/*` et éviter de surcharger les composants React.
  - Centraliser le formatage événementiel dans `src/calendar/formatEvent.ts` pour réutilisation inter-vues.
  - Utiliser `EventIcon` comme point unique pour gérer emoji/texte/image + fallback.
  - Conserver les validations simples (nom requis, bornes heure/minute, correction fin < début).
  - Garder une UX compacte adaptée au popover OBR.

- **problèmes restants :**
  - Pas encore de récurrence événementielle fonctionnelle.
  - Pas encore de notifications automatiques de déclenchement.
  - Pas encore d’édition/suppression depuis Aujourd’hui ou Mois (uniquement via onglet Événements).
  - Modules météo/saisons/lunes/packs encore hors scope MVP actif.

- **prochaine action utile :**
  - Enchaîner avec la prochaine petite étape demandée (probable : récurrence simple ou amélioration UX de l’onglet Événements), puis mettre à jour immédiatement ce journal avec le même format.
