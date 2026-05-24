# Weather Design — OBR Living Calendar

## Statut

Le MVP est terminé, testé, validé et figé.

La météo actuelle n’est plus un placeholder. Elle possède déjà une première base fonctionnelle :

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
- états météo simples ;
- événements météo configurables ;
- conditions météo sur température, vent et pluie ;
- opérateurs `gte` et `lte` ;
- affichage des événements météo actifs dans Aujourd’hui ;
- détection des alertes météo nouvellement déclenchées au passage du temps ;
- encart de synthèse des nouveaux déclenchements.

Le but de ce document est maintenant de définir une **météo v2 globale**, plus réaliste et plus utile en jeu, sans obliger le MJ à configurer chaque jour manuellement.

## Objectif général

La météo doit donner au calendrier une sensation de monde vivant.

Elle doit être :

- crédible ;
- cohérente avec les saisons ;
- stable dans le temps ;
- lisible rapidement en partie ;
- utile pour le MJ ;
- partiellement visible par les joueurs ;
- exploitable par des événements météo conditionnels ;
- simple à paramétrer.

Elle n’a pas besoin d’être scientifiquement parfaite.

Le but est de produire une météo de JDR agréable, compréhensible et exploitable.

## Principe fondamental : le MJ configure les saisons, pas les jours

Le MJ ne doit jamais avoir à paramétrer chaque jour de météo.

La bonne logique est :

- la saison décrit le climat général ;
- le moteur génère automatiquement les tendances ;
- le moteur génère automatiquement la météo dominante du jour ;
- le moteur génère automatiquement les variations horaires ;
- le résultat reste déterministe grâce au seed.

Le MJ configure donc des profils saisonniers, pas un calendrier météorologique jour par jour.

Exemple :

- hiver : froid, humide, vent moyen ;
- printemps : doux, pluvieux, instable ;
- été : chaud, sec, orages rares ;
- automne : frais, venteux, pluie fréquente.

Le moteur transforme ensuite ces paramètres en journées météo cohérentes.

## Principe central : météo déterministe

La météo ne doit pas être relancée au hasard à chaque ouverture de l’addon.

À date identique, avec la même graine météo, le résultat météo doit rester identique.

Exemple :

- campagne : `Kingmaker` ;
- graine météo : `kingmaker-4710` ;
- jour absolu : `142` ;
- heure : `18`.

Le résultat météo doit rester stable.

Cela permet au MJ de revenir à une date précédente, de rouvrir l’addon, ou de synchroniser les joueurs sans incohérence.

## Données météo actuelles

La météo actuelle est représentée par un snapshot simple.

Champs actuels importants :

- température ;
- vitesse du vent ;
- direction du vent ;
- pluie actuelle ;
- état météo.

Les unités affichées dépendent de la langue :

- FR : °C, km/h, mm/h ;
- EN : °F, mi/h, in/h.

Les valeurs sont saisies dans les unités affichées. Il n’y a pas encore de conversion automatique entre systèmes d’unités.

## Profils météo de saison actuels

Chaque saison fournit les bornes générales de météo.

Structure actuelle :

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

La météo v2 phase 1 ajoute des **traits avancés optionnels** au profil saisonnier :

- `stability`
- `precipitationChance`
- `stormChance`
- `fogChance`
- `temperatureSwing`
- `windVariability`

Ces champs restent optionnels pour préserver la compatibilité des anciens calendriers.
S’ils sont absents, le moteur les déduit automatiquement à partir des valeurs min/moyenne/max de la saison.

Règles actuelles :

- la température peut être négative ;
- le vent ne doit pas rester négatif ;
- la pluie ne doit pas rester négative ;
- les valeurs doivent garantir `min <= average <= max`.

Cette structure reste la base de la météo v2.

## Modèle cible météo v2

La météo v2 doit fonctionner en couches.

Ordre logique :

1. Saison.
2. Tendance météo sur plusieurs jours.
3. Résumé météo journalier.
4. État météo dominant du jour.
5. Variation horaire.
6. Snapshot météo actuel.
7. Événements météo conditionnels.
8. Affichage MJ / joueur.

La génération doit rester automatique et déterministe.

## Couche 1 — Saison

La saison reste la source principale de la météo.

Elle définit le climat général avec :

