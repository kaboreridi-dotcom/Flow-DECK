# Prompt de développement — Flow DECK

Tu dois développer **Flow DECK**, une application web de gestion de tâches de type Kanban, entièrement utilisable côté navigateur.

L’objectif est de créer une application riche, fluide et complète permettant à un utilisateur de gérer ses projets et ses tâches sans compte, sans authentification et sans aucun backend.

**Important : concentre-toi exclusivement sur la logique, les fonctionnalités, les interactions, la structure fonctionnelle, les données, les validations, le stockage local, les performances, l’accessibilité et le SEO. Ne donne aucune consigne concernant le design visuel, les couleurs, les typographies, les espacements, les animations visuelles, les formes, les composants graphiques ou l’apparence générale. La conception visuelle sera réalisée séparément.**

## Objectif fonctionnel

Flow DECK doit fonctionner comme un véritable espace personnel de gestion de tâches directement dans le navigateur.

L’application doit permettre de :

- créer et gérer plusieurs tableaux Kanban ;
- créer, modifier, supprimer, déplacer et organiser des tâches ;
- déplacer les tâches entre plusieurs colonnes avec Drag & Drop ;
- conserver toutes les données automatiquement dans LocalStorage ;
- fonctionner sans compte utilisateur ;
- fonctionner sans serveur ;
- fonctionner hors connexion une fois la page chargée ;
- récupérer l’état précédent de l’application lors d’une nouvelle visite ;
- proposer des outils avancés d’organisation, de filtrage, de recherche, de suivi et de productivité.

Aucune fonctionnalité ne doit nécessiter un compte ou une connexion.

---

## Gestion des tableaux

L’utilisateur doit pouvoir créer plusieurs tableaux indépendants.

Chaque tableau doit pouvoir contenir :

- un nom ;
- une description facultative ;
- plusieurs colonnes ;
- plusieurs tâches ;
- des paramètres propres au tableau ;
- un historique des modifications permettant certaines opérations d’annulation/rétablissement.

Fonctionnalités attendues :

- créer un tableau ;
- renommer un tableau ;
- modifier sa description ;
- dupliquer un tableau ;
- supprimer un tableau ;
- réinitialiser un tableau avec confirmation ;
- changer le tableau actif ;
- conserver le dernier tableau consulté ;
- réorganiser les tableaux ;
- rechercher un tableau ;
- trier les tableaux ;
- créer un nouveau tableau à partir d’un modèle prédéfini ;
- exporter un tableau ;
- importer un tableau.

La suppression d’un tableau doit demander une confirmation afin d’éviter les suppressions accidentelles.

---

## Colonnes Kanban

Chaque tableau doit initialement pouvoir proposer les colonnes :

- À faire ;
- En cours ;
- Terminé.

Mais ces colonnes doivent être entièrement personnalisables.

L’utilisateur doit pouvoir :

- créer une colonne ;
- renommer une colonne ;
- supprimer une colonne ;
- dupliquer une colonne ;
- déplacer une colonne ;
- modifier la position d’une colonne ;
- définir une limite optionnelle de tâches ;
- archiver une colonne ;
- restaurer une colonne archivée.

La suppression d’une colonne contenant des tâches doit être protégée contre les suppressions accidentelles.

Lors de la suppression d’une colonne, prévoir une logique permettant de choisir quoi faire des tâches qu’elle contient :

- déplacer les tâches vers une autre colonne ;
- archiver les tâches ;
- supprimer définitivement les tâches.

---

## Gestion des tâches

Une tâche doit pouvoir contenir au minimum :

- un identifiant unique ;
- un titre obligatoire ;
- une description facultative ;
- une colonne ;
- une date de création ;
- une date de dernière modification ;
- une date d’échéance facultative ;
- une priorité ;
- des étiquettes ;
- des sous-tâches ;
- des commentaires ou notes ;
- une liste de liens ;
- un statut ;
- une estimation de durée facultative ;
- du temps réellement passé facultatif ;
- un ordre de position.

L’utilisateur doit pouvoir :

- créer une tâche ;
- modifier une tâche ;
- supprimer une tâche ;
- dupliquer une tâche ;
- archiver une tâche ;
- restaurer une tâche archivée ;
- déplacer une tâche vers une autre colonne ;
- réordonner les tâches ;
- rechercher une tâche ;
- ouvrir les détails d’une tâche ;
- marquer une tâche comme terminée ;
- réouvrir une tâche terminée.

