# DINEE Platform — modèle de domaine

Statut : conception de phase 0 ; schéma initial migré en phase 1. Les transitions et fonctionnalités décrites restent à livrer dans leurs phases respectives. Voir [architecture](architecture.md) et [périmètre produit](product-mvp.md). Les champs ci-dessous définissent les responsabilités et invariants ; les migrations seront introduites selon les phases autorisées.

## Entités et responsabilités

| Entité | Champs essentiels et responsabilité |
| --- | --- |
| users | email de connexion normalisé unique, password haché, role admin/member, email_verified_at ; identité authentifiée |
| profiles | user_id nullable unique, prénom, nom, photo privée, téléphone/email/LinkedIn normalisés, entreprise, fonction, secteur, bio, intérêts, recherche, apports, disponibilité, source, joined_at, created_by |
| events | titre, starts_at UTC, timezone, lieu, description, capacité indicative positive nullable, status, created_by |
| event_selections | event_id, profile_id, selected_by, selected_at, withdrawn_at nullable ; sélection humaine, unique(event_id, profile_id) |
| invitations | event_selection_id unique, status, sent_at nullable, responded_at nullable, future_interest nullable, token_hash unique, token_expires_at, token_revoked_at nullable |
| invitation_follow_ups | invitation_id, recorded_by, sent_at, identifiant d'opération unique ; trace de chaque relance déclarée |
| attendances | event_selection_id unique, status present/absent, recorded_by, recorded_at ; constat réel |
| recommendations | recommender_profile_id, coordonnées proposées et motif, status, recommended_profile_id nullable, reviewed_by/at ; proposition soumise à décision |

Les données professionnelles peu structurées (intérêts, recherche, apports) restent des textes courts validés en V1 ; pas de taxonomie ou moteur de matching. Source du profil : manual, import, recommendation. Disponibilité : unspecified, available, temporarily_unavailable.

## Relations

- User possède zéro ou un Profile ; Profile possède zéro ou un User via profiles.user_id. Le compte n'est pas requis à la création du profil. La liaison est unique et réservée à l'activation contrôlée.
- Event possède plusieurs EventSelections ; Profile possède plusieurs EventSelections.
- Une sélection possède zéro ou une Invitation et zéro ou une Attendance. Invitation et Attendance obtiennent event/profile via cette sélection, sans clés redondantes.
- Invitation possède plusieurs FollowUps. Les compteurs et dates de dernière relance sont calculés à partir de ces lignes.
- Recommendation appartient à un profil recommandant et pointe éventuellement vers un profil admis après examen. Les informations proposées restent un instantané de la soumission ; elles n'écrasent pas les coordonnées d'un profil existant.

Les clés étrangères protègent l'intégrité ; conserver les références historiques, refuser les suppressions qui les casseraient. Pas de table d'historique dupliquant les invitations et présences.

## États persistés et transitions

### Édition

EventStatus : draft, upcoming, completed, cancelled.

- draft → upcoming : champs essentiels valides, date future ; l'édition devient invitante.
- draft/upcoming → cancelled : annule les invitations actives et révoque les liens dans une transaction.
- upcoming → completed : à partir du début de l'édition, action administrative explicite.
- completed/cancelled terminaux en V1. Pas de suppression ou réouverture silencieuse.
- Une édition upcoming passée reste à clôturer ; elle ne continue pas à accepter des réponses ou produire des relances.
- Les modifications de date/lieu ne déclenchent aucun message automatique. Avertir l'admin si des invitations ont été envoyées.

### Sélection

Une ligne active représente « sélectionné ». Autorisée sur une édition draft/upcoming future. Retirer une sélection renseigne withdrawn_at et annule/révoque son invitation ; pas de retrait après présence enregistrée. Resélectionner réactive la même ligne, sans réactiver automatiquement une ancienne invitation. Une contrainte unique empêche les doublons lors d'un double clic.

### Invitation

InvitationStatus : pending, accepted, declined, cancelled.

- Création : sélection active, édition upcoming future ; pending, sent_at null, nouveau token.
- Envoi déclaré : action admin explicite après WhatsApp, sent_at renseigné une seule fois. Ouvrir WhatsApp ne change rien en base. La date décrit une déclaration humaine, pas un accusé de réception.
- pending → accepted/declined : token valide ou membre propriétaire, édition active future ; responded_at renseigné. Une réponse est possible même si l'admin a oublié de déclarer l'envoi ; ne pas inventer sent_at.
- accepted ↔ declined : correction autorisée avant début, même validation ; répétition de la même réponse idempotente.
- Refus : future_interest booléen proposé explicitement, ne pas déduire true sans choix. Acceptation : remettre ce champ à null.
- pending/accepted/declined → cancelled : admin, retrait de sélection ou annulation de l'édition ; révocation immédiate.
- cancelled est terminal en V1 : pas de réémission ni de remise à zéro implicite. Une resélection après annulation conserve cet état ; cette limite est expliquée dans l'interface. La rotation d'un lien non annulé reste disponible sans recréer une invitation.

Expiration/révocation du lien ne sont pas des statuts de réponse. Une révocation bloque l'accès public ; une annulation bloque aussi la réponse authentifiée. Une simple rotation conserve réponse, sent_at et relances. Expiration par défaut au début du dîner ; possibilité de révocation anticipée.

### Présence

AttendanceStatus persisté : present ou absent. « pending » signifie absence de ligne, évitant un état stocké pour chaque sélection.