- température minimale ;
- température moyenne ;
- température maximale ;
- vent minimal ;
- vent moyen ;
- vent maximal ;
- pluie minimale ;
- pluie moyenne ;
- pluie maximale.

À terme, on pourra ajouter des paramètres avancés optionnels.

Exemple de modèle futur possible :

```ts
type SeasonWeatherProfile = {
  temperature: { min: number; average: number; max: number };
  windSpeed: { min: number; average: number; max: number };
  rain: { min: number; average: number; max: number };

  stability?: number;
  precipitationChance?: number;
  stormChance?: number;
  fogChance?: number;
};
```

Ces nouveaux paramètres doivent rester optionnels.

Si absents, ils peuvent être déduits automatiquement :

- forte pluie moyenne = plus grande chance de pluie ;
- grand écart pluie min/max = météo plus instable ;
- vent max élevé = plus grande chance de tempête ;
- température basse + pluie = plus grande chance de neige ;
- vent faible + pluie récente + matin = plus grande chance de brouillard.

## Couche 2 — Tendance météo

Une tendance météo représente une période de plusieurs jours.

Exemples :

- période froide ;
- période chaude ;
- période humide ;
- période sèche ;
- vents forts ;
- temps calme ;
- temps instable ;
- temps stable.

La tendance ne doit pas être stockée jour par jour.

Elle doit être recalculée de façon déterministe à partir de :

- seed météo ;
- identifiant de campagne/projet ;
- saison ;
- jour absolu ;
- bloc de tendance.

La durée d’une tendance peut dépendre d’une valeur de stabilité.

Exemple :

- saison très stable : tendances de 5 à 10 jours ;
- saison instable : tendances de 2 à 4 jours.

La tendance influence ensuite :

- température du jour ;
- pluie du jour ;
- vent du jour ;
- probabilité d’orage ;
- probabilité de brouillard ;
- état météo dominant.

## Couche 3 — Résumé météo journalier

Chaque jour doit avoir un résumé météo journalier calculé automatiquement.

Ce résumé doit être déterministe et cohérent avec la saison et la tendance.

Champs recommandés :

```ts
type DailyWeatherSummary = {
  absoluteDay: number;
  minTemperature: number;
  maxTemperature: number;
  averageTemperature: number;
  rainTotal24h: number;
  maxWindSpeed: number;
  dominantWindDirection: WindDirection;
  dominantState: WeatherState;
};
```

Objectifs :

- avoir une température min/max du jour ;
- distinguer pluie actuelle et cumul sur 24 h ;
- savoir si le jour est globalement clair, pluvieux, neigeux, orageux, etc. ;
- donner des données utiles aux événements météo avancés.

Exemples d’usage :

- routes boueuses si pluie 24 h >= 8 mm ;
- crue si pluie 24 h >= 20 mm ;
- gel nocturne si température minimale <= 0 °C ;
- canicule si température maximale >= seuil élevé ;
- tempête si vent max élevé + pluie forte.

## Couche 4 — État météo dominant du jour

Chaque jour doit recevoir un état dominant.

États disponibles :

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

Ces états existent déjà dans le type météo.

La v2 doit les utiliser comme une vraie couche de simulation, pas seulement comme un résultat de seuil horaire.

Exemples de règles attendues :

- pluie faible dominante si pluie modérée sur plusieurs heures ;
- pluie forte si pluie importante ;
- orage si pluie forte + instabilité + vent ;
- neige si température basse + précipitations ;
- brouillard si matin + vent faible + pluie récente ou humidité ;
- tempête si vent très fort + pluie forte ;
- clair si peu de pluie, vent modéré, stabilité élevée ;
- couvert si faible pluie ou humidité sans vraie précipitation.

## Couche 5 — Variation horaire

La météo horaire doit être générée à partir du résumé journalier.

Elle ne doit pas ressembler à une suite de jets indépendants.

### Température

La température doit suivre une courbe crédible :

- minimum pendant la nuit ou au petit matin ;
- montée progressive le matin ;
- maximum en début ou milieu d’après-midi ;
- baisse progressive le soir.

La courbe peut rester simple.

Exemple :

- 05 h : proche du minimum ;
- 14 h ou 15 h : proche du maximum ;
- nuit : basse ;
- journée : plus chaude.

