# FindIt Tables Reference

This document describes the application tables at a high level. Real table creation is handled by **Laravel migrations**, not manual SQL.

## `users`

Purpose:
- Stores account information for admins and normal users.

Key fields:
- `name`
- `email`
- `phone`
- `nrc_no`
- `nrc_front_photo`
- `nrc_back_photo`
- `profile_image`
- `password`
- `role`
- `status`

## `categories`

Purpose:
- Stores reusable item categories.

Key fields:
- `name`
- `description`

## `items`

Purpose:
- Stores lost and found reports submitted by users.

Key fields:
- `user_id`
- `category_id`
- `type`
- `title`
- `description`
- `location`
- `item_date`
- `image`
- `status`
- `admin_note`
- `approved_by`
- `approved_at`
- `rejected_at`
- `returned_at`

## `claims`

Purpose:
- Stores claim requests for reported items.

Key fields:
- `item_id`
- `user_id`
- `message`
- `contact_phone`
- `status`
- `admin_note`
- `reviewed_by`
- `reviewed_at`

## `messages`

Purpose:
- Stores private communication between users.

Key fields:
- `item_id`
- `sender_id`
- `receiver_id`
- `message`
- `is_read`

## `community_posts`

Purpose:
- Stores community announcements and posts.

Key fields:
- `user_id`
- `title`
- `content`
- `status`

## `contact_messages`

Purpose:
- Stores public contact form submissions and support messages.

Key fields:
- `name`
- `email`
- `phone`
- `subject`
- `message`
- `status`

## `activity_logs`

Purpose:
- Stores activity history for tracking user and system actions.

Key fields:
- `user_id`
- `action`
- `description`
- `meta`

## `personal_access_tokens`

Purpose:
- Stores Laravel Sanctum API tokens for authenticated sessions.

## Laravel System Tables

- `migrations`
- `cache`
- `jobs`

These support Laravel internals and should remain managed by the framework.
