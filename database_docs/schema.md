# FindIt Database Schema

FindIt uses **MySQL** as the database engine, but the schema is managed by **Laravel migrations** in `backend/database/migrations/`.

Important:
- Do not create tables manually in phpMyAdmin or with raw SQL.
- The real schema should be created with Laravel commands such as:
  - `php artisan migrate`
  - `php artisan migrate:fresh --seed`

## Database Flow

1. The frontend sends requests to the Laravel REST API.
2. Laravel controllers and models handle validation and business logic.
3. Eloquent models read and write data in MySQL.
4. Sanctum manages API authentication tokens.

## Main Tables

- `users`
  - Stores admin and normal user accounts.
- `categories`
  - Stores item categories.
- `items`
  - Stores lost and found item reports.
- `claims`
  - Stores claim requests for items.
- `messages`
  - Stores user-to-user communication.
- `community_posts`
  - Stores community updates and posts.
- `contact_messages`
  - Stores contact/support submissions.
- `activity_logs`
  - Stores user and system activity records.
- `personal_access_tokens`
  - Stores Sanctum tokens.
- `cache`, `jobs`, `migrations`
  - Laravel system tables.

## Relationships

- A `user` can have many `items`.
- A `user` can have many `claims`.
- A `user` can send and receive many `messages`.
- A `user` can create many `community_posts`.
- An `item` belongs to one `user`.
- An `item` may belong to one `category`.
- An `item` can have many `claims`.
- An approved `item` may reference the admin user who approved it.

## Migration Source of Truth

The source of truth for the database schema is:
- `backend/database/migrations/`
- `backend/database/seeders/`
- `backend/database/factories/`

If the schema changes, update the Laravel migrations first, then update this documentation.
