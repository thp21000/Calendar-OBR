# Cahier des charges fonctionnel — Addon Calendrier vivant pour OBR

## 1. Intention du projet

L’objectif est de créer un addon Owlbear Rodeo destiné aux MJ, avec une version utilisable gratuitement et une logique de packs prêts à l’emploi pour Patreon.

L’addon ne doit pas être seulement un calendrier. Il doit devenir un outil de suivi du temps de campagne : date, heure, saisons, lunes, événements, météo actuelle, prévisions et événements conditionnels.

Nom de travail possible : **Living Calendar**, **GM Calendar**, **World Calendar**, **Campaign Calendar** ou **Calendrier Vivant**.

Phrase de présentation possible :

> Un calendrier vivant pour campagnes JDR : temps, saisons, lunes, événements et météo dynamique directement utilisables en partie.

## 2. Objectifs principaux

L’addon doit permettre au MJ de :

* créer un calendrier personnalisé adapté à son univers ;
* suivre la date et l’heure actuelle de la campagne ;
* avancer ou reculer rapidement le temps ;
* créer des événements ponctuels, récurrents ou conditionnels ;
* simuler une météo cohérente selon les saisons ;
* afficher des prévisions météo plus ou moins précises ;
* gérer une ou plusieurs lunes ;
* afficher certaines informations aux joueurs, tout en gardant les informations sensibles côté MJ ;
* importer/exporter des calendriers complets ou des modules séparés ;
* proposer des packs prêts à l’emploi via Patreon.

## 3. Principes de conception

### 3.1. Date interne absolue

Le système doit fonctionner avec une valeur interne simple :

* jour absolu ;
* heure ;
* minute.

Le calendrier affiché n’est qu’une conversion de cette date interne.

Exemple interne :

* Jour absolu : 148 262 ;
* Heure : 18 ;
* Minute : 55.

Exemple affiché :

* 21 Calistril 4710, 18:55 ;
* Hiver ;
* Lune : gibbeuse décroissante.

Cela permettra de gérer plus facilement :

* les mois irréguliers ;
* les semaines non standards ;
* les événements récurrents ;
* les phases lunaires ;
* la météo déterministe ;
* les prévisions.

### 3.2. Météo déterministe

La météo ne doit pas être relancée totalement au hasard à chaque ouverture.

À date identique, saison identique et graine identique, la météo doit rester la même.

Le système devrait utiliser une graine de campagne, par exemple :

* nom du calendrier ;
* graine météo définie par le MJ ;
* jour absolu ;
* heure.

Cela évite les incohérences si le MJ ferme puis rouvre l’addon.

### 3.3. Séparation MJ / joueurs

Le MJ doit pouvoir voir toutes les informations.

Les joueurs ne doivent voir que les informations autorisées :

* date actuelle ;
* heure actuelle ;
* météo actuelle visible ;
* événements publics ;
* phase de lune visible ;
* prévisions si le MJ les active.

Certains événements doivent rester invisibles jusqu’à leur déclenchement.

## 4. Utilisateurs visés

### 4.1. MJ

Le MJ est l’utilisateur principal. Il doit pouvoir créer, modifier, importer, exporter et piloter le calendrier.

### 4.2. Joueurs

Les joueurs peuvent consulter une version simplifiée : date, heure, météo, lune, événements publics.

Ils ne doivent pas pouvoir modifier les données.

### 4.3. Créateur Patreon

Le créateur doit pouvoir préparer des packs de calendrier prêts à l’emploi :

* calendrier complet ;
* saisons seules ;
* événements seuls ;
* météo seule ;
* lunes seules ;
* pack complet de campagne.

## 5. Structure fonctionnelle générale

L’addon est organisé autour de six grands modules :

1. Tableau de bord ;
2. Calendrier ;
3. Temps et heure ;
4. Événements ;
5. Météo ;
6. Paramètres MJ / import-export.

## 6. Écrans principaux

## 6.1. Écran “Aujourd’hui”

C’est l’écran principal de l’addon.

Il doit afficher immédiatement :

* date actuelle ;
* heure actuelle ;
* saison actuelle ;
* phase de lune actuelle ;
* météo actuelle ;
* résumé météo : température, vent, direction du vent, pluie ;
* événements du jour ;
* boutons rapides pour avancer/reculer le temps.

