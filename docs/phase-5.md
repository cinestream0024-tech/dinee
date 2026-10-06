# Phase 5 — Recommandations

## Périmètre livré

- Un membre authentifié peut proposer une personne et consulter uniquement ses propres recommandations.
- Les coordonnées sont normalisées et une soumission pendante identique du même membre est bloquée.
- L’administrateur peut filtrer les recommandations, identifier un profil existant partageant les mêmes coordonnées, accepter ou refuser.
- Une acceptation crée un profil sans compte avec `source=recommendation`, ou rattache la recommandation à un profil existant.
- Aucune recommandation ne crée automatiquement un compte, une sélection ou une invitation.

## Transitions

`pending` peut devenir `accepted` ou `rejected`. Une décision enregistrée est définitive dans le MVP. L’auteur de la décision et sa date sont conservés.

## Confidentialité

Le serveur déduit toujours le profil recommandant depuis la session. Le membre ne peut ni choisir cet identifiant ni consulter les propositions d’un autre membre. Les doublons potentiels et l’identité des autres profils restent réservés à l’administration.

## Endpoints

- `GET|POST /api/v1/member/recommendations`
- `GET /api/v1/admin/recommendations`
- `POST /api/v1/admin/recommendations/{id}/accept`
- `POST /api/v1/admin/recommendations/{id}/reject`
