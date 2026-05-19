# PROJECT_CONTEXT

## Projet

- **Nom** : Calendar OBR — Calendrier vivant pour Owlbear Rodeo
- **Type** : Extension Owlbear Rodeo, frontend web + manifest Owlbear
- **Objectif** : permettre au MJ de gérer un calendrier de campagne vivant directement dans Owlbear Rodeo :
  - date actuelle ;
  - heure actuelle ;
  - mois personnalisés ;
  - jours de semaine personnalisés ;
  - événements de campagne ;
  - affichages Aujourd’hui / Mois / Événements / Paramètres ;
  - stockage indépendant par room OBR ;
  - import/export JSON ;
  - base technique préparée pour saisons, météo, lunes et packs.

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

Le projet est surtout travaillé directement via GitHub/Codex. Les commandes `npm run build` et `npm run test` doivent quand même rester valides, car le workflow GitHub Pages en dépend.

## Décisions validées

- Utiliser une date interne absolue :
  - `absoluteDay`
  - `hour`
  - `minute`
- Convertir cette date interne vers une date affichée selon le calendrier personnalisé.
- Conserver une architecture modulaire :
  - moteur de date ;
  - logique événements ;
  - formatage ;
  - stockage ;
  - import/export ;
  - i18n ;
  - composants UI.
- Garder les fonctions de calcul pures et testables.
- Garder une séparation claire entre logique métier et interface React.
- Avancer par petites étapes MVP.
- Ne pas mélanger météo, lunes, événements et calendrier dans un seul gros fichier.
- Tout texte visible doit passer par l’i18n FR/EN.
- Les exports JSON doivent contenir `schemaVersion` et `appVersion`.
- Le stockage doit être indépendant par room OBR.
- Le MVP ne doit pas encore inclure :
  - météo avancée ;
  - lunes fonctionnelles ;
  - récurrence complexe ;
  - notifications automatiques avancées ;
  - packs Patreon complets ;
  - synchronisation joueur avancée.

## État actuel

### Ce qui fonctionne

- Extension frontend fonctionnelle dans Owlbear Rodeo.
- Navigation principale :
  - Aujourd’hui ;
  - Mois ;
  - Événements ;
  - Paramètres.
- GitHub Pages fonctionne.
- Manifest OBR fonctionnel.
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
  - placeholders saison/météo/lune.
- Vue Mois :
  - grille mensuelle ;
  - jours de semaine personnalisés ;
  - premier jour affiché configurable ;
  - jour actuel mis en évidence ;
  - icône du premier événement du jour ;
  - tooltip avec numéro du jour et noms d’événements.
- Vue Événements :
  - liste complète des événements ;
  - création d’événement ;
  - édition d’événement ;
  - suppression d’événement avec confirmation ;
  - affichage icône/nom/date/résumé/visibilité.
- Événements :
  - création ;
  - édition ;
  - suppression ;
  - tri ;
  - filtrage par jour ;
  - filtrage du jour courant ;
  - événement toute la journée ;
  - date de fin optionnelle ;
  - icône texte/emoji ;
  - icône image via URL.
- Icônes événement :
  - texte ou emoji ;
  - URL image `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg` ;
  - support des URLs avec paramètres ;
  - fallback si l’image échoue.
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
  - données/sauvegarde ;
  - fonctions futures.
- Import/export :
  - logique JSON présente ;
  - validation ;
  - sanitation ;
  - `schemaVersion` ;
  - `appVersion`.
- i18n FR/EN active.
- Tests unitaires sur les parties principales :
  - moteur calendrier ;
  - événements ;
  - formatage ;
  - vue mois logique ;
  - paramètres ;
  - stockage ;
  - import/export ;
  - scope OBR.

### Ce qui est en cours

- Stabilisation UX dans le popover OBR.
- Amélioration progressive de l’onglet Événements.
- Nettoyage de la densité visuelle des formulaires.
- Vérification de l’édition d’événement en conditions réelles.

### Limites connues

- Pas encore de récurrence événementielle fonctionnelle.
- Pas encore de notifications automatiques au changement de date/heure.
- Pas encore de vrai système de déclenchement d’événement.
- Pas encore de saisons fonctionnelles.
- Pas encore de météo fonctionnelle.
- Pas encore de lunes fonctionnelles.
- Pas encore d’interface complète d’import/export.
- Pas encore d’affichage joueur différencié.
- Pas encore de synchronisation avancée OBR entre MJ/joueurs.
- Les modules météo/saisons/lunes/packs sont encore hors scope MVP actif.
- L’UI doit rester surveillée pour éviter les débordements dans le popover.

## Architecture du projet

### Domaine et logique calendrier

- `src/domain/types.ts`
  - Types centraux :
    - `CalendarProject`
    - `CalendarSystem`
    - `CalendarDate`
    - `CalendarEvent`
    - `UiSettings`
    - types météo/lunes placeholders.

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