### 6.2. Contexte d’aventure

Le MJ peut définir un **Contexte d’aventure** séparé du biome météo. Le biome décrit le terrain ou le climat général utilisé par la génération météo ; le Contexte d’aventure décrit la situation actuelle des PJ (lieu, activité ou contexte Kingmaker) et ne modifie aucune métrique météo.

Le projet conserve une liste unique de contextes actifs (`activeContextIds`) et la liste des contextes disponibles. Les anciens champs `primaryContextId` et `secondaryContextIds` sont migrés doucement vers cette liste active. Ce contexte sert de condition réutilisable (`any`, `all`, `none`) pour filtrer les événements datés et déclencher les événements météo, sans transformer ces événements en données météo.

### Éléments affichés

* Date longue : `21 Calistril (février) 4710, 18:55` ;
* Saison : `❄️ Hiver` ;
* Lune : icône de phase ;
* Température : `4 °C` ;
* Vent : `24 km/h ↘` ;
* Pluie : `0 mm` ;
* Événements du jour ;
* Alertes météo actives.

### Boutons rapides de temps

* -2 h ;
* -1 h ;
* -15 min ;
* -5 min ;
* +5 min ;
* +15 min ;
* +1 h ;
* +2 h ;
* pause longue +8 h.

### Boutons optionnels possibles

À ajouter plus tard ou dans un menu avancé :

* aller à l’aube ;
* aller à midi ;
* aller au crépuscule ;
* aller à minuit ;
* définir une heure précise.

## 6.2. Écran “Calendrier mensuel”

Cet écran affiche le mois actuel.

Chaque jour doit pouvoir afficher :

* numéro du jour ;
* mise en évidence du jour actuel ;
* icône d’événement ;
* icône météo simple optionnelle ;
* icône de phase lunaire importante optionnelle ;
* indicateur MJ si événement secret.

Au clic sur un jour, ouvrir le détail du jour.

### Détail d’un jour

Le détail du jour affiche :

* date complète ;
* saison ;
* météo du jour ;
* phase de lune ;
* événements publics ;
* événements MJ ;
* notes du MJ ;
* événements lunaires filtrés par phase, lune, biome et contexte d’aventure optionnels ;
* bouton pour créer un événement ce jour-là.

## 6.3. Écran “Événements”

Cet écran permet de gérer tous les événements.

Fonctions attendues :

* créer un événement ;
* modifier un événement ;
* supprimer un événement ;
* archiver un événement ;
* filtrer par type ;
* filtrer par visibilité ;
* filtrer par événement futur/passé ;
* rechercher par nom.

### Types d’événements

* ponctuel ;
* récurrent ;
* annuel ;
* météo conditionnelle ;
* lunaire ;
* événement MJ secret.

### Champs d’un événement

* identifiant unique ;
* nom ;
* icône ;
* type ;
* date de départ ;
* heure optionnelle ;
* périodicité ;
* résumé court ;
* description MJ ;
* description joueur ;
* lien externe ;
* visibilité ;
* notification activée ou non ;
* suppression après déclenchement ;
* archivage après déclenchement ;
* état : actif, déclenché, archivé, désactivé.

### Visibilités possibles

* MJ uniquement ;
* visible aux joueurs ;
* révélé automatiquement à la date atteinte ;
* révélé manuellement par le MJ.

## 6.4. Écran “Météo”

Cet écran affiche :

* météo actuelle détaillée ;
* prévisions sur les 5 prochaines heures ;
* prévisions sur les 5 prochains jours ;
* événements météo actifs ;
* tendance générale.

### Météo actuelle

Valeurs affichées :

* état météo : clair, nuageux, couvert, pluie, orage, brouillard, neige, tempête ;
* température ;
* ressenti optionnel ;
* vent ;
* direction du vent ;
* rafales optionnelles ;
* pluie actuelle ;
* cumul de pluie sur 24 h ;
* humidité optionnelle en V1 ou V2 ;
* visibilité optionnelle en V1 ou V2.

### Prévision 5 heures

Afficher cinq blocs horaires :

* +1 h ;
* +2 h ;
* +3 h ;
* +4 h ;
* +5 h.

Chaque bloc affiche :

* température ;
* vent ;
* pluie prévue ;
* état météo simplifié.

