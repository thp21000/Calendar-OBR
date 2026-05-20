# PROJECT_CONTEXT

## Projet

- **Nom** : Calendar OBR — Calendrier vivant pour Owlbear Rodeo
- **Type** : extension Owlbear Rodeo, frontend web + manifest Owlbear
- **Objectif** : permettre au MJ de gérer un calendrier de campagne vivant directement dans Owlbear Rodeo.

Fonctions visées ou déjà en place :

- date et heure actuelles ;
- mois personnalisés ;
- jours de semaine personnalisés ;
- vue Aujourd’hui ;
- vue Mois ;
- vue Événements ;
- vue Paramètres ;
- événements de campagne ;
- récurrences simples ;
- déclenchement d’événements au passage du temps ;
- saisons ;
- météo actuelle ;
- prévisions météo horaires et journalières ;
- événements météo automatiques côté logique métier ;
- import/export JSON ;
- stockage indépendant par room OBR ;
- base technique préparée pour lunes, packs Patreon et affichage joueur.

L’addon doit rester utilisable dans un popover OBR compact. Les fonctionnalités doivent être ajoutées progressivement, par petites étapes testables.

## URLs importantes

- **Repository GitHub** : https://github.com/thp21000/Calendar-OBR
- **Page GitHub Pages** : https://thp21000.github.io/Calendar-OBR/
- **Manifest OBR** : https://thp21000.github.io/Calendar-OBR/manifest.json
- **URL à ajouter dans Owlbear Rodeo** : https://thp21000.github.io/Calendar-OBR/manifest.json

## Stack

- **Frontend** : React + TypeScript + Vite
- **Backend** : aucun backend dédié
- **Base de données serveur** : aucune
- **Stockage** : localStorage navigateur, avec clé scopée par room OBR quand disponible
- **Tests** : Vitest
- **SDK** : `@owlbear-rodeo/sdk`
- **Déploiement** : GitHub Pages via GitHub Actions

## Commandes utiles

```bash
npm install
npm run dev
npm run build
npm run test
npm run preview
```

Le projet est surtout travaillé directement via GitHub/Codex. Les commandes `npm run build` et `npm run test` doivent toujours rester valides, car le workflow GitHub Pages en dépend.

## Décisions validées

- Utiliser une date interne absolue :
  - `absoluteDay` ;
  - `hour` ;
  - `minute`.
- Convertir cette date interne vers une date affichée selon le calendrier personnalisé.
- Conserver une architecture modulaire :
  - moteur de date ;
  - logique événements ;
  - logique saisons ;
  - logique météo ;
  - logique événements météo ;
  - formatage ;
  - stockage ;
  - import/export ;
  - i18n ;
  - composants UI.
- Garder les fonctions de calcul pures et testables.
- Garder une séparation claire entre logique métier et interface React.
- Avancer par petites étapes MVP.
- Ne pas mélanger météo, lunes, événements, saisons et calendrier dans un seul gros fichier.
- Tout texte visible doit passer par l’i18n FR/EN.
- Les exports JSON doivent contenir `schemaVersion` et `appVersion`.
- Le stockage doit être indépendant par room OBR.
- Les icônes texte/emoji/URL image doivent passer autant que possible par un composant d’affichage commun.
- La météo doit être déterministe : même projet, même seed, même jour et même heure doivent produire le même résultat.
- La météo réelle simulée doit rester séparée des prévisions imparfaites.
- Les prévisions utilisent `forecastMode` :
  - `fine` : prévision proche de la météo réelle ;
  - `wide` : prévision plus incertaine.
- Les valeurs météo sont saisies dans les unités affichées, sans conversion automatique pour le moment :
  - FR : °C, km/h, mm/h ;
  - EN : °F, mi/h, in/h.
- Le MVP ne doit pas encore inclure :
  - lunes fonctionnelles ;
  - événements météo visibles dans l’interface ;
  - notifications météo automatiques ;
  - packs Patreon complets ;
  - synchronisation joueur avancée.

## État actuel

### Ce qui fonctionne