### Événements

- `src/calendar/eventsLogic.ts`
  - Logique pure événements :
    - création ;
    - ajout ;
    - mise à jour ;
    - suppression ;
    - tri ;
    - filtrage par jour ;
    - filtrage jour courant ;
    - comparaison dates ;
    - gestion all-day ;
    - date de fin ;
    - détection URL image.

- `src/calendar/formatEvent.ts`
  - Formatage partagé des événements :
    - date/heure longue ;
    - date/heure courte ;
    - visibilité ;
    - affichage all-day ;
    - affichage fin même jour / autre jour.

- `src/calendar/__tests__/eventsLogic.test.ts`
  - Tests de la logique événementielle.

- `src/calendar/__tests__/formatEvent.test.ts`
  - Tests de formatage événementiel si présent.

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
    - placeholders saison/météo/lune.

- `src/components/MonthView.tsx`
  - Vue Mois :
    - grille mensuelle ;
    - jour actuel ;
    - icône d’événement ;
    - tooltip événements.

- `src/components/EventsView.tsx`
  - Vue Événements :
    - formulaire de création ;
    - liste des événements ;
    - édition ;
    - suppression.

- `src/components/events/EventForm.tsx`
  - Formulaire partagé création/édition événement.

- `src/components/EventIcon.tsx`
  - Affichage unifié des icônes événement :
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
- [x] Validation/sanitation import JSON.
- [x] Création d’événement.
- [x] Édition d’événement.
- [x] Suppression d’événement.
- [x] Événement toute la journée.
- [x] Date de fin optionnelle.
- [x] Icône événement texte/emoji.
- [x] Icône événement image URL.
- [x] Événements du jour dans Aujourd’hui.
- [x] Icône événement dans Mois.
- [x] Tooltip événements dans Mois.
- [x] Tests unitaires principaux.

### En cours

- [ ] Polish UI compact popover OBR.
- [ ] Consolidation ergonomique de l’onglet Événements.
- [ ] Vérification en conditions réelles de l’édition d’événement.
- [ ] Amélioration progressive des formulaires longs.

### À faire ensuite

Priorité probable :

1. Vérifier/corriger totalement l’édition des événements existants.
2. Ajouter la récurrence simple.
3. Ajouter les notifications automatiques au changement de date/heure.
4. Ajouter une UI import/export JSON.
5. Ajouter les saisons fonctionnelles.
6. Ajouter la météo fonctionnelle.
7. Ajouter les lunes fonctionnelles.
8. Préparer les packs Patreon.
9. Ajouter une vraie vue joueur / visibilité joueur.
10. Ajouter une synchronisation OBR plus avancée si nécessaire.

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
- La vue Mois ne doit pas être surchargée par les événements.
- La logique métier doit rester hors des composants React autant que possible.
- Toute nouvelle fonctionnalité doit être testée si elle ajoute une logique pure.
- Toute chaîne visible doit passer par `messages.ts`.

## Règles de reprise pour Codex

Avant toute modification, lire :

- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- les fichiers du dossier `docs/`
- les fichiers concernés par la tâche.

Règles :

- Ne pas faire de grosse refonte sans demande explicite.
- Ne pas mélanger plusieurs grosses fonctionnalités dans une même étape.
- Ne pas coder météo/lunes/packs tant que la tâche demandée ne les concerne pas.
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

## État actuel précis

Le MVP calendrier est déjà utilisable dans Owlbear Rodeo avec :

- calendrier personnalisable ;
- date et heure courantes ;
- navigation Aujourd’hui / Mois / Événements / Paramètres ;
- gestion d’événements simples ;
- affichage des événements dans Aujourd’hui ;
- repères visuels dans Mois ;
- stockage par room ;
- i18n ;
- tests ;
- base import/export.

Les prochaines étapes doivent rester ciblées. La priorité immédiate recommandée est de vérifier/corriger l’édition d’événement en conditions réelles, puis d’ajouter la récurrence simple.

## Journal de session

### Session du 19 mai 2026