### Prévision 5 jours

Afficher cinq blocs journaliers :

* +1 jour ;
* +2 jours ;
* +3 jours ;
* +4 jours ;
* +5 jours.

Chaque bloc affiche :

* température min ;
* température max ;
* vent moyen ou max ;
* pluie estimée ;
* état météo dominant.

## 6.5. Écran “Saisons”

Écran MJ uniquement.

Permet de créer et modifier les saisons.

### Champs d’une saison

* identifiant unique ;
* nom ;
* icône ;
* date de début ;
* date de fin ;
* température minimale ;
* température moyenne ;
* température maximale ;
* vent minimal ;
* vent moyen ;
* vent maximal ;
* pluie minimale ;
* pluie moyenne ;
* pluie maximale ;
* chance de pluie ;
* stabilité météo ;
* description.

### Stabilité météo

La stabilité météo sert à éviter que la météo change trop brutalement.

Valeurs possibles :

* très instable ;
* instable ;
* normale ;
* stable ;
* très stable.

Effet attendu :

* plus la saison est stable, plus les tendances météo durent longtemps ;
* plus la saison est instable, plus les changements météo sont fréquents.

## 6.6. Écran “Événements météo”

Écran MJ uniquement.

Permet de créer des événements automatiques déclenchés par la météo.

### Champs d’un événement météo

* identifiant unique ;
* nom ;
* icône ;
* résumé joueur ;
* description MJ ;
* lien externe ;
* conditions de déclenchement ;
* durée ;
* délai avant redéclenchement ;
* visibilité ;
* notification ;
* actif ou inactif.

### Conditions possibles

* température actuelle inférieure à X ;
* température actuelle supérieure à X ;
* température moyenne sur X heures inférieure à Y ;
* vent actuel supérieur à X ;
* rafales supérieures à X ;
* pluie actuelle supérieure à X ;
* cumul de pluie sur 24 h supérieur à X ;
* cumul de pluie sur plusieurs jours supérieur à X ;
* état météo égal à brouillard, pluie, neige, orage, tempête ;
* saison spécifique ;
* période de la journée ;
* phase de lune spécifique.

### Logique des conditions

Le MJ doit pouvoir choisir :

* toutes les conditions doivent être vraies ;
* au moins une condition doit être vraie.

## 6.7. Écran “Lunes”

Écran MJ uniquement pour la configuration, visible partiellement aux joueurs selon les options.

### Champs d’une lune

* identifiant unique ;
* nom ;
* icône ;
* durée du cycle en jours ;
* décalage initial ;
* visibilité joueur ;
* couleur ou style optionnel ;
* description.

### Phases proposées

* nouvelle lune ;
* premier croissant ;
* premier quartier ;
* gibbeuse croissante ;
* pleine lune ;
* gibbeuse décroissante ;
* dernier quartier ;
* dernier croissant.

### Cas avancés à prévoir

Même si le MVP ne gère qu’une seule lune, la structure doit permettre plusieurs lunes plus tard.

Exemples d’événements lunaires futurs :

* rituel à chaque pleine lune ;
* créature active à chaque nouvelle lune ;
* événement rare lorsque deux lunes sont pleines ;
* fête tous les trois cycles lunaires.

## 6.8. Écran “Configuration du calendrier”

Écran MJ uniquement.

Permet de définir :

* nom du calendrier ;
* nom de l’ère ;
* année actuelle ;
* date actuelle ;
* heure actuelle ;
* mois ;
* jours de la semaine ;
* format d’affichage ;
* langue ;
* unités de mesure ;
* graine météo.

### Mois

Chaque mois doit avoir :

* identifiant unique ;
* nom ;
* nom court optionnel ;
* ordre ;
* nombre de jours ;
* icône optionnelle ;
* saison dominante optionnelle.

### Jours de la semaine

Le calendrier doit pouvoir gérer :

* une semaine standard ;
* des noms de jours personnalisés ;
* un nombre de jours différent du calendrier réel.

Pour les semaines très personnalisées, il faut prévoir une structure extensible, mais ne pas forcément tout intégrer dès le MVP.

## 6.9. Écran “Import / Export”

Écran MJ uniquement.

Fonctions attendues :

