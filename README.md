# Personal Finance & Expense Management System

INTECH 3112 project built with a React + Vite frontend and a Laravel REST API.

## Features

- Authentication with personal API tokens
- Dashboard with income, expenses, balances, recent transactions, and budget progress
- CRUD screens for accounts, categories, transactions, and budgets
- Financial reports and monthly activity summaries
- User-specific records

## Local development

### Backend

```powershell
cd backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

Configure `backend/.env` with your local database credentials before running migrations.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_API_BASE_URL`; the local default is `http://127.0.0.1:8000/api`.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Render + Neon setup and required environment variables. Do not commit `.env` files, database files, or secrets.
