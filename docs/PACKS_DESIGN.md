# Packs Design — Calendar OBR

## Statut actuel

Le MVP est terminé et validé.

## Objectif

Le système de packs permet de créer, importer, exporter et distribuer des calendriers prêts à l’emploi.

Ces packs pourront être proposés via Patreon ou partagés gratuitement.

Ils doivent permettre à un MJ d’importer rapidement :

- un calendrier complet ;
- des saisons ;
- des événements ;
- des événements météo ;
- des lunes ;
- des profils météo ;
- des paramètres météo ;
- ou un ensemble complet prêt à jouer.

## Important

Les packs Patreon avancés ne sont pas encore implémentés.

Non implémenté actuellement :

- marketplace ;
- authentification Patreon ;
- gestion de droits ;
- téléchargement distant ;
- packs distants par URL ;
- import partiel ;
- fusion intelligente ;
- mise à jour incrémentale d’un pack.

Le MVP possède toutefois une base solide :

- packs intégrés ;
- import local de pack JSON ;
- export du calendrier courant comme pack JSON ;
- validation des packs ;
- remplacement complet du calendrier courant après confirmation.

## Format actuel d’un CalendarPack

Le format utilisé actuellement est `CalendarPack`.

```ts
export type CalendarPack = {
  schemaVersion: number;
  packId: string;
  packVersion: string;
  name: string;
  description?: string;
  author?: string;
  locale: LocaleCode;
  project: CalendarProject;
};
```

Un pack contient donc un `CalendarProject` complet.

Cela signifie qu’un pack peut contenir :

- système de calendrier ;
- mois ;
- jours de semaine ;
- date et heure de départ ;
- événements ;
- saisons ;
- profils météo ;
- lunes ;
- paramètres météo ;
- événements météo ;
- paramètres UI utiles.

## Packs intégrés actuels

Les packs intégrés sont définis dans :

```txt
src/packs/defaultFantasyCalendarPack.ts
```

Packs disponibles :

- `fantasy-classic-fr`
  - nom : Calendrier fantasy classique ;
  - langue : français ;
  - contenu : calendrier fantasy générique avec saisons, lune principale et météo de base.

- `fantasy-classic-en`
  - nom : Classic fantasy calendar ;
  - langue : anglais ;
  - contenu : calendrier fantasy générique avec saisons, lune principale et météo de base.

Chaque pack intégré contient :

- 12 mois ;
- 7 jours de semaine ;
- 4 saisons ;
- profils météo de saison ;
- 1 lune principale ;
- événements météo de base ;
- paramètres météo.

## Sélection des packs par langue

La fonction :

```ts
getBuiltInCalendarPacks(locale)
```

retourne les packs intégrés correspondant à la langue demandée.

Comportement attendu :

- si `locale = "fr"` :
  - retourner les packs FR ;
- si `locale = "en"` :
  - retourner les packs EN ;
- si aucun pack n’existe dans la langue demandée :
  - utiliser un fallback FR.

Actuellement :

- l’interface FR voit `fantasy-classic-fr` ;
- l’interface EN voit `fantasy-classic-en` ;
- l’interface EN ne doit pas voir le pack FR tant qu’un pack EN existe.

## Logique des packs

La logique pure est dans :

```txt
src/packs/calendarPacks.ts
```

Fonctions principales :

```ts
getBuiltInCalendarPacks(locale)
validateCalendarPack(pack)
importCalendarPack(pack, currentProject)
createCalendarPackFromProject(project, metadata)
exportCalendarPack(pack)
getCalendarPackSummary(pack)
```

### getBuiltInCalendarPacks

Retourne les packs intégrés disponibles pour une langue.

### validateCalendarPack

Valide la structure du pack et le `CalendarProject` inclus.

Cette fonction vérifie notamment :

- `schemaVersion` ;
- `packId` ;
- `packVersion` ;
- `name` ;
- `locale` ;
- `description` si présent ;
- `author` si présent ;
- validité du projet inclus.

Le projet inclus est validé et assaini avec la logique existante de calendrier.

### importCalendarPack

Importe un pack valide.

Comportement :

- si le pack est valide :
  - retourne le projet du pack ;
- si le pack est invalide :
  - conserve le projet courant ;
  - retourne une erreur.

Important :

- l’import de pack remplace le calendrier courant ;
- il ne fait pas de fusion ;
- il ne fait pas d’import partiel.

### createCalendarPackFromProject

Crée un `CalendarPack` à partir du calendrier courant.

Métadonnées utilisées :

- `packId` ;
- `packVersion` ;
- `name` ;
- `description` ;
- `author`.

Règles :

- si `packId` est vide, générer un identifiant simple à partir du nom ;
- si `packVersion` est vide, utiliser `1.0.0` ;
- si `name` est vide, utiliser le nom du calendrier ;
- ne pas modifier le projet original ;
- cloner le projet dans le pack.

### exportCalendarPack

Convertit un pack en JSON formaté.

```ts
JSON.stringify(pack, null, 2)
```

### getCalendarPackSummary

Retourne un résumé simple :