* exporter le calendrier complet ;
* importer un calendrier complet ;
* exporter uniquement les événements ;
* importer uniquement les événements ;
* exporter uniquement les saisons ;
* importer uniquement les saisons ;
* exporter uniquement les lunes ;
* importer uniquement les lunes ;
* exporter uniquement les événements météo ;
* importer uniquement les événements météo.

### Modes d’import

* remplacer les données actuelles ;
* ajouter aux données actuelles ;
* fusionner si possible ;
* créer un nouveau calendrier.

### Sécurité

Avant un remplacement complet, afficher une confirmation.

Recommander régulièrement l’export JSON comme sauvegarde.

## 7. Données à stocker

## 7.1. Objet principal : CalendarProject

Structure conceptuelle :

```json
{
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "id": "calendar-id",
  "name": "Calendrier de campagne",
  "locale": "fr",
  "units": {
    "temperature": "celsius",
    "windSpeed": "kmh",
    "rain": "mm"
  },
  "currentTime": {},
  "calendarSystem": {},
  "seasons": [],
  "moons": [],
  "events": [],
  "weatherEvents": [],
  "weatherSettings": {},
  "uiSettings": {}
}
```

## 7.2. currentTime

```json
{
  "absoluteDay": 0,
  "hour": 18,
  "minute": 55,
  "year": 4710,
  "monthId": "calistril",
  "dayOfMonth": 21
}
```

Le plus important reste `absoluteDay`. Les autres champs peuvent être calculés ou conservés pour faciliter l’affichage.

## 7.3. calendarSystem

```json
{
  "eraName": "AR",
  "startYear": 4710,
  "months": [],
  "weekdays": [],
  "dateFormat": "day-month-year",
  "timeFormat": "24h"
}
```

## 7.4. month

```json
{
  "id": "pharast",
  "name": "Pharast",
  "shortName": "Pha",
  "order": 3,
  "days": 30,
  "icon": "🌱",
  "defaultSeasonId": "spring"
}
```

## 7.5. weekday

```json
{
  "id": "moonday",
  "name": "Lundain",
  "shortName": "Lun",
  "order": 1
}
```

## 7.6. season

```json
{
  "id": "winter",
  "name": "Hiver",
  "icon": "❄️",
  "start": { "monthId": "kuthona", "day": 1 },
  "end": { "monthId": "pharast", "day": 20 },
  "temperature": {
    "min": -10,
    "average": 4,
    "max": 12
  },
  "wind": {
    "min": 0,
    "average": 24,
    "max": 70
  },
  "rain": {
    "min": 0,
    "average": 3,
    "max": 20
  },
  "rainChance": 35,
  "weatherStability": "normal",
  "description": "Saison froide et humide."
}
```

## 7.7. moon

```json
{
  "id": "main-moon",
  "name": "Lune",
  "cycleLengthDays": 29.5,
  "initialOffsetDays": 3,
  "iconSet": "default",
  "visibleToPlayers": true,
  "description": "Lune principale du monde."
}
```

## 7.8. event

```json
{
  "id": "event-id",
  "name": "Fête du printemps",
  "icon": "🌸",
  "type": "annual",
  "date": {
    "monthId": "pharast",
    "day": 1,
    "hour": null,
    "minute": null
  },
  "recurrence": {
    "type": "yearly",
    "interval": 1
  },
  "summary": "Grande fête populaire.",
  "gmDescription": "Les nobles utilisent cette fête pour négocier discrètement.",
  "playerDescription": "La ville se couvre de fleurs et de lanternes.",
  "link": "",
  "visibility": "players",
  "notifyOnTrigger": true,
  "deleteAfterTrigger": false,
  "archiveAfterTrigger": false,
  "status": "active"
}
```

## 7.9. weatherEvent

```json
{
  "id": "muddy-roads",
  "name": "Routes boueuses",
  "icon": "🌧️",
  "summary": "Les chemins deviennent lourds et collants.",
  "gmDescription": "Les déplacements terrestres peuvent être ralentis.",
  "link": "",
  "conditionsMode": "all",
  "conditions": [
    {
      "type": "rainTotal24h",
      "operator": ">=",
      "value": 8
    }
  ],
  "durationHours": 24,
  "cooldownHours": 48,
  "visibility": "players",
  "notifyOnTrigger": true,
  "enabled": true
}
```

