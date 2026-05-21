# Weather Design — OBR Living Calendar

## Statut actuel

Le MVP est terminé et validé.

La météo n’est plus seulement un placeholder. Une première version fonctionnelle existe déjà.

Fonctions météo actuellement en place :

- profils météo par saison ;
- température min/moyenne/max ;
- vent min/moyenne/max ;
- pluie min/moyenne/max ;
- températures négatives autorisées ;
- vent et pluie forcés en non négatif ;
- unités FR/EN ;
- seed météo configurable ;
- météo actuelle déterministe ;
- prévisions horaires sur 5 h ;
- prévisions journalières sur 5 jours ;
- mode de prévision `fine` / `wide` ;
- événements météo configurables ;
- conditions météo sur température, vent et pluie ;
- opérateurs `gte` et `lte` ;
- affichage des événements météo actifs dans Aujourd’hui ;
- détection des alertes météo nouvellement déclenchées au passage du temps ;
- encart de synthèse des nouveaux déclenchements.

## Objectif

La météo doit donner au calendrier une sensation de monde vivant.

Elle doit être :

- crédible ;
- cohérente avec les saisons ;
- stable dans le temps ;
- lisible rapidement en partie ;
- utile pour le MJ ;
- optionnellement visible par les joueurs ;
- compatible avec des événements météo conditionnels.

Elle n’a pas besoin d’être scientifiquement parfaite.

Le but est de produire une météo de JDR agréable, compréhensible et exploitable.

## Principe central : météo déterministe

La météo ne doit pas être relancée au hasard à chaque ouverture de l’addon.

À date identique, avec la même graine météo, la météo doit rester identique.

Exemple :

- campagne : `Kingmaker` ;
- graine météo : `kingmaker-4710` ;
- jour absolu : `142` ;
- heure : `18`.

Le résultat météo doit être stable.

Cela permet au MJ de revenir à une date précédente ou de rouvrir l’addon sans incohérence.

## Données météo actuellement utilisées

La météo actuelle est représentée par un snapshot simple.

Champs actuellement importants :

- température ;
- vitesse du vent ;
- direction du vent ;
- pluie.

Les unités affichées dépendent de la langue :

- FR : °C, km/h, mm/h ;
- EN : °F, mi/h, in/h.

Les valeurs sont saisies dans les unités affichées. Il n’y a pas encore de conversion automatique entre systèmes d’unités.

## Profils météo de saison

Chaque saison fournit les bornes générales de la météo.

Profil actuel :

```ts
type SeasonWeatherProfile = {
  temperature: {
    min: number;
    average: number;
    max: number;
  };
  windSpeed: {
    min: number;
    average: number;
    max: number;
  };
  rain: {
    min: number;
    average: number;
    max: number;
  };
};
```

Règles actuelles :

- la température peut être négative ;
- le vent ne doit pas rester négatif ;
- la pluie ne doit pas rester négative ;
- les valeurs sont normalisées pour garantir `min <= average <= max`.

## Prévisions météo

L’addon distingue :

- la météo réelle simulée ;
- la météo prévue affichée.

La météo réelle peut être connue par le système.

La prévision affichée peut être plus ou moins précise.

### Mode fine

Le mode `fine` affiche une prévision proche de la météo réelle.

Utile pour :

- campagnes avec météo fiable ;
- magie de divination ;
- outils scientifiques ;
- MJ qui veulent donner des informations précises.

### Mode wide

Le mode `wide` affiche une tendance plus imprécise.

Utile pour :

- fantasy médiévale ;
- exploration ;
- incertitude narrative ;
- météo moins prévisible.

### Dégradation de la précision

Principe attendu :

- +1 h à +5 h : assez fiable ;
- +1 jour : tendance fiable ;
- +2 jours : valeurs approximatives ;
- +3 jours : fourchettes larges ;
- +4 à +5 jours : tendance générale seulement.

La logique actuelle existe déjà, mais peut être enrichie plus tard.

## Événements météo actuels

Les événements météo sont configurables dans les paramètres.

Structure conceptuelle actuelle :

```ts
type WeatherEvent = {
  id: string;
  name: string;
  icon?: string;
  summary?: string;
  link?: string;
  conditions: WeatherCondition[];
  requireAllConditions?: boolean;
  enabled?: boolean;
};
```

Conditions actuelles :

```ts
type WeatherCondition = {
  metric: "temperature" | "windSpeed" | "rain";
  operator: "gte" | "lte";
  value: number;
};
```

Règles :

- `enabled === false` désactive l’événement ;
- `enabled` absent est traité comme actif ;
- `requireAllConditions` absent est traité comme `true` ;
- un événement sans condition ne se déclenche pas.

## Affichage actuel

Dans Aujourd’hui, l’addon affiche :

- météo actuelle ;
- prévisions 5 h ;
- prévisions 5 jours ;
- événements météo actifs ;
- alertes météo nouvellement déclenchées ;
- synthèse des nouveaux déclenchements.

Différence importante :

- événements météo actifs : conditions vraies maintenant ;
- alertes météo déclenchées : événements devenus actifs entre deux moments lors du passage du temps.

## Couches de simulation futures

La météo devrait évoluer en plusieurs couches.

### 1. Saison

Déjà partiellement fait.

La saison donne les bornes générales :

- température minimale ;
- température moyenne ;
- température maximale ;
- vent minimal ;
- vent moyen ;
- vent maximal ;
- pluie minimale ;
- pluie moyenne ;
- pluie maximale.

### 2. Tendance météo

À faire plus tard.

Une tendance dure plusieurs jours.

Exemples :

- période froide ;
- période chaude ;
- période humide ;
- période sèche ;
- vents forts ;
- temps calme ;
- temps instable.

La durée de la tendance dépendra d’une future notion de stabilité météo.

### 3. État météo du jour

À faire plus tard.

Chaque jour pourrait recevoir une météo dominante.

Exemples :

- clair ;
- nuageux ;
- couvert ;
- brouillard ;
- pluie faible ;
- pluie forte ;
- orage ;
- neige ;
- vent fort ;
- tempête.

### 4. Variation horaire

À améliorer plus tard.

La température devrait généralement :

- être plus basse la nuit ;
- monter le matin ;
- atteindre un maximum en après-midi ;
- redescendre le soir.

Le vent doit varier sans changer brutalement de direction toutes les heures.

La pluie peut être continue ou fonctionner par épisodes.

### 5. Événements météo avancés

À enrichir plus tard.

Après génération, le système vérifie si certains événements météo conditionnels doivent être déclenchés.

Exemples :

- routes boueuses ;
- crue ;
- brouillard dangereux ;
- gel nocturne ;
- tempête ;
- canicule ;
- neige abondante.

## États météo futurs

États météo recommandés :

```ts
type WeatherState =
  | "clear"
  | "cloudy"
  | "overcast"
  | "fog"
  | "lightRain"
  | "heavyRain"
  | "storm"
  | "snow"
  | "strongWind"
  | "tempest";
```

Ces états ne sont pas encore pleinement implémentés.

Priorité future : les ajouter seulement si l’UI reste lisible et si les événements météo en profitent réellement.

## Direction du vent

Directions actuelles ou prévues :

```ts
type WindDirection =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";
```

La direction existe déjà dans la météo.

Amélioration future :

- stabiliser la direction sur plusieurs heures ;
- afficher une icône ou flèche plus lisible ;
- éviter les changements trop brusques.

## Pluie et cumul 24 h

Actuellement, la pluie est simple.

À terme, il faut distinguer :

### Pluie actuelle

Ce qui tombe maintenant.

Exemple :

```txt
Pluie actuelle : 2 mm/h
```

### Cumul de pluie sur 24 h

Ce qui est tombé récemment.

Exemple :

```txt
Cumul 24 h : 14 mm
```

Le cumul sur 24 h sera essentiel pour les événements météo avancés :

- pluie 24 h >= 8 mm : routes boueuses ;
- pluie 24 h >= 20 mm : crue locale ;
- pluie forte + vent fort : tempête dangereuse.

## Événements météo avancés

Les événements météo existent déjà, mais leur modèle reste volontairement simple.

Évolutions futures possibles :

```ts
type WeatherEvent = {
  id: string;
  name: string;
  icon?: string;
  summary: string;
  gmDescription?: string;
  playerDescription?: string;
  link?: string;
  conditionsMode: "all" | "any";
  conditions: WeatherCondition[];
  durationHours: number;
  cooldownHours: number;
  visibility: "gm" | "players" | "revealOnTrigger";
  notifyOnTrigger: boolean;
  enabled: boolean;
};
```

Champs à ajouter plus tard si nécessaire :

- durée ;
- cooldown ;
- visibilité joueur ;
- description MJ ;
- description joueur ;
- notification ;
- statut actif/terminé ;
- historique de déclenchement.

## Conditions futures possibles

Conditions actuelles :

- température ;
- vent ;
- pluie ;
- supérieur ou égal ;
- inférieur ou égal.

Conditions futures possibles :

```ts
type WeatherCondition =
  | TemperatureCondition
  | WindCondition
  | RainCondition
  | RainTotalCondition
  | WeatherStateCondition
  | SeasonCondition
  | TimeOfDayCondition
  | MoonPhaseCondition;
```

Exemples :

```ts
{
  type: "temperature",
  operator: "<=",
  value: 0
}
```

```ts
{
  type: "rainTotal24h",
  operator: ">=",
  value: 8
}
```

```ts
{
  type: "windSpeed",
  operator: ">=",
  value: 50
}
```

```ts
{
  type: "weatherState",
  operator: "is",
  value: "fog"
}
```

## Exemples d’événements météo futurs

### Routes boueuses

Condition :

- pluie cumulée sur 24 h >= 8 mm.

Effet narratif :

- les chemins deviennent lourds ;
- les déplacements peuvent être ralentis.

### Crue soudaine

Condition :

- pluie cumulée sur 24 h >= 20 mm ;
- ou pluie forte pendant plusieurs heures.

Effet narratif :

- gué dangereux ;
- rivière plus difficile à traverser.

### Gel nocturne

Condition :

- température <= 0 °C ;
- période de nuit.

Effet narratif :

- sol glissant ;
- eau gelée ;
- campement inconfortable.

### Brouillard de vallée

Condition :

- matin ;
- humidité ou pluie récente ;
- température basse ou douce.

Effet narratif :

- visibilité réduite ;
- embuscades facilitées.

### Tempête

Condition :

- vent >= 60 km/h ;
- pluie forte ou orage.

Effet narratif :

- voyage dangereux ;
- vol difficile ;
- bruit important ;
- visibilité réduite.

## Priorités post-MVP météo

### Priorité 1 — UX météo

- rendre la météo actuelle plus lisible ;
- améliorer la présentation des prévisions ;
- éviter la surcharge dans Aujourd’hui ;
- ajouter éventuellement de petites icônes météo simples.

### Priorité 2 — Cumul et états météo

- ajouter un état météo simple ;
- ajouter pluie actuelle vs cumul 24 h ;
- ajouter min/max journaliers ;
- améliorer la cohérence jour/nuit.

### Priorité 3 — Événements météo avancés

- ajouter durée ;
- ajouter cooldown ;
- ajouter conditions sur état météo ;
- ajouter conditions sur saison ;
- ajouter conditions sur période de journée ;
- ajouter conditions sur phase lunaire si les événements lunaires deviennent utiles.

### Priorité 4 — Vue joueur et synchronisation

- décider quelles informations météo sont visibles par les joueurs ;
- synchroniser la météo actuelle si une vue joueur est ajoutée ;
- éviter d’exposer les événements météo secrets.

## Ce qui n’est pas prioritaire

Ne pas prioriser maintenant :

- météo scientifique avancée ;
- pression atmosphérique ;
- humidité détaillée ;
- biomes ;
- altitude ;
- cartes météo ;
- modèle régional complexe ;
- IA ou génération narrative longue ;
- marketplace météo ;
- effets mécaniques système-spécifiques.

## Règle importante pour le développement

Ne pas mélanger toute la météo avec les composants UI.

Prévoir ou conserver des fonctions séparées :

- génération météo ;
- météo actuelle ;
- prévisions ;
- unités ;
- formatage ;
- événements météo ;
- évaluation des conditions.

Fichiers actuels principaux :

```txt
src/calendar/weatherLogic.ts
src/calendar/weatherUnits.ts
src/calendar/weatherEventsLogic.ts
src/calendar/seasonsLogic.ts
src/components/settings/WeatherSettingsSection.tsx
src/components/settings/WeatherEventsSettingsSection.tsx
src/components/today/WeatherAndSeasonCard.tsx
```

Toute logique météo pure doit être testée.

## Critères avant de considérer une amélioration météo comme terminée

Pour toute amélioration météo :

- `npm run build` passe ;
- `npm run test` passe ;
- les valeurs sont déterministes ;
- les anciennes sauvegardes ne cassent pas ;
- l’import/export JSON conserve les nouvelles données ;
- les packs restent valides ;
- les textes visibles passent par l’i18n ;
- l’UI reste utilisable dans le popover.
