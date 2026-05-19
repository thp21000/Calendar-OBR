# MVP Tasks — OBR Living Calendar

## Objectif du MVP

Le MVP doit poser une base propre pour l’addon calendrier.

Il ne doit pas implémenter toute la vision finale.

Le but est d’obtenir une version minimale mais utilisable, avec :

- calendrier personnalisable ;
- date actuelle ;
- heure actuelle ;
- boutons rapides de temps ;
- vue mensuelle ;
- événements simples ;
- import/export JSON ;
- i18n FR/EN ;
- stockage local.

## Hors scope du MVP

Ne pas coder maintenant :

- météo avancée ;
- prévisions météo ;
- événements météo conditionnels ;
- plusieurs lunes ;
- packs Patreon complets ;
- synchronisation OBR complète ;
- vue joueur complète ;
- biomes ;
- altitude ;
- régions climatiques ;
- journal de campagne.

Ces fonctionnalités doivent seulement être prévues dans l’architecture.

## Phase 1 — Socle technique

Créer les types principaux :

- CalendarProject ;
- CalendarSystem ;
- CalendarMonth ;
- CalendarWeekday ;
- CalendarCurrentTime ;
- CalendarEvent ;
- UiSettings.

Créer les fonctions de date :

- addMinutes ;
- addHours ;
- addDays ;
- absoluteDayToCalendarDate ;
- calendarDateToAbsoluteDay ;
- getCurrentMonth ;
- getWeekday ;
- getDaysInYear ;
- getMonthById.

Créer le stockage local :

- loadCalendarProject ;
- saveCalendarProject ;
- createDefaultCalendarProject ;
- exportCalendarProject ;
- importCalendarProject.

Préparer l’i18n :

- fr.ts ;
- en.ts ;
- système de traduction utilisé par l’interface.

## Phase 2 — Interface principale

Créer l’écran “Aujourd’hui”.

Il doit afficher :

- nom du calendrier ;
- date actuelle ;
- heure actuelle ;
- jour de semaine ;
- mois actuel ;
- année actuelle ;
- événements du jour ;
- placeholders pour saison, météo et lune si ces fonctions ne sont pas encore codées.

Ajouter les boutons rapides :

- -2 h ;
- -1 h ;
- -15 min ;
- -5 min ;
- +5 min ;
- +15 min ;
- +1 h ;
- +2 h ;
- pause longue +8 h.

Les boutons doivent gérer correctement :

- changement de minute ;
- changement d’heure ;
- changement de jour ;
- changement de mois ;
- changement d’année.

## Phase 3 — Vue mensuelle

Créer une vue calendrier mensuel simple.

Elle doit afficher :

- le mois actuel ;
- les jours du mois ;
- le jour actuel mis en évidence ;
- le jour de semaine si possible ;
- un marqueur si un événement existe ce jour-là.

Au clic sur un jour, afficher :

- date complète ;
- événements du jour ;
- bouton pour créer un événement ce jour-là.

## Phase 4 — Configuration minimale du calendrier

Créer un écran ou panneau de paramètres permettant au MJ de modifier :

- nom du calendrier ;
- année actuelle ;
- mois actuel ;
- jour actuel ;
- heure actuelle ;
- minute actuelle ;
- liste des mois ;
- nombre de jours par mois ;
- liste des jours de semaine.

Pour le MVP, l’interface peut rester simple.

Il faut privilégier la fiabilité plutôt que le design avancé.

## Phase 5 — Événements simples

Créer les événements ponctuels simples.

Champs nécessaires :

- id ;
- name ;
- icon ;
- date ;
- hour optionnelle ;
- minute optionnelle ;
- summary ;
- gmDescription optionnelle ;
- playerDescription optionnelle ;
- link optionnel ;
- visibility ;
- notifyOnTrigger ;
- deleteAfterTrigger ;
- archiveAfterTrigger ;
- status.

Créer les actions :

- créer un événement ;
- modifier un événement ;
- supprimer un événement ;
- afficher un événement dans la vue mensuelle ;
- afficher un événement dans le détail du jour.

## Phase 6 — Événements récurrents simples

Ajouter une première version des événements récurrents.

Types minimum :

- aucun ;
- tous les X jours ;
- tous les X mois ;
- tous les ans.

Ne pas coder immédiatement les récurrences complexes.

Ne pas coder encore les événements lunaires ou météo.

## Phase 7 — Notifications d’événements

Quand le temps avance, vérifier si un événement est atteint.

Si l’événement doit notifier :

- afficher une notification ;
- afficher son nom ;
- afficher son résumé ;
- permettre de voir le détail ;
- permettre d’ignorer ;
- permettre d’archiver si MJ.

Pour le MVP, une notification simple suffit.

## Phase 8 — Import/export JSON complet

Créer un export JSON complet du calendrier.

L’export doit inclure :

- schemaVersion ;
- appVersion ;
- id ;
- name ;
- locale ;
- units ;
- currentTime ;
- calendarSystem ;
- events ;
- seasons ;
- moons ;
- weatherSettings ;
- weatherEvents ;
- uiSettings.

Même si seasons, moons, weatherSettings et weatherEvents ne sont pas encore utilisés, ils doivent être acceptés comme champs optionnels ou vides pour préparer la suite.

Créer un import JSON complet.

L’import doit :

- vérifier que le JSON est valide ;
- vérifier schemaVersion ;
- éviter d’écraser les données si l’import échoue ;
- afficher une erreur claire si le fichier est invalide ;
- demander confirmation avant remplacement complet.

## Phase 9 — i18n FR/EN

Tout texte visible doit passer par l’i18n.

Prévoir au minimum :

- français ;
- anglais.

Le français peut être la langue par défaut.

Les clés doivent être organisées clairement :

- common ;
- calendar ;
- time ;
- events ;
- importExport ;
- settings ;
- errors.

## Phase 10 — Préparation future météo/lunes/packs

Ne pas coder les fonctionnalités avancées maintenant.

Mais prévoir les structures ou placeholders pour :

- seasons ;
- moons ;
- weatherSettings ;
- weatherEvents ;
- pack metadata future.

Le but est d’éviter une refonte lourde en V1 ou V2.

## Critères d’acceptation MVP

Le MVP est considéré comme réussi si :

- le MJ peut créer ou utiliser un calendrier par défaut ;
- le MJ peut définir des mois personnalisés ;
- le MJ peut définir le nombre de jours par mois ;
- le MJ peut définir les jours de semaine ;
- le MJ peut régler la date actuelle ;
- le MJ peut régler l’heure actuelle ;
- les boutons rapides modifient correctement le temps ;
- le passage jour/mois/année fonctionne ;
- la vue mensuelle affiche le bon mois ;
- le jour actuel est visible ;
- le MJ peut créer un événement ponctuel ;
- l’événement apparaît au bon jour ;
- l’export JSON fonctionne ;
- l’import JSON restaure correctement les données ;
- l’interface est utilisable dans un popover OBR ;
- l’interface existe en français et en anglais ;
- le build passe.

## Ordre de travail conseillé

1. Types principaux.
2. Moteur de date.
3. Stockage local.
4. i18n.
5. Interface Aujourd’hui.
6. Boutons rapides de temps.
7. Vue mensuelle.
8. Événements simples.
9. Import/export.
10. Nettoyage UX et tests.

## Règle importante

Ne pas essayer de coder tout le projet d’un coup.

Le MVP doit rester simple, stable et extensible.