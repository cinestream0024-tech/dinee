# DINEE Platform — architecture et inspection

Statut : décisions de phase 0, complétées par les fondations de phase 1 le 24 septembre 2026. L’inventaire ci-dessous décrit l’état initial ; voir [phase 1](phase-1.md) et [développement](development.md) pour l’état implémenté. Voir [le cadrage](product-mvp.md) et [le domaine](domain-model.md).

## État constaté du workspace

| Élément | Observation directe |
| --- | --- |
| Versionnement | `git status --short` échoue : aucun dépôt Git dans ce dossier ou ses parents. Aucun historique local permettant un retour arrière Git |
| Frontend | Template TailAdmin à la racine : src/, public/, package.json, package-lock.json, Vite, TypeScript et ESLint |
| Provenance | README annonce TailAdmin Free, LICENSE.md contient la licence MIT ; AGENTS.md annonce Pro. Ne pas supposer des composants Pro disponibles |
| Versions déclarées | React ^19.2.7, Vite ^8.2.2, Tailwind ^4.3.3, TypeScript ^5.8, React Router ^8.3.1. AGENTS.md mentionne Router v7 et TS ~5.7 : manifeste et vérification d'installation guideront la compatibilité |
| Routage | src/App.tsx : pages de démonstration, AppLayout et formulaires auth ; aucune protection DINEE constatée |
| Auth | SignInForm.tsx est une interface de démonstration, pas une intégration Sanctum |
| i18n | Bootstrap existant, uniquement en/common.json et locale en active ; ar/es/de annoncées absentes |
| Design | Tokens @theme dans src/index.css, composants UI/form, contextes thème/langue/sidebar réutilisables ; police Outfit chargée depuis Google Fonts |
| Backend | Aucun backend/, composer.json ou code Laravel présent |
| Tests/PWA | Pas de suite de tests ni de manifest/service worker identifiés ; aucun script test dans package.json |
| Dépendances | node_modules absent. Lockfile npm v3, dépendances racine alignées au manifeste |

Environnement observé : PHP CLI 8.3.30, Composer 2.10.3, extensions pdo_mysql, pdo_sqlite, mbstring, openssl, intl, curl, fileinfo et zip disponibles. Node du PATH : 24.19.0 ; npm absent du PATH. Laragon fournit `D:/laragon/bin/nodejs/node-v22/node.exe` 22.22.0 et `npm.cmd` 10.9.4. Client MySQL 8.4.3 disponible sous Laragon, absent du PATH. La disponibilité du serveur, les identifiants et la connexion MySQL ne sont pas validés.

## Arborescence cible

```text
dinee/
├── AGENTS.md
├── README.md
├── backend/
│   ├── app/
│   │   ├── Actions/{Auth,Events,Profiles,Selections,Invitations,Attendance,Recommendations}/
│   │   ├── Enums/
│   │   ├── Models/
│   │   ├── Policies/
│   │   ├── Http/{Controllers,Requests,Resources}/
│   │   └── Services/Messaging/
│   ├── config/dinee.php
│   ├── database/{migrations,factories,seeders}/
│   ├── routes/{api,web}.php
│   ├── tests/{Feature,Unit}/
│   └── .env.example
├── frontend/
│   ├── public/                 # assets existants puis manifest/icônes
│   ├── src/
│   │   ├── App.tsx             # déclaration unique des routes
│   │   ├── layouts/{AdminLayout,MemberLayout,PublicLayout}.tsx
│   │   ├── features/{auth,events,profiles,invitations,attendance,recommendations}/
│   │   ├── pages/{admin,member,public}/
│   │   ├── services/           # client HTTP commun
│   │   ├── components/         # primitives TailAdmin et UI réutilisable
│   │   ├── types/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── icons/
│   │   ├── i18n/
│   │   ├── locales/{fr,en,ar,es,de}/
│   │   └── index.css           # tokens et utilitaires centralisés
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
└── docs/
    ├── product-mvp.md
    ├── architecture.md
    └── domain-model.md
```