Admin seulement, édition commencée upcoming/completed et non annulée, sélection active. Une confirmation n'est pas une présence. Un invité ayant oublié de répondre peut être marqué présent ; ne pas changer sa réponse automatiquement. Une présence peut être corrigée en absence et inversement. Aucun absent créé automatiquement à la clôture : conserver « non renseigné » jusqu'au constat humain.

### Recommandation

RecommendationStatus : pending, accepted, rejected.

Créer pending avec un recommandant identifié, un nom, une fonction, une entreprise et un motif ; téléphone/email/LinkedIn facultatifs. Le membre ne choisit pas recommender_profile_id.

pending → accepted : admin choisit de créer un profil ou de rattacher un doublon existant, puis renseigne recommended_profile_id et reviewed_by/at dans la même transaction. Une nouvelle admission reçoit source=recommendation et joined_at. Pas de compte, sélection ou invitation automatique.

pending → rejected : décision admin, aucune admission. États terminaux V1 ; double décision concurrente refusée ou traitée de façon idempotente. Le recommandant voit sa proposition et son statut, jamais le dossier privé du profil résultant.

## Relances et indicateurs calculés

Paramètre global follow_up_delay_hours = 48, entier strictement positif, configurable. Pour une invitation :

```text
follow_up_count = nombre de relances déclarées
last_follow_up_at = date maximale de ces relances, ou null
last_contact_at = last_follow_up_at sinon sent_at
à_relancer = sélection active
             ET édition upcoming ET maintenant < starts_at
             ET status = pending ET sent_at non null
             ET last_contact_at + délai <= maintenant
```

Un lien expiré/révoqué n'efface pas le besoin de suivi : signaler « lien à renouveler » avant la préparation du message. Une relance déclarée exige pending, sent_at non null, édition future active et échéance atteinte ; elle est horodatée côté serveur. Identifiant d'opération unique pour éviter deux relances par retry/double clic. count et last_follow_up_at sont exposés par Resource, jamais modifiables directement par le client. L'indexation des relances et des invitations doit soutenir la requête du cockpit.

Compteurs d'une édition : sélectionnés = sélections actives ; à envoyer = sélections actives sans invitation ou avec invitation pending non envoyée ; envoyées = invitations non annulées avec sent_at ; confirmations/refus = réponses accepted/declined ; sans réponse = pending avec sent_at ; à relancer = sous-ensemble calculé ci-dessus. Ces ensembles se chevauchent : ne pas les additionner. Une réponse sans sent_at doit afficher « réponse reçue, envoi non déclaré » et ne pas revenir dans la file à envoyer.

Prochaine édition : upcoming avec starts_at futur minimal. Recommandations nouvelles : pending. S'il n'y a aucune prochaine édition, afficher un état vide explicite, pas les chiffres d'une édition passée.

## Historique

Projection des sélections, éditions, invitations et présences. Priorité d'affichage : présence/absence constatée, puis réponse, puis invitation envoyée, puis sélection côté admin uniquement. Une édition annulée conserve sa mention et ne compte pas comme participation. « Nombre de participations » compte seulement present.

Historique membre limité à son profil et aux éditions pour lesquelles une invitation a été envoyée, une réponse enregistrée ou une présence constatée. Ne jamais exposer les autres sélectionnés, les notes administratives ou les coordonnées de tiers.

## Doublons et concurrence

- Email : espaces extérieurs retirés, normalisation de casse ; pas de suppression des points ou suffixes spécifiques à certains fournisseurs.
- Téléphone : format E.164 avec indicatif confirmé ; préremplir +243 dans l'interface sans convertir arbitrairement un numéro ambigu.
- LinkedIn : URL de profil canonique HTTPS, suppression des paramètres de tracking et slash terminal ; validation sans téléchargement.
- Valeurs absentes stockées null, pas en chaîne vide. Index uniques sur les identifiants normalisés retenus pour éviter les doublons exacts ; gérer explicitement les coordonnées partagées comme conflit à examiner, pas comme preuve d'identité.
- Nom seul : avertissement de similitude, jamais fusion automatique. Identifiants correspondant à plusieurs profils différents : arrêter la ligne d'import et demander une résolution administrative.
- CSV : validation avant écriture, prévisualisation et bilan par ligne ; pas de mise à jour destructive implicite. Contraintes SQL restent nécessaires même après détection préalable.
- Aucun rapprochement automatique User/Profile par simple saisie d'email. Vérification d'identité indépendante obligatoire.
- Transactions et verrous ciblés pour réponse/annulation, relance, acceptation de recommandation et sélection. Ne pas laisser la validation HTTP seule garantir l'état.

## Autorisations à tester

| Action | Admin | Membre | Token public |
| --- | --- | --- | --- |
| Réseau, édition, sélection, cockpit | Oui | Non | Non |
| Dossier et historique | Profils autorisés | Son profil seulement | Non |
| Réponse invitation | Correction contrôlée | La sienne, active | Celle du token valide |
| Envoi/relance/présence | Oui | Non | Non |
| Compléter profil/disponibilité | Oui | Son profil seulement | Non |
| Recommander | Si profil recommandant lié | Oui | Non |
| Décider une recommandation | Oui | Non | Non |

Prévoir tests aux bornes exactes des 48h, à l'expiration et au début de l'événement, ainsi que tokens révoqués, retrait de sélection, annulation, doubles requêtes, absence de compte, doublons CSV et accès croisé entre deux membres. Les critères détaillés de livraison figurent dans le cadrage produit.
