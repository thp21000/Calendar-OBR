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

Cette structure est maintenant conservée comme champ legacy pour les anciens calendriers et l'interface existante.
La base météo principale de la v2 est désormais le profil de biome actif.

## Modèle cible météo v2

La météo v2 fonctionne en couches.

Ordre logique actuel :

1. Biome actif : profil météo de base.
2. Saison actuelle : modificateur du profil de biome.
3. Tendance météo sur plusieurs jours.
4. Résumé météo journalier.
5. État météo dominant du jour.
6. Variation horaire.
7. Snapshot météo actuel.
8. Effets météo actifs / overrides MJ, prioritaires sur la génération de base.
9. Événements météo conditionnels.
10. Affichage MJ / joueur.

La génération doit rester automatique et déterministe.

## Couche 1 — Biome + modificateur saisonnier

Le biome actif est la source principale de la météo.
Il définit un profil complet : température, pluie horaire, pluie 24 h, vent, traits avancés et poids d'états météo.

La saison ne définit plus un climat absolu dans le moteur de génération principal.
Elle applique un `weatherModifier` optionnel au profil du biome : offsets de température, multiplicateurs de pluie/vent, ajustements de traits et poids d'états météo.

Les anciens champs `season.weatherProfile` sont conservés pour compatibilité et pour l'interface historique, mais ils ne sont plus la source principale de génération.

Un profil ou modificateur absent reste compatible : le moteur utilise le biome tempéré par défaut, les profils de biome intégrés et un modificateur saisonnier neutre.

## Couche legacy — Profil météo de saison

Le profil météo saisonnier historique définit :

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

Conditions actuellement supportées :

```ts
type WeatherConditionMetric =
  | "temperature"
  | "windSpeed"
  | "rain"
  | "dailyMinTemperature"
  | "dailyMaxTemperature"
  | "dailyRainTotal";
```

```ts
type WeatherCondition =
  | { type?: "metric"; metric: WeatherConditionMetric; operator: "gte" | "lte"; value: number }
  | { type: "state"; state: WeatherState }
  | { type: "dominantState"; state: WeatherState }
  | { type: "windDirection"; direction: WindDirection }
  | { type: "season"; seasonId: string }
  | { type: "timeOfDay"; startHour: number; endHour: number }
  | { type: "moonPhase"; moonId: string; phaseId: MoonPhaseId };
```

Clarifications :

- `state` = état météo horaire actuel.
- `dominantState` = état dominant de la journée.
- `rain` = pluie actuelle à l’heure donnée.
- `dailyRainTotal` = cumul de pluie de la journée.
- `dailyMinTemperature` = température minimale du jour.
- `dailyMaxTemperature` = température maximale du jour.
- `windDirection` = direction actuelle du vent.

## Exemples d’événements météo avancés

### Routes boueuses

Conditions possibles :

- pluie cumulée sur 24 h >= 8 mm.
- `dailyRainTotal >= 8`.

Effet narratif :

- chemins lourds ;
- déplacements ralentis ;
- traces plus visibles ;
- chariots plus difficiles à manœuvrer.

### Crue locale

Conditions possibles :

- pluie cumulée sur 24 h >= 20 mm ;
- `dailyRainTotal >= 20`.
- ou pluie forte pendant plusieurs heures.

Effet narratif :

- gué dangereux ;
- rivière plus difficile à traverser ;
- risque d’isolement ;
- ponts fragilisés.

### Gel nocturne

Conditions possibles :

- température minimale <= 0 °C ;
- `dailyMinTemperature <= 0`.
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
- `dailyMaxTemperature >= 35`.
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

## Météo v2 — Phase 6 : cohérence état dominant / état horaire

La phase 6 clarifie la relation entre l'état météo horaire (`state`) et l'ambiance dominante journalière (`dominantState`).

- `state` reste l'état **actuel** de l'heure (pluie, vent, température instantanés prioritaires).
- `dominantState` représente l'ambiance globale du jour et sert d'influence secondaire.
- Hors épisode fort, `dominantState` peut orienter l'affichage vers des états cohérents (`cloudy`/`overcast`, brouillard matinal, etc.) sans forcer en permanence l'état dominant.
- Les états horaires restent recalculés à la volée et ne sont pas stockés.