- Extension frontend fonctionnelle dans Owlbear Rodeo.
- GitHub Pages fonctionne.
- Manifest OBR fonctionnel.
- Navigation principale :
  - Aujourd’hui ;
  - Mois ;
  - Événements ;
  - Paramètres.
- Moteur calendrier :
  - conversion date interne ↔ date calendrier ;
  - mois personnalisés ;
  - jours de semaine personnalisés ;
  - offset de semaine ;
  - ajout/retrait de minutes, heures et jours.
- Sauvegarde :
  - localStorage ;
  - clé de stockage indépendante par room OBR quand la room est disponible ;
  - fallback local hors OBR.
- Vue Aujourd’hui :
  - nom du calendrier ;
  - date actuelle formatée ;
  - boutons rapides de temps ;
  - pause longue +8 h ;
  - événements du jour ;
  - événements déclenchés récemment ;
  - saison actuelle ;
  - météo actuelle ;
  - prévisions météo 5 h ;
  - prévisions météo 5 jours ;
  - placeholder lune.
- Vue Mois :
  - grille mensuelle ;
  - jours de semaine personnalisés ;
  - premier jour affiché configurable ;
  - jour actuel mis en évidence ;
  - icône du premier événement du jour ;
  - icône du début de saison ;
  - masquage du numéro du jour si un marqueur événement/saison est affiché ;
  - tooltip avec numéro du jour, saison et noms d’événements.
- Vue Événements :
  - formulaire de création replié par défaut ;
  - formulaire partagé création/édition ;
  - sections repliables dans le formulaire ;
  - liste complète des événements ;
  - édition ;
  - suppression avec confirmation ;
  - actions manuelles de statut ;
  - filtre par statut ;
  - filtre temporel ;
  - recherche textuelle.
- Événements de campagne :
  - création ;
  - édition ;
  - suppression ;
  - tri ;
  - filtrage par jour ;
  - filtrage du jour courant ;
  - événement toute la journée ;
  - date de fin optionnelle ;
  - icône texte/emoji ;
  - icône image via URL ;
  - visibilité `gm`, `players`, `revealOnTrigger` ;
  - statut `active`, `triggered`, `archived`, `disabled` ;
  - options de déclenchement ;
  - suppression/archivage après fin effective ;
  - récurrence simple.
- Récurrences événementielles :
  - aucune ;
  - tous les X jours ;
  - tous les X mois ;
  - tous les X ans ;
  - affichage dans les cartes ;
  - prise en compte dans Aujourd’hui et Mois ;
  - prise en compte dans la détection de déclenchement.
- Déclenchement au passage du temps :
  - détection des événements dont le début tombe entre deux moments ;
  - affichage dans Aujourd’hui ;
  - all-day déclenché à 00:00 ;
  - détection séparée de la fin effective ;
  - suppression/archivage seulement à la fin de l’événement.
- Saisons :
  - type enrichi avec début, fin et profil météo ;
  - logique de saison courante ;
  - saisons traversant la fin d’année ;
  - interface de gestion dans Paramètres ;
  - ajout, modification, suppression ;
  - icône texte/emoji/URL image ;
  - affichage dans Aujourd’hui ;
  - marqueur de début de saison dans Mois.
- Profil météo des saisons :
  - température min/moyenne/max ;
  - vent min/moyenne/max ;
  - pluie min/moyenne/max ;
  - température négative autorisée ;
  - vent/pluie forcés en non négatif ;
  - saisie texte permettant le signe `-` ;
  - normalisation `min <= average <= max`.
- Météo :
  - météo actuelle déterministe ;
  - prévisions horaires sur 5 h ;
  - prévisions journalières sur 5 jours ;
  - mode de prévision `fine` / `wide` ;
  - seed météo configurable ;
  - bouton de génération de seed ;
  - unités FR/EN adaptées.
- Événements météo automatiques :
  - types enrichis ;
  - conditions météo ;
  - opérateurs `gte` et `lte` ;
  - logique pure de détection ;
  - compatibilité partielle avec anciennes données ;
  - tests unitaires.
- Import/export :
  - logique JSON ;
  - validation ;
  - sanitation ;
  - `schemaVersion` ;
  - `appVersion` ;
  - interface export JSON ;
  - interface import JSON avec confirmation.