---

## Drag & Drop

Implémente un système complet de Drag & Drop.

Le déplacement doit permettre :

- de réordonner les tâches dans une même colonne ;
- de déplacer une tâche vers une autre colonne ;
- de déplacer une tâche à n’importe quelle position valide ;
- de déplacer une colonne ;
- de préserver automatiquement l’ordre après chaque déplacement ;
- de sauvegarder immédiatement les changements dans LocalStorage.

Le système doit également rester utilisable au clavier et ne doit pas dépendre exclusivement du Drag & Drop.

Chaque déplacement doit déclencher une mise à jour cohérente des données sans créer de doublons ni perdre les informations de la tâche.

---

## Priorités

Prévoir plusieurs niveaux de priorité, par exemple :

- faible ;
- normale ;
- élevée ;
- urgente.

La priorité doit être stockée dans les données et utilisable dans les recherches, filtres et tris.

---

## Étiquettes

Une tâche peut recevoir plusieurs étiquettes.

L’utilisateur doit pouvoir :

- créer une étiquette ;
- renommer une étiquette ;
- supprimer une étiquette ;
- affecter une ou plusieurs étiquettes à une tâche ;
- retirer une étiquette ;
- rechercher par étiquette ;
- filtrer par étiquette.

Les étiquettes doivent être gérées au niveau du tableau afin d’éviter les duplications inutiles.

---

## Sous-tâches

Chaque tâche peut contenir une checklist de sous-tâches.

Fonctionnalités :

- ajouter une sous-tâche ;
- modifier une sous-tâche ;
- supprimer une sous-tâche ;
- réordonner les sous-tâches ;
- marquer une sous-tâche comme terminée ;
- calculer automatiquement le pourcentage de progression ;
- afficher le nombre de sous-tâches terminées / totales.

Une tâche contenant des sous-tâches doit pouvoir calculer automatiquement sa progression.

---

## Dates d’échéance

Les tâches peuvent avoir une date d’échéance.

Gérer au minimum les états suivants :

- aucune échéance ;
- échéance future ;
- échéance aujourd’hui ;
- échéance proche ;
- échéance dépassée ;
- tâche terminée.

Prévoir la possibilité de :

- définir une échéance ;
- modifier une échéance ;
- supprimer une échéance ;
- détecter automatiquement les tâches en retard ;
- filtrer les tâches par état d’échéance ;
- trier les tâches selon leur échéance.

---

## Recherche globale

Implémente une recherche instantanée capable de rechercher dans :

- le titre des tâches ;
- les descriptions ;
- les étiquettes ;
- les commentaires ;
- les noms de tableaux ;
- les noms de colonnes ;
- les sous-tâches.

La recherche doit être tolérante aux différences de casse et gérer correctement les recherches partielles.

La recherche ne doit jamais modifier les données originales.

---

## Filtres

Prévoir un système de filtrage combinable.

Filtres possibles :

- tableau ;
- colonne ;
- statut ;
- priorité ;
- étiquette ;
- date d’échéance ;
- tâches terminées ;
- tâches non terminées ;
- tâches en retard ;
- tâches avec sous-tâches ;
- tâches sans échéance.

Plusieurs filtres doivent pouvoir être utilisés simultanément.

Prévoir également la possibilité de réinitialiser tous les filtres.

---

## Tri

Les tâches doivent pouvoir être triées selon différents critères :

- ordre manuel ;
- date de création ;
- date de modification ;
- échéance ;
- priorité ;
- titre ;
- progression ;
- temps estimé.

Le tri choisi ne doit pas détruire l’ordre manuel permanent sauf lorsqu’une action explicite demande de réorganiser les tâches.

---

## Vues et organisation

La logique de l’application doit permettre plusieurs modes de consultation des données, notamment :

- vue Kanban ;
- vue liste ;
- vue des tâches terminées ;
- vue des tâches en retard ;
- vue des tâches à échéance proche.

Les différentes vues doivent utiliser les mêmes données sources et rester synchronisées.

---

## Archives

Implémente un système d’archivage.

Une tâche archivée :

- ne doit plus apparaître dans la vue principale ;
- doit rester récupérable ;
- doit conserver toutes ses données ;
- doit pouvoir être restaurée.