Étape suivante prévue : conditions météo avancées basées sur `dailyRainTotal`, `dailyMinTemperature`, `dailyMaxTemperature` et `dominantState`.

## Météo v2 — Clarification state vs dominantState

- `state` = état météo horaire actuel.
- `dominantState` = ambiance météo dominante du jour.
- `state` reste prioritaire pour la météo instantanée.
- `dominantState` influence l'état horaire surtout quand la météo actuelle est calme ou ambiguë.
- Ces données sont recalculées de façon déterministe et ne sont pas stockées heure par heure.

## Météo v2 — Phase 7 : conditions météo avancées pour événements

Nouvelles métriques météo utilisables dans les conditions métriques :
- `dailyMinTemperature`
- `dailyMaxTemperature`
- `dailyRainTotal`

Nouveaux types de conditions :
- `dominantState` (état dominant du jour)
- `windDirection` (direction du vent actuelle)

## Exemples de conditions météo v2 (alignés code)

- Gel nocturne : `dailyMinTemperature <= 0`
- Canicule : `dailyMaxTemperature >= 35`
- Routes boueuses : `dailyRainTotal >= 8`
- Crue : `dailyRainTotal >= 20`
- Journée orageuse : `dominantState = storm`
- Vent du nord : `windDirection = N`

## Météo v2 — Phase 8 : visibilité joueur des événements météo

Nouveaux champs d'événement météo :
- `gmDescription`
- `playerDescription`
- `visibility` (`gm` | `players` | `revealOnTrigger`)
- `notifyOnTrigger`

Règles :
- `gm` : visible seulement MJ.
- `players` : visible côté joueur quand l'événement est actif.
- `revealOnTrigger` : visible côté joueur quand déclenché/actif (incluant la fenêtre de durée).
- `notifyOnTrigger` : contrôle la notification interne au déclenchement (`absent => true`).

Sécurité côté joueur :
- Les joueurs ne voient jamais les conditions météo.
- Les joueurs ne voient jamais les descriptions MJ.
- Les joueurs ne voient jamais les seeds ni la logique interne de génération.

## Météo v2 — Phase 9 : statut et cycle de vie des événements météo

Cycle de vie :
- `active` : événement utilisable normalement.
- `triggered` : déjà déclenché au moins une fois, encore utilisable selon durée/cooldown.
- `archived` : conservé mais ne se déclenche plus.
- `disabled` : désactivé manuellement ou automatiquement.

Champs ajoutés :
- `lastTriggeredAtMinutes`
- `archiveAfterTrigger`
- `disableAfterTrigger`

Notes :
- Pas d’historique complet à ce stade : seul le dernier déclenchement est stocké.
- Les joueurs ne voient jamais ces champs internes.

## Phase 10 — Historique léger des événements météo

`triggerHistory` est un historique limité des derniers déclenchements d'un événement météo.

- Ce n'est **pas** une timeline météo complète.
- L'historique est limité à **10 entrées par événement**.
- Quand la limite est dépassée, les **entrées les plus anciennes** sont supprimées automatiquement.
- Cet historique est **réservé au MJ**.
- Les joueurs ne voient jamais `triggerHistory`.

Type documenté :

```ts
type WeatherEventTriggerHistoryEntry = {
  id: string;
  triggeredAtMinutes: number;
  weatherState?: WeatherState;
  dominantState?: WeatherState;
  temperature?: number;
  rain?: number;
  windSpeed?: number;
};
```

Précisions :

- `triggeredAtMinutes` est exprimé en **minutes absolues internes**.
- `weatherState` correspond à l'état météo horaire au moment du déclenchement.
- `dominantState` correspond à l'état dominant du jour au moment du déclenchement.
- `temperature`, `rain` et `windSpeed` correspondent aux valeurs météo au moment du déclenchement.
- L'historique ne stocke pas toute la météo heure par heure, seulement un résumé du moment du déclenchement.

## Météo de scène OBR

