# PROJECT_CONTEXT

## Projet

- **Nom** : Calendar OBR — Calendrier vivant pour Owlbear Rodeo
- **Type** : extension Owlbear Rodeo, frontend React/TypeScript + manifest OBR
- **Objectif** : permettre au MJ de gérer un calendrier de campagne vivant directement dans Owlbear Rodeo.

Le projet doit rester utilisable dans un popover OBR compact. Les fonctionnalités doivent être ajoutées par petites étapes testables, avec une séparation claire entre logique métier et interface React.

## URLs importantes

- **Repository GitHub** : https://github.com/thp21000/Calendar-OBR
- **Page GitHub Pages** : https://thp21000.github.io/Calendar-OBR/
- **Manifest OBR** : https://thp21000.github.io/Calendar-OBR/manifest.json
- **URL à ajouter dans Owlbear Rodeo** : https://thp21000.github.io/Calendar-OBR/manifest.json

## Stack

- **Frontend** : React + TypeScript + Vite
- **SDK** : `@owlbear-rodeo/sdk`
- **Tests** : Vitest
- **Stockage** : localStorage navigateur, avec clé scopée par room OBR quand disponible
- **Déploiement** : GitHub Pages via GitHub Actions
- **Backend** : aucun

## Commandes utiles

```bash
npm install
npm run dev
npm run build
npm run test
npm run preview
```

Le projet est surtout travaillé directement via GitHub/Codex. `npm run build` et `npm run test` doivent rester valides.

## Décisions validées

- Utiliser une date interne absolue : `absoluteDay`, `hour`, `minute`.
- Convertir la date interne vers une date affichée selon le calendrier personnalisé.
- Garder les fonctions de calcul pures et testables dans `src/calendar/*` ou `src/packs/*`.
- Garder la logique métier hors des composants React autant que possible.
- Tout texte visible doit passer par l’i18n FR/EN.
- Les exports JSON de calendrier doivent contenir `schemaVersion` et `appVersion`.
- Les packs doivent contenir un `CalendarProject` complet et remplacer le calendrier courant après confirmation.
- Le stockage doit être indépendant par room OBR.
- La météo doit être déterministe : même projet, même seed, même jour et même heure donnent le même résultat.
- La météo réelle simulée est séparée des prévisions imparfaites.
- Les prévisions utilisent `forecastMode` : `fine` ou `wide`.
- Les valeurs météo sont saisies dans les unités affichées, sans conversion automatique pour le moment : FR `°C`, `km/h`, `mm/h`; EN `°F`, `mi/h`, `in/h`.
- Les lunes sont affichées dans Aujourd’hui uniquement pour le MVP. Pas d’affichage lunaire dans la vue Mois pour le moment.
- Les paramètres sont en sections repliables fermées par défaut, avec état ouvert/fermé mémorisé en `sessionStorage`.

## État actuel

### Fonctionnel

- Extension chargeable dans Owlbear Rodeo via GitHub Pages.
- Manifest OBR fonctionnel.
- Navigation principale : Aujourd’hui, Mois, Événements, Paramètres.
- Sauvegarde localStorage avec scope par room OBR et fallback local hors OBR.
- i18n FR/EN active.
- Import/export JSON complet du calendrier avec sanitation et validation.
- Packs intégrés et packs JSON externes.

### Calendrier

- Moteur de date interne : conversion date interne ↔ date affichée.
- Mois personnalisés.
- Jours de semaine personnalisés.
- Offset de semaine.
- Date/heure actuelle modifiable.
- Boutons rapides de temps : -2 h, -1 h, -15 min, -5 min, +5 min, +15 min, +1 h, +2 h, pause longue +8 h.
- Vue Mois avec grille mensuelle, jour actuel, événements et débuts de saison.

### Événements de campagne

- Création, édition, suppression.
- Événement toute la journée.
- Date de fin optionnelle.
- Icône texte/emoji/image URL.
- Visibilité `gm`, `players`, `revealOnTrigger`.
- Statuts `active`, `triggered`, `archived`, `disabled`.
- Récurrence : aucune, tous les X jours, tous les X mois, tous les X ans.
- Déclenchement au passage du temps.
- All-day déclenché à 00:00.
- Suppression/archivage après fin effective, pas au début.
- Filtres, recherche et actions manuelles de statut.
- Affichage dans Aujourd’hui et Mois.

### Saisons