## 7.10. weatherSettings

```json
{
  "seed": "campaign-seed",
  "forecastMode": "wide",
  "playersCanSeeForecast": true,
  "generationMode": "seasonal-procedural",
  "temperatureVariation": "normal",
  "rainVariation": "normal",
  "windVariation": "normal"
}
```

## 7.11. uiSettings

```json
{
  "activeTab": "today",
  "compactMode": false,
  "showWeatherIconsInCalendar": true,
  "showMoonIconsInCalendar": true,
  "showSecretEventMarkersToGM": true
}
```

## 8. Simulation météo

## 8.1. But de la simulation

La météo doit être :

* crédible ;
* cohérente avec les saisons ;
* stable dans le temps ;
* facile à lire en partie ;
* suffisamment prévisible pour permettre des prévisions ;
* suffisamment aléatoire pour surprendre.

Elle n’a pas besoin d’être scientifiquement parfaite.

## 8.2. Couches de simulation

La météo devrait être générée en cinq couches :

1. saison ;
2. tendance sur plusieurs jours ;
3. météo du jour ;
4. variation horaire ;
5. événements météo déclenchés.

### Saison

La saison donne les bornes générales :

* température min/moy/max ;
* vent min/moy/max ;
* pluie min/moy/max ;
* chance de pluie ;
* stabilité météo.

### Tendance météo

La tendance permet de créer une cohérence sur plusieurs jours.

Exemples :

* vague froide ;
* temps doux ;
* période humide ;
* temps sec ;
* vents forts ;
* ciel calme.

La durée d’une tendance dépend de la stabilité de la saison.

### Météo du jour

Le jour reçoit un état dominant :

* clair ;
* nuageux ;
* couvert ;
* pluie faible ;
* pluie forte ;
* orage ;
* brouillard ;
* neige ;
* vent fort ;
* tempête.

### Variation horaire

L’heure ajuste les valeurs.

La température devrait généralement :

* être plus basse la nuit ;
* monter le matin ;
* atteindre un maximum en après-midi ;
* redescendre le soir.

Le vent peut varier, mais sa direction doit rester cohérente sur plusieurs heures.

La pluie peut être par épisodes.

### Événements météo

Après génération, le système vérifie les conditions des événements météo.

Si les conditions sont remplies :

* l’événement se déclenche ;
* une notification peut apparaître ;
* l’événement reste actif pendant sa durée ;
* il ne peut pas se redéclencher avant son cooldown.

## 8.3. États météo de base

États recommandés pour le MVP ou la V1 :

* clair ;
* nuageux ;
* couvert ;
* brouillard ;
* pluie faible ;
* pluie forte ;
* orage ;
* neige ;
* vent fort ;
* tempête.

## 8.4. Température

La température doit dépendre de :

* la saison ;
* la tendance météo ;
* l’heure ;
* un bruit pseudo-aléatoire déterministe ;
* éventuellement l’altitude ou le climat en V2.

Pour le MVP/V1, il suffit de gérer la saison.

## 8.5. Vent

Le vent doit contenir :

* vitesse actuelle ;
* direction ;
* rafales optionnelles.

Directions possibles :

* nord ;
* nord-est ;
* est ;
* sud-est ;
* sud ;
* sud-ouest ;
* ouest ;
* nord-ouest.

## 8.6. Pluie

Deux valeurs sont importantes :

* pluie actuelle ;
* cumul sur 24 h.

Le cumul sur 24 h est nécessaire pour déclencher des événements comme :

* routes boueuses ;
* crue ;
* glissement de terrain ;
* campement difficile ;
* pistes effacées.

## 8.7. Prévisions

Les prévisions ne doivent pas forcément afficher la météo exacte.

L’addon doit distinguer :

* météo réelle générée ;
* météo prévue affichée.

### Mode fin

Le mode fin affiche une prévision proche de la réalité.

Utile pour :

* campagnes où la météo est fiable ;
* univers avec outils magiques ou scientifiques ;
* MJ qui veulent donner des infos précises.

### Mode large

Le mode large affiche une tendance plus floue.

Utile pour :

* fantasy médiévale ;
* exploration ;
* campagne où la météo doit rester incertaine.

### Dégradation avec le temps

Plus la prévision est lointaine, plus elle doit être imprécise.