Même logique pour les colonnes et les éléments qui peuvent être archivés.

Prévoir une zone permettant de consulter les éléments archivés.

---

## Corbeille

Implémente une corbeille permettant de récupérer les éléments supprimés récemment.

Prévoir :

- suppression vers la corbeille ;
- restauration ;
- suppression définitive ;
- vidage de la corbeille ;
- confirmation avant suppression définitive.

La corbeille doit également être persistée dans LocalStorage.

---

## Annuler / Rétablir

Implémente un historique local des principales opérations.

Le système doit permettre :

- annuler une action ;
- rétablir une action ;
- conserver plusieurs étapes d’historique ;
- gérer correctement les modifications complexes ;
- éviter que l’historique devienne incohérent après importation ou restauration.

Les opérations importantes pouvant entrer dans l’historique comprennent notamment :

- création ;
- suppression ;
- modification ;
- déplacement ;
- réorganisation ;
- archivage ;
- restauration.

---

## Sauvegarde LocalStorage

Toutes les données importantes doivent être sauvegardées automatiquement dans LocalStorage.

La sauvegarde doit avoir lieu après toute modification significative.

Stocker notamment :

- tableaux ;
- colonnes ;
- tâches ;
- étiquettes ;
- sous-tâches ;
- préférences fonctionnelles ;
- tableau actif ;
- filtres si nécessaire ;
- historique si nécessaire ;
- éléments archivés ;
- corbeille.

Ne jamais dépendre d’un serveur distant pour le fonctionnement principal.

Prévoir une gestion robuste des cas suivants :

- LocalStorage vide ;
- données corrompues ;
- ancienne version de données ;
- structure de données incompatible ;
- quota LocalStorage atteint.

L’application doit disposer d’une stratégie de migration de données afin que de futures évolutions puissent modifier le format interne sans détruire les données existantes.

---

## Import / Export

L’utilisateur doit pouvoir exporter les données localement.

Prévoir au minimum :

- export d’un tableau ;
- export de tous les tableaux ;
- import d’un tableau ;
- import de plusieurs tableaux.

Utiliser un format structuré et facilement réutilisable, par exemple JSON.

Lors de l’import :

- valider la structure ;
- vérifier les identifiants ;
- éviter les collisions ;
- gérer les données incomplètes ;
- refuser proprement les fichiers invalides ;
- préserver autant que possible les informations valides ;
- informer l’utilisateur en cas d’erreur.

Prévoir également une stratégie claire en cas d’import d’un tableau portant le même identifiant qu’un tableau existant.

---

## Duplication

Permettre de dupliquer :

- une tâche ;
- une colonne ;
- un tableau.

Lors de la duplication, générer de nouveaux identifiants uniques tout en conservant les propriétés appropriées.

Une tâche dupliquée ne doit jamais partager accidentellement ses sous-tâches, étiquettes ou métadonnées mutables avec la tâche originale.

---

## Statistiques

Prévoir des statistiques calculées localement à partir des données du tableau.

Exemples :

- nombre total de tâches ;
- tâches terminées ;
- tâches en cours ;
- tâches à faire ;
- tâches en retard ;
- taux de complétion ;
- nombre de tâches par priorité ;
- nombre de tâches par étiquette ;
- progression des tâches contenant des sous-tâches.

Les statistiques doivent être recalculées automatiquement après les modifications.

---

## Productivité

Ajouter plusieurs outils utiles à la gestion quotidienne des tâches.

Prévoir notamment :

- tâches prioritaires ;
- tâches arrivant bientôt à échéance ;
- tâches en retard ;
- tâches récemment modifiées ;
- tâches récemment terminées ;
- recherche des tâches nécessitant une attention particulière.

Prévoir également un système permettant de repérer facilement les tâches bloquées ou incomplètes.

---

## Temps et estimation

Chaque tâche peut disposer :

- d’une durée estimée ;
- d’un temps réellement passé.

Prévoir la possibilité de :

- saisir une estimation ;
- modifier l’estimation ;
- saisir du temps passé ;
- comparer estimation et temps réel ;
- calculer des statistiques globales.

Un minuteur local peut également être associé à une tâche.

Le minuteur doit :

- démarrer ;
- mettre en pause ;
- reprendre ;
- arrêter ;
- conserver le temps écoulé ;
- restaurer son état après un rafraîchissement de page.