#### sujets traités :
  - Préparation et consolidation du socle technique du projet :
    - types principaux du calendrier ;
    - moteur de date interne ;
    - conversion date interne ↔ date affichée ;
    - ajout/retrait de temps ;
    - validation des données ;
    - stockage local ;
    - import/export JSON ;
    - tests unitaires.
  - Mise en place de la base React + Vite + TypeScript :
    - création de l’application frontend ;
    - intégration minimale dans Owlbear Rodeo ;
    - ajout du manifest OBR ;
    - correction des chemins du manifest pour GitHub Pages / OBR.
  - Mise en ligne GitHub Pages :
    - page disponible sur `https://thp21000.github.io/Calendar-OBR/` ;
    - manifest disponible sur `https://thp21000.github.io/Calendar-OBR/manifest.json` ;
    - validation du chargement de l’extension dans Owlbear Rodeo.
  - Mise en place de la sauvegarde indépendante par room OBR :
    - détection du scope room OBR ;
    - fallback local hors OBR ;
    - utilisation d’une clé de stockage différente selon la room.
  - Création et amélioration de la vue **Aujourd’hui** :
    - affichage compact de la date complète ;
    - affichage de l’heure actuelle ;
    - boutons rapides de modification du temps ;
    - bouton pause longue +8 h ;
    - placeholders saison / météo / lune ;
    - correction du style pour éviter le scroll horizontal.
  - Création de la vue **Mois** :
    - grille mensuelle ;
    - jours de semaine personnalisés ;
    - jour actuel mis en avant ;
    - prise en compte du premier jour affiché dans la grille ;
    - tests autour de `monthGridStartsOnWeekdayId`.
  - Création puis refonte de la page **Paramètres** :
    - passage d’un formulaire long à des sections repliables ;
    - configuration générale ;
    - date et heure actuelles ;
    - structure du calendrier ;
    - configuration des mois ;
    - configuration des jours de semaine ;
    - référence du calendrier ;
    - affichage ;
    - données / sauvegarde ;
    - fonctions futures.
  - Nettoyage progressif de l’architecture des paramètres :
    - extraction de sous-composants ;
    - création de helpers dans `settingsLogic.ts` ;
    - sécurisation du déplacement/suppression des mois et jours ;
    - nettoyage des tests.
  - Implémentation de la logique métier événements :
    - création ;
    - ajout au projet ;
    - mise à jour ;
    - suppression ;
    - tri ;
    - occurrence sur un jour ;
    - récupération des événements d’un jour donné ;
    - récupération des événements du jour courant.
  - Ajout des tests unitaires de la logique événements :
    - création ;
    - ajout ;
    - modification ;
    - suppression ;
    - tri ;
    - filtre par jour ;
    - projet vide.
  - Ajout de l’onglet **Événements** :
    - première version en lecture seule ;
    - affichage des événements triés ;
    - affichage de la date, du résumé et de la visibilité.
  - Ajout du formulaire de création d’événement :
    - nom ;
    - icône ;
    - résumé ;
    - année ;
    - mois ;
    - jour ;
    - heure ;
    - minute ;
    - visibilité.
  - Enrichissement des événements :
    - support de l’option **toute la journée** ;
    - ajout d’une date/heure de fin optionnelle ;
    - détection d’URL d’image pour les icônes ;
    - affichage image si l’icône est une URL png/jpg/jpeg/gif/webp/svg ;
    - fallback texte/emoji si l’image ne charge pas.
  - Factorisation du formatage des événements :
    - extraction de `formatEvent.ts` ;
    - format long de date/heure ;
    - format court pour Aujourd’hui ;
    - format de visibilité ;
    - prise en compte des événements all-day et des dates de fin.
  - Affichage des événements dans **Aujourd’hui** :
    - section “Événements du jour” ;
    - affichage icône ;
    - nom ;
    - horaire court ;
    - résumé ;
    - visibilité.
  - Affichage des événements dans **Mois** :
    - ajout d’un marqueur sur les jours contenant un événement ;
    - remplacement du marqueur `• N` par l’icône du premier événement ;
    - tooltip au survol avec le numéro du jour et le nom des événements.
  - Ajout des actions **Modifier** et **Supprimer** dans l’onglet Événements :
    - bouton Modifier ;
    - formulaire partagé création/édition ;
    - bouton Supprimer ;
    - confirmation avant suppression.
  - Identification d’un bug critique dans l’édition d’événement :
    - en mode édition, `createCalendarEvent` régénérait un nouvel `id` ;
    - le nouvel `id` empêchait `updateCalendarEvent` de retrouver l’événement existant ;
    - correction demandée : en édition, conserver impérativement `initialEvent.id`.
  - Mise à jour de `PROJECT_CONTEXT.md` pour documenter l’état du projet et faciliter la reprise.