La météo de scène est un forçage temporaire lié à la scène Owlbear Rodeo courante.

Principes :

- les profils météo de scène sont des modèles globaux du calendrier, configurés dans Paramètres ;
- l’affectation d’un profil à une scène est stockée dans les métadonnées de la scène OBR, sous la clé `com.gmtools.calendar.sceneWeather` ;
- l’affectation stocke au minimum l’identifiant, le nom et l’icône du profil, ainsi que l’état actif/inactif ;
- sélectionner un profil pour une scène ne l’applique pas immédiatement ;
- à l’ouverture d’une scène avec profil enregistré mais inactif, le MJ doit confirmer l’application ;
- une scène sans profil actif désactive les overrides de source `sceneWeather` et revient à la météo automatique ;
- l’application d’un profil passe par `WeatherOverride`, avec `source: "sceneWeather"`, afin de conserver la priorité existante des overrides récents ;
- les overrides manuels et les événements météo ne sont pas supprimés par le retour automatique, seuls les overrides de source `sceneWeather` concernés le sont ;
- les transitions interpolent les champs numériques et basculent les champs non numériques à mi-transition.

Hors contexte OBR, l’addon doit rester utilisable : les helpers de métadonnées ne plantent pas et la gestion manuelle du menu reste possible avec une scène locale implicite.

### Intégration OBR

L’entrée de gestion de la météo de scène n’est pas un bouton de navigation React dans le popover principal. Elle est enregistrée par la page de background de l’extension avec `OBR.tool.create / OBR.tool.createAction`, filtrée pour le rôle `GM`, puis son action ouvre `index.html?view=scene-weather` avec `OBR.modal.open`.

La demande automatique d’application à l’ouverture d’une scène est également une modal OBR externe : le background surveille les changements de scène, lit les métadonnées de la scène courante et ouvre `index.html?view=scene-weather-confirm` seulement si un profil est enregistré mais inactif. Le garde `lastPromptedAtMinutes` empêche les boucles de confirmation pour le même instant de calendrier.

Avec la version du SDK actuellement utilisée, l’API expose la disponibilité et les métadonnées de la scène active mais pas son nom public. L’interface affiche donc le libellé neutre « Scène OBR active » quand le nom n’est pas fourni par l’API, et ne réutilise jamais le rôle ou le nom du MJ comme nom de scène.

### Profils prédéfinis

Les profils prédéfinis de météo de scène sont des aides de départ globales au calendrier. Un nouveau projet, ou un ancien projet sans aucun `sceneWeatherProfiles`, reçoit la liste par défaut. Si le MJ a déjà au moins un profil, la liste n’est pas remplacée automatiquement.

La section Paramètres > Profils météo de scène propose aussi “Ajouter les profils prédéfinis manquants”. Cette action ajoute uniquement les profils par défaut absents par `id`, sans écraser les profils personnalisés ou modifiés par le MJ. Les profils prédéfinis restent des profils normaux : ils peuvent être modifiés, supprimés ou dupliqués.

Ces profils utilisent uniquement les états météo existants (`clear`, `cloudy`, `overcast`, `fog`, `lightRain`, `heavyRain`, `storm`, `snow`, `strongWind`, `tempest`). Les ambiances spécialisées comme tempête de neige, pluie tropicale ou cendres volcaniques sont représentées par ces états existants avec des valeurs météo et biomes adaptés.

## Synchronisation et fenêtre OBR pour la météo de scène

La météo de scène est pilotée depuis une modal OBR externe. Quand cette modal sauvegarde le calendrier, un signal local `BroadcastChannel("calendar-obr-project")` et un événement navigateur local préviennent les autres iframes ouvertes du même addon afin de recharger le calendrier depuis le stockage scopé. Cela permet à la popover principale de refléter immédiatement un profil météo de scène appliqué depuis la modal.

La popover principale conserve son auto-ajustement de hauteur via `OBR.action.setHeight`, mais les vues modales dédiées (`view=scene-weather` et `view=scene-weather-confirm`) désactivent cette mesure pour ne pas polluer la taille de la fenêtre principale. Les contenus longs doivent scroller dans leur conteneur plutôt que forcer une hauteur OBR excessive.

