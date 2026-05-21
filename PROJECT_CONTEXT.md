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
- événements météo automatiques ;
- lunes et phase lunaire actuelle ;
- système lunaire complet par défaut ;
- import/export JSON de calendrier ;
- système de packs ;
- packs intégrés FR/EN ;
- import de packs JSON externes ;
- export du calendrier actuel comme pack JSON ;
- stockage indépendant par room OBR ;
- base technique préparée pour packs Patreon, affichage joueur et synchronisation avancée..

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
  - logique lunes ;
  - logique packs ;
  - formatage ;
  - stockage ;
  - import/export ;
  - i18n ;
  - composants UI.
- Garder les fonctions de calcul pures et testables.
- Garder une séparation claire entre logique métier et interface React.
- Avancer par petites étapes MVP.
- Ne pas mélanger météo, lunes, événements, saisons, packs et calendrier dans un seul gros fichier.
- Tout texte visible doit passer par l’i18n FR/EN.
- Les exports JSON de calendrier doivent contenir `schemaVersion` et `appVersion`.
- Les packs JSON doivent contenir `schemaVersion`, `packId`, `packVersion`, `name`, `locale` et un `CalendarProject` complet.
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
- Ne pas afficher les lunes dans la vue Mois pour le moment.
- Les paramètres doivent être en sections repliables.
- Les sections de paramètres sont fermées par défaut.
- L’état ouvert/fermé des sections de paramètres est mémorisé en `sessionStorage`.
- Les packs importés remplacent le calendrier courant après confirmation.
- Pas d’import partiel de pack ni de fusion dans le MVP.
- Le MVP ne doit pas encore inclure :
  - marketplace ;
  - authentification Patreon ;
  - gestion de droits ;
  - téléchargement distant de packs ;
  - import partiel de packs ;
  - fusion de packs ;
  - événements lunaires ;
  - effets mécaniques des lunes ;
  - synchronisation joueur avancée.

## État actuel

### Ce qui fonctionne

- Extension frontend fonctionnelle dans Owlbear Rodeo.
- GitHub Pages et manifest OBR fonctionnels.
- Navigation principale : Aujourd’hui, Mois, Événements, Paramètres.
- Sauvegarde localStorage avec clé indépendante par room OBR, fallback local hors OBR.
- i18n FR/EN active.
- Tests unitaires sur les principales logiques métier.

#### Calendrier

- Moteur de conversion date interne ↔ date calendrier.
- Mois personnalisés.
- Jours de semaine personnalisés.
- Offset de semaine.
- Ajout/retrait de minutes, heures et jours.
- Date et heure actuelles modifiables depuis les paramètres.
- Boutons rapides de temps dans Aujourd’hui.

#### Vue Aujourd’hui

Affiche actuellement :

- nom du calendrier ;
- date actuelle formatée ;
- boutons rapides de temps ;
- pause longue +8 h ;
- événements du jour ;
- événements déclenchés récemment ;
- alertes météo déclenchées récemment ;
- encart de synthèse des nouveaux déclenchements ;
- saison actuelle ;
- météo actuelle ;
- prévisions météo 5 h ;
- prévisions météo 5 jours ;
- événements météo actifs ;
- phase actuelle des lunes.

#### Vue Mois

- Grille mensuelle.
- Jours de semaine personnalisés.
- Premier jour affiché configurable.
- Jour actuel mis en évidence.
- Icône du premier événement du jour.
- Icône du début de saison.
- Masquage du numéro du jour si un marqueur événement/saison est affiché.
- Tooltip avec numéro du jour, saison et noms d’événements.
- Les lunes ne sont volontairement pas affichées dans Mois pour le MVP.

#### Vue Événements

- Formulaire de création replié par défaut.
- Formulaire partagé création/édition.
- Sections repliables dans le formulaire.
- Liste complète des événements.
- Édition et suppression avec confirmation.
- Actions manuelles de statut.
- Filtres par statut et période.
- Recherche textuelle.