#### fichiers modifiés ou créés pendant la session :
  - `PROJECT_CONTEXT.md`
  - `AGENTS.md`
  - `docs/MVP_TASKS.md`
  - `docs/WEATHER_DESIGN.md`
  - `docs/PACKS_DESIGN.md`
  - `package.json`
  - `vite.config.ts`
  - `index.html`
  - `public/manifest.json`
  - `public/icon.svg`
  - `.github/workflows/pages.yml`
  - `src/App.tsx`
  - `src/domain/types.ts`
  - `src/calendar/dateEngine.ts`
  - `src/calendar/eventsLogic.ts`
  - `src/calendar/formatDisplayDate.ts`
  - `src/calendar/formatEvent.ts`
  - `src/calendar/monthView.ts`
  - `src/calendar/settingsLogic.ts`
  - `src/calendar/__tests__/dateEngine.test.ts`
  - `src/calendar/__tests__/eventsLogic.test.ts`
  - `src/calendar/__tests__/formatEvent.test.ts`
  - `src/calendar/__tests__/monthView.test.ts`
  - `src/calendar/__tests__/settingsLogic.test.ts`
  - `src/components/TodayView.tsx`
  - `src/components/MonthView.tsx`
  - `src/components/EventsView.tsx`
  - `src/components/EventIcon.tsx`
  - `src/components/CollapsibleSection.tsx`
  - `src/components/events/EventForm.tsx`
  - `src/components/settings/GeneralSettingsSection.tsx`
  - `src/components/settings/CurrentTimeSettingsSection.tsx`
  - `src/components/settings/CalendarStructureSettingsSection.tsx`
  - `src/components/settings/MonthsSettingsSection.tsx`
  - `src/components/settings/WeekdaysSettingsSection.tsx`
  - `src/components/settings/CalendarReferenceSettingsSection.tsx`
  - `src/components/settings/YearsSettingsSection.tsx`
  - `src/components/settings/DisplaySettingsSection.tsx`
  - `src/components/settings/DataSettingsSection.tsx`
  - `src/components/settings/FutureSettingsSection.tsx`
  - `src/storage/calendarStorage.ts`
  - `src/importExport/calendarImportExport.ts`
  - `src/obr/roomScope.ts`
  - `src/i18n/messages.ts`

#### décisions prises :
  - Avancer en petites étapes MVP plutôt que demander de grosses fonctionnalités d’un coup.
  - Garder la logique métier dans `src/calendar/*`.
  - Éviter de dupliquer la logique dans les composants React.
  - Garder les composants UI aussi simples que possible pour le popover OBR.
  - Utiliser une date interne absolue comme source de vérité.
  - Garder le stockage local, mais scopé par room OBR.
  - Utiliser GitHub Pages pour héberger l’extension et le manifest.
  - Garder le manifest OBR avec des URLs absolues quand nécessaire pour éviter les erreurs 404 dans OBR.
  - Centraliser le formatage des événements dans `src/calendar/formatEvent.ts`.
  - Centraliser l’affichage des icônes dans `EventIcon`.
  - Utiliser `EventForm` comme formulaire partagé création/édition.
  - Ne pas encore coder météo, lunes, saisons fonctionnelles, packs Patreon ou synchronisation joueur avancée.
  - Ne pas encore coder les récurrences tant que les événements simples ne sont pas stabilisés.

#### problèmes corrigés pendant la session :
  - Erreur 404 dans OBR liée aux chemins du manifest.
  - Risque de stockage partagé entre plusieurs rooms OBR.
  - Page Paramètres trop longue et brouillonne.
  - Scroll horizontal dans le popover.
  - `monthGridStartsOnWeekdayId` présent mais pas encore utilisé dans la vue Mois.
  - Tests mal structurés dans `settingsLogic.test.ts`.
  - Icône URL affichée comme texte au lieu d’image.
  - Marqueur événement dans Mois trop peu lisible sous forme `• N`.

#### problèmes restants / points de vigilance :
  - Vérifier en conditions réelles que la modification d’un événement conserve bien l’id original.
  - Vérifier qu’une modification d’événement met bien à jour :
    - la liste Événements ;
    - la vue Aujourd’hui ;
    - la vue Mois ;
    - le stockage local.
  - Si le bug d’édition n’est pas encore corrigé dans le code :
    - corriger `EventForm.tsx` pour ne pas écraser `initialEvent.id` avec un nouvel id.
  - Pas encore de récurrence événementielle fonctionnelle.
  - Pas encore de notifications automatiques au changement de date/heure.
  - Pas encore d’interface complète d’import/export JSON.
  - Pas encore d’édition ou suppression depuis Aujourd’hui ou Mois.
  - Pas encore de saisons fonctionnelles.
  - Pas encore de météo fonctionnelle.
  - Pas encore de lunes fonctionnelles.
  - Pas encore de packs Patreon.
  - Pas encore de vue joueur différenciée.
  - L’onglet Événements risque de devenir trop long si on ajoute encore des options sans sections repliables.

#### état final de la session :
  - L’extension se charge dans Owlbear Rodeo.
  - Le calendrier est utilisable avec date, heure, mois, paramètres et événements simples.
  - Les événements peuvent être créés et affichés.
  - Les événements apparaissent dans Aujourd’hui et dans Mois.
  - La suppression est prévue via confirmation.
  - L’édition existe dans l’interface, mais doit être vérifiée attentivement à cause du bug d’id identifié.
  - La base technique est suffisamment avancée pour continuer vers la récurrence, mais seulement après validation de l’édition.