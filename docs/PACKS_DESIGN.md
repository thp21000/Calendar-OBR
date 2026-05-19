# Packs Design — OBR Living Calendar

## Objectif

Le projet doit permettre de créer et distribuer des packs prêts à l’emploi.

Ces packs pourront être proposés via Patreon ou partagés gratuitement.

Ils doivent permettre à un MJ d’importer rapidement :

- un calendrier complet ;
- des saisons ;
- des événements ;
- des événements météo ;
- des lunes ;
- des profils météo ;
- ou un ensemble complet prêt à jouer.

## Important

Les packs Patreon ne sont PAS à implémenter complètement dans le MVP.

Cependant, la structure JSON du projet doit être pensée dès le début pour ne pas bloquer cette fonctionnalité plus tard.

Le MVP doit surtout avoir un import/export JSON propre et fiable.

## Types de packs possibles

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
- phases ;
- événements liés aux lunes.

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

## Structure générale d’un pack

Un pack doit contenir des métadonnées claires.

Exemple conceptuel :

```json
{
  "packType": "calendar-pack",
  "schemaVersion": 1,
  "packVersion": "1.0.0",
  "name": "Fantasy Classic Calendar",
  "author": "GM Tools & Resources",
  "description": "Calendrier fantasy générique avec saisons, lunes et événements.",
  "language": "fr",
  "compatibility": {
    "minimumAppVersion": "0.1.0",
    "maximumSchemaVersion": 1
  },
  "content": {
    "calendarSystem": {},
    "seasons": [],
    "moons": [],
    "events": [],
    "weatherSettings": {},
    "weatherEvents": []
  }
}
```

## Types de packs

Prévoir une valeur `packType`.

Valeurs possibles :

```ts
type CalendarPackType =
  | "full-calendar"
  | "calendar-system"
  | "seasons"
  | "events"
  | "weather"
  | "weather-events"
  | "moons"
  | "campaign-pack";
```

## Métadonnées recommandées

```ts
type CalendarPackMetadata = {
  packType: CalendarPackType;
  schemaVersion: number;
  packVersion: string;
  name: string;
  author: string;
  description: string;
  language: "fr" | "en" | "multi";
  tags?: string[];
  compatibility: {
    minimumAppVersion?: string;
    maximumSchemaVersion?: number;
  };
};
```

## Contenu du pack

```ts
type CalendarPackContent = {
  calendarSystem?: CalendarSystem;
  seasons?: Season[];
  moons?: Moon[];
  events?: CalendarEvent[];
  weatherSettings?: WeatherSettings;
  weatherEvents?: WeatherEvent[];
};
```

## Modes d’import prévus

L’utilisateur doit pouvoir choisir comment importer un pack.

### Remplacer

Remplace les données existantes.

À utiliser avec prudence.

Doit demander confirmation.

### Ajouter

Ajoute les nouvelles données aux données actuelles.

Risque de doublons.

### Fusionner

Ajoute les nouvelles données, mais tente d’éviter les doublons via les identifiants.

Plus avancé.

Peut être prévu en V2.

### Créer un nouveau calendrier

Crée un calendrier séparé à partir du pack.

Très utile pour les packs complets.

## Import sélectif

À prévoir pour V2.

Lorsqu’un pack contient plusieurs types de données, le MJ doit pouvoir choisir :

- importer le calendrier ;
- importer les saisons ;
- importer les événements ;
- importer les lunes ;
- importer les événements météo ;
- importer la configuration météo.

Exemple :

```txt
Ce pack contient :
[x] Calendrier
[x] Saisons
[ ] Événements
[x] Lunes
[ ] Événements météo
```

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

Les identifiants permettent :

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

## App version

Les exports complets du calendrier doivent aussi inclure :

```json
"appVersion": "0.1.0"
```

Pour les packs, utiliser :

```json
"packVersion": "1.0.0"
```

## Sécurité d’import

L’import doit vérifier :

- que le JSON est valide ;
- que schemaVersion existe ;
- que le type de pack est reconnu ;
- que les données principales sont présentes ;
- que les tableaux attendus sont bien des tableaux ;
- que les identifiants ne sont pas vides.

En cas d’erreur, afficher un message clair.

Ne pas écraser les données existantes si l’import échoue.

## Exports du MVP

Dans le MVP, priorité à :

- export calendrier complet ;
- import calendrier complet.

Le format doit déjà contenir des sections vides ou optionnelles pour les futures fonctionnalités :

```json
{
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "id": "calendar-id",
  "name": "Calendrier de campagne",
  "calendarSystem": {},
  "currentTime": {},
  "events": [],
  "seasons": [],
  "moons": [],
  "weatherSettings": {},
  "weatherEvents": [],
  "uiSettings": {}
}
```

Même si seasons, moons, weatherSettings et weatherEvents ne sont pas encore utilisés, leur présence ou leur prise en charge optionnelle aidera pour la V1.

## Exports V1

En V1, ajouter :

- export saisons ;
- import saisons ;
- export lune ;
- import lune ;
- export météo ;
- import météo.

## Exports V1.5

En V1.5, ajouter :

- export événements météo ;
- import événements météo ;
- export événements lunaires ;
- import événements lunaires.

## Exports V2

En V2, ajouter :

- packs complets ;
- import sélectif ;
- fusion intelligente ;
- prévisualisation du contenu du pack ;
- affichage du nom, auteur, version et description du pack.

## Exemple de pack simple : saisons

```json
{
  "packType": "seasons",
  "schemaVersion": 1,
  "packVersion": "1.0.0",
  "name": "Saisons fantasy tempérées",
  "author": "GM Tools & Resources",
  "description": "Quatre saisons tempérées pour une campagne fantasy classique.",
  "language": "fr",
  "compatibility": {
    "minimumAppVersion": "0.1.0",
    "maximumSchemaVersion": 1
  },
  "content": {
    "seasons": [
      {
        "id": "spring",
        "name": "Printemps",
        "icon": "🌱"
      },
      {
        "id": "summer",
        "name": "Été",
        "icon": "☀️"
      },
      {
        "id": "autumn",
        "name": "Automne",
        "icon": "🍂"
      },
      {
        "id": "winter",
        "name": "Hiver",
        "icon": "❄️"
      }
    ]
  }
}
```

## Exemple de pack simple : événements météo

```json
{
  "packType": "weather-events",
  "schemaVersion": 1,
  "packVersion": "1.0.0",
  "name": "Événements météo dangereux",
  "author": "GM Tools & Resources",
  "description": "Événements conditionnels pour rendre la météo plus utile en exploration.",
  "language": "fr",
  "compatibility": {
    "minimumAppVersion": "0.1.0",
    "maximumSchemaVersion": 1
  },
  "content": {
    "weatherEvents": [
      {
        "id": "muddy-roads",
        "name": "Routes boueuses",
        "icon": "🌧️",
        "summary": "Les chemins deviennent lourds et collants."
      },
      {
        "id": "sudden-flood",
        "name": "Crue soudaine",
        "icon": "🌊",
        "summary": "Les eaux montent rapidement."
      }
    ]
  }
}
```

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

Ne pas implémenter tout le système de packs dès le MVP.

Pour le MVP :

- créer un export/import complet fiable ;
- prévoir schemaVersion ;
- prévoir des champs optionnels pour les futures données ;
- ne pas coder l’import sélectif avancé maintenant.

Pour la V2 :

- ajouter les vrais packs ;
- ajouter la prévisualisation ;
- ajouter la fusion ;
- ajouter l’import sélectif.