- Interface de gestion dans Paramètres.
- Ajout, modification, suppression.
- Début et fin de saison.
- Saisons traversant la fin d’année.
- Icône texte/emoji/image URL.
- Affichage de la saison actuelle dans Aujourd’hui.
- Marqueur de début de saison dans Mois.
- Profil météo par saison.

### Météo

- Profil météo par saison : température, vent, pluie avec min/moyenne/max.
- Températures négatives autorisées.
- Vent/pluie forcés en non négatif.
- Saisie texte permettant `-` pour valeurs négatives.
- Météo actuelle déterministe.
- Prévisions météo 5 h.
- Prévisions météo 5 jours.
- Mode de prévision `fine` / `wide`.
- Seed météo configurable et générable.
- Événements météo configurables avec conditions.
- Événements météo actifs affichés dans Aujourd’hui.
- Alertes météo nouvellement déclenchées au passage du temps affichées séparément.
- Encart de synthèse des nouveaux déclenchements avec bouton Masquer.

### Lunes

- Type `Moon` enrichi : nom, icône, durée de cycle, décalage de cycle.
- Système lunaire principal par défaut : 1 lune, cycle complet de 29,5 jours, 8 phases calculées.
- Phase actuelle affichée dans Aujourd’hui.
- Interface de gestion des lunes dans Paramètres.
- Ajout, modification, suppression.
- Prévisualisation de la phase actuelle.
- Résumé du cycle complet affiché dans les paramètres.
- Initialisation douce des anciens calendriers sans lune via `ensureDefaultMoonSystem`.
- Flag `uiSettings.defaultMoonSystemInitialized` pour éviter que la lune supprimée volontairement revienne.

### Packs

- Type `CalendarPack` ajouté.
- Packs intégrés :
  - `fantasy-classic-fr` — Calendrier fantasy classique.
  - `fantasy-classic-en` — Classic fantasy calendar.
- Filtrage des packs selon la langue de l’interface : FR voit le pack FR, EN voit le pack EN.
- Validation des packs via `validateCalendarPack`.
- Import de pack intégré depuis Paramètres.
- Import de pack JSON externe depuis fichier local.
- Export du calendrier actuel comme pack JSON.
- Résumé de pack : mois, saisons, lunes, événements météo.
- Import d’un pack = remplacement du calendrier courant après confirmation.
- Pas encore d’import partiel ni de fusion.

## Architecture principale

### Domaine

- `src/domain/types.ts`
  - Types centraux : `CalendarProject`, `CalendarSystem`, `CalendarDate`, `CalendarEvent`, `UiSettings`, `Season`, `WeatherSnapshot`, `WeatherEvent`, `WeatherCondition`, `Moon`, `MoonPhase`, `CalendarPack`.

### Calendrier et événements

- `src/calendar/dateEngine.ts`
  - Conversion et manipulation de date/heure.
- `src/calendar/monthView.ts`
  - Construction de la grille mensuelle.
- `src/calendar/settingsLogic.ts`
  - Normalisation et manipulation de la structure du calendrier.
- `src/calendar/eventsLogic.ts`
  - Logique pure des événements de campagne.
- `src/calendar/formatEvent.ts`
  - Formatage partagé des événements.

### Saisons, météo, lunes

- `src/calendar/seasonsLogic.ts`
  - Logique pure des saisons et profils météo.
- `src/calendar/weatherUnits.ts`
  - Unités météo selon la langue.
- `src/calendar/weatherLogic.ts`
  - Météo actuelle, prévisions, mode fine/wide, variation déterministe.
- `src/calendar/weatherEventsLogic.ts`
  - Conditions météo, événements météo actifs, alertes nouvellement déclenchées.
- `src/calendar/moonLogic.ts`
  - Cycle lunaire, phases, système lunaire par défaut, initialisation douce.

### Packs

- `src/packs/defaultFantasyCalendarPack.ts`
  - Packs intégrés FR/EN.
- `src/packs/calendarPacks.ts`
  - `getBuiltInCalendarPacks`
  - `validateCalendarPack`
  - `importCalendarPack`
  - `createCalendarPackFromProject`
  - `exportCalendarPack`
  - `getCalendarPackSummary`
- `src/packs/__tests__/calendarPacks.test.ts`
  - Tests de validation, import, export, résumé et filtrage par langue.

### UI

- `src/App.tsx`
  - Chargement scope OBR, chargement/sauvegarde projet, navigation principale.
- `src/components/TodayView.tsx`
  - Calculs et actions de la vue Aujourd’hui.
- `src/components/today/*`
  - Cartes extraites de TodayView : déclenchements, événements, météo/saison/lunes.
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
  - Chargement, sauvegarde, reset, localStorage, initialisation douce des lunes.
