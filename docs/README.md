# EasyBooking Architecture

## Purpose

EasyBooking is a Telegram Mini App for salon bookings. The project combines a React web app, a Grammy bot with HTTP API endpoints, and a PostgreSQL database for operational data.

## High-Level Modules

| Module | Responsibility |
| --- | --- |
| `webapp/` | Telegram Mini App UI for booking flow, reviews, and admin screens |
| `bot/` | Telegram bot handlers, HTTP API, notifications, business logic, and PostgreSQL access |
| `shared/` | Shared TypeScript domain types used by frontend and backend |
| `postgres/` | Database schema and local PostgreSQL bootstrap scripts |

## Runtime Architecture

1. The user opens the Telegram Mini App and goes through the booking flow in `webapp/`.
2. The frontend sends requests to the Bun HTTP server started from `bot/src/index.ts`.
3. Backend handlers validate input, read and write booking data through the PostgreSQL service layer.
4. The Telegram bot sends booking confirmations, reminders, cancellation notifications, and review requests.
5. Admin routes in the Mini App use the same API surface to manage bookings, masters, services, clients, and reviews.

## Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Client booking flow |
| `/review/:bookingId` | Review submission page |
| `/admin` | Admin entry point |
| `/admin-dashboard` | Calendar, clients, reviews, and settings views |
| `/admin-masters` | Master management |
| `/admin-services` | Service management |
| `/admin-bookings` | Booking management and manual booking tools |
| `/admin-reviews` | Review monitoring |

## Backend Boundaries

- `bot/src/index.ts` starts the Telegram bot and Bun HTTP server.
- `bot/src/api/` contains request handlers for booking, availability, reviews, admin access, uploads, and notifications.
- `bot/src/services/data.ts` and related services isolate database operations from transport logic.
- `bot/src/notifications/` contains scheduled reminder and review-request jobs.

## Data Model

The PostgreSQL schema in `postgres/schema.sql` covers masters, services, clients, master absences, bookings, reviews, admins, and promo codes. The `bookings_readable` view supports admin reporting screens.

## Operational Constraints

- The repository uses Bun workspaces from the project root.
- The development server lifecycle is controlled by the user.
- Telegram configuration and database access are provided through environment variables.