#### Événements de campagne

- Création, édition, suppression.
- Tri et filtrage par jour / jour courant.
- Événement toute la journée.
- Date de fin optionnelle.
- Icône texte/emoji/image URL.
- Visibilité `gm`, `players`, `revealOnTrigger`.
- Statuts `active`, `triggered`, `archived`, `disabled`.
- Récurrence simple : aucune, tous les X jours, tous les X mois, tous les X ans.
- Déclenchement au passage du temps.
- All-day déclenché à 00:00.
- Suppression/archivage seulement après fin effective.

#### Saisons

- Type enrichi avec début, fin et profil météo.
- Logique de saison courante.
- Saisons traversant la fin d’année.
- Interface de gestion dans Paramètres.
- Ajout, modification, suppression.
- Icône texte/emoji/URL image.
- Affichage dans Aujourd’hui.
- Marqueur de début de saison dans Mois.

#### Profil météo des saisons

- Température min/moyenne/max.
- Vent min/moyenne/max.
- Pluie min/moyenne/max.
- Température négative autorisée.
- Vent/pluie forcés en non négatif.
- Saisie texte permettant le signe `-`.
- Normalisation `min <= average <= max`.

#### Météo

- Météo actuelle déterministe.
- Prévisions horaires sur 5 h.
- Prévisions journalières sur 5 jours.
- Mode de prévision `fine` / `wide`.
- Seed météo configurable et générable.
- Unités FR/EN adaptées.

#### Événements météo automatiques

- Types enrichis.
- Conditions météo.
- Opérateurs `gte` et `lte`.
- Logique pure de détection.
- Interface de création/édition/suppression.
- Affichage des événements météo actifs dans Aujourd’hui.
- Détection des alertes météo nouvellement déclenchées au passage du temps.
- Affichage séparé des alertes météo déclenchées.
- Compatibilité avec anciennes données : `enabled` absent = actif ; `requireAllConditions` absent = `true` ; `conditions` absent ou vide = non déclenché.

#### Lunes

- Type `Moon` enrichi.
- Cycle lunaire complet de 8 phases.
- Lune principale par défaut.
- Initialisation douce pour anciens calendriers sans lune.
- Flag `defaultMoonSystemInitialized`.
- Affichage de la phase actuelle dans Aujourd’hui.
- Interface de gestion dans Paramètres.
- Ajout, modification, suppression.
- Prévisualisation de phase.
- Affichage du cycle complet.

#### Packs

- Type `CalendarPack`.
- Pack intégré FR `fantasy-classic-fr`.
- Pack intégré EN `fantasy-classic-en`.
- Filtrage des packs selon la langue.
- Validation des packs.
- Résumé des packs.
- Application d’un pack intégré avec confirmation.
- Import d’un pack JSON externe.
- Export du calendrier actuel comme pack JSON.
- Tests unitaires.

#### Import/export

- Export JSON de calendrier.
- Import JSON de calendrier.
- Validation.
- Sanitation.
- Interface export/import JSON avec confirmation.
- Conservation des lunes, saisons, météo, événements météo et flags UI.

#### Paramètres

Sections actuelles :

- configuration générale ;
- date et heure actuelles ;
- structure du calendrier ;
- mois ;
- jours de semaine ;
- référence du calendrier ;
- années ;
- affichage ;
- saisons ;
- lunes ;
- météo ;
- événements météo ;
- packs ;
- données/sauvegarde ;
- fonctions futures.

## Architecture du projet

### Domaine et logique calendrier

- `src/domain/types.ts`
  - Types centraux : `CalendarProject`, `CalendarSystem`, `CalendarDate`, `CalendarEvent`, `UiSettings`, `Season`, `SeasonWeatherProfile`, `WeatherSnapshot`, `WeatherEvent`, `WeatherCondition`, `Moon`, `MoonPhase`, `CalendarPack`.

- `src/calendar/dateEngine.ts`
  - Conversion et manipulation de date/heure.