### Météo de scène persistante

Une météo de scène appliquée n'est pas un effet temporaire borné par `durationMinutes` : elle représente l'état forcé de la scène OBR active. L'override `source: "sceneWeather"` créé pour une scène n'a donc pas de `endMinuteOfDay` et reste pris en compte tant qu'il existe dans le projet, jusqu'au retour en météo automatique, au retrait du profil de scène ou à la synchronisation d'une autre scène sans profil actif.

Dans la vue Aujourd'hui, la météo de scène active est affichée dans la même liste visuelle que les alertes météo actives, avec le nom du profil et le sous-texte « Météo de scène active ». Elle ne doit pas afficher de plage horaire ni le libellé d'override manuel « Météo forcée MJ ».

### Variations 5 minutes et demande d'application

Quand une météo de scène force des valeurs numériques, ces valeurs restent centrées sur le profil mais reçoivent une variation déterministe par palier de 5 minutes. La seed combine le projet, le profil, la scène et le palier de temps ; elle ne dépend jamais de `Math.random`. Les états forcés (`state`, `dominantState`, `trendKind`) et la direction du vent forcée restent stables, tandis que température, pluie, cumul 24 h et vent bougent légèrement dans les bornes prévues.

La demande automatique d'application d'un profil enregistré mais inactif est réservée à l'ouverture/activation de scène signalée par OBR (`ready`) ou au premier démarrage du background. Les changements de métadonnées et le polling de sécurité peuvent nettoyer/réappliquer les overrides, mais ne doivent pas ouvrir de modal de confirmation : enregistrer un profil, avancer le calendrier de 5 minutes, 1 heure ou lancer une sauvegarde ne redéclenche donc pas la popup.

### Profils météo de scène repliables

Dans Paramètres > Profils météo de scène, chaque profil est lui-même présenté comme une carte repliable fermée par défaut. L'en-tête montre l'icône, le nom et l'état activé/inactif ; l'ouverture du profil révèle les sections internes existantes (Général, Biome, État du ciel, Température, Pluie, Vent, Note MJ). La création et la duplication ouvrent automatiquement le nouveau profil pour faciliter son édition.

### Lissage des métriques visibles toutes les 5 minutes

La météo automatique conserve ses plans horaires comme points de contrôle, mais les métriques instantanées visibles ne restent plus figées pendant une heure. Le moteur ramène la minute courante au palier inférieur de 5 minutes (`WEATHER_METRIC_STEP_MINUTES`), normalise les dépassements d'heure/jour, puis interpole très doucement les valeurs entre l'heure courante et l'heure suivante avec `smoothstep(ratio)`.

Règles appliquées :

- la température utilise l'heure décimale du palier de 5 minutes pour conserver une courbe jour/nuit continue, bornée par les min/max journaliers ;
- la vitesse du vent et la pluie instantanée interpolent les plans horaires et restent toujours positives ou nulles ;
- la direction du vent reste stable sur l'heure courante pour éviter une agitation visuelle toutes les 5 minutes ;
- `dailyRainTotal`, `dailyMinTemperature` et `dailyMaxTemperature` restent des résumés journaliers stables pour la météo automatique ;
- quand ces champs sont forcés par une météo de scène, la variation déterministe de scène continue de s'appliquer par palier de 5 minutes ;
- les prévisions horaires restent des cartes `+1 h`, `+2 h`, etc., mais conservent la minute courante (par exemple 06:10 -> 07:10), afin d'utiliser le même lissage que la météo actuelle.

### Cumul de pluie affiché

Le champ `dailyRainTotal` exposé dans le snapshot courant représente désormais le cumul déjà tombé depuis minuit pour l'affichage Aujourd'hui, et non le total prévisionnel complet de la journée. Le résumé journalier conserve `rainTotal24h` comme total généré/prévisionnel interne.

Le cumul affiché est calculé avec le même plan de pluie et le même palier de 5 minutes que la pluie instantanée : chaque tranche ajoute `rainRate * 5 / 60`, puis le résultat est arrondi à 0,1 et remis à 0 à 00:00. La pluie instantanée reste un taux (`mm/h` ou `in/h`), tandis que le cumul utilise une unité de quantité (`mm` ou `in`).

