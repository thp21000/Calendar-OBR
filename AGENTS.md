# Instructions pour Codex

Projet : addon Owlbear Rodeo de calendrier vivant pour MJ.

## Règles générales

- Ne pas implémenter plusieurs grosses fonctionnalités en même temps.
- Toujours lire PROJECT_CONTEXT.md et les fichiers du dossier docs avant de modifier le code.
- Préférer une architecture simple, claire et extensible.
- Séparer la logique métier de l’interface.
- Ne pas mélanger météo, événements, calendrier et stockage dans un seul gros fichier.
- Les fonctions de calcul de date doivent être pures et testables.
- Tout texte visible doit passer par l’i18n FR/EN.
- Les données exportées doivent inclure schemaVersion.
- Les données exportées doivent inclure appVersion.
- Préserver la compatibilité future avec les packs JSON Patreon.
- L’interface doit rester compacte et utilisable dans un popover Owlbear Rodeo.
- Ne pas coder la météo avancée, les packs Patreon complets ou la synchronisation OBR complète tant que le MVP calendrier n’est pas stable.

## Commandes

À compléter selon le projet :

- Installation : npm install
- Développement : npm run dev
- Build : npm run build
- Tests : npm test ou npm run test si disponible
- Lint : npm run lint si disponible

## Architecture souhaitée

Séparer clairement :

- logique calendrier ;
- logique de temps ;
- logique événements ;
- stockage ;
- import/export ;
- i18n ;
- composants UI ;
- futures fonctions météo ;
- futures fonctions lune ;
- futures fonctions packs.

Les fonctions de calcul de date doivent être placées dans des fichiers dédiés et être faciles à tester.

## Avant de terminer une tâche

- Vérifier que le build passe.
- Lancer les tests si disponibles.
- Résumer les fichiers créés.
- Résumer les fichiers modifiés.
- Expliquer les choix techniques importants.
- Signaler clairement ce qui n’a pas été fait.
- Ne pas prétendre qu’une fonctionnalité est terminée si elle n’a pas été testée.