- `src/calendar/monthView.ts`
  - Construction de la vue mensuelle.

- `src/calendar/settingsLogic.ts`
  - Normalisation et manipulation de la structure du calendrier.

### Événements de campagne

- `src/calendar/eventsLogic.ts`
  - Logique pure événements.

- `src/calendar/formatEvent.ts`
  - Formatage partagé des événements.

- `src/calendar/__tests__/eventsLogic.test.ts`
  - Tests de la logique événementielle.

- `src/calendar/__tests__/formatEvent.test.ts`
  - Tests de formatage événementiel.

### Saisons, météo et lunes

- `src/calendar/seasonsLogic.ts`
  - Logique pure saisons et profils météo.

- `src/calendar/weatherUnits.ts`
  - Unités météo selon la langue.

- `src/calendar/weatherLogic.ts`
  - Météo actuelle, prévisions, mode `fine` / `wide`, variation déterministe.

- `src/calendar/weatherEventsLogic.ts`
  - Conditions météo, événements météo actifs, alertes nouvellement déclenchées.

- `src/calendar/moonLogic.ts`
  - Normalisation de lune, système lunaire par défaut, initialisation douce, calcul de phase.

### Packs

- `src/packs/defaultFantasyCalendarPack.ts`
  - Packs intégrés FR/EN.

- `src/packs/calendarPacks.ts`
  - `getBuiltInCalendarPacks`, `validateCalendarPack`, `importCalendarPack`, `createCalendarPackFromProject`, `exportCalendarPack`, `getCalendarPackSummary`.

- `src/packs/__tests__/calendarPacks.test.ts`
  - Tests de validation, import, export, résumé et filtrage par langue.

### UI

- `src/App.tsx`
  - Chargement scope OBR, chargement/sauvegarde projet, navigation principale.

- `src/components/TodayView.tsx`
  - Calculs de données, state local des déclenchements, boutons de temps.

- `src/components/today/*`
  - Cartes extraites de TodayView.

- `src/components/MonthView.tsx`
  - Vue mensuelle.

- `src/components/EventsView.tsx`
  - Liste, filtres, recherche, création/édition/suppression des événements.

- `src/components/events/EventForm.tsx`
  - Formulaire partagé création/édition événement.

- `src/components/EventIcon.tsx`
  - Affichage emoji/texte/image URL.

- `src/components/SettingsView.tsx`
  - Assemblage des sections de paramètres.

- `src/components/CollapsibleSection.tsx`
  - Section repliable avec état en `sessionStorage`.

- `src/components/settings/PacksSettingsSection.tsx`
  - Packs intégrés, import pack JSON, export calendrier actuel comme pack JSON.

### Stockage / OBR / import-export

- `src/storage/calendarStorage.ts`
  - Chargement, sauvegarde, reset, localStorage, clé de scope, initialisation douce des lunes.

- `src/obr/roomScope.ts`
  - Détection room OBR ou fallback local.

- `src/importExport/calendarImportExport.ts`
  - Export/import JSON de calendrier, validation et sanitation.

- `src/i18n/messages.ts`
  - Dictionnaires FR/EN et helper `t`.

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
- [x] Import/export JSON calendrier.
- [x] Validation/sanitation import JSON.
- [x] Événements ponctuels et récurrents.
- [x] Déclenchement au passage du temps.
- [x] Actions après fin d’événement.
- [x] Saisons configurables.
- [x] Profil météo des saisons.
- [x] Météo actuelle.
- [x] Prévisions météo 5 h.
- [x] Prévisions météo 5 jours.
- [x] Mode de prévision fine/large.
- [x] Seed météo configurable.
- [x] Événements météo automatiques.
- [x] Interface de gestion des événements météo.
- [x] Affichage des événements météo actifs dans Aujourd’hui.
- [x] Alertes météo déclenchées au passage du temps.
- [x] Encart nouveaux déclenchements.
- [x] Lunes fonctionnelles dans Aujourd’hui.
- [x] Interface de gestion des lunes.
- [x] Système lunaire complet par défaut.
- [x] Packs intégrés FR/EN.
- [x] Interface Packs dans Paramètres.
- [x] Import de pack JSON externe.
- [x] Export du calendrier actuel comme pack JSON.
- [x] Tests unitaires principaux.