### Min/max comme limites rares, moyenne comme centre climatique

Les bornes `min`/`max` des profils de biome et des modificateurs saisonniers représentent des limites possibles, pas des valeurs fréquentes. La génération journalière utilise donc des distributions déterministes pondérées : la température est centrée autour de la moyenne, tandis que le vent et la pluie sont asymétriques et favorisent les valeurs faibles à modérées.

Les tendances et traits météo orientent ces distributions sans ajouter de nouveau paramètre visible : une tendance froide/chaude déplace la température, une tendance stable resserre les écarts, et les tendances `windy`, `wet`, `stormy` ou une forte probabilité d'orage augmentent seulement la probabilité interne de valeurs marquées. Les extrêmes restent possibles, mais ils passent par des tirages déterministes rares et restent bornés par les limites configurées.

## États météo spécialisés prédéfinis

Le moteur inclut une première série d’états météo spécialisés en plus des états historiques. Ces états restent prédéfinis pour l’instant : ils sont utilisables par la génération météo, les poids de biomes, les événements météo, les overrides et les profils de météo de scène, mais ils ne disposent pas encore d’un écran de configuration libre dans les Paramètres.

États ajoutés :

- `blizzard` : froid marqué, précipitations et vent fort.
- `sandstorm` : temps chaud/sec avec vent extrême, volontairement strict pour rester rare hors biomes adaptés.
- `monsoon` : pluie instantanée ou cumul très fort, favorisée par les biomes humides.
- `seaFog` : brume côtière/marine, surtout portée par les poids de biome et des conditions calmes.
- `volcanicAsh` : état narratif spécialisé, destiné principalement aux biomes/profils/overrides qui le favorisent explicitement.

Les états spécialisés sont ajoutés à la liste partagée des états météo afin d’éviter les listes divergentes dans les sélecteurs UI et la validation d’import/export. Les anciens états restent compatibles et inchangés.

## Configuration météo avancée

La section Paramètres > Configuration météo avancée expose une première couche de réglages prudente autour des états météo, des tendances et des règles de dominance. Cette couche ne remplace pas les constantes historiques : les états et tendances prédéfinis restent les valeurs de secours, et les anciens calendriers fonctionnent même si `weatherAdvancedSettings` est absent.

Les réglages avancés fusionnent les defaults internes avec les overrides du projet :

- `stateConfigs` permet d'ajuster activation, icône, libellés FR/EN, priorité et seuils principaux d'un état météo ;
- `trendConfigs` permet d'ajuster activation, icône, libellés FR/EN et modificateurs de génération des tendances ;
- `dominanceConfigs` permet d'activer/désactiver ou d'ajuster les seuils de dominance automatique.

Les overrides MJ, événements météo et météos de scène qui forcent explicitement un état continuent de l'afficher même si l'état est désactivé pour la génération automatique. En revanche, la génération automatique évite les états désactivés et utilise un fallback proche (`blizzard` vers `snow`, `monsoon` vers `heavyRain`, etc.).

Les règles de dominance désactivées sont également respectées lors du fallback historique : si `monsoon` est désactivé dans `dominanceConfigs`, le résumé journalier automatique ne peut pas retomber sur `monsoon` via l'ancienne règle codée en dur et choisit un état voisin autorisé.

Les seuils des `stateConfigs` influencent aussi la classification automatique instantanée et horaire. Le moteur tente d'abord les états activés dont les seuils configurés correspondent, en respectant leur priorité, puis retombe sur la classification historique. Si un état historique ne respecte plus des seuils explicitement configurés, il utilise le fallback de génération automatique. Les états forcés par override, météo de scène ou événement météo restent affichables même s'ils sont désactivés ou hors seuils.

À la persistance, les réglages avancés restent optionnels : les anciens calendriers sans `weatherAdvancedSettings` n'ont pas besoin d'être migrés en écrivant tous les defaults. Si le champ est présent, import/export et sauvegarde le nettoient avec `sanitizeWeatherAdvancedSettings` pour conserver les overrides valides, les entrées custom propres et supprimer les valeurs invalides (`NaN`, `Infinity`, types incorrects).