Ces dossiers seront créés au moment utile ; pas de modules vides construits en parallèle. La structure demandée par le commanditaire remplace le singulier layout/ du template ; les règles de composants, tokens, icônes, traduction et RTL restent applicables sous frontend/.

## Migration de l'existant, phase 1 seulement

Préserver et versionner ou sauvegarder l'état initial avant déplacement. Déplacer les sources, assets, configurations et manifests frontend ensemble, conserver la licence et le lockfile. Adapter les chemins et commandes, puis vérifier build/lint avant et après migration. Garder les démos comme référence au début, retirer leurs routes de l'application produit progressivement, sans suppression massive non revue. Mettre à jour README et les conventions de chemins lorsque la migration est effective.

Aucune installation, suppression ou migration de code en phase 0. Les dépendances Laravel/Sanctum, TanStack Query et tests sont prévues ; établir les versions compatibles et la liste d'installation lors de la phase 1. Respecter la règle locale d'accord avant ajout de packages ; ne pas ajouter de dépendance optionnelle sans nécessité.

## Décisions d'architecture

1. Monolithe API Laravel et une seule SPA React. Pas de microservices, Redux, repository générique ou bus de commandes.
2. Laravel devra être une version maintenue compatible avec PHP 8.3.30 ; vérifier les contraintes Composer lors de l'installation, sans imposer ici un numéro non testé. MySQL est la référence de développement et d'intégration ; SQLite pourra accélérer des tests isolés sans remplacer la validation MySQL.
3. Controllers minces : Form Requests pour les entrées, Policies pour les droits, Actions métier pour transitions et transactions, Resources explicites pour les sorties. Les contraintes SQL doublent les protections applicatives contre les courses.
4. Sanctum en mode session/cookies pour la SPA, avec CSRF, rotation de session à la connexion et invalidation à la déconnexion. Aucun jeton d'authentification dans localStorage. Un seul domaine de déploiement privilégié ; proxy Vite vers Laravel en développement pour API, auth et cookie CSRF. CORS limité aux origines explicites si nécessaire.
5. Rôles V1 admin/member, comptes admin provisionnés par procédure contrôlée. Aucun champ role ou profile_id modifiable par le formulaire membre. Pas d'inscription publique libre. Un admin peut ne pas posséder de profil.
6. Activation membre distincte du lien d'invitation : lien d'activation unique, expirant et haché, délivré à un contact vérifié ou après vérification humaine par l'équipe. Une invitation transférable ne suffit jamais à revendiquer le profil. Prévoir récupération d'accès par email vérifié ; le transport de production sera configuré avant mise en service, sans fausse délivrance.
7. TanStack Query pour les données serveur, état local pour les formulaires ; React Hook Form/Zod uniquement si le besoin justifie leurs dépendances. Les validations Laravel restent la référence. Vider le cache Query à la déconnexion ou au changement d'identité.
8. AdminLayout reprend TailAdmin ; MemberLayout et PublicLayout ont une navigation minimale et de grandes cibles tactiles. Tokens DINEE centralisés dans index.css, y compris rayons et typographie ; mode sombre et propriétés logiques conservés.
9. UTC en base ; fuseau métier Africa/Kinshasa et affichage explicite. Les paramètres métier, dont le délai de 48h, résident dans config/dinee.php avec configuration d'environnement.
10. Séparer composition du message WhatsApp et enregistrement métier d'un envoi déclaré. Une future passerelle officielle pourra enregistrer une preuve de livraison distincte sans modifier les réponses ou sélections.

## Surfaces API prévues