- Paramètres :
  - sections repliables ;
  - configuration générale ;
  - date et heure actuelles ;
  - structure du calendrier ;
  - mois ;
  - jours de semaine ;
  - référence du calendrier ;
  - années ;
  - affichage ;
  - saisons ;
  - météo ;
  - données/sauvegarde ;
  - fonctions futures.
- i18n FR/EN active.
- Tests unitaires sur les parties principales :
  - moteur calendrier ;
  - événements ;
  - formatage ;
  - vue mois logique ;
  - paramètres ;
  - stockage ;
  - import/export ;
  - scope OBR ;
  - saisons ;
  - unités météo ;
  - météo ;
  - événements météo.

### Ce qui est en cours

- Stabilisation UX dans le popover OBR.
- Amélioration progressive de l’onglet Événements.
- Consolidation progressive de la météo.
- Préparation de l’interface des événements météo.
- Préparation future des lunes.

### Limites connues

- Les événements météo automatiques existent seulement côté logique métier ; il n’y a pas encore d’interface de création/édition.
- Les événements météo ne sont pas encore affichés dans Aujourd’hui.
- Les événements météo ne déclenchent pas encore de notification visuelle.
- Les événements météo ne sont pas encore liés au passage du temps.
- Les lunes ne sont pas encore fonctionnelles.
- Pas encore d’affichage joueur différencié.
- Pas encore de synchronisation avancée OBR entre MJ/joueurs.
- Les packs Patreon ne sont pas encore implémentés.
- La météo reste une simulation MVP simple : pas encore de météo matin/après-midi/nuit, pas encore d’icônes météo détaillées, pas encore de min/max journaliers.
- L’UI doit rester surveillée pour éviter les débordements dans le popover.

## Architecture du projet

### Domaine et logique calendrier

- `src/domain/types.ts`
  - Types centraux :
    - `CalendarProject` ;
    - `CalendarSystem` ;
    - `CalendarDate` ;
    - `CalendarEvent` ;
    - `UiSettings` ;
    - `Season` ;
    - `SeasonWeatherProfile` ;
    - `WeatherSnapshot` ;
    - `WeatherEvent` ;
    - `WeatherCondition` ;
    - types lunes placeholders.

- `src/calendar/dateEngine.ts`
  - Logique pure de date/heure :
    - conversion date interne → date affichée ;
    - conversion date affichée → date interne ;
    - ajout minutes/heures/jours ;
    - récupération mois/jour ;
    - calcul weekday.

- `src/calendar/monthView.ts`
  - Helpers pour construire la vue mensuelle :
    - jours du mois ;
    - premier jour de la grille ;
    - ordre d’affichage des jours de semaine ;
    - prise en compte de `monthGridStartsOnWeekdayId`.

- `src/calendar/settingsLogic.ts`
  - Normalisation et manipulation de la structure du calendrier :
    - ajout/suppression mois ;
    - ajout/suppression jours de semaine ;
    - réordonnancement ;
    - validation des tailles ;
    - normalisation des offsets.

### Événements de campagne

- `src/calendar/eventsLogic.ts`
  - Logique pure événements :
    - création ;
    - ajout ;
    - mise à jour ;
    - suppression ;
    - tri ;
    - filtrage par jour ;
    - filtrage jour courant ;
    - récurrences simples ;
    - déclenchement ;
    - fin effective ;
    - actions après fin ;
    - statuts ;
    - gestion all-day ;
    - date de fin.

- `src/calendar/formatEvent.ts`
  - Formatage partagé des événements :
    - date/heure longue ;
    - date/heure courte ;
    - visibilité ;
    - récurrence ;
    - options de déclenchement ;
    - statut ;
    - affichage all-day ;
    - affichage fin même jour / autre jour.

- `src/calendar/__tests__/eventsLogic.test.ts`
  - Tests de la logique événementielle.

- `src/calendar/__tests__/formatEvent.test.ts`
  - Tests de formatage événementiel.

### Saisons et météo

- `src/calendar/seasonsLogic.ts`
  - Logique pure saisons :
    - saison courante ;
    - saison contenant une date ;
    - saisons qui traversent la fin d’année ;
    - saisons commençant à une date ;
    - création/suppression/mise à jour ;
    - profil météo par défaut ;
    - normalisation profil météo ;
    - parsing des valeurs météo saisies.