Proposition :

* +1 h à +5 h : assez fiable ;
* +1 jour : tendance fiable ;
* +2 jours : valeurs approximatives ;
* +3 jours : fourchettes larges ;
* +4 à +5 jours : tendance générale seulement.

## 9. Notifications

Le système doit pouvoir afficher une notification quand :

* un événement daté est atteint ;
* un événement météo est déclenché ;
* un événement lunaire est atteint ;
* une date importante arrive ;
* une pause longue fait avancer jusqu’à un événement.

### Contenu d’une notification

* icône ;
* nom ;
* résumé court ;
* bouton “voir détail” ;
* bouton “ignorer” ;
* bouton “archiver” si MJ.

### Gestion des notifications

Chaque événement doit pouvoir choisir :

* notifier une seule fois ;
* notifier à chaque occurrence ;
* ne pas notifier ;
* supprimer après notification ;
* archiver après notification.

## 10. Langues et unités

## 10.1. Langues

Langues prévues :

* français ;
* anglais.

Prévoir une structure i18n similaire à celle de l’addon Loot Tables.

## 10.2. Unités

Température :

* Celsius ;
* Fahrenheit en option future.

Vent :

* km/h ;
* mph.

Pluie :

* mm ;
* pouces en option future.

Pour le MVP, Celsius, km/h et mm suffisent, mais la structure doit permettre les autres unités.

## 11. Import, export et packs Patreon

## 11.1. Exports nécessaires

L’addon doit permettre d’exporter :

* calendrier complet ;
* calendrier sans événements ;
* événements seuls ;
* saisons seules ;
* lunes seules ;
* événements météo seuls ;
* configuration météo seule.

## 11.2. Packs prêts à l’emploi

Les packs Patreon peuvent être distribués en JSON.

Exemples de packs :

* calendrier fantasy classique ;
* calendrier médiéval générique ;
* calendrier sombre avec hiver long ;
* calendrier désertique ;
* calendrier maritime ;
* pack météo rude pour campagne de survie ;
* pack de fêtes et jours sacrés ;
* pack de lunes occultes ;
* pack d’événements météo dangereux ;
* pack exploration Kingmaker-like non officiel.

## 11.3. Structure d’un pack

Un pack devrait contenir :

* nom du pack ;
* auteur ;
* version ;
* description ;
* compatibilité ;
* contenu inclus ;
* données JSON.

Exemple conceptuel :

```json
{
  "packType": "calendar-pack",
  "schemaVersion": 1,
  "name": "Fantasy Classic Calendar",
  "author": "GM Tools & Resources",
  "version": "1.0.0",
  "description": "Calendrier fantasy générique avec saisons, lunes et météo.",
  "content": {
    "calendarSystem": {},
    "seasons": [],
    "moons": [],
    "events": [],
    "weatherEvents": []
  }
}
```

## 12. Intégration OBR

## 12.1. MVP

Pour le MVP, l’addon peut fonctionner principalement en local storage, comme un outil de MJ.

Priorité :

* interface propre ;
* sauvegarde locale ;
* import/export JSON fiable ;
* affichage lisible dans le popover OBR.

## 12.2. V1 ou V1.5

Prévoir ensuite une meilleure intégration OBR :

* synchronisation avec la room ;
* affichage joueur ;
* données partagées entre MJ et joueurs ;
* droits de modification réservés au MJ ;
* état du calendrier lié à la room.

## 12.3. V2

Fonctions possibles :

* widget joueur compact ;
* notification visible dans la room ;
* notes liées à une scène ;
* météo liée à une scène ;
* export/import par campagne.

## 13. Découpage MVP / V1 / V1.5 / V2

## 13.1. MVP — version minimale solide

Objectif : rendre l’addon utile immédiatement, sans météo complexe.

Fonctions MVP :

* créer un calendrier personnalisé ;
* définir les mois ;
* définir les jours de semaine ;
* définir l’année et la date actuelle ;
* afficher la date actuelle ;
* afficher l’heure actuelle ;
* boutons rapides de temps ;
* pause longue +8 h ;
* vue calendrier mensuel ;
* événements ponctuels simples ;
* événements récurrents simples ;
* notifications d’événements ;
* visibilité MJ/joueur basique ;
* import/export calendrier complet JSON ;
* langue FR/EN ;
* stockage local.

