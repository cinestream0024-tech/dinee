# Déploiement Railway

Le projet est un monorepo avec trois services Railway :

- `Frontend` : racine `/frontend`, construit avec le Dockerfile et servi par Caddy ;
- `Backend` : racine `/backend`, détecté comme application Laravel par Railpack ;
- `MySQL` : base privée Railway.

Le frontend sert de point d’entrée public. Caddy transmet `/api/*` et `/sanctum/*` au backend, ce qui conserve une authentification Sanctum same-origin et évite d’exposer une configuration CORS complexe au navigateur.

## Frontend

Variables :

```env
BACKEND_URL=https://<domaine-public-du-backend>
```

Générer un domaine public et utiliser `/health` comme healthcheck.

## Backend

Générer un domaine public, utilisé uniquement comme origine du proxy frontend. Configurer la commande de pré-déploiement :

```sh
php artisan migrate --force
```

Variables minimales :

```env
APP_NAME="DINEE Platform"
APP_ENV=production
APP_KEY=<php artisan key:generate --show>
APP_DEBUG=false
APP_URL=https://<domaine-public-du-frontend>
FRONTEND_URL=https://<domaine-public-du-frontend>
APP_LOCALE=fr
APP_FALLBACK_LOCALE=en
LOG_CHANNEL=stderr
DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=<hôte-du-frontend-sans-https>
CACHE_STORE=database
QUEUE_CONNECTION=sync
DINEE_FOLLOW_UP_DELAY_HOURS=48
```

Utiliser `/up` comme healthcheck.

Les photos utilisent actuellement le disque privé local. Attacher un volume Railway au stockage privé avant les tests de photo afin qu’elles survivent aux redéploiements. Les secrets et mots de passe de démonstration restent dans les variables Railway et ne sont jamais commités.