La tendance et l’état météo peuvent influencer la courbe :

- ciel couvert = moins d’écart jour/nuit ;
- ciel clair = plus grand écart jour/nuit ;
- pluie = température plus stable ;
- neige = température basse.

### Pluie

La pluie doit distinguer :

- pluie actuelle ;
- cumul sur 24 h.

La pluie actuelle représente ce qui tombe maintenant.

Le cumul 24 h représente ce qui est tombé sur la journée ou les dernières 24 h selon la logique retenue.

Pour la v2, on peut commencer par un cumul journalier simple.

La pluie ne doit pas être répartie uniformément sur toutes les heures.

Elle peut être répartie par épisodes :

- pluie faible continue ;
- averse courte ;
- pluie forte pendant quelques heures ;
- orage ponctuel ;
- neige pendant une partie de la journée.

### Vent

Le vent doit varier sans changer brutalement.

Direction du vent actuelle :

```ts
type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
```

La direction dominante peut être choisie par jour.

Puis, heure par heure, elle peut varier légèrement :

- même direction ;
- direction adjacente ;
- rarement changement plus fort.

La vitesse du vent peut varier autour d’une valeur journalière, avec des pics.

## Couche 6 — Snapshot météo actuel

Le snapshot météo actuel reste la donnée utilisée par l’interface.

Structure cible :

```ts
type WeatherSnapshot = {
  temperature: number;
  windSpeed: number;
  windDirection: WindDirection;
  rain: number;
  state: WeatherState;
  dailyMinTemperature?: number;
  dailyMaxTemperature?: number;
  dailyRainTotal?: number;
  dominantState?: WeatherState;
};
```

Les nouveaux champs doivent être optionnels pour ne pas casser les anciennes sauvegardes.

Le snapshot actuel doit continuer à fonctionner même si les nouveaux champs sont absents.

## Prévisions météo

L’addon distingue déjà :

- météo réelle simulée ;
- météo prévue affichée.

Cette distinction doit rester.

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

La météo réelle reste déterministe.

La prévision affichée peut introduire une erreur déterministe.

## Événements météo actuels

Les événements météo actuels sont configurables dans les paramètres.

Structure actuelle conceptuelle :

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

Règles actuelles :

- `enabled === false` désactive l’événement ;
- `enabled` absent est traité comme actif ;
- `requireAllConditions` absent est traité comme `true` ;
- un événement sans condition ne se déclenche pas.

Ces règles doivent rester compatibles.

## Événements météo avancés

Une fois la météo journalière et les états mieux définis, les événements météo doivent être enrichis.

Structure future possible :

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

Champs à ajouter progressivement :

- durée ;
- cooldown ;
- visibilité joueur ;
- description MJ ;
- description joueur ;
- notification ;
- statut actif/terminé ;
- historique léger des déclenchements.

Ne pas tout ajouter en une seule étape si cela rend le code instable.

## Conditions météo avancées

Conditions actuelles :

- température ;
- vent ;
- pluie actuelle ;
- supérieur ou égal ;
- inférieur ou égal.

Conditions futures possibles :

```ts
type WeatherConditionMetric =
  | "temperature"
  | "windSpeed"
  | "rain"
  | "rainTotal24h"
  | "weatherState"
  | "dominantWeatherState"
  | "season"
  | "timeOfDay"
  | "moonPhase";
```

Exemples :

```txt
temperature <= 0
rainTotal24h >= 8
windSpeed >= 50
weatherState is fog
dominantWeatherState is snow
season is winter
timeOfDay is night
moonPhase is full
```

La priorité est :

1. `rainTotal24h`
2. `weatherState`
3. `season`
4. `timeOfDay`
5. `moonPhase`

## Exemples d’événements météo avancés

### Routes boueuses

Conditions possibles :

- pluie cumulée sur 24 h >= 8 mm.

Effet narratif :

- chemins lourds ;
- déplacements ralentis ;
- traces plus visibles ;
- chariots plus difficiles à manœuvrer.

### Crue locale

Conditions possibles :

- pluie cumulée sur 24 h >= 20 mm ;
- ou pluie forte pendant plusieurs heures.

Effet narratif :

- gué dangereux ;
- rivière plus difficile à traverser ;
- risque d’isolement ;
- ponts fragilisés.

