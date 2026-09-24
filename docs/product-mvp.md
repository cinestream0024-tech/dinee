# DINEE Platform — cadrage MVP

Statut : phase 0, 24 septembre 2026. Conception uniquement ; aucune fonctionnalité métier décrite ici n'est encore implémentée. La phase 1 attend la validation explicite du commanditaire.

## Objectif

Le DINEE est un réseau professionnel privé et curaté à Kinshasa. La plateforme structure la relation dans le temps ; Yannick décide des admissions, des sélections et des invitations. Elle doit réduire les oublis et les relances manuelles tout en permettant aux membres de maintenir leurs informations.

Un profil représente une personne, un utilisateur représente un accès authentifié. Le réseau peut contenir 600 profils et seulement 120 comptes activés. Aucune inscription publique ne donne accès au réseau.

## Périmètre IN

| Expérience | Livrables V1 |
| --- | --- |
| Administration | Éditions, réseau privé, création et import CSV de profils, sélection manuelle, invitations personnelles, relances, présences, examen des recommandations |
| Cockpit | Prochaine édition, sélectionnés, invitations à envoyer, envoyées, confirmations, refus, sans réponse, à relancer, recommandations en attente |
| Membre | Profil personnel, disponibilité, invitations, réponse, historique personnel, recommandation d'une personne |
| Invité | Consultation minimale et réponse sans compte par lien sécurisé ; proposition d'activation après la réponse |
| Mobile | Une application React, interfaces membre/public légères, PWA installable et shell disponible après chargement |

WhatsApp reste semi-automatique : ouvrir un message prérempli ne prouve aucun envoi. Seule une confirmation explicite de l'admin enregistre l'envoi ou la relance. Aucun message n'est envoyé automatiquement.

L'import V1 utilise un CSV documenté, une prévisualisation, des erreurs par ligne et la détection des doublons. Il ne remplace pas silencieusement un profil existant. Pas d'import WhatsApp ni de synchronisation CRM.

## Périmètre OUT

Pas de feed, messagerie, chat, application native, marketplace, paiement, abonnement, gamification, IA, matchmaking, recommandations algorithmiques, annuaire public, CRM générique ou intégration WhatsApp Business complète. Pas de cache offline des données personnelles. Pas d'accès automatique aux profils des autres participants.

Les connexions intentionnelles entre membres restent une évolution future : aucune table ni interface dédiée en V1. Les identifiants stables des profils et éditions permettront de l'ajouter avec des règles de consentement.

## Parcours de référence

1. Yannick crée Patrick dans son réseau sans compte.
2. Il crée une édition et y sélectionne Patrick.
3. Il crée l'invitation, ouvre WhatsApp puis confirme manuellement son envoi.
4. Patrick consulte le lien et confirme ou décline sans inscription. En cas de refus, il peut demander à être considéré pour une prochaine édition.
5. Sans réponse, l'invitation apparaît à relancer après 48 heures ; chaque relance effectivement confirmée repousse cette échéance.
6. L'équipe marque la présence après le dîner ; l'historique de Patrick reflète la participation.
7. Patrick active ensuite son compte par une procédure distincte de vérification d'identité, complète son profil et recommande Sarah.
8. Yannick accepte ou refuse la recommandation. Accepter Sarah dans le réseau ne la sélectionne ni ne l'invite automatiquement.

## Décisions produit

- Capacité indicative : avertissement en cas de dépassement, pas de liste d'attente ou de refus automatique.
- Français par défaut pour DINEE ; conserver l'infrastructure i18n et compléter les locales en/ar/es/de prescrites par AGENTS.md lors de l'implémentation.
- Disponibilité : disponible, temporairement indisponible, non renseignée. Elle informe Yannick sans bloquer ses décisions.
- Le souhait exprimé lors d'un refus est conservé sur cette invitation ; la disponibilité générale du profil reste une préférence distincte.
- Une réponse peut être corrigée avant le début d'une édition active et tant que le lien est valide. Après le début, seules les corrections administratives sont permises.
- Un lien transféré peut être utilisé par son détenteur : il autorise seulement la consultation minimale et la réponse à cette invitation, jamais l'activation directe d'un compte.
- L'historique membre contient ses sélections/invitations/présences pertinentes, sans révéler d'autres éditions privées. Une sélection non encore invitée reste administrative.
- « Non invité » peut être calculé pour une édition consultée par l'admin ; aucune ligne artificielle pour chaque combinaison profil/édition.
- Les recommandations en attente restent séparées du réseau admis. Le membre ne peut consulter ni un profil tiers existant ni la détection de doublons interne.

## Phases et critères de sortie

| Phase | Périmètre autorisable | Vérification attendue |
| --- | --- | --- |
| 0 | Inspection et ces trois documents | Cohérence produit/domaine/architecture, inventaire et limites explicites |
| 1 | Laravel, migration du frontend existant, connexion API, MySQL, auth de base, trois layouts, modèles/migrations/factories/seeders initiaux et policies | Installation reproductible, migrations MySQL, connexion/déconnexion, séparation admin/membre, build et lint |
| 2 | Édition + profil + sélection, import CSV, historique de base | Boucle API/UI fonctionnelle et testée avant invitations |
| 3 | Invitations, réponse publique, WhatsApp, relances, cockpit et présence | Tokens invalides/révoqués/expirés, transitions, seuils de relance, check-in et autorisations |
| 4 | Espace membre, activation, profil, disponibilité, historique | Identité vérifiée, accès strictement personnel et parcours mobile |
| 5 | Recommandations et décision administrative | Attribution, acceptation/rejet, doublons, aucune admission automatique |
| 6 | PWA, finition mobile, démonstration, documentation et nettoyage | Boucle complète, installation et shell offline sans données métier mises en cache |

Chaque phase se termine par un rapport et un STOP. Aucune phase suivante sans accord explicite. À l'intérieur d'une phase : modèle, API, validation/policies, tests backend, frontend, tests pertinents et validation manuelle.

## Matrice de validation prévue

Backend : profil sans utilisateur, création d'édition, sélection unique, invitation, réponse publique, refus avec intérêt futur, confirmation, calcul de relance, enregistrement de relance, présence/absence, historique personnel, recommandation, permissions et rejet des tokens invalides/révoqués. Ajouter expiration, bornes temporelles, double clic et isolation entre membres.

Frontend : réponse publique, édition du profil, dashboard, filtre à relancer et recommandation ; états chargement/erreur/vide, clavier, mobile et RTL. Les tests arriveront avec leur tranche, sans simuler leur réussite en phase 0.

## Mesure de réussite

La boucle Patrick → édition → invitation → réponse/relance → présence → historique → recommandation Sarah doit fonctionner intégralement. Le cockpit doit identifier sans calcul manuel les actions urgentes et distinguer un message préparé d'un envoi déclaré. Aucun gain de temps chiffré n'est supposé avant observation de l'usage.