À ne pas mettre dans le MVP :

* météo avancée ;
* événements météo conditionnels ;
* multiples lunes ;
* synchronisation OBR complète ;
* packs partiels avancés ;
* prévisions météo complexes.

## 13.2. V1 — météo, saisons et lunes

Objectif : faire de l’addon un vrai calendrier vivant.

Fonctions V1 :

* gestion des saisons ;
* météo actuelle simulée ;
* température ;
* vent ;
* direction du vent ;
* pluie ;
* cumul de pluie sur 24 h ;
* prévisions 5 heures ;
* prévisions 5 jours ;
* mode prévision fine / large ;
* gestion d’une lune ;
* phases de lune ;
* événements annuels ;
* export/import saisons ;
* export/import lune ;
* export/import événements.

## 13.3. V1.5 — événements conditionnels

Objectif : rendre la météo utile mécaniquement en jeu.

Fonctions V1.5 :

* événements météo conditionnels ;
* conditions multiples ;
* logique “toutes les conditions” ou “une condition suffit” ;
* durée d’événement ;
* cooldown ;
* notifications météo ;
* événements lunaires simples ;
* affichage MJ des événements secrets ;
* amélioration de la vue joueur ;
* import/export événements météo.

## 13.4. V2 — intégration avancée et packs

Objectif : transformer l’addon en outil partageable et monétisable.

Fonctions V2 :

* plusieurs lunes ;
* calendriers multiples ;
* packs prêts à l’emploi ;
* import sélectif avancé ;
* fusion intelligente des données ;
* synchronisation OBR room ;
* vraie vue joueur ;
* notes liées aux jours ;
* notes liées aux scènes ;
* profils météo par région ou biome ;
* mode voyage ;
* génération d’événements aléatoires optionnelle.

## 14. Critères d’acceptation MVP

Le MVP est considéré comme réussi si :

* le MJ peut créer un calendrier personnalisé ;
* le MJ peut définir au moins 12 mois, mais le système accepte plus ou moins ;
* le MJ peut définir le nombre de jours par mois ;
* le MJ peut définir les noms des jours de semaine ;
* le MJ peut choisir une date et une heure actuelle ;
* les boutons rapides modifient correctement l’heure ;
* le passage d’un jour, d’un mois et d’une année fonctionne correctement ;
* la vue mensuelle affiche correctement le mois actuel ;
* le jour actuel est clairement visible ;
* le MJ peut créer un événement ponctuel ;
* le MJ peut créer un événement récurrent simple ;
* l’événement apparaît au bon jour ;
* une notification apparaît quand la date est atteinte ;
* l’export JSON restaure correctement les données après import ;
* l’interface fonctionne correctement dans le popover OBR ;
* l’interface est disponible en français et en anglais.

## 15. Critères d’acceptation V1

La V1 est considérée comme réussie si :

* le MJ peut créer des saisons ;
* chaque saison influence la météo ;
* la météo actuelle est stable et déterministe ;
* revenir à la même date donne la même météo ;
* la température reste cohérente avec la saison ;
* le vent reste cohérent avec la saison ;
* la pluie reste cohérente avec la saison ;
* les prévisions 5 heures s’affichent ;
* les prévisions 5 jours s’affichent ;
* le mode fin est plus précis que le mode large ;
* la lune affiche correctement sa phase ;
* les données V1 sont exportables et importables.

## 16. Priorités UX

L’interface doit être :

* compacte ;
* lisible ;
* utilisable dans un popover ;
* agréable en jeu ;
* rapide à manipuler ;
* claire pour le MJ ;
* non surchargée pour les joueurs.

Priorités visuelles :

* date et heure toujours visibles ;
* météo actuelle visible en un coup d’œil ;
* boutons de temps accessibles ;
* calendrier mensuel simple ;
* événements lisibles ;
* icônes utiles mais pas envahissantes.

## 17. Points de vigilance

### 17.1. Complexité météo

La météo peut devenir trop complexe.

Il faut commencer simple :

* température ;
* vent ;
* pluie ;
* état météo.

Puis ajouter :

* rafales ;
* humidité ;
* visibilité ;
* biomes ;
* altitude.

### 17.2. Calendriers trop personnalisés