- `src/calendar/weatherUnits.ts`
  - Libellés d’unités météo selon la langue :
    - FR : °C, km/h, mm/h ;
    - EN : °F, mi/h, in/h.

- `src/calendar/weatherLogic.ts`
  - Logique pure météo :
    - génération météo réelle simulée ;
    - météo actuelle ;
    - prévisions horaires ;
    - prévisions journalières ;
    - mode `fine` / `wide` ;
    - variation déterministe ;
    - direction du vent.

- `src/calendar/weatherEventsLogic.ts`
  - Logique pure événements météo :
    - condition météo ;
    - événement météo déclenché ;
    - récupération des événements météo déclenchés.

- `src/calendar/__tests__/seasonsLogic.test.ts`
  - Tests de la logique saisons.

- `src/calendar/__tests__/weatherUnits.test.ts`
  - Tests des unités météo.

- `src/calendar/__tests__/weatherLogic.test.ts`
  - Tests de la météo et des prévisions.

- `src/calendar/__tests__/weatherEventsLogic.test.ts`
  - Tests de la logique des événements météo.

### UI principale

- `src/App.tsx`
  - Point d’entrée React principal :
    - chargement scope OBR ;
    - chargement projet ;
    - sauvegarde projet ;
    - navigation onglets ;
    - routage interne Aujourd’hui / Mois / Événements / Paramètres.

- `src/components/TodayView.tsx`
  - Vue Aujourd’hui :
    - date courante ;
    - boutons de temps ;
    - pause longue ;
    - événements du jour ;
    - événements déclenchés ;
    - saison actuelle ;
    - météo actuelle ;
    - prévisions 5 h ;
    - prévisions 5 jours ;
    - placeholder lune.

- `src/components/MonthView.tsx`
  - Vue Mois :
    - grille mensuelle ;
    - jour actuel ;
    - icône d’événement ;
    - icône de début de saison ;
    - tooltip événements/saison.

- `src/components/EventsView.tsx`
  - Vue Événements :
    - formulaire de création repliable ;
    - liste des événements ;
    - édition ;
    - suppression ;
    - filtres ;
    - recherche ;
    - actions de statut.

- `src/components/events/EventForm.tsx`
  - Formulaire partagé création/édition événement.

- `src/components/EventIcon.tsx`
  - Affichage unifié des icônes :
    - emoji ;
    - texte ;
    - URL image ;
    - fallback image.

### Paramètres

- `src/components/SettingsView.tsx`
  - Assemblage des sections de paramètres.

- `src/components/CollapsibleSection.tsx`
  - Section repliable réutilisable.

- `src/components/settings/*`
  - Sous-sections de paramètres :
    - général ;
    - date/heure ;
    - structure calendrier ;
    - mois ;
    - jours de semaine ;
    - référence calendrier ;
    - années ;
    - affichage ;
    - saisons ;
    - météo ;
    - données/sauvegarde ;
    - fonctions futures.

### Stockage / OBR / import-export

- `src/storage/calendarStorage.ts`
  - Chargement ;
  - sauvegarde ;
  - reset ;
  - gestion localStorage ;
  - clé personnalisée par scope.

- `src/obr/roomScope.ts`
  - Détection du scope OBR :
    - room OBR si disponible ;
    - fallback `local-dev` hors OBR.

- `src/importExport/calendarImportExport.ts`
  - Export JSON ;
  - import JSON ;
  - validation ;
  - sanitation.

### i18n

- `src/i18n/messages.ts`
  - Dictionnaires FR/EN.
  - Helper `t(locale, key)`.

## Fonctionnalités

### Déjà faites