Le minuteur ne doit utiliser aucun service externe.

---

## Récurrence

Permettre aux tâches de devenir récurrentes.

Prévoir plusieurs fréquences :

- quotidienne ;
- hebdomadaire ;
- mensuelle ;
- personnalisée.

Lorsqu’une tâche récurrente est terminée, le comportement doit être cohérent et permettre la création automatique de sa prochaine occurrence.

Les occurrences doivent conserver un historique compréhensible et ne doivent pas écraser les anciennes tâches terminées.

---

## Modèles de tableaux

Prévoir des modèles fonctionnels permettant de créer rapidement un tableau préconfiguré.

Exemples :

- gestion de projet ;
- tâches personnelles ;
- planification hebdomadaire ;
- contenu éditorial ;
- suivi d’idées ;
- développement logiciel ;
- liste de courses ;
- suivi d’objectifs.

Les modèles doivent uniquement servir à initialiser des données et ne doivent créer aucune dépendance serveur.

---

## Commandes rapides

Prévoir une logique de raccourcis clavier pour les actions fréquentes.

Exemples :

- créer une tâche ;
- rechercher ;
- fermer une fenêtre de détails ;
- annuler ;
- rétablir ;
- ouvrir le panneau d’aide ;
- naviguer entre les éléments ;
- déplacer une tâche.

Les raccourcis doivent être désactivés lorsqu’une saisie textuelle nécessite normalement ces touches.

---

## Accessibilité fonctionnelle

Même si le design sera réalisé séparément, toute la logique doit être compatible avec une utilisation accessible.

Notamment :

- navigation complète au clavier ;
- focus correctement géré ;
- éléments interactifs utilisables sans souris ;
- Drag & Drop alternatif au clavier ;
- états accessibles ;
- annonces des changements importants aux technologies d’assistance ;
- ordre logique de navigation ;
- contrôles avec des noms explicites.

Ne jamais rendre une fonctionnalité dépendante uniquement d’une interaction visuelle.

---

## URLs et navigation

L’application peut utiliser une navigation côté navigateur permettant de représenter certaines ressources dans l’URL.

Par exemple, l’état de navigation peut permettre d’identifier :

- le tableau actif ;
- une tâche ouverte ;
- une vue ;
- certains filtres.

Toute URL doit rester exploitable après actualisation lorsque cela est techniquement possible dans une application purement front-end.

La navigation doit rester cohérente sans nécessiter de compte.

---

## SEO et compréhension par les moteurs de recherche et les chatbots

L’application doit être optimisée pour le référencement naturel et pour la compréhension par les moteurs de recherche et les systèmes d’IA.

Le contenu public de l’application doit être sémantiquement clair et compréhensible.

Prévoir notamment :

- un titre de page pertinent ;
- une description meta pertinente ;
- une structure HTML sémantique ;
- des titres hiérarchisés correctement ;
- des contenus textuels explicites ;
- des attributs `aria` pertinents lorsque nécessaires ;
- des URLs propres lorsque pertinentes ;
- une structure de navigation compréhensible ;
- un contenu indexable correspondant réellement à la fonction de l’application ;
- des données structurées appropriées lorsque pertinentes ;
- des balises Open Graph utiles pour le partage ;
- des informations adaptées aux moteurs de recherche ;
- une bonne compréhension du contenu par les agents conversationnels et crawlers.

Ne pas ajouter de contenu artificiel ou de texte uniquement destiné à manipuler les moteurs de recherche.

Les textes présents dans l’application doivent rester centrés sur l’utilité réelle du produit.

Ne jamais afficher à l’utilisateur :

- le contenu de ce prompt ;
- les instructions de développement ;
- les numéros de sections du présent prompt ;
- les noms internes utilisés uniquement pour développer l’application ;
- les technologies utilisées ;
- la stack technique ;
- des informations destinées au développeur ;
- des commentaires expliquant la construction interne du site ;
- des références au fait qu’une IA a créé l’application.

---

## Données et sécurité locale

Puisqu’il n’y a aucun compte utilisateur ni backend :

- toutes les données appartiennent au navigateur local ;
- aucune synchronisation distante ne doit être introduite ;
- aucune information ne doit être envoyée vers un serveur externe ;
- ne pas ajouter d’analytics ou de tracking distant par défaut ;
- éviter toute dépendance à un service tiers pour les données utilisateur.