Les calendriers fantasy peuvent devenir très étranges.

Le MVP doit gérer :

* mois personnalisés ;
* nombre de jours par mois ;
* jours de semaine personnalisés.

Les semaines irrégulières ou multiples modèles de semaine peuvent être prévues plus tard.

### 17.3. Synchronisation OBR

La synchronisation entre MJ et joueurs peut être délicate.

Il vaut mieux commencer par un stockage local solide, puis ajouter la synchronisation après.

### 17.4. Import/export

L’import/export doit être fiable dès le départ, car il servira :

* aux sauvegardes ;
* au partage ;
* aux packs Patreon ;
* aux tests ;
* aux migrations de version.

## 18. Plan de travail conseillé pour Codex

## Étape 1 — Base du projet

* créer la structure de l’addon ;
* créer les types principaux ;
* créer le stockage local ;
* créer l’i18n FR/EN ;
* créer une interface minimale.

## Étape 2 — Temps et calendrier

* créer le système de date absolue ;
* convertir date absolue vers date affichée ;
* gérer les mois ;
* gérer les jours de semaine ;
* gérer les années ;
* gérer l’heure ;
* créer les boutons rapides.

## Étape 3 — Vue principale

* créer l’écran Aujourd’hui ;
* afficher date, heure, saison placeholder, lune placeholder, météo placeholder ;
* créer la vue calendrier mensuel ;
* mettre en évidence le jour actuel.

## Étape 4 — Événements MVP

* créer les événements ponctuels ;
* créer les événements récurrents simples ;
* afficher les événements dans le calendrier ;
* afficher le détail des événements ;
* créer les notifications ;
* gérer visibilité MJ/joueur basique.

## Étape 5 — Import/export MVP

* exporter calendrier complet ;
* importer calendrier complet ;
* valider le schemaVersion ;
* gérer les erreurs d’import ;
* ajouter une confirmation avant remplacement.

## Étape 6 — Saisons et météo V1

* créer les saisons ;
* calculer la saison actuelle ;
* générer météo actuelle déterministe ;
* afficher température, vent, pluie ;
* créer prévisions 5 heures ;
* créer prévisions 5 jours ;
* ajouter mode fin / large.

## Étape 7 — Lune V1

* créer configuration d’une lune ;
* calculer phase actuelle ;
* afficher phase ;
* permettre événements liés à phase simple.

## Étape 8 — Événements météo V1.5

* créer conditions météo ;
* vérifier conditions à chaque changement de temps ;
* déclencher événement ;
* gérer durée ;
* gérer cooldown ;
* afficher notification.

## Étape 9 — Packs Patreon V2

* créer format de pack ;
* importer pack complet ;
* importer module partiel ;
* fusionner événements ;
* afficher nom, auteur, version, description ;
* préparer exemples de packs.

## 19. Exemple de parcours utilisateur MJ

1. Le MJ ouvre l’addon.
2. Il crée un nouveau calendrier.
3. Il définit les mois et jours de semaine.
4. Il choisit la date actuelle de la campagne.
5. Il crée quelques événements importants.
6. Il sauvegarde automatiquement en local.
7. En partie, il avance l’heure avec les boutons rapides.
8. Quand une date importante est atteinte, l’addon affiche une notification.
9. En V1, la météo change automatiquement selon la saison.
10. En V1.5, des événements météo peuvent se déclencher.

## 20. Exemple de parcours utilisateur Patreon

1. Le MJ télécharge un pack JSON.
2. Il ouvre l’addon.
3. Il va dans Import / Export.
4. Il importe le pack.
5. L’addon affiche le nom, la description et le contenu du pack.
6. Le MJ choisit d’importer tout ou seulement certains modules.
7. Le calendrier est prêt à l’emploi.

## 21. Conclusion fonctionnelle

Le projet doit être pensé comme un socle évolutif.

La priorité n’est pas de tout faire immédiatement, mais de créer une base saine :

* date absolue ;
* calendrier personnalisable ;
* événements ;
* import/export ;
* interface compacte.

Ensuite, la météo, les lunes et les événements conditionnels peuvent transformer l’addon en véritable calendrier vivant.

La logique de packs Patreon doit être prévue dès le début, car elle influence fortement la structure d’import/export et la manière de séparer les données.
