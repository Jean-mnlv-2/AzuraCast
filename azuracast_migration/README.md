# BantuWave

Plateforme de diffusion radio : **Django (DRF + ASGI)** + **React (Vite)** + **PostgreSQL**, **Redis**, **Celery**, **Nginx**.

## Dossier du projet

Le produit s’appelle **BantuWave** ; dans ce monorepo, le dossier du code peut encore s’appeler **`azuracast_migration`** (les workflows GitHub et Dependabot pointent vers `azuracast_migration/`). Renommez le dossier en **`BantuWave`** quand rien ne le verrouille, puis mettez à jour **`.github/workflows/ci.yml`** et **`.github/dependabot.yml`** en remplaçant `azuracast_migration` par `BantuWave`.

**Dépôt dont la racine est BantuWave** (`backend/`, `frontend/`) : dans la CI et Dependabot, utilisez `backend` et `frontend` (sans préfixe de dossier).

Docker Compose utilise le nom de projet **`bantuwave`** (conteneurs du type `bantuwave-backend-1`), indépendamment du nom du dossier.

## Production (Docker)

```bash
cp .env.sample .env
# Éditer SECRET_KEY, INTERNAL_DJ_AUTH_TOKEN, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, CSRF_TRUSTED_ORIGINS

./bantuwave.sh setup
./bantuwave.sh start
```

Interface : **http://localhost:8080** (`WEB_PORT` dans `.env`).

## Développement (Vite)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

API : http://localhost:8000 · Vite : http://localhost:3000

## Alignement avec l’existant (AzuraCast)

Même domaine fonctionnel : stations, médias, playlists AutoDJ, Liquidsoap/Icecast, webhooks, analytics, podcasts, utilisateurs et permissions par station. L’API REST et les modèles suivent une logique compatible avec une migration depuis AzuraCast (schémas et flux à affiner au fil de l’import de données).

## Structure

```text
BantuWave/   (ou nom actuel du dossier)
├── backend/
├── frontend/
├── nginx/
├── docker-compose.yml
├── docker-compose.dev.yml
└── bantuwave.sh
```