### Gel nocturne

Conditions possibles :

- température minimale <= 0 °C ;
- période de nuit ou matin.

Effet narratif :

- sol glissant ;
- eau gelée ;
- campement inconfortable ;
- traces figées.

### Brouillard de vallée

Conditions possibles :

- matin ;
- vent faible ;
- pluie récente ou cumul 24 h > 0 ;
- température basse ou douce.

Effet narratif :

- visibilité réduite ;
- embuscades facilitées ;
- navigation plus difficile.

### Tempête

Conditions possibles :

- vent >= 60 km/h ;
- pluie forte ou orage.

Effet narratif :

- voyage dangereux ;
- vol difficile ;
- bruit important ;
- visibilité réduite ;
- risque de dégâts matériels.

### Canicule

Conditions possibles :

- température maximale >= seuil élevé ;
- plusieurs jours chauds consécutifs si les tendances sont disponibles.

Effet narratif :

- fatigue ;
- eau plus importante ;
- animaux ralentis ;
- incendies plus probables.

### Neige abondante

Conditions possibles :

- état météo snow ;
- température <= 1 °C ;
- cumul de précipitation élevé.

Effet narratif :

- routes bloquées ;
- traces visibles ;
- déplacements ralentis ;
- froid dangereux.

## Affichage MJ

Dans Aujourd’hui, l’addon doit afficher clairement :

- météo actuelle ;
- état météo actuel ;
- température actuelle ;
- vent actuel ;
- pluie actuelle ;
- direction du vent ;
- résumé du jour :
  - min/max température ;
  - pluie 24 h ;
  - état dominant ;
- prévisions 5 h ;
- prévisions 5 jours ;
- événements météo actifs ;
- alertes météo nouvellement déclenchées.

Important :

- ne pas surcharger visuellement ;
- privilégier une lecture rapide ;
- garder les détails plus avancés dans des zones repliables ou compactes si nécessaire.

## Affichage joueur

La vue joueur doit afficher uniquement les informations publiques.

Pour la météo, le snapshot public peut afficher :

- météo actuelle ;
- saison ;
- état météo ;
- température ;
- vent ;
- pluie ;
- éventuellement résumé simple du jour.

Ne pas exposer :

- événements météo MJ ;
- conditions secrètes ;
- descriptions MJ ;
- données techniques inutiles ;
- seed météo ;
- logique de génération.

Les événements météo publics pourront être affichés plus tard si leur modèle de visibilité est enrichi.

## Import / export

Les nouveaux champs météo doivent être compatibles avec les anciens calendriers.

Règles :

- les nouveaux champs doivent être optionnels ;
- les anciennes sauvegardes restent valides ;
- `sanitizeCalendarProject` doit normaliser les données nouvelles si elles sont stockées ;
- les données calculables ne doivent pas forcément être stockées ;
- éviter de stocker des journées météo générées si elles peuvent être recalculées déterministiquement.

Principe recommandé :

- stocker les paramètres de saison ;
- stocker les réglages météo ;
- ne pas stocker chaque jour généré ;
- recalculer les jours depuis le seed, la saison et la date.

## Ce qui doit être stocké

À stocker :

- profils météo de saison ;
- seed météo ;
- mode de prévision ;
- paramètres avancés optionnels de saison s’ils sont ajoutés ;
- événements météo configurés.

À ne pas stocker par défaut :

- météo de chaque jour ;
- météo de chaque heure ;
- tendances générées si elles peuvent être recalculées ;
- historiques météo complets.

Exception possible plus tard :

- historique léger des événements météo déclenchés ;
- notifications déjà vues ;
- overrides manuels spécifiques si un MJ veut forcer une météo exceptionnelle.

## Overrides manuels éventuels

Pas prioritaire maintenant.

Plus tard, il pourrait être utile d’ajouter :

- météo forcée pour un jour précis ;
- événement météo spécial ;
- tempête scénarisée ;
- brouillard imposé ;
- saison magique anormale.

Mais ce n’est pas l’objectif de la v2 initiale.

La v2 doit d’abord fournir un moteur automatique fiable.

## Architecture recommandée

Garder la logique météo hors des composants React.

Fichiers principaux :