- [x] Socle TypeScript / React / Vite.
- [x] Manifest OBR.
- [x] GitHub Pages.
- [x] Moteur calendrier interne.
- [x] Vue Aujourd’hui.
- [x] Vue Mois.
- [x] Vue Événements.
- [x] Vue Paramètres.
- [x] Navigation principale.
- [x] Sauvegarde localStorage.
- [x] Sauvegarde scopée par room OBR.
- [x] i18n FR/EN.
- [x] Import/export JSON logique.
- [x] Interface import/export JSON.
- [x] Validation/sanitation import JSON.
- [x] Création d’événement.
- [x] Édition d’événement.
- [x] Suppression d’événement.
- [x] Événement toute la journée.
- [x] Date de fin optionnelle.
- [x] Récurrrences simples.
- [x] Déclenchement au passage du temps.
- [x] Actions après fin d’événement.
- [x] Statuts et filtres d’événements.
- [x] Recherche d’événements.
- [x] Icône événement texte/emoji.
- [x] Icône événement image URL.
- [x] Événements du jour dans Aujourd’hui.
- [x] Icône événement dans Mois.
- [x] Tooltip événements dans Mois.
- [x] Saisons fonctionnelles.
- [x] Interface de gestion des saisons.
- [x] Profil météo des saisons.
- [x] Icônes saisons dans Aujourd’hui et Mois.
- [x] Météo actuelle.
- [x] Prévisions météo 5 h.
- [x] Prévisions météo 5 jours.
- [x] Mode de prévision fine/large.
- [x] Seed météo configurable.
- [x] Base logique des événements météo automatiques.
- [x] Tests unitaires principaux.

### En cours

- [ ] Polish UI compact popover OBR.
- [ ] Consolidation ergonomique de l’onglet Événements.
- [ ] Consolidation ergonomique de la section météo/saisons.
- [ ] Préparation de l’interface des événements météo.
- [ ] Préparation des lunes.

### À faire ensuite

Priorité probable :

1. Ajouter l’interface de création/édition/suppression des événements météo.
2. Afficher les événements météo déclenchés dans Aujourd’hui.
3. Brancher les événements météo au passage du temps.
4. Ajouter des notifications météo simples.
5. Ajouter les lunes fonctionnelles.
6. Préparer les packs Patreon.
7. Ajouter une vraie vue joueur / visibilité joueur.
8. Ajouter une synchronisation OBR plus avancée si nécessaire.

## Bugs / points de vigilance connus

- L’édition d’événement a eu un bug lié à la régénération d’id via `createCalendarEvent`. Le principe à respecter :
  - en création : générer un nouvel id ;
  - en édition : conserver l’id existant.
- À chaque évolution du formulaire événement, vérifier que :
  - l’id de l’événement édité reste identique ;
  - l’événement est bien modifié ;
  - aucun doublon n’est créé ;
  - le tri reste correct.
- Les formulaires deviennent longs dans le popover. Il faut privilégier :
  - sections repliables ;
  - sous-composants ;
  - champs groupés ;
  - pas de scroll horizontal.
- Le rendu compact du popover OBR doit rester une contrainte prioritaire.
- La vue Mois ne doit pas être surchargée par les événements/saisons.
- La logique métier doit rester hors des composants React autant que possible.
- Toute nouvelle fonctionnalité doit être testée si elle ajoute une logique pure.
- Toute chaîne visible doit passer par `messages.ts`.
- Les événements météo ont une logique de compatibilité avec les anciennes données :
  - `enabled` absent = actif ;
  - `requireAllConditions` absent = `true` ;
  - `conditions` absent ou vide = non déclenché.
- Les événements météo ne sont pas encore exposés dans l’interface ; ne pas les considérer terminés côté UX.

## Règles de reprise pour Codex

Avant toute modification, lire :

- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- les fichiers du dossier `docs/`
- les fichiers concernés par la tâche.

Règles :

- Ne pas faire de grosse refonte sans demande explicite.
- Ne pas mélanger plusieurs grosses fonctionnalités dans une même étape.
- Ne pas coder lunes/packs tant que la tâche demandée ne les concerne pas.
- Ne pas dupliquer la logique métier dans les composants React.
- Préférer les helpers purs dans `src/calendar/*`.
- Garder l’UI compatible avec un popover OBR compact.
- Lancer `npm run build`.
- Lancer `npm run test`.
- Résumer clairement :
  - fichiers créés ;
  - fichiers modifiés ;
  - résultat build ;
  - résultat tests ;
  - comportement ajouté ;
  - limites restantes.