- `src/obr/roomScope.ts`
  - Détection room OBR ou fallback local.
- `src/importExport/calendarImportExport.ts`
  - Export/import JSON de calendrier, validation et sanitation.
- `src/i18n/messages.ts`
  - Dictionnaires FR/EN et helper `t`.

## Fonctionnalités terminées

- [x] Socle React/TypeScript/Vite.
- [x] Manifest OBR et GitHub Pages.
- [x] Moteur calendrier interne.
- [x] Vue Aujourd’hui.
- [x] Vue Mois.
- [x] Vue Événements.
- [x] Vue Paramètres.
- [x] Paramètres repliables avec mémoire de session.
- [x] Sauvegarde localStorage scopée par room OBR.
- [x] i18n FR/EN.
- [x] Import/export JSON calendrier.
- [x] Validation/sanitation import JSON.
- [x] Événements ponctuels et récurrents.
- [x] Déclenchement au passage du temps.
- [x] Actions après fin d’événement.
- [x] Saisons configurables.
- [x] Profil météo saisonnier.
- [x] Météo actuelle.
- [x] Prévisions météo 5 h et 5 jours.
- [x] Mode prévision fine/large.
- [x] Seed météo configurable.
- [x] Événements météo configurables.
- [x] Alertes météo actives et nouvellement déclenchées.
- [x] Lunes et phase actuelle dans Aujourd’hui.
- [x] Système lunaire complet par défaut.
- [x] Packs intégrés FR/EN.
- [x] Import de packs JSON externes.
- [x] Export du calendrier actuel comme pack JSON.
- [x] Tests unitaires principaux.

## Limites connues / hors scope actuel

- Pas d’affichage des lunes dans la vue Mois pour le MVP.
- Pas d’événements lunaires.
- Pas d’effets mécaniques des lunes.
- Pas d’import partiel de pack.
- Pas de fusion de pack avec le calendrier actuel.
- Pas de marketplace.
- Pas d’authentification Patreon.
- Pas de téléchargement distant de packs.
- Pas de gestion de droits.
- Pas encore de vue joueur différenciée.
- Pas encore de synchronisation avancée MJ/joueurs via OBR.
- Météo encore simple : pas de matin/après-midi/nuit, pas d’icônes météo avancées, pas de min/max journaliers.

## Prochaines étapes possibles

Priorités utiles :

1. Améliorer l’ergonomie de la section Packs si l’UI devient trop longue.
2. Ajouter des packs intégrés supplémentaires.
3. Ajouter un meilleur formatage/aperçu des packs avant import.
4. Préparer une vraie stratégie Patreon sans coder l’authentification.
5. Ajouter une vue joueur ou un mode visibilité joueur.
6. Améliorer les notifications sans spam.
7. Ajouter des événements lunaires plus tard si nécessaire.

## Règles de reprise pour Codex

Avant toute modification, lire :

- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- les fichiers du dossier `docs/`
- les fichiers concernés par la tâche.

Règles :

- Ne pas faire de grosse refonte sans demande explicite.
- Ne pas mélanger plusieurs grosses fonctionnalités dans une même étape.
- Ne pas coder de marketplace, Patreon, import partiel ou fusion de packs sans demande explicite.
- Ne pas dupliquer la logique métier dans les composants React.
- Préférer les helpers purs dans `src/calendar/*` ou `src/packs/*`.
- Garder l’UI compatible avec un popover OBR compact.
- Toute nouvelle chaîne visible doit passer par `messages.ts`.
- Toute nouvelle logique pure doit avoir des tests.
- Lancer `npm run build` et `npm run test` avant de répondre.

## Journal de session

### Session du 19 mai 2026

- Mise en place du socle React/Vite/TypeScript.
- Intégration OBR minimale.
- Manifest OBR et GitHub Pages.
- Moteur de date, stockage, navigation et premières vues.
- Premiers événements de campagne.
- Début de structuration de `PROJECT_CONTEXT.md`.

### Session du 20 mai 2026

- Événements enrichis : récurrences, statuts, filtres, recherche, déclenchement, actions après fin.
- Saisons configurables.
- Profils météo de saison.
- Météo actuelle et prévisions.
- Événements météo et alertes.
- Lunes et phase actuelle.
- Paramètres repliables avec mémoire de session.
- Import/export JSON renforcé.
- Packs intégrés FR/EN.
- Import de packs JSON externes.
- Export du calendrier actuel comme pack JSON.
- Mise à jour complète de la documentation projet.