L'interface de configuration avancée garde les états et tendances prédéfinis comme base non supprimable : les actions de réinitialisation retirent leurs overrides afin de retrouver les defaults runtime sans gonfler la sauvegarde. Les règles de dominance peuvent, elles, recevoir des règles personnalisées sûres qui ciblent un `WeatherState` existant ; ces règles custom peuvent être supprimées, tandis que les règles prédéfinies ne peuvent qu'être désactivées ou réinitialisées.

## Configuration des biomes météo

La section Paramètres > Biomes météo sert d'outil de réglage de campagne pour le climat de base. Elle rappelle que le biome fournit la base climatique, puis que les saisons, événements météo, overrides MJ et météos de scène peuvent modifier ou remplacer ce climat.

L'écran affiche d'abord le biome courant avec son icône, son nom, sa description et un sélecteur compact. Changer le biome courant conserve la logique de transition existante (`previousBiomeId`, `biomeChangedAtMinutes`, `transitionDurationMinutes`) afin d'éviter une rupture brutale de météo ; une action séparée permet de stabiliser immédiatement la transition si le MJ le souhaite.

Chaque biome prédéfini reste une carte repliable. Le MJ peut y ajuster les profils de température, pluie instantanée, pluie journalière, vent, traits météo et poids d'états météo. Les poids utilisent la liste partagée `WEATHER_STATES` et les libellés/icônes configurés dans la configuration météo avancée, afin que les états renommés ou ré-icônés restent cohérents entre les sections.

Les profils de biomes personnalisés complets ne sont pas encore créés par l'UI. Les actions de réinitialisation retirent seulement les overrides de profils pour retrouver les defaults runtime et éviter de remplir inutilement les sauvegardes. Une disponibilité par biome peut masquer un biome du sélecteur courant sans empêcher les anciennes sauvegardes ou météos forcées de continuer à fonctionner.

### Conditions de biomes pour les événements météo

Les événements météo peuvent désormais inclure une condition `biome` avec une liste optionnelle de `biomeIds`. Une liste absente ou vide ne limite pas l'événement ; dès qu'au moins un biome est sélectionné, la logique de déclenchement compare uniquement `getWeatherBiomeState(project).currentBiomeId` à cette liste.

Pendant une transition de biome, la condition utilise le biome courant et ignore volontairement `previousBiomeId`, car les transitions représentent un lissage climatique visuel/génératif et non une double appartenance de l'environnement. Les imports nettoient cette liste pour conserver seulement les IDs de biomes connus, supprimer les doublons et préserver les anciens événements sans restriction.

## Organisation des paramètres météo

La page Paramètres présente la météo comme une pile de couches afin d'aider le MJ à comprendre l'ordre réel de résolution. La grande section Météo expose d'abord la base globale, puis les biomes, les saisons, les tendances, la dominance, les états météo instantanés, les événements météo et enfin la météo de scène / forcée.

Cette organisation reflète les priorités du moteur : le biome fournit le climat naturel, les saisons l'ajustent, les tendances et règles de dominance orientent la génération automatique, les états instantanés décrivent le résultat lisible, puis les événements météo et overrides de scène peuvent modifier ou remplacer le résultat. Les sections longues restent repliables pour conserver une interface compacte dans le popover OBR.

## Unités météo

Le moteur météo conserve une unité interne canonique afin d’éviter les doubles conversions et les écarts entre génération, événements, biomes, saisons, overrides et import/export :

- température : Celsius ;
- vent : km/h ;
- pluie : millimètres.

Le réglage `project.units` ne modifie pas les valeurs stockées. Il choisit seulement les unités affichées et saisies dans l’interface : métrique (`°C`, `km/h`, `mm`) ou impérial (`°F`, `mph`, `in`). Les champs de configuration convertissent les valeurs affichées vers l’unité interne au moment de la sauvegarde. Les exports restent donc en unités internes, avec la préférence d’affichage conservée séparément.