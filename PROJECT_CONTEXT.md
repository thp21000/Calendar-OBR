# Project Context — OBR Living Calendar

## Objectif du projet

Ce projet est un addon Owlbear Rodeo destiné aux maîtres de jeu.

L’objectif est de créer un calendrier vivant pour campagnes JDR, capable de gérer :

- un calendrier personnalisé ;
- la date actuelle de la campagne ;
- l’heure actuelle ;
- les événements de campagne ;
- les saisons ;
- les phases de lune ;
- une météo procédurale cohérente ;
- des prévisions météo ;
- des événements météorologiques conditionnels ;
- des imports/exports JSON ;
- des packs prêts à l’emploi distribuables via Patreon.

Le projet doit être pensé comme un outil de MJ utilisable en partie, dans une interface compacte adaptée au popover Owlbear Rodeo.

## Intention produit

L’addon ne doit pas être seulement un calendrier.

Il doit devenir un outil de suivi du temps de campagne :

- “Quel jour sommes-nous ?”
- “Quelle heure est-il ?”
- “Quelle est la météo ?”
- “Y a-t-il un événement aujourd’hui ?”
- “Quelle est la phase de lune ?”
- “Que voient les joueurs ?”
- “Quelles informations restent réservées au MJ ?”

Phrase de présentation possible :

> Un calendrier vivant pour campagnes JDR : temps, saisons, lunes, événements et météo dynamique directement utilisables en partie.

## Public visé

### MJ

Le MJ est l’utilisateur principal.

Il doit pouvoir :

- créer et modifier le calendrier ;
- gérer la date et l’heure ;
- créer des événements ;
- configurer les saisons ;
- configurer la météo ;
- gérer les lunes ;
- importer/exporter les données ;
- préparer des calendriers ou packs à partager.

### Joueurs

Les joueurs doivent pouvoir consulter une version limitée, si cette fonction est activée.

Ils peuvent voir :

- la date actuelle ;
- l’heure actuelle ;
- la saison ;
- la météo actuelle ;
- les prévisions autorisées ;
- les événements publics ;
- les phases de lune visibles.

Ils ne doivent pas pouvoir modifier le calendrier.

### Créateur Patreon

Le projet doit permettre de proposer des packs prêts à l’emploi :

- calendriers complets ;
- saisons ;
- événements ;
- événements météo ;
- lunes ;
- profils météo ;
- packs de campagne.

## Principe technique central

Le système doit fonctionner avec une date interne absolue.

Même si le calendrier affiché est personnalisé, irrégulier ou fantastique, l’addon doit garder en interne une valeur simple :

- jour absolu ;
- heure ;
- minute.

Exemple :

```ts
{
  absoluteDay: 142,
  hour: 18,
  minute: 55
}
```

Ensuite, le système convertit cette valeur en date affichée selon la configuration du calendrier.

Exemple affiché :

```txt
21 Calistril 4710, 18:55
Hiver
Lune gibbeuse décroissante
```

Ce principe est important pour gérer correctement :

- le passage du temps ;
- les mois personnalisés ;
- les années ;
- les événements récurrents ;
- les saisons ;
- les lunes ;
- la météo déterministe ;
- les prévisions.

## Priorités du MVP

Le MVP doit être volontairement limité.

Le but de la première version n’est pas de tout faire, mais de poser une base propre.

Le MVP doit inclure :

- création d’un calendrier personnalisé ;
- mois personnalisés ;
- nombre de jours par mois ;
- jours de semaine personnalisés ;
- année actuelle ;
- date actuelle ;
- heure actuelle ;
- boutons rapides de changement d’heure ;
- pause longue +8 h ;
- vue du mois ;
- événements ponctuels simples ;
- événements récurrents simples ;
- notifications d’événements ;
- import/export JSON complet ;
- i18n FR/EN ;
- stockage local.

## Hors scope du MVP

Ne pas implémenter immédiatement :

- météo avancée ;
- prévisions météo ;
- événements météo conditionnels ;
- multiples lunes ;
- synchronisation OBR complète MJ/joueurs ;
- packs Patreon avancés ;
- biomes ;
- altitude ;
- régions climatiques ;
- notes de voyage ;
- journal de campagne.

Ces fonctionnalités doivent être prévues dans l’architecture, mais pas codées tout de suite.

## Découpage prévu

### MVP

Base calendrier + temps + événements simples + import/export.

### V1

Saisons, météo actuelle, prévisions simples, une lune.

### V1.5

Événements météo conditionnels, événements lunaires, notifications avancées.

### V2

Packs Patreon, import sélectif, plusieurs lunes, meilleure synchronisation OBR, vue joueur plus complète.

## Contraintes UX

L’interface doit être :

- compacte ;
- lisible ;
- utilisable dans un popover OBR ;
- rapide en partie ;
- adaptée au MJ ;
- non surchargée pour les joueurs.

L’écran principal doit toujours rendre visibles :

- la date ;
- l’heure ;
- la saison ;
- la météo actuelle, même si elle est provisoire ou placeholder dans le MVP ;
- les boutons rapides de temps ;
- les événements du jour.

## Contraintes de données

Les exports JSON doivent inclure :

- schemaVersion ;
- appVersion ;
- identifiant du calendrier ;
- nom du calendrier ;
- configuration du calendrier ;
- date actuelle ;
- événements ;
- paramètres UI ;
- futures sections prévues pour saisons, météo, lunes et packs.

L’import/export doit être fiable dès le début, car il servira :

- aux sauvegardes ;
- aux tests ;
- aux migrations ;
- au partage de calendriers ;
- aux packs Patreon.

## Architecture souhaitée

Séparer clairement :

- logique calendrier ;
- logique de temps ;
- logique événements ;
- stockage ;
- import/export ;
- i18n ;
- interface utilisateur ;
- futures fonctions météo ;
- futures fonctions lune ;
- futures fonctions packs.

Les fonctions de calcul de date doivent être pures et testables.

Éviter un gros fichier unique qui mélange toute la logique.

## Langues

Prévoir dès le départ :

- français ;
- anglais.

Tout texte visible dans l’interface doit passer par l’i18n.

## Unités prévues

Pour le MVP, les unités météo peuvent rester en attente.

Pour la V1, prévoir :

- température : Celsius ;
- vent : km/h ;
- pluie : mm.

La structure doit permettre plus tard :

- Fahrenheit ;
- mph ;
- pouces.

## Stockage OBR

Pour le MVP, le stockage local est suffisant.

La synchronisation avec la room OBR pourra venir plus tard.

Ne pas bloquer l’architecture, mais ne pas essayer de tout synchroniser dès le départ.

## Philosophie de développement

Faire simple, propre et extensible.

Ne pas sur-implémenter.

Ne pas coder la météo complète tant que le moteur de date, les événements et l’import/export ne sont pas solides.

Chaque phase doit être fonctionnelle et testable avant de passer à la suivante.