- `src/calendar/weatherLogic.ts`
- `src/calendar/weatherState.ts`
- `src/calendar/weatherUnits.ts`
- `src/calendar/weatherEventsLogic.ts`
- `src/calendar/seasonsLogic.ts`
- `src/components/settings/WeatherSettingsSection.tsx`
- `src/components/settings/WeatherEventsSettingsSection.tsx`
- `src/components/today/WeatherAndSeasonCard.tsx`

Fichiers possibles à ajouter :

- `src/calendar/weatherDaily.ts`
- `src/calendar/weatherTrend.ts`
- `src/calendar/weatherHourly.ts`
- `src/calendar/weatherSummary.ts`

Rôle possible :

- `weatherTrend.ts` : tendance sur plusieurs jours ;
- `weatherDaily.ts` : résumé journalier ;
- `weatherHourly.ts` : variation horaire ;
- `weatherSummary.ts` : formatage ou agrégation lisible.

Ne pas mélanger la simulation météo avec l’UI.

## Plan d’implémentation recommandé

### Phase 1 — Spécification et structure

Objectif :

- poser les types ;
- clarifier ce qui est stocké et ce qui est calculé ;
- garantir la compatibilité avec l’existant.

À faire :

- ajouter types optionnels au besoin ;
- ajouter tests de non-régression ;
- ne pas modifier fortement l’UI.

### Phase 2 — Résumé météo journalier

La phase 2 ajoute une couche **journalière déterministe** via `DailyWeatherSummary`.

- Le résumé est calculé automatiquement par jour avec `getDailyWeatherSummary(project, absoluteDay)`.
- Le calcul utilise :
  - la saison du jour ;
  - le profil météo saisonnier (ou le profil par défaut) ;
  - les traits avancés (ou leurs valeurs dérivées) ;
  - une seed déterministe (seed météo, projet, saison, jour).
- Le résultat inclut :
  - températures min/moyenne/max du jour ;
  - cumul de pluie 24h ;
  - vent max du jour ;
  - direction dominante ;
  - état dominant (`WeatherState`).

Important :
- la météo reste pilotée par les saisons ;
- les traits avancés restent optionnels ;
- la météo quotidienne reste **recalculée** (pas stockée) ;
- aucune météo jour par jour n’est persistée en import/export.

### Phase 3 — Variation jour/nuit

Objectif :

- rendre les températures horaires plus crédibles.

À faire :

- générer température horaire depuis min/max journalier ;
- éviter les variations absurdes ;
- garder les bornes de saison.

### Phase 4 — Pluie par épisodes

Objectif :

- éviter une pluie trop uniforme ou trop aléatoire.

À faire :

- générer des épisodes de pluie ;
- répartir le cumul journalier ;
- garder pluie actuelle et cumul 24 h séparés.

### Phase 5 — Vent plus stable

Objectif :

- éviter les changements de direction trop brusques.

À faire :

- choisir une direction dominante par jour ;
- varier légèrement heure par heure ;
- ajouter des pics de vent si nécessaire.

### Phase 6 — États météo améliorés

Objectif :

- rendre les états météo plus crédibles.

À faire :

- utiliser température, pluie, cumul, vent, heure, tendance ;
- améliorer brouillard, neige, orage, tempête ;
- garder les seuils simples et lisibles.

### Phase 7 — Événements météo avancés

Objectif :

- rendre la météo vraiment exploitable en jeu.

À faire :

- conditions sur cumul 24 h ;
- conditions sur état météo ;
- conditions sur saison ;
- conditions sur période de journée ;
- durée ;
- cooldown ;
- visibilité ;
- descriptions MJ/joueur.

### Phase 8 — Affichage et vue joueur

Objectif :

- présenter la météo enrichie sans surcharge.

À faire :

- améliorer `WeatherAndSeasonCard` ;
- ajouter résumé météo public si utile ;
- éviter d’exposer les données MJ.

## Priorités météo v2

Priorité 1 :

- résumé journalier ;
- min/max ;
- cumul pluie 24 h ;
- état dominant.

Priorité 2 :

- variation jour/nuit ;
- pluie par épisodes ;
- vent plus stable.

Priorité 3 :

- états météo améliorés.

Priorité 4 :

- événements météo avancés.

Priorité 5 :

- affichage enrichi MJ / joueur.

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
- effets mécaniques système-spécifiques ;
- configuration manuelle jour par jour ;
- historique complet de météo.

