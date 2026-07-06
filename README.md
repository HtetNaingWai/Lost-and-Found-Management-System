# FindIt - Lost and Found Management System

FindIt is a full-stack lost and found management system built with:

- Frontend: React + Vite
- Backend: Laravel REST API
- Database: MySQL
- Authentication: Laravel Sanctum

## Project Structure

```text
findit-lost-and-found-system/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   └── Services/
│   ├── config/
│   ├── database/
│   │   ├── factories/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── public/
│   ├── routes/
│   │   ├── api.php
│   │   └── web.php
│   ├── storage/
│   ├── .env
│   ├── composer.json
│   └── artisan
├── database_docs/
│   ├── schema.md
│   └── tables.md
├── README.md
└── .gitignore
```

## Frontend

The frontend is organized by responsibility:

- `components/`: reusable UI building blocks
- `pages/`: page-level and layout-level React views
- `services/`: API helpers and request logic
- `utils/`: shared constants and formatting helpers
- `hooks/`: reusable custom hooks
- `context/`: React context providers when needed

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend environment:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Backend

The backend is a Laravel API application using Sanctum for authentication.

- `app/Http/Controllers`: API controllers
- `app/Http/Middleware`: middleware such as admin access checks
- `app/Http/Requests`: request validation classes
- `app/Models`: Eloquent models
- `app/Services`: business-logic services

Run the backend:

```bash
cd backend
composer install
php artisan migrate:fresh --seed
php artisan serve
```

Backend database configuration:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lost_and_found
DB_USERNAME=root
DB_PASSWORD=
```

## Database

The MySQL schema is managed by Laravel migrations.

Important:
- Do not create manual SQL tables for the application.
- Use Laravel migration commands to create and reset tables.

Useful commands:

```bash
cd backend
php artisan migrate
php artisan migrate:fresh --seed
```

Documentation only:
- `database_docs/schema.md`
- `database_docs/tables.md`

## Notes

- The UI design and CSS were preserved during this refactor.
- Existing frontend and backend features were kept in place.
- Admin and user API routes remain under the Laravel backend.