| Surface | Exemples | Autorisation |
| --- | --- | --- |
| Auth | session, connexion, déconnexion, activation | CSRF, limitation de tentatives, vérification d'identité |
| /api/admin | events, profiles, selections, invitations, follow-ups, attendance, recommendations, dashboard | Sanctum + rôle et Policy par ressource |
| /api/member | me/profile, invitations, history, recommendations | Profile lié à la session, jamais un identifiant arbitraire choisi par le client |
| /api/public | consultation et réponse d'invitation | Token limité à cette invitation ; réponse minimale et rate limiting |

Réponses paginées pour les listes ; filtres validés côté serveur. Erreurs cohérentes : 401 non connecté, 403 non autorisé, 404 ressource/token inaccessible, 409 conflit métier, 422 validation, 429 limitation. Les requêtes publiques ne confirment pas l'existence d'un profil ou la cause précise d'invalidité d'un lien.

## Confidentialité et sécurité

Tokens d'invitation : 32 octets aléatoires cryptographiques, encodage URL-safe, empreinte SHA-256 en base, expiration et révocation. Le brut est retourné une seule fois à la création/rotation ; il n'apparaît ni dans les listes API ni dans les logs. Repréparer ultérieurement un message nécessite une rotation explicite, qui invalide l'ancien lien et avertit l'admin. Aucune rotation implicite à l'ouverture du cockpit.

La route demandée /invitation/{token} transporte un secret de capacité, jamais nom, email ou téléphone. Protéger aussi ce secret : HTTPS, Referrer-Policy no-referrer, Cache-Control no-store pour les réponses sensibles, suppression des tokens dans les journaux serveur/proxy/erreurs, aucun analytics ou contenu tiers sur cette page. Limiter les requêtes publiques par IP et empreinte de token, avec stockage partagé en production. Token, édition active et échéance vérifiés dans chaque lecture/écriture, sous transaction lors des réponses.

Resources dédiées admin, membre et public : jamais de sérialisation automatique de relations privées. Le public reçoit seulement les détails nécessaires du dîner et de sa réponse. Photos validées par type/taille, stockage privé et accès autorisé ; aucun lien public permanent vers les pièces personnelles. Aucune récupération serveur d'URL LinkedIn fournie par l'utilisateur.

Conserver created_by, selected_by, recorded_by, reviewed_by et horodatages pertinents afin de pouvoir ajouter un audit log plus tard. Ne pas enregistrer les tokens bruts dans des événements ou traces. Les règles d'effacement et de conservation des données devront être convenues avant la production ; pas de suppression en cascade de l'historique via une action UI V1.

## PWA et déploiement prévus

Manifest avec nom provisoire, couleurs issues des tokens, icônes remplaçables, scope et start_url non sensibles. Service worker limité au shell et aux assets statiques ; ne jamais mettre en cache API, réponses auth, URLs d'invitation ou données métier. Hors ligne : interface d'indisponibilité explicite, aucune réponse ou mutation mise en attente. HTTPS et fallback SPA nécessaires au déploiement. Prévoir une police locale ou un repli système pour éviter la dépendance réseau du template.

## Vérifications de phase 0 et limites

- Inspection des fichiers, routes, formulaires auth, configuration i18n, thème, licence et scripts : effectuée.
- Versions CLI PHP/Composer/Node/npm/client MySQL et extensions PHP : contrôlées sans connexion à une base.
- JSON package.json et package-lock.json : parse valide, dépendances racine cohérentes.
- Documents : vérifier présence, liens relatifs, marqueurs Markdown et maintien du STOP avant phase 1.
- Build, lint et tests applicatifs : non exécutés ; node_modules absent, backend et scripts de tests absents. Aucun résultat de compilation ou de parcours navigateur n'est revendiqué.

Risques ouverts : compatibilité réelle des dépendances non installées, absence de Git/sauvegarde versionnée, PATH npm/MySQL, disponibilité et accès MySQL, locales manquantes, démos non conformes à certaines règles actuelles (texte en dur/SVG inline), transport d'activation et récupération à configurer. Aucun de ces points n'empêche le cadrage ; ils doivent être traités dans leur phase avant de revendiquer une application fonctionnelle.