## Décisions techniques à ne pas re-discuter à chaque reprise

- Conserver le principe de date interne absolue + conversion affichée.
- Conserver le stockage local scopé par room OBR.
- Conserver la séparation logique métier / UI.
- Conserver les fonctions de calcul pures et testables.
- Conserver React + TypeScript + Vite.
- Conserver GitHub Pages pour l’hébergement.
- Conserver l’i18n FR/EN.
- Conserver le découpage en petites étapes MVP.
- Conserver la météo déterministe.
- Conserver les prévisions imparfaites via `forecastMode`.

## État actuel précis

Le MVP calendrier est déjà utilisable dans Owlbear Rodeo avec :

- calendrier personnalisable ;
- date et heure courantes ;
- navigation Aujourd’hui / Mois / Événements / Paramètres ;
- gestion d’événements simples et récurrents ;
- déclenchement d’événements au passage du temps ;
- affichage des événements dans Aujourd’hui ;
- repères visuels dans Mois ;
- gestion des saisons ;
- météo actuelle ;
- prévisions météo ;
- stockage par room ;
- i18n ;
- import/export JSON ;
- tests ;
- base logique des événements météo.

Les prochaines étapes doivent rester ciblées. La priorité immédiate recommandée est l’interface des événements météo, puis leur affichage dans Aujourd’hui.

## Journal de session

### Session du 19 mai 2026

#### sujets traités :

- Préparation et consolidation du socle technique du projet : types principaux, moteur de date, stockage local, import/export JSON et tests unitaires.
- Mise en place de la base React + Vite + TypeScript.
- Intégration minimale Owlbear Rodeo.
- Ajout du manifest OBR.
- Correction des chemins pour GitHub Pages / OBR.
- Mise en ligne GitHub Pages.
- Mise en place de la sauvegarde indépendante par room OBR.
- Création et amélioration de la vue Aujourd’hui.
- Création de la vue Mois.
- Création puis refonte de la page Paramètres.
- Nettoyage progressif de l’architecture des paramètres.
- Implémentation de la logique métier événements.
- Ajout des tests unitaires de la logique événements.
- Ajout de l’onglet Événements.
- Ajout du formulaire de création d’événement.
- Enrichissement des événements : all-day, date de fin, icône image URL.
- Factorisation du formatage des événements.
- Affichage des événements dans Aujourd’hui.
- Affichage des événements dans Mois.
- Ajout des actions Modifier / Supprimer.
- Identification et correction du problème d’id en édition.
- Mise à jour initiale de `PROJECT_CONTEXT.md`.

#### décisions prises :

- Avancer en petites étapes MVP.
- Garder la logique métier dans `src/calendar/*`.
- Éviter de dupliquer la logique dans les composants React.
- Garder les composants UI simples pour le popover OBR.
- Utiliser une date interne absolue comme source de vérité.
- Garder le stockage local, mais scopé par room OBR.
- Utiliser GitHub Pages pour héberger l’extension et le manifest.
- Centraliser le formatage des événements dans `src/calendar/formatEvent.ts`.
- Centraliser l’affichage des icônes dans `EventIcon`.
- Utiliser `EventForm` comme formulaire partagé création/édition.

### Session du 20 mai 2026

#### sujets traités :

- Finalisation progressive de l’onglet Événements :
  - récurrences simples ;
  - options de déclenchement ;
  - statuts ;
  - filtres ;
  - recherche ;
  - actions manuelles de statut ;
  - formulaire de création repliable ;
  - sections repliables dans `EventForm`.
- Déclenchement au passage du temps :
  - détection des événements déclenchés ;
  - affichage dans Aujourd’hui ;
  - normalisation all-day à 00:00 ;
  - distinction début / fin effective ;
  - suppression et archivage seulement à la fin de l’événement.
- Import/export JSON branché dans l’interface Paramètres.
- Saisons :
  - enrichissement du type `Season` ;
  - logique `seasonsLogic.ts` ;
  - interface de gestion des saisons ;
  - affichage de la saison actuelle ;
  - icône de début de saison dans Mois ;
  - tooltip Mois enrichi.
