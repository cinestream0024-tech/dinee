# Développement local DINEE

## Environnement vérifié

Windows / Laragon : PHP 8.3.30, Composer 2.10.3, Node 22.22.0, npm 10.9.4, MySQL 8.4.3.
Versions résolues en phase 1 : Laravel 13.33.0, Sanctum 4.3.3, Vite 8.2.2. Les lockfiles font autorité.

## Accès local via ledinee.test

Cette machine est configurée pour ouvrir l'application sur [http://ledinee.test](http://ledinee.test). Le fichier `hosts` résout le domaine vers `127.0.0.1` et Apache sert le build React depuis `frontend/dist`. Les chemins `/api` et `/sanctum` sont relayés vers Laravel sur `127.0.0.1:8000`.

Après avoir démarré Apache et MySQL dans Laragon, lancer à la racine :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

Pour arrêter les processus du projet démarrés par ce script :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
```

Le virtual host installé dans Laragon est conservé dans `ops/laragon/ledinee.test.conf`. Apache doit charger `mod_proxy`, `mod_proxy_http` et `mod_rewrite`. Le script ne démarre ni n'arrête Apache ou MySQL, car ils sont partagés avec les autres projets Laragon.

À la racine, dans PowerShell :

```powershell
$env:Path = "D:\laragon\bin\nodejs\node-v22;D:\laragon\bin\mysql\mysql-8.4.3-winx64\bin;" + $env:Path
php --version
composer --version
node --version
npm --version
mysql --version
```

Démarrer MySQL dans Laragon. Les bases dédiées locales sont `dinee` et `dinee_test`.
Ne pas utiliser une base existante d'un autre projet. Pour une installation neuve :

```sql
CREATE DATABASE IF NOT EXISTS dinee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS dinee_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

L'environnement local vérifié utilise root sans mot de passe sur 127.0.0.1. C'est uniquement une configuration de développement ; utiliser un compte dédié et des secrets séparés en déploiement.

## Backend

```powershell
cd backend
composer install
Copy-Item .env.example .env # seulement si .env n'existe pas déjà
php artisan key:generate   # seulement pour une nouvelle installation
```

Renseigner les paramètres DB et `DINEE_DEMO_PASSWORD` dans le fichier local `.env`. Le mot de passe de démo doit contenir au moins 12 caractères. Ne pas committer ce fichier. La clé APP_KEY ne doit pas être régénérée sur une installation déjà utilisée.

```powershell
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Le seeder crée uniquement des données fictives, sans numéros de téléphone :
- admin : `yannick@dinee.test` (Yannick Démo) ;
- membre : `patrick@dinee.test` (Patrick Démo), lié à son profil ;
- Sarah Démo et Alex Démo : profils sans compte ;
- deux éditions fictives, passée et future.

Mot de passe des deux comptes dans l'environnement local préparé : `Dinee-Demo-2026!`. Ce mot de passe de démonstration est public et ne convient pas à un déploiement. Le seeder lit la valeur locale et n'écrase pas le mot de passe d'un compte déjà existant. Il refuse de s'exécuter hors environnements local/testing.

## Frontend

Pour installer les dépendances et produire la version servie par `ledinee.test` :

```powershell
cd frontend
npm install
npm run build
```

Après une modification frontend, relancer `npm run build`, puis actualiser [http://ledinee.test](http://ledinee.test). Pour travailler avec le rechargement à chaud, `npm run dev` reste disponible directement sur `http://127.0.0.1:5173`; le domaine `ledinee.test` continue alors de servir le dernier build généré.
Le proxy Vite transmet aussi `/api` et `/sanctum` à Laravel sur le port 8000. `frontend/.env.example` documente `VITE_API_URL` ; le laisser vide en développement local.

La connexion prépare le cookie CSRF, puis envoie les identifiants à /api/v1/auth/login.
La session est conservée dans un cookie HttpOnly, pas dans localStorage. Les requêtes API transmettent un Referer réduit à l'origine du site pour la détection stateful Sanctum, jamais le chemin de la page ou un token d'invitation.
Le cache Query est effacé à la déconnexion et au changement de compte.

## Commandes de validation

Depuis backend/ :

```powershell
composer check-platform-reqs
php artisan test
php vendor/bin/pint --test
```

Les tests utilisent réellement MySQL et réinitialisent uniquement `dinee_test`. Les variables PHPUnit imposent le nom de cette base et le TestCase vérifie cette isolation avant les migrations de test. Les identifiants proviennent de l'environnement local ; un `.env.testing` ignoré peut fournir des identifiants distincts. Ne jamais mettre de données utiles dans la base de test.

Depuis frontend/ :

```powershell
npm test
npm run build
npm run lint
```

Test navigateur, avec les deux serveurs démarrés et les données de démonstration chargées :

```powershell
npx playwright install chromium --only-shell
$env:DINEE_BASE_URL = "http://ledinee.test"
$env:DINEE_DEMO_PASSWORD = "Dinee-Demo-2026!"
$env:DINEE_CHROMIUM_EXECUTABLE = "D:\laragon\www\dinee\.local\chromium-validated\chrome-headless-shell-win64\chrome-headless-shell.exe" # si présent
npm run test:smoke
```

Le test utilise Chromium headless, contrôle desktop/mobile, connexion admin/membre, session après rechargement, déconnexion, refus d'accès admin, CSRF réel et RTL. Les captures et le résultat sont générés sous `.local/evidence/` (ignoré par Git), sans cookies ni fichiers d'état d'authentification.

Utiliser un navigateur moderne compatible Tailwind 4. Edge 100 présent sur cette machine ne rend pas correctement les utilitaires CSS modernes ; le navigateur de test téléchargé évite ce faux diagnostic.

## Sécurité et environnement

- Les mutations d'auth utilisent toujours le middleware web/CSRF ; les lectures protégées utilisent auth:sanctum. Les jetons Bearer sont désactivés pour cette SPA.
- CORS autorise uniquement FRONTEND_URL, avec credentials. Un en-tête d'origine autorisée fixe n'autorise pas une origine différente.
- Pas d'inscription, OAuth, MFA, récupération de mot de passe ou activation publique en phase 1.
- En production : APP_DEBUG=false, HTTPS, SESSION_SECURE_COOKIE=true, origines/session configurées, secrets dédiés et serveur servant la SPA et l'API. Ne pas utiliser artisan serve comme serveur de production.
- PWA finale et stratégie offline restent en phase 6.
- Git ignore .env*, vendor, node_modules, caches, logs, résultats de tests et .local ; seuls les .env.example assainis sont versionnés.

En cas de téléchargement CDN indisponible, le test accepte DINEE_CHROMIUM_EXECUTABLE pointant vers un Chromium headless de la version attendue. Le navigateur local de validation peut être placé sous .local/ et reste ignoré par Git.

Sur cette machine, le dossier .git initialisé dans le bac à sable appartient à son compte technique. Si Git signale dubious ownership, utiliser ponctuellement : git -c safe.directory=D:/laragon/www/dinee status (même option pour les autres commandes). La tentative de rétablissement du propriétaire a été refusée par Windows ; aucune protection globale n’a été désactivée.
