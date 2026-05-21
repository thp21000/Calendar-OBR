# Instructions pour Codex

Projet : addon Owlbear Rodeo de calendrier vivant pour MJ.

## Statut du projet

Le MVP est terminé et validé.

## Règles générales

- Toujours lire `PROJECT_CONTEXT.md` avant de modifier le code.
- Toujours lire les fichiers pertinents dans `docs/` avant de modifier une fonctionnalité.
- Ne pas relancer une fonctionnalité déjà validée sans raison claire.
- Préférer des petites étapes testables.
- Préférer une architecture simple, claire et extensible.
- Séparer la logique métier de l’interface.
- Ne pas mélanger calendrier, événements, météo, lunes, packs et stockage dans un seul gros fichier.
- Les fonctions de calcul doivent être pures et testables.
- Tout texte visible doit passer par l’i18n FR/EN.
- Les données exportées doivent inclure `schemaVersion`.
- Les exports de calendrier doivent inclure `appVersion`.
- Les packs doivent inclure `packId`, `packVersion`, `name`, `locale` et un `CalendarProject` complet.
- Préserver la compatibilité avec les packs JSON.
- L’interface doit rester compacte et utilisable dans un popover Owlbear Rodeo.

## Priorités post-MVP

Les priorités post-MVP recommandées sont :

1. Stabilisation et polish UX du popover.
2. Documentation publique et préparation de release.
3. Amélioration de la section Packs si elle devient trop longue.
4. Ajout de packs intégrés supplémentaires.
5. Prévisualisation plus détaillée des packs avant import.
6. Vue joueur ou mode lecture joueur.
7. Synchronisation OBR plus avancée entre MJ et joueurs.
8. Notifications plus robustes et moins répétitives.
9. Météo plus riche : états météo, tendances, cumul 24 h, min/max journaliers.
10. Événements météo avancés : durée, cooldown, conditions plus nombreuses.
11. Événements lunaires simples.
12. Import partiel et fusion intelligente de packs.
13. Packs distants ou distribution Patreon manuelle.
14. Marketplace ou authentification Patreon seulement plus tard, si explicitement demandé.

## Architecture attendue

Séparer clairement :

- logique calendrier ;
- logique de date et temps ;
- logique événements ;
- logique saisons ;
- logique météo ;
- logique événements météo ;
- logique lunes ;
- logique packs ;
- stockage ;
- import/export ;
- i18n ;
- composants UI ;
- intégration OBR.

Fichiers ou dossiers de référence :

- `src/calendar/dateEngine.ts`
- `src/calendar/eventsLogic.ts`
- `src/calendar/seasonsLogic.ts`
- `src/calendar/weatherLogic.ts`
- `src/calendar/weatherEventsLogic.ts`
- `src/calendar/moonLogic.ts`
- `src/packs/calendarPacks.ts`
- `src/storage/calendarStorage.ts`
- `src/importExport/calendarImportExport.ts`
- `src/components/*`
- `src/components/settings/*`
- `src/i18n/messages.ts`

## Règles de modification

Avant de modifier :

- identifier la portée exacte de la tâche ;
- lire les fichiers concernés ;
- vérifier si une fonction pure existe déjà ;
- éviter de dupliquer une logique existante dans un composant React ;
- garder l’UI compatible avec un popover compact ;
- ajouter ou mettre à jour les tests si une logique pure change.

Pendant la modification :

- ne pas faire de refonte globale non demandée ;
- ne pas déplacer massivement les fichiers sans nécessité ;
- ne pas modifier le format de données sans sanitation/import/export adapté ;
- ne pas casser les anciens calendriers sauvegardés ;
- ne pas faire revenir automatiquement une donnée que le MJ a supprimée volontairement ;
- ne pas transformer un événement météo en événement de campagne sauf demande explicite.

Après modification :

- lancer `npm run build` ;
- lancer `npm run test` ;
- signaler clairement les fichiers créés ;
- signaler clairement les fichiers modifiés ;
- expliquer le comportement ajouté ;
- signaler les limites restantes ;
- ne pas prétendre qu’une fonctionnalité est terminée si elle n’a pas été testée.

## Commandes

Commandes habituelles :

```bash
npm install
npm run dev
npm run build
npm run test
npm run preview
```

S’il existe un lint dans le projet, le lancer aussi :

```bash
npm run lint
```

Ne pas inventer le résultat des commandes. Si une commande n’a pas été lancée, le dire clairement.

## Données et compatibilité

Les données existantes doivent rester compatibles.

Points de vigilance :

- anciens projets sans lunes ;
- anciens projets avec `moons: []` ;
- flag `uiSettings.defaultMoonSystemInitialized` ;
- événements météo sans `enabled` ;
- événements météo sans `requireAllConditions` ;
- conditions météo invalides ;
- profils météo avec valeurs négatives ;
- import/export JSON ;
- packs JSON exportés puis réimportés.

Règles importantes :

- `enabled` absent sur un événement météo = actif ;
- `requireAllConditions` absent = toutes les conditions ;
- `conditions` absent ou vide = événement météo non déclenché ;
- `defaultMoonSystemInitialized: true` empêche de recréer la lune par défaut après suppression volontaire ;
- l’import de pack remplace le calendrier courant seulement après confirmation ;
- un pack invalide ne doit jamais remplacer le calendrier courant.

## Règles UX

L’interface doit rester :

- compacte ;
- lisible ;
- utilisable dans le popover OBR ;
- sans scroll horizontal ;
- stable en thème sombre ;
- compréhensible pour un MJ en pleine partie.

Pour les sections longues :

- utiliser des sections repliables ;
- préférer les sous-composants ;
- grouper les champs ;
- limiter les gros blocs de texte ;
- éviter de surcharger la vue Mois ;
- éviter de surcharger Aujourd’hui avec des informations non essentielles.

## Règles documentation

Quand une fonctionnalité importante est ajoutée ou modifiée, vérifier si un de ces fichiers doit être mis à jour :

- `PROJECT_CONTEXT.md`
- `docs/CALENDAR_SPEC.md`
- `docs/WEATHER_DESIGN.md`
- `docs/PACKS_DESIGN.md`
- `AGENTS.md`