### En cours

- [ ] Polish UI compact popover OBR.
- [ ] Consolidation ergonomique de l’onglet Événements.
- [ ] Consolidation ergonomique de la section météo/saisons/lunes.
- [ ] Consolidation ergonomique de la section Packs.
- [ ] Préparation d’une stratégie de packs Patreon distribués manuellement.
- [ ] Préparation d’un futur affichage joueur.

### À faire ensuite

Priorité probable :

1. Améliorer l’ergonomie de la section Packs si elle devient trop longue.
2. Ajouter des packs intégrés supplémentaires.
3. Ajouter une meilleure prévisualisation des packs avant import.
4. Préparer des fichiers de packs téléchargeables manuellement pour Patreon.
5. Ajouter une vraie vue joueur / visibilité joueur.
6. Ajouter une synchronisation OBR plus avancée si nécessaire.
7. Ajouter des événements lunaires plus tard si nécessaire.

## Bugs / points de vigilance connus

- L’édition d’événement a eu un bug lié à la régénération d’id via `createCalendarEvent` : en édition, conserver l’id existant.
- Les formulaires deviennent longs dans le popover : privilégier sections repliables, sous-composants, champs groupés, pas de scroll horizontal.
- Le rendu compact du popover OBR doit rester une contrainte prioritaire.
- La vue Mois ne doit pas être surchargée par les événements/saisons.
- Ne pas ajouter l’affichage des lunes dans Mois tant que ce n’est pas demandé.
- Toute nouvelle chaîne visible doit passer par `messages.ts`.
- Toute nouvelle logique pure doit avoir des tests.
- Les événements météo ont une logique de compatibilité avec les anciennes données.
- Le système lunaire par défaut utilise `defaultMoonSystemInitialized` pour éviter que la lune revienne après suppression volontaire.
- Les packs remplacent le calendrier courant : toujours demander confirmation, ne pas faire de fusion implicite.
- Les exports de packs doivent rester réimportables avec `validateCalendarPack`.

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
- Conserver les lunes uniquement dans Aujourd’hui pour le moment.
- Conserver l’import de pack comme remplacement complet du calendrier courant.

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
- événements météo ;
- lunes dans Aujourd’hui ;
- stockage par room ;
- i18n ;
- import/export JSON ;
- packs intégrés FR/EN ;
- import de packs JSON ;
- export du calendrier actuel comme pack JSON ;
- tests.

## Statut MVP

Le MVP a été validé le 21 mai 2026.

Critères validés :
- tests vérifiés ;
- fonctionnement dans Owlbear Rodeo ;
- calendrier utilisable ;
- événements, saisons, météo, lunes et packs fonctionnels ;
- import/export JSON fonctionnel ;
- documentation projet à jour.

Les prochaines étapes relèvent du post-MVP.

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

### Session du 21 mai 2026

#### sujets traités :

- Événements météo :
  - ajout de l’interface de gestion des événements météo dans les paramètres ;
  - création, modification et suppression d’événements météo ;
  - activation/désactivation d’un événement météo ;
  - ajout, modification et suppression des conditions météo ;
  - prise en charge des conditions sur température, vent et pluie ;
  - prise en charge des opérateurs `gte` et `lte` ;
  - compatibilité UI avec les anciennes données :
    - `enabled` absent = actif ;
    - `requireAllConditions` absent = toutes les conditions ;
  - correction de la saisie des valeurs numériques pour accepter les valeurs négatives utiles aux températures ;
  - affichage des événements météo actifs dans Aujourd’hui ;
  - détection des événements météo nouvellement déclenchés au passage du temps ;
  - séparation entre :
    - événements météo actuellement actifs ;
    - alertes météo déclenchées récemment ;
  - ajout d’un encart de synthèse des nouveaux déclenchements avec bouton Masquer.