Les données stockées doivent être validées avant leur utilisation afin d’éviter qu’un état LocalStorage corrompu fasse planter l’application.

---

## Gestion des erreurs

Prévoir une gestion robuste des erreurs.

L’application doit :

- éviter les crashes lorsqu’une donnée est manquante ;
- gérer les données invalides ;
- gérer les imports incorrects ;
- gérer les suppressions d’éléments référencés ailleurs ;
- gérer les conflits d’identifiants ;
- gérer les erreurs de stockage ;
- restaurer un état cohérent lorsque cela est possible.

Les opérations critiques doivent être atomiques autant que possible afin d’éviter de sauvegarder un état partiellement modifié.

---

## Performance

La logique doit être conçue pour rester fluide avec un grand nombre de :

- tableaux ;
- colonnes ;
- tâches ;
- étiquettes ;
- sous-tâches ;
- entrées historiques.

Éviter les recalculs inutiles.

Éviter les écritures LocalStorage excessives lorsqu’elles ne sont pas nécessaires tout en garantissant que les données importantes sont sauvegardées rapidement.

Les opérations de recherche, filtrage, tri et calcul statistique doivent rester efficaces avec des volumes de données importants pour une application locale.

---

## Architecture des données

Définis une structure de données cohérente, extensible et versionnée.

Chaque objet important doit avoir un identifiant stable et unique.

Prévoir des métadonnées permettant d’évoluer ultérieurement sans casser les anciennes données.

Séparer logiquement :

- données persistantes ;
- état temporaire d’interface ;
- état de navigation ;
- historique ;
- données archivées ;
- corbeille.

Éviter les duplications inutiles de données.

Les relations entre les tableaux, colonnes, tâches, étiquettes et sous-tâches doivent être déterministes et facilement réparables en cas d’incohérence.

---

## État initial

Lors de la toute première utilisation, créer automatiquement un environnement fonctionnel avec au moins un tableau et les colonnes :

À faire → En cours → Terminé.

L’utilisateur doit pouvoir immédiatement créer une première tâche sans configuration préalable.

Lors des visites suivantes, restaurer l’état précédemment sauvegardé.

---

## Fonctionnement sans réseau

Le cœur de l’application doit rester fonctionnel sans réseau.

Après chargement initial :

- les tableaux doivent être accessibles ;
- les tâches doivent être modifiables ;
- le Drag & Drop doit fonctionner ;
- les recherches doivent fonctionner ;
- les filtres doivent fonctionner ;
- les statistiques doivent fonctionner ;
- les imports/exports doivent fonctionner ;
- le stockage local doit fonctionner.

Prévoir un comportement résilient lorsque la connexion réseau n’est pas disponible.

---

## Règles importantes

Le produit ne doit jamais introduire :

- compte utilisateur ;
- inscription ;
- connexion ;
- mot de passe ;
- profil utilisateur ;
- synchronisation cloud ;
- backend ;
- base de données distante ;
- abonnement ;
- paiement ;
- espace administrateur ;
- fonctionnalités nécessitant un serveur.

Tout doit fonctionner localement dans le navigateur.

Ne crée pas de fonctionnalités fictives qui nécessiteraient un backend.

---

## Qualité attendue

Le résultat doit être une application réellement fonctionnelle et cohérente, pas simplement une démonstration.

Toutes les interactions importantes doivent être reliées aux données réelles.

Une action effectuée par l’utilisateur doit mettre à jour :

1. l’état courant ;
2. les données persistantes ;
3. les vues concernées ;
4. les statistiques concernées ;
5. l’historique lorsque pertinent.

Aucune fonctionnalité annoncée ne doit être une simple simulation visuelle.

Teste les cas normaux et les cas limites :

- tableau vide ;
- colonne vide ;
- tâche sans description ;
- tâche sans échéance ;
- grand nombre de tâches ;
- suppression d’éléments liés ;
- import invalide ;
- données LocalStorage corrompues ;
- actualisation de la page ;
- navigation entre tableaux ;
- déplacement rapide de plusieurs tâches ;
- utilisation uniquement au clavier ;
- absence de connexion réseau.

Le produit final doit donner la sensation d’un véritable outil personnel de gestion de tâches complet, fiable et durable, tout en restant **100 % front-end, sans compte et sans backend**.

Le nom public de l’application est **Flow DECK**.
