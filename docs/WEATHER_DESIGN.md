# Weather Design — OBR Living Calendar

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

## Important

La météo avancée n’est PAS à implémenter dans le MVP.

Le MVP peut seulement prévoir les structures nécessaires ou afficher des placeholders.

La météo réelle commence en V1.

Les événements météo conditionnels commencent en V1.5.

## Principe central : météo déterministe

La météo ne doit pas être relancée au hasard à chaque ouverture de l’addon.

À date identique, avec la même graine météo, la météo doit rester identique.

Exemple :

- campagne : “Kingmaker” ;
- graine météo : “kingmaker-4710” ;
- jour absolu : 142 ;
- heure : 18.

Le résultat météo doit être stable.

Cela permet au MJ de revenir à une date précédente ou de rouvrir l’addon sans incohérence.

## Données de base d’une saison

Chaque saison doit fournir les limites générales de la météo.

Exemple de structure :

```ts
type SeasonWeatherProfile = {
  temperature: {
    min: number;
    average: number;
    max: number;
  };
  wind: {
    min: number;
    average: number;
    max: number;
  };
  rain: {
    min: number;
    average: number;
    max: number;
  };
  rainChance: number;
  weatherStability: WeatherStability;
};
```

## Stabilité météo

La stabilité météo sert à éviter que le temps change trop brutalement.

Valeurs possibles :

```ts
type WeatherStability =
  | "veryUnstable"
  | "unstable"
  | "normal"
  | "stable"
  | "veryStable";
```

Effet attendu :

- très instable : changements fréquents ;
- instable : météo variable ;
- normale : comportement équilibré ;
- stable : météo qui dure plusieurs jours ;
- très stable : longues périodes similaires.

## Couches de simulation

La météo devrait être générée en plusieurs couches.

### 1. Saison

La saison donne les bornes générales :

- température minimale ;
- température moyenne ;
- température maximale ;
- vent minimal ;
- vent moyen ;
- vent maximal ;
- pluie minimale ;
- pluie moyenne ;
- pluie maximale ;
- chance de pluie ;
- stabilité météo.

### 2. Tendance météo

Une tendance dure plusieurs jours.

Exemples :

- période froide ;
- période chaude ;
- période humide ;
- période sèche ;
- vents forts ;
- temps calme ;
- temps instable.

La durée de la tendance dépend de la stabilité de la saison.

### 3. Météo du jour

Chaque jour reçoit une météo dominante.

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

L’heure modifie les valeurs.

La température devrait généralement :

- être plus basse la nuit ;
- monter le matin ;
- atteindre un maximum en après-midi ;
- redescendre le soir.

Le vent doit varier sans changer brutalement de direction toutes les heures.

La pluie peut être continue ou fonctionner par épisodes.

### 5. Événements météo

Après génération, le système vérifie si certains événements météo conditionnels doivent être déclenchés.

Exemples :

- routes boueuses ;
- crue ;
- brouillard dangereux ;
- gel nocturne ;
- tempête ;
- canicule ;
- neige abondante.

## États météo de base

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

## Données météo actuelles

La météo actuelle devrait contenir :

```ts
type CurrentWeather = {
  state: WeatherState;
  temperatureC: number;
  windSpeedKmh: number;
  windDirection: WindDirection;
  windGustKmh?: number;
  currentRainMm: number;
  rainTotal24hMm: number;
};
```

## Direction du vent

Directions possibles :

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

## Pluie

Il faut distinguer deux valeurs.

### Pluie actuelle

Ce qui tombe maintenant.

Exemple :

```txt
Pluie actuelle : 2 mm
```

### Cumul de pluie sur 24 h

Ce qui est tombé récemment.

Exemple :

```txt
Cumul 24 h : 14 mm
```

Le cumul sur 24 h est essentiel pour les événements météo.

Exemples :

- si pluie 24 h >= 8 mm : routes boueuses ;
- si pluie 24 h >= 20 mm : crue locale ;
- si pluie forte + vent fort : tempête dangereuse.

## Prévisions météo

L’addon doit distinguer :

- la météo réelle générée ;
- la météo prévue affichée.

La météo réelle peut être connue par le système.

La prévision affichée peut être plus ou moins précise.

## Modes de prévision

### Mode fin

Prévision proche de la météo réelle.

Utile pour :

- campagnes avec météo fiable ;
- magie de divination ;
- outils scientifiques ;
- MJ qui veulent donner des informations précises.

### Mode large

Prévision plus imprécise.

Utile pour :

- fantasy médiévale ;
- exploration ;
- incertitude narrative ;
- météo moins prévisible.

## Dégradation de la précision

Plus la prévision est lointaine, plus elle doit être incertaine.

Proposition :

```txt
+1 h à +5 h : assez fiable
+1 jour : tendance fiable
+2 jours : valeurs approximatives
+3 jours : fourchettes larges
+4 à +5 jours : tendance générale seulement
```

## Prévision 5 heures

Afficher :

- +1 h ;
- +2 h ;
- +3 h ;
- +4 h ;
- +5 h.

Chaque bloc contient :

- état météo ;
- température ;
- vent ;
- pluie.

## Prévision 5 jours

Afficher :

- +1 jour ;
- +2 jours ;
- +3 jours ;
- +4 jours ;
- +5 jours.

Chaque bloc contient :

- état dominant ;
- température minimale ;
- température maximale ;
- vent moyen ou maximal ;
- pluie estimée.

## Événements météo conditionnels

À implémenter en V1.5, pas en MVP.

Un événement météo est déclenché automatiquement si ses conditions sont remplies.

Exemple :

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

## Conditions possibles

```ts
type WeatherCondition =
  | TemperatureCondition
  | WindCondition
  | RainCondition
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

## Exemples d’événements météo

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

## Règle importante pour le développement

Ne pas mélanger toute la météo avec les composants UI.

Prévoir des fonctions séparées :

- génération météo ;
- calcul météo actuelle ;
- calcul météo journalière ;
- calcul prévision ;
- formatage d’affichage ;
- évaluation des événements météo.

Exemples de fichiers possibles :

```txt
src/weather/types.ts
src/weather/generateWeather.ts
src/weather/forecast.ts
src/weather/weatherEvents.ts
src/weather/formatWeather.ts
```

## Priorité V1

Pour la V1, se limiter à :

- saison actuelle ;
- météo actuelle ;
- température ;
- vent ;
- direction du vent ;
- pluie actuelle ;
- cumul pluie 24 h ;
- prévision 5 heures ;
- prévision 5 jours ;
- mode fin / large.

Ne pas ajouter immédiatement :

- altitude ;
- biome ;
- humidité ;
- pression atmosphérique ;
- cartes météo ;
- climat régional avancé.

Ces éléments peuvent venir en V2 ou plus tard.