# INTECH 3112 — Free deployment notes

This repository contains a React/Vite frontend (`frontend/`) and Laravel API (`backend/`).

## Hosting layout

- Render Static Site: build from the repository using `cd frontend && npm ci && npm run build`, publish `frontend/dist`.
- Render Web Service: Docker runtime, Docker context `./backend`, Dockerfile `./backend/Dockerfile`, health check `/up`, region Singapore, Free plan.
- Neon PostgreSQL: project `intech3112-final`, region Singapore.

## Required Render API environment variables

Set values in the Render dashboard only; do not commit credentials:

- `APP_NAME=Personal Finance & Expense Management System`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<generated unique Laravel key>`
- `APP_URL=<API service https URL>`
- `DB_CONNECTION=pgsql`
- `DB_URL=<Neon PostgreSQL connection string with SSL enabled>`
- `FRONTEND_URL=<frontend https URL>`
- `LOG_CHANNEL=stderr`
- `CACHE_STORE=file`
- `SESSION_DRIVER=file`
- `QUEUE_CONNECTION=sync`

On startup, the API container runs `php artisan migrate --force` and caches its config before starting Apache.

## Required Render Static Site environment variable

- `VITE_API_BASE_URL=<API service https URL>/api`

React Router fallback is supplied by `frontend/public/_redirects`.

## Notes

- The deployment should not import the local SQLite file or local MySQL records. The hosted database starts clean; each user should register an account.
- Free Render web services sleep when idle, so the first request after inactivity can take a little while.
- Do not commit `.env`, database passwords, or application keys.