- Nettoyage de la vue Aujourd’hui :
  - extraction de plusieurs blocs d’affichage hors de `TodayView.tsx` ;
  - création de composants dédiés dans `src/components/today/` ;
  - conservation de la logique de passage du temps dans `TodayView` ;
  - séparation plus nette entre calculs, état local et affichage ;
  - maintien du comportement existant après refactor.

- Lunes :
  - enrichissement du type `Moon` ;
  - ajout des types de phases lunaires ;
  - création de `moonLogic.ts` ;
  - calcul déterministe de la phase lunaire selon `absoluteDay` ;
  - gestion d’un cycle lunaire complet en 8 phases ;
  - calcul d’illumination approximative ;
  - prise en charge de `cycleLengthDays` ;
  - prise en charge de `cycleOffsetDays`, y compris négatif ;
  - affichage de la phase lunaire actuelle dans Aujourd’hui ;
  - ajout de l’interface de gestion des lunes dans les paramètres ;
  - ajout, modification et suppression de lunes ;
  - prévisualisation de la phase actuelle dans la carte de lune ;
  - affichage informatif du cycle complet dans les paramètres.

- Système lunaire par défaut :
  - ajout d’une lune principale par défaut ;
  - ajout d’un cycle complet de 29,5 jours ;
  - correction pour que les anciens calendriers avec `moons: []` reçoivent une lune principale une seule fois ;
  - ajout du flag `defaultMoonSystemInitialized` ;
  - correction pour éviter que la lune principale revienne après suppression volontaire par le MJ ;
  - décision de ne pas afficher les lunes dans la vue Mois pour le MVP.

- Paramètres :
  - correction des sections ouvertes par défaut ;
  - toutes les sections Paramètres commencent fermées si aucun état de session n’existe ;
  - ajout de la mémorisation de l’ouverture/fermeture des sections via `sessionStorage` ;
  - ajout de `storageKey` dans `CollapsibleSection` ;
  - branchement de clés stables pour chaque section de paramètres.

- Import/export JSON calendrier :
  - vérification et sécurisation de la conservation des nouvelles données ;
  - conservation des lunes ;
  - conservation du flag `defaultMoonSystemInitialized` ;
  - conservation des saisons avec profil météo ;
  - conservation des paramètres météo ;
  - conservation des événements météo ;
  - conservation des conditions météo ;
  - normalisation des lunes importées ;
  - normalisation des profils météo importés ;
  - validation des événements météo importés ;
  - tests d’import/export ajoutés ou complétés.

- Packs :
  - ajout du type `CalendarPack` ;
  - création d’un premier pack intégré en français ;
  - création d’un pack intégré équivalent en anglais ;
  - ajout de la logique pure des packs dans `calendarPacks.ts` ;
  - validation des packs ;
  - résumé des packs ;
  - application d’un pack intégré depuis les paramètres ;
  - confirmation avant remplacement du calendrier courant ;
  - import d’un pack JSON externe depuis un fichier local ;
  - validation avant import ;
  - affichage du pack sélectionné ;
  - export du calendrier actuel comme pack JSON ;
  - génération d’un `packId` si absent ;
  - version par défaut `1.0.0` ;
  - correction du nom de fichier exporté pour éviter `pack-pack-xxx.json` ;
  - filtrage des packs intégrés selon la langue de l’interface :
    - interface FR → pack FR ;
    - interface EN → pack EN.

- Documentation :
  - préparation d’une nouvelle version de `PROJECT_CONTEXT.md` ;
  - préparation d’une nouvelle version de `docs/PACKS_DESIGN.md` ;
  - génération de fichiers `.md` téléchargeables pour éviter les problèmes de rendu Markdown dans le chat ;
  - clarification de l’état actuel du projet, des limites et des prochaines étapes.

