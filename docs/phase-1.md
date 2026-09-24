# Phase 1 — fondations techniques

## État et périmètre

Phase 1 terminée et vérifiée le 24 septembre 2026.
La phase 2 a été explicitement autorisée par le commanditaire pendant la validation finale ; elle ne démarre qu'après fermeture de cette phase.

## Livrables

- Dépôt Git initialisé ; commit de référence `c4f3ee6`, avec sources TailAdmin et documents de phase 0.
- Frontend déplacé sous frontend/ avec ses composants, assets, licence conservée à la racine et lockfile.
- Backend Laravel 13.33.0 / Sanctum 4.3.3 ; schéma MySQL et données fictives.
- Authentification réelle, déconnexion, utilisateur courant, rôles admin/member, policies Profile/Event.
- Trois layouts, routes protégées, client API centralisé, TanStack Query, français par défaut et chaînes DINEE traduites en cinq langues.
- Routes métier avancées absentes ; les pages correspondantes restent des placeholders.
- Documentation de démarrage, tests et contrôle du schéma.

## Schéma obtenu

Tables domaine : users, profiles, events, event_selections, invitations, invitation_follow_ups, attendances, recommendations.
Tables techniques Laravel : migrations, password_reset_tokens, sessions, cache, cache_locks, jobs, job_batches, failed_jobs.

profiles.user_id est nullable et unique. Une sélection est unique par paire édition/profil.
Invitation et présence sont chacune uniques par sélection. Les relations historiques ont des clés étrangères restrictives.
Les contacts email/téléphone passent par ContactNormalizer ; numéros locaux ambigus rejetés, contacts absents à null.
Les futurs modules n'ont ni contrôleurs de mutation ni transitions exposées en phase 1.

## Vérifications

- MySQL : migrations et seeders exécutés sur dinee ; tests sur dinee_test.
- Backend : 24 tests, 79 assertions, tous réussis.
- Frontend : 15 tests réussis, build réussi.
- Lint : zéro erreur, quatre avertissements Fast Refresh hérités des contextes.
- Chromium 153 headless : connexion admin, session après rechargement, API/DB, navigation mobile, déconnexion, connexion membre, accès admin refusé côté UI et API, CSRF réel et RTL réussis.
- Captures desktop 1440×1000 et mobile 390×844 inspectées ; aucun débordement horizontal ni erreur JavaScript.
- Pint et git diff --check : réussis. Tous les fichiers src/public initiaux sont présents sous frontend/. Seuls les .env.example assainis sont suivis.

## Décisions précisées depuis la phase 0

Laravel compatible PHP 8.3 a été résolu en version 13. La session Sanctum suffit : aucune API de jetons personnels n'est ouverte.
Actions de session dans un service dédié ; pas de dossiers d'actions vides.
Les mutations auth utilisent les routes web avec préfixe /api/v1 pour rendre la protection CSRF indépendante de la détection stateful.
Le client envoie seulement l'origine dans Referer pour Sanctum, malgré la politique générale no-referrer.
Les chaînes DINEE sont traduites ; les démos non routées conservent leurs textes historiques.
TailAdmin est adapté au menu DINEE avec ses tokens, primitives et contexte sidebar, sans thème concurrent.

## Limites

La phase 1 ne livre ni CRUD métier, ni import, ni invitation fonctionnelle, ni relance, ni présence opérationnelle, ni activation membre. Ces sujets suivent le plan approuvé.
Root MySQL sans mot de passe et comptes de démonstration sont strictement locaux.
Le transport email/activation et le déploiement sécurisé restent à configurer dans leurs phases.
Les quatre avertissements Fast Refresh ne bloquent ni le build ni l'usage ; leur refactorisation n'est pas requise pour cette fondation.
Les commandes ont nécessité une exécution autorisée hors du bac à sable Windows défaillant. Aucune protection globale n'a été désactivée.