- nombre de mois ;
- nombre de saisons ;
- nombre de lunes ;
- nombre d’événements météo.

Ce résumé est affiché dans l’interface.

## Interface Packs

L’interface est dans :

```txt
src/components/settings/PacksSettingsSection.tsx
```

Elle est accessible dans :

```txt
Paramètres > Packs
```

Fonctions disponibles :

- afficher les packs intégrés ;
- afficher nom, description, auteur, version ;
- afficher un résumé du contenu ;
- appliquer un pack intégré ;
- importer un pack JSON externe ;
- exporter le calendrier actuel comme pack JSON.

## Application d’un pack intégré

L’application d’un pack intégré doit :

- demander confirmation ;
- remplacer le calendrier courant si l’utilisateur confirme ;
- ne rien modifier si l’utilisateur annule ;
- afficher une erreur si le pack est invalide.

Texte attendu :

```txt
Appliquer ce pack remplacera le calendrier actuel de cette room. Continuer ?
```

En anglais :

```txt
Applying this pack will replace the current calendar for this room. Continue?
```

## Import d’un pack JSON externe

L’import de pack JSON externe utilise un fichier local `.json`.

Comportement :

1. L’utilisateur choisit un fichier.
2. Le fichier est lu.
3. Le JSON est parsé.
4. Le pack est validé avec `validateCalendarPack`.
5. Si le pack est valide :
   - afficher le pack sélectionné ;
   - demander confirmation ;
   - remplacer le calendrier courant si confirmé.
6. Si le pack est invalide :
   - afficher une erreur ;
   - ne pas modifier le calendrier courant.

Le fichier doit contenir un objet `CalendarPack`.

## Export du calendrier actuel comme pack JSON

L’export permet de transformer le calendrier courant en pack.

Champs demandés :

- ID du pack ;
- version du pack ;
- nom du pack ;
- description ;
- auteur.

Comportement :

1. Créer le pack avec `createCalendarPackFromProject`.
2. Valider le pack avec `validateCalendarPack`.
3. Exporter avec `exportCalendarPack`.
4. Télécharger le fichier JSON.

Nom de fichier actuel :

```txt
<packId>.json
```

Le JSON exporté doit être réimportable comme pack.

## Résumé de pack

`getCalendarPackSummary(pack)` retourne :

- nombre de mois ;
- nombre de saisons ;
- nombre de lunes ;
- nombre d’événements météo.

Ce résumé est affiché dans la section Packs.

## Tests

Les tests des packs sont dans :

```txt
src/packs/__tests__/calendarPacks.test.ts
```

Ils couvrent :

- disponibilité des packs intégrés ;
- filtrage FR/EN ;
- validité des packs intégrés ;
- rejet des packs invalides ;
- import valide remplaçant le projet ;
- import invalide conservant le projet courant ;
- résumé de pack ;
- création d’un pack depuis le projet courant ;
- absence de mutation du projet original ;
- génération de `packId` ;
- version par défaut ;
- export JSON ;
- revalidation du JSON exporté.

## Types de packs possibles à terme

Le système actuel utilise surtout des packs de calendrier complet.

À terme, on pourra prévoir plusieurs types de packs.

### Calendrier complet

Contient :

- système de calendrier ;
- mois ;
- jours de semaine ;
- date de départ optionnelle ;
- saisons ;
- lunes ;
- événements ;
- météo ;
- événements météo.

Utilisation :

- installer un calendrier complet pour une campagne.

### Pack de saisons

Contient uniquement :

- saisons ;
- profils météo saisonniers.

Utilisation :

- ajouter une météo saisonnière à un calendrier existant.

### Pack d’événements

Contient uniquement :

- événements ponctuels ;
- événements récurrents ;
- fêtes ;
- jours sacrés ;
- événements de campagne.

Utilisation :

- enrichir un calendrier existant.

### Pack météo

Contient :

- paramètres météo ;
- profils saisonniers ;
- événements météo conditionnels.

Utilisation :

- rendre une campagne plus vivante ou plus dangereuse.

### Pack lunaire

Contient :

- une ou plusieurs lunes ;
- cycles lunaires ;
- phases calculées ;
- événements liés aux lunes à terme.

Utilisation :

- ajouter une dimension mystique, religieuse ou occulte.

### Pack de campagne

Contient un ensemble cohérent :

- calendrier ;
- saisons ;
- lunes ;
- événements ;
- météo ;
- événements conditionnels ;
- notes éventuelles.

Utilisation :

- pack premium prêt à l’emploi.

## Modes d’import prévus à terme

Actuellement, seul le remplacement complet existe.

### Remplacer

Remplace le calendrier courant.

Statut :

- déjà fait pour les packs complets.

Doit toujours demander confirmation.

### Ajouter

Ajoute les nouvelles données aux données actuelles.

Statut :

- non implémenté.

Risque de doublons.

### Fusionner

Ajoute les nouvelles données, mais tente d’éviter les doublons via les identifiants.

Statut :

- non implémenté.

Peut être prévu en V2.

### Import sélectif