- Profil météo de saison :
  - min/moyenne/max température ;
  - min/moyenne/max vent ;
  - min/moyenne/max pluie ;
  - unités FR/EN ;
  - températures négatives ;
  - parsing météo texte.
- Météo :
  - type `WeatherSnapshot` ;
  - météo actuelle déterministe ;
  - prévisions 5 h ;
  - prévisions 5 jours ;
  - mode de prévision fine/large ;
  - seed météo configurable.
- Événements météo :
  - enrichissement des types ;
  - ajout de `WeatherCondition` ;
  - ajout de `weatherEventsLogic.ts` ;
  - tests de conditions et déclenchement météo.
- Mise à jour complète de `PROJECT_CONTEXT.md`.

#### fichiers modifiés ou créés pendant la session :

- `PROJECT_CONTEXT.md`
- `src/domain/types.ts`
- `src/calendar/eventsLogic.ts`
- `src/calendar/formatEvent.ts`
- `src/calendar/seasonsLogic.ts`
- `src/calendar/weatherUnits.ts`
- `src/calendar/weatherLogic.ts`
- `src/calendar/weatherEventsLogic.ts`
- `src/calendar/__tests__/eventsLogic.test.ts`
- `src/calendar/__tests__/formatEvent.test.ts`
- `src/calendar/__tests__/seasonsLogic.test.ts`
- `src/calendar/__tests__/weatherUnits.test.ts`
- `src/calendar/__tests__/weatherLogic.test.ts`
- `src/calendar/__tests__/weatherEventsLogic.test.ts`
- `src/components/TodayView.tsx`
- `src/components/MonthView.tsx`
- `src/components/EventsView.tsx`
- `src/components/EventIcon.tsx`
- `src/components/events/EventForm.tsx`
- `src/components/settings/DataSettingsSection.tsx`
- `src/components/settings/SeasonsSettingsSection.tsx`
- `src/components/settings/WeatherSettingsSection.tsx`
- `src/components/SettingsView.tsx`
- `src/i18n/messages.ts`

#### décisions prises :

- La météo actuelle est la météo réelle simulée.
- Les prévisions météo peuvent être imparfaites.
- Le mode `fine` est proche de la météo réelle.
- Le mode `wide` est plus incertain.
- La seed météo doit être configurable.
- Les températures négatives doivent être acceptées.
- Le vent et la pluie ne doivent jamais rester négatifs.
- Les événements météo doivent d’abord être posés côté logique métier avant l’interface.
- Les événements météo avec ancienne structure doivent être tolérés autant que possible.

#### problèmes corrigés pendant la session :

- All-day qui ne se déclenchait pas correctement à 00:00.
- Suppression/archivage appliqués trop tôt au début au lieu de la fin.
- Événements archivés/désactivés visibles dans les vues actives.
- Formulaire événement trop long dans le popover.
- Recherche et filtres manquants dans l’onglet Événements.
- Icône de saison URL affichée comme lien au lieu d’image.
- Numéro du jour encore visible dans Mois malgré icône événement/saison.
- Températures négatives impossibles à saisir à cause du signe `-`.
- Unités anglaises météo incorrectes.

#### problèmes restants / points de vigilance :

- Les événements météo sont encore uniquement côté logique métier.
- Il faut encore créer l’interface de gestion des événements météo.
- Il faut encore afficher les événements météo déclenchés dans Aujourd’hui.
- Il faut encore décider comment éviter les répétitions de notifications météo à chaque changement d’heure.
- Les lunes restent à implémenter.
- La vue joueur / visibilité joueur reste à implémenter.
- Les packs Patreon restent à implémenter.

#### état final de la session :

- L’extension se charge dans Owlbear Rodeo.
- Le calendrier est utilisable avec date, heure, mois, paramètres et événements.
- Les événements peuvent être créés, modifiés, supprimés, filtrés et recherchés.
- Les événements peuvent être récurrents.
- Les événements peuvent se déclencher au passage du temps.
- Les saisons sont configurables et affichées.
- La météo actuelle et les prévisions sont affichées.
- La configuration météo permet de choisir le mode de prévision et la seed.
- La base des événements météo automatiques est en place côté logique métier.