#### fichiers modifiés ou créés pendant la session :

- `PROJECT_CONTEXT.md`
- `docs/PACKS_DESIGN.md`
- `src/domain/types.ts`
- `src/storage/calendarStorage.ts`
- `src/importExport/calendarImportExport.ts`
- `src/importExport/__tests__/calendarImportExport.test.ts`
- `src/calendar/weatherEventsLogic.ts`
- `src/calendar/moonLogic.ts`
- `src/calendar/__tests__/weatherEventsLogic.test.ts`
- `src/calendar/__tests__/moonLogic.test.ts`
- `src/packs/defaultFantasyCalendarPack.ts`
- `src/packs/calendarPacks.ts`
- `src/packs/__tests__/calendarPacks.test.ts`
- `src/components/TodayView.tsx`
- `src/components/today/TriggerSummaryCard.tsx`
- `src/components/today/TodayEventsCard.tsx`
- `src/components/today/TriggeredEventsCard.tsx`
- `src/components/today/TriggeredWeatherAlertsCard.tsx`
- `src/components/today/WeatherAndSeasonCard.tsx`
- `src/components/CollapsibleSection.tsx`
- `src/components/SettingsView.tsx`
- `src/components/settings/WeatherEventsSettingsSection.tsx`
- `src/components/settings/MoonsSettingsSection.tsx`
- `src/components/settings/PacksSettingsSection.tsx`
- `src/i18n/messages.ts`

#### décisions prises :

- Les événements météo doivent être configurables directement dans l’addon.
- Les événements météo actifs et les alertes météo nouvellement déclenchées doivent rester deux notions séparées.
- Les événements météo ne doivent pas être transformés automatiquement en événements de campagne.
- Les alertes météo nouvellement déclenchées doivent être basées sur la météo réelle simulée, pas sur les prévisions.
- L’encart “Nouveaux déclenchements” est un état local d’interface, pas une donnée persistée dans le projet.
- `TodayView` devait être nettoyé avant d’ajouter trop de fonctionnalités supplémentaires.
- Les lunes doivent exister dans le MVP, mais seulement dans Aujourd’hui.
- Les lunes ne doivent pas être affichées dans la vue Mois pour le moment.
- Le système lunaire par défaut doit être une seule lune principale avec un cycle complet, pas huit lunes différentes.
- Un ancien calendrier sans lune doit recevoir automatiquement une lune principale une seule fois.
- Si le MJ supprime volontairement la lune principale, elle ne doit pas revenir automatiquement.
- Les sections de paramètres doivent être fermées par défaut.
- L’état ouvert/fermé des paramètres doit être mémorisé seulement en session, pas dans le projet.
- Les packs doivent contenir un `CalendarProject` complet.
- L’import d’un pack remplace le calendrier courant après confirmation.
- L’import partiel et la fusion de packs sont hors scope pour le moment.
- Les packs intégrés doivent exister en français et en anglais.
- L’export du calendrier actuel comme pack JSON doit produire un fichier réimportable.
- La section Packs doit rester simple et exploitable avant d’envisager Patreon, marketplace ou téléchargement distant.

#### problèmes corrigés pendant la session :

- Les événements météo n’avaient pas encore d’interface de création/édition/suppression.
- Les valeurs météo négatives dans les conditions météo pouvaient être difficiles ou impossibles à saisir correctement.
- `enabled` et `requireAllConditions` n’étaient pas toujours affichés selon les règles de compatibilité anciennes données.
- Les événements météo actifs n’étaient pas encore affichés dans Aujourd’hui.
- Il n’y avait pas de détection séparée des alertes météo nouvellement déclenchées.
- Un événement météo déjà actif pouvait être confondu avec un nouveau déclenchement.
- `TodayView.tsx` devenait trop gros et difficile à maintenir.
- Les lunes étaient seulement prévues, mais pas réellement configurables.
- Les anciens calendriers avec `moons: []` restaient sans lune.
- Le calendrier par défaut pouvait avoir une lune principale, mais sans flag empêchant son retour après suppression volontaire.
- Les sections Paramètres s’ouvraient encore automatiquement au lieu de commencer fermées.
- L’ouverture/fermeture des sections Paramètres n’était pas mémorisée pendant la session.
- L’import/export JSON devait être renforcé pour toutes les nouvelles données ajoutées.
- Les packs n’existaient pas encore comme format exploitable.
- Le pack intégré existait seulement en français.
- L’interface anglaise pouvait encore tomber sur le pack français.
- L’export de pack pouvait générer un nom de fichier du type `pack-pack-xxx.json`.
- Les documents de contexte n’étaient plus à jour après les ajouts météo, lunes et packs.
- Les longs blocs Markdown fournis dans le chat se cassaient à cause des blocs de code imbriqués.