## Règles de développement

Toujours :

- garder la météo déterministe ;
- garder les saisons comme source principale ;
- ne pas demander au MJ de configurer les jours un par un ;
- préserver les anciennes sauvegardes ;
- préserver l’import/export JSON ;
- ne pas exposer les données MJ côté joueur ;
- garder les fonctions météo pures et testables ;
- ajouter des tests dès qu’une logique pure est créée ou modifiée.

À lancer pour chaque étape météo :

- `npm run test`
- `npm run build`

## Critères avant de considérer une amélioration météo comme terminée

Pour toute amélioration météo :

- le build passe ;
- les tests passent ;
- les valeurs sont déterministes ;
- les anciennes sauvegardes ne cassent pas ;
- l’import/export JSON conserve les paramètres nécessaires ;
- les données calculables ne sont pas stockées inutilement ;
- l’UI reste lisible ;
- la vue joueur n’expose aucune donnée MJ ;
- la météo reste basée sur les saisons et non sur une configuration jour par jour.

## Météo v2 — Phase 2 : résumé météo journalier

La phase 2 ajoute une couche **journalière déterministe** via `DailyWeatherSummary`.

- Le résumé est calculé automatiquement par jour avec `getDailyWeatherSummary(project, absoluteDay)`.
- Le calcul utilise :
  - la saison du jour ;
  - le profil météo saisonnier (ou le profil par défaut) ;
  - les traits avancés (ou leurs valeurs dérivées) ;
  - une seed déterministe (seed météo, projet, saison, jour).
- Le résultat inclut :
  - températures min/moyenne/max du jour ;
  - cumul de pluie 24h ;
  - vent max du jour ;
  - direction dominante ;
  - état dominant (`WeatherState`).

Important :
- la météo reste pilotée par les saisons ;
- les traits avancés restent optionnels ;
- la météo quotidienne reste **recalculée** (pas stockée) ;
- aucune météo jour par jour n’est persistée en import/export.

## Météo v2 — Phase 3 : intégration du résumé journalier au snapshot

La phase 3 relie `DailyWeatherSummary` à la météo horaire (`WeatherSnapshot`).

- `generateWeatherForTime` enrichit le snapshot avec :
  - `dailyMinTemperature`
  - `dailyMaxTemperature`
  - `dailyRainTotal`
  - `dominantState`
- Ces champs restent calculés à la volée (non persistés).
- Une première variation jour/nuit est appliquée à la température :
  - proche du minimum vers 05:00,
  - proche du maximum vers 15:00,
  - transition progressive entre les deux.

Ce qui reste pour les phases suivantes :
- pluie par épisodes horaires,
- vent horaire plus stable,
- affinage avancé des tendances.

## Météo v2 — Phase 4 : pluie horaire par épisodes

La phase 4 remplace la pluie horaire indépendante par une répartition en épisodes déterministes sur la journée.

- `dailyRainTotal` reste le cumul journalier (`rainTotal24h`) calculé par `getDailyWeatherSummary`.
- `WeatherSnapshot.rain` représente désormais la pluie actuelle à l'heure demandée (mm/h), issue du plan d'épisodes horaires.
- La pluie horaire est recalculée à la volée à partir de la seed météo, du projet, du jour et de l'état dominant, puis arrondie à 1 décimale.
- Les données horaires ne sont pas stockées dans le projet ; elles sont entièrement déterministes et régénérées au besoin.

Étape suivante prévue : stabilisation du vent horaire (direction et variations plus progressives).

## Météo v2 — Phase 5 : vent horaire plus stable

La phase 5 introduit un plan de vent horaire déterministe basé sur le résumé journalier.

- La direction dominante du jour (`dominantWindDirection`) sert de base au vent horaire.
- Heure par heure, la direction reste majoritairement identique, avec de faibles variations adjacentes selon la variabilité de saison.
- La vitesse horaire reste cohérente avec `maxWindSpeed` du résumé journalier, avec des pics limités et narrativement plausibles.
- Le vent horaire est recalculé à la volée (non stocké) depuis la seed météo, le projet, le jour et l'état dominant.

Étape suivante prévue : amélioration des états météo en s'appuyant sur les données horaires enrichies (température/pluie/vent).