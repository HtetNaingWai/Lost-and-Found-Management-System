# FindIt - Lost and Found Management System

## Overview

**FindIt** is a full-stack Lost and Found Management System designed to help users report lost items, share found items, and reconnect owners with their belongings through a centralized digital platform.

The system provides a user-friendly community platform where users can:

- Report lost and found items
- Browse available item listings
- Search and filter items
- View item locations through an interactive map
- Communicate with other users through messaging
- Receive notifications about item updates

Administrators can manage the platform by reviewing submissions, approving or rejecting reports, and maintaining system reliability.

---

# Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React + Vite | Frontend framework and development environment |
| CSS | User interface styling and responsive design |
| API Services | Communication between frontend and backend |

## Backend

| Technology | Purpose |
|---|---|
| Laravel | REST API backend framework |
| Laravel Sanctum | Authentication and API security |
| MySQL | Database management |

---

# System Architecture

FindIt follows a full-stack client-server architecture:

```
User Interface
      |
      ↓
React Frontend
      |
      ↓
Laravel REST API
      |
      ↓
MySQL Database
```

The frontend manages user interaction and interface rendering, while the Laravel backend handles business logic, authentication, validation, and database operations.

---

# Project Structure

```
findit-lost-and-found-system/

├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API communication logic
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # Global state management
│   │   └── utils/         # Shared utilities
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   └── Services/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │
│   ├── routes/
│   │   ├── api.php
│   │   └── web.php
│   │
│   └── artisan
│
├── database_docs/
│   ├── schema.md
│   └── tables.md
│
└── README.md
```

---

# Main Features

## User Features

### Authentication
- User registration and login
- Secure authentication using Laravel Sanctum
- Profile management

### Lost & Found Management

Users can:

- Create lost item reports
- Create found item reports
- Upload item images
- Provide item details and locations
- View approved listings

### Search and Discovery

Users can:

- Browse lost and found items
- Filter items by category and date
- View item locations through maps

### Communication

Users can:

- Send messages related to items
- Communicate with item owners/finders
- Receive notifications

---

## Admin Features

Administrators can:

- Review pending item submissions
- Approve or reject reports
- Manage lost and found records
- Monitor user activities
- Maintain platform reliability

---

# Installation Guide

## Requirements

- Node.js
- npm
- PHP 8+
- Composer
- MySQL

---

# Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Run:

```bash
npm run dev
```

---

# Backend Setup

```bash
cd backend
composer install
```

Configure `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lost_and_found
DB_USERNAME=root
DB_PASSWORD=
```

Run database:

```bash
php artisan migrate:fresh --seed
```

Start server:

```bash
php artisan serve
```

---

# Database Management

FindIt uses Laravel migrations for database management.

Important:

- Do not create tables manually.
- Use Laravel migration commands.

Commands:

```bash
php artisan migrate
```

Reset database:

```bash
php artisan migrate:fresh --seed
```

---

# Default Admin Account

```
Email:
admin@findit.com

Password:
password123
```

---

# Development Notes

- UI design and CSS are preserved.
- Frontend and backend features are maintained.
- Authentication is handled using Laravel Sanctum.
- API routes are managed through Laravel backend.
- Admin and user functions are separated.

---

# Future Improvements

- AI-based item matching
- Advanced search
- Mobile application
- Enhanced real-time communication
- Cloud storage integration

---

# License

This project is developed as an academic full-stack web application project.