#### problèmes restants / points de vigilance :

- La vue Mois ne doit pas être surchargée.
- Les lunes ne sont volontairement pas affichées dans Mois.
- Les événements lunaires ne sont pas encore implémentés.
- Les effets mécaniques des lunes ne sont pas encore implémentés.
- Les packs remplacent le calendrier courant ; il n’y a pas encore d’import partiel.
- Il n’y a pas encore de fusion intelligente de packs.
- Il n’y a pas encore de marketplace.
- Il n’y a pas encore d’authentification Patreon.
- Il n’y a pas encore de gestion de droits.
- Il n’y a pas encore de téléchargement distant de packs.
- La section Packs peut devenir longue dans un popover compact.
- Il faudra probablement améliorer l’ergonomie de la section Packs avant d’ajouter beaucoup de contenus.
- La vue joueur / visibilité joueur reste à implémenter.
- La synchronisation avancée MJ/joueurs via OBR reste à implémenter.
- Les notifications restent simples et locales à l’interface.
- La météo reste une simulation MVP simple :
  - pas de météo matin/après-midi/nuit ;
  - pas d’icônes météo détaillées ;
  - pas de min/max journaliers.

#### état final de la session :

- L’extension se charge dans Owlbear Rodeo.
- Le calendrier est utilisable avec date, heure, mois, événements et paramètres.
- Les événements peuvent être créés, modifiés, supprimés, filtrés et recherchés.
- Les événements peuvent être récurrents.
- Les événements peuvent se déclencher au passage du temps.
- Les événements peuvent être archivés ou supprimés après leur fin effective.
- Les saisons sont configurables et affichées.
- Les profils météo saisonniers sont configurables.
- La météo actuelle est générée de façon déterministe.
- Les prévisions météo horaires et journalières sont affichées.
- Le mode de prévision météo `fine` / `wide` est configurable.
- La seed météo est configurable.
- Les événements météo sont configurables dans les paramètres.
- Les événements météo actifs sont affichés dans Aujourd’hui.
- Les alertes météo nouvellement déclenchées sont détectées au passage du temps.
- Les nouveaux déclenchements sont résumés dans un encart masquable.
- Les lunes sont configurables.
- Une lune principale avec cycle complet existe par défaut.
- La phase lunaire actuelle est affichée dans Aujourd’hui.
- Les anciens calendriers sans lune peuvent recevoir automatiquement le système lunaire par défaut.
- La lune principale ne revient pas si le MJ la supprime volontairement.
- Les sections Paramètres sont fermées par défaut et mémorisées pendant la session.
- Le calendrier complet peut être exporté et importé en JSON.
- Les nouvelles données sont conservées à l’import/export JSON :
  - lunes ;
  - saisons ;
  - profils météo ;
  - paramètres météo ;
  - événements météo ;
  - flag `defaultMoonSystemInitialized`.
- Les packs intégrés FR/EN existent.
- L’interface Packs permet d’appliquer un pack intégré.
- L’interface Packs permet d’importer un pack JSON externe.
- L’interface Packs permet d’exporter le calendrier actuel comme pack JSON.
- Le pack exporté peut être réimporté comme pack.