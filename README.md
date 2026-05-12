# 🏎️ RedAutoSchool — Car Reservation System

A modern, mobile-first car booking system for driving schools built with **Next.js 15**, **Supabase Auth**, and a direct **PostgreSQL** connection for the API layer.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), React, Zustand, React Query |
| Auth | Supabase Auth (Google OAuth) |
| API | Next.js Route Handlers |
| DB connection | `pg` (node-postgres) — direct Postgres pool |
| Database | Supabase Postgres (or any Postgres) |
| Validation | Zod |
| Forms | React Hook Form |

---

## Setup

### 1. Create a Supabase project

[supabase.com](https://supabase.com) → New project.

### 2. Run the schema

Supabase → SQL Editor → paste & run `supabase-schema.sql`.

Creates: `profiles`, `cars` (pre-seeded × 4), `bookings`, indexes, RLS policies, signup trigger.

### 3. Enable Google OAuth

Supabase → Authentication → Providers → Google → enable, add credentials.  
Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 4. Configure environment

```bash
cp .env.example .env.local
```

| Variable | Where to find |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (URI) |
| `DATABASE_SSL` | `true` for Supabase, `false` for local |

### 5. Install & run

```bash
npm install
npm run dev
```

---

## REST API

All endpoints require `Authorization: Bearer <supabase_access_token>`.

---

### Cars

#### `GET /api/cars`

List all active cars.

```json
{
  "cars": [
    { "id": "uuid", "name": "Mazda 3", "model": "MAZDA", "color": "Червона", "image_emoji": "🚗", "is_active": true }
  ]
}
```

---

### Bookings

#### `GET /api/bookings`

My upcoming bookings (current user, today onwards).

```json
{
  "bookings": [
    {
      "id": "uuid",
      "car_name": "Mazda 3",
      "car_color": "Червона",
      "car_emoji": "🚗",
      "booking_date": "2025-07-15",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "first_name": "Петро",
      "last_name": "Іваненко",
      "status": "confirmed"
    }
  ]
}
```

---

#### `POST /api/bookings`

Create a booking. Checks for overlaps — no DB-level locks.

**Body:**
```json
{
  "car_id":       "uuid",
  "booking_date": "2025-07-15",
  "start_time":   "09:00",
  "end_time":     "11:00",
  "first_name":   "Петро",
  "last_name":    "Іваненко",
  "phone":        "+380991234567"
}
```

**Responses:**
- `201` — `{ "booking": { ... } }`
- `400` — `{ "error": "VALIDATION_FAILED", "issues": { ... } }`
- `409` — `{ "error": "SLOT_TAKEN" }` — time overlaps an existing booking

---

#### `GET /api/bookings/:id`

Single booking (must belong to current user).

---

#### `DELETE /api/bookings/:id`

Soft-cancel a booking (sets `status = 'cancelled'`).

**Responses:**
- `200` — `{ "booking": { ..., "status": "cancelled" } }`
- `404` — not found or already cancelled

---

### Instructor views

These mirror the Python `write_to_sheets` logic: bookings grouped by instructor → car → month with hour totals.

#### `GET /api/instructor`

List all instructors who have at least one booking.

Query params:
- `all=true` — also return a flat table of all bookings across all instructors
- `from=YYYY-MM-DD`, `to=YYYY-MM-DD` — date range filter (only with `all=true`)

```json
{
  "instructors": ["Іваненко Петро", "Коваленко Марія"],
  "bookings": [...]   // only when all=true
}
```

---

#### `GET /api/instructor/:name`

Full schedule for one instructor, grouped car → month.

`:name` = URL-encoded `"Іваненко Петро"` (LastName space FirstName).

Query params: `from=YYYY-MM-DD`, `to=YYYY-MM-DD`

```json
{
  "instructor": "Іваненко Петро",
  "grand_total_hours": 12.5,
  "cars": [
    {
      "car_name": "Mazda 3",
      "total_hours": 8.0,
      "months": [
        {
          "month": "2025-06",
          "total_hours": 4.0,
          "bookings": [
            {
              "id": "uuid",
              "car_name": "Mazda 3",
              "car_color": "Червона",
              "booking_date": "2025-06-10",
              "start_time": "09:00:00",
              "end_time": "11:00:00",
              "duration_hours": 2.0,
              "status": "confirmed"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Project Structure

```
src/
├── lib/
│   ├── db.ts          # pg Pool + query/queryOne helpers
│   └── auth.ts        # JWT validation + Res helpers
├── models/
│   ├── booking.model.ts    # Booking CRUD + overlap check
│   ├── car.model.ts        # Car queries
│   └── instructor.model.ts # Per-instructor schedule view
├── app/
│   ├── api/
│   │   ├── cars/           # GET /api/cars
│   │   ├── bookings/       # GET, POST /api/bookings
│   │   │   └── [id]/       # GET, DELETE /api/bookings/:id
│   │   └── instructor/     # GET /api/instructor
│   │       └── [name]/     # GET /api/instructor/:name
│   ├── book/               # Booking wizard UI (car→date→time→details→success)
│   ├── my-bookings/        # User bookings management UI
│   ├── signin/
│   └── auth/callback/
├── features/
│   ├── auth/               # useSession, AuthGuard, UserMenu, supabase client
│   └── booking/            # CarSelector, CalendarPicker, TimePicker, DetailsForm
└── shared/
    └── providers/          # QueryProvider
```

## Database Schema

```
cars         id · name · model · color · image_emoji · is_active
profiles     id (→ auth.users) · full_name · phone
bookings     id · user_id · car_id · car_name · booking_date
             start_time · end_time · first_name · last_name
             phone · status · created_at
```

Indexes on `(car_id, booking_date)`, `user_id`, `(last_name, first_name)`, `booking_date`.