Permet de choisir quoi importer.

Exemple :

```txt
Ce pack contient :
[x] Calendrier
[x] Saisons
[ ] Événements
[x] Lunes
[ ] Événements météo
```

Statut :

- non implémenté.

## Identifiants

Chaque élément importable doit avoir un identifiant stable.

Exemples :

```txt
season-winter
season-spring
moon-main
event-spring-festival
weather-event-muddy-roads
```

Les identifiants permettent à terme :

- la fusion ;
- la détection de doublons ;
- les mises à jour futures ;
- une meilleure stabilité d’import/export.

## Schema version

Tous les exports et packs doivent inclure :

```json
"schemaVersion": 1
```

Cela permettra de migrer les données plus tard.

Exemple futur :

```ts
if (schemaVersion === 1) {
  migrateFromV1(data);
}
```

## App version et pack version

Les exports complets du calendrier utilisent :

```json
"appVersion": "0.1.0"
```

Les packs utilisent :

```json
"packVersion": "1.0.0"
```

## Sécurité d’import

L’import doit vérifier :

- que le JSON est valide ;
- que `schemaVersion` existe ;
- que `packId` existe ;
- que `packVersion` existe ;
- que `name` existe ;
- que `locale` est valide ;
- que le `CalendarProject` inclus est valide ;
- que les tableaux attendus sont bien des tableaux ;
- que les identifiants importants ne sont pas vides.

En cas d’erreur :

- afficher un message clair ;
- ne pas écraser les données existantes ;
- conserver le calendrier courant.

## Priorités post-MVP packs

### Priorité 1 — UX

- rendre la section Packs plus compacte si elle devient trop longue ;
- améliorer la distinction entre packs intégrés, import et export ;
- améliorer la prévisualisation avant import ;
- afficher plus clairement le contenu d’un pack.

### Priorité 2 — Contenu

- ajouter des packs intégrés supplémentaires ;
- préparer des packs JSON téléchargeables manuellement ;
- préparer des packs Patreon sans authentification intégrée ;
- créer des exemples FR/EN cohérents.

### Priorité 3 — Import partiel

- importer seulement les saisons ;
- importer seulement les événements ;
- importer seulement la météo ;
- importer seulement les lunes ;
- importer seulement les événements météo.

### Priorité 4 — Fusion

- fusionner les contenus par identifiants ;
- éviter les doublons ;
- proposer un aperçu des conflits ;
- permettre de remplacer ou conserver les éléments existants.

### Priorité 5 — Distribution avancée

Seulement plus tard :

- téléchargement distant ;
- index de packs ;
- marketplace ;
- authentification Patreon ;
- gestion de droits.

## Exemples de packs Patreon

Idées de packs possibles :

- Fantasy Classic Calendar ;
- Dark Winter Calendar ;
- Desert Survival Weather ;
- Maritime Campaign Weather ;
- Sacred Days & Festivals ;
- Occult Moon Cycles ;
- Dangerous Weather Events ;
- Medieval Rural Calendar ;
- Exploration Campaign Calendar ;
- Kingmaker-like Exploration Pack non officiel.

## Limites actuelles

Non implémenté actuellement :

- marketplace ;
- authentification Patreon ;
- gestion de droits ;
- téléchargement distant ;
- packs distants par URL ;
- import partiel ;
- fusion intelligente ;
- mise à jour incrémentale d’un pack ;
- tags de pack ;
- compatibilité minimum/maximum d’app ;
- aperçu détaillé de tous les contenus d’un pack.

## Évolutions futures possibles

Idées futures :

- importer seulement les saisons ;
- importer seulement les événements ;
- importer seulement la météo ;
- importer seulement les lunes ;
- fusionner les contenus par identifiants ;
- prévisualiser les mois/saisons/événements avant import ;
- ajouter des tags ;
- ajouter une compatibilité par version d’app ;
- proposer des packs Patreon téléchargeables manuellement ;
- proposer plus de packs intégrés gratuits.

## Philosophie des packs Patreon

Les packs ne doivent pas seulement être des fichiers techniques.

Ils doivent être présentés comme du contenu prêt à jouer.

Chaque pack devrait avoir :

- un nom clair ;
- une description utile ;
- un thème ;
- une langue ;
- une compatibilité ;
- un contenu compréhensible avant import.

Exemple de présentation Patreon :

> Pack météo d’exploration — routes boueuses, brouillards matinaux, crues soudaines, gel nocturne et tempêtes. Compatible avec le calendrier vivant OBR.

## Règle importante pour Codex

Ne pas implémenter tout le système de packs avancé maintenant.

Pour le post-MVP proche :

- garder l’import/export complet fiable ;
- garder la validation de pack ;
- garder l’import de pack comme remplacement complet ;
- garder l’export du calendrier courant comme pack JSON ;
- améliorer l’UX ;
- ajouter éventuellement des packs intégrés supplémentaires.

Ne pas coder sans demande explicite :

- import sélectif avancé ;
- fusion ;
- marketplace ;
- authentification Patreon ;
- téléchargement distant ;
- gestion de droits.
