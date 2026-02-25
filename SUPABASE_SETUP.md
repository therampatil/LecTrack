# LecTrack – Supabase Setup Guide

## Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in a name (e.g. `lectrack`), choose a region, set a database password → **Create project**
4. Wait ~1 min for the project to spin up

---

## Step 2 — Get your API keys

1. In your project sidebar go to **Settings → API**
2. Copy **Project URL** and **anon / public** key
3. Open `supabase.js` in this project and paste them:

```js
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

---

## Step 3 — Run the SQL setup script

1. In your Supabase dashboard go to **SQL Editor → New query**
2. Open `supabase_setup.sql` from this project folder
3. Copy the **entire file** and paste it into the SQL editor
4. Click **Run**

This creates:

| Object                              | Purpose                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `profiles` table                    | Stores every user's name, email, phone, PRN, branch, year, college, avatar URL |
| `on_auth_user_created` trigger      | Auto-creates a profile row the moment someone signs up                         |
| `handle_updated_at` trigger         | Keeps `updated_at` accurate on every save                                      |
| Row Level Security policies         | Users can only read/write their **own** row                                    |
| `avatars` storage bucket            | Public bucket for profile pictures                                             |
| Storage RLS policies                | Users can only upload/delete **their own** avatar                              |
| `timetables` table _(optional)_     | Persists each user's lecture timetable as JSON                                 |
| `confusion_logs` table _(optional)_ | Records confusion history per session                                          |

---

## Step 4 — Enable Email Auth (already on by default)

1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled ✅
3. Under **Email** settings, you can turn off "Confirm email" during dev so users aren't blocked waiting for a confirmation email

---

## Step 5 — Enable Google OAuth _(optional)_

1. Go to **Authentication → Providers → Google**
2. Enable it and follow the on-screen steps to create a Google OAuth app
3. Paste your **Client ID** and **Client Secret** → Save

---

## Step 6 — Configure Site URL (for redirects)

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to where you host the app, e.g. `http://localhost:5173` for local dev
3. Add your production URL to **Redirect URLs** as well

---

## Database Schema Reference

### `profiles`

| Column          | Type          | Notes                                 |
| --------------- | ------------- | ------------------------------------- |
| `id`            | `uuid`        | Primary key — matches `auth.users.id` |
| `full_name`     | `text`        | Set at signup                         |
| `email`         | `text`        | Set at signup                         |
| `phone`         | `text`        | Editable on profile page              |
| `avatar_url`    | `text`        | Public URL from `avatars` bucket      |
| `prn`           | `text`        | Permanent Registration Number         |
| `roll_number`   | `text`        | Class roll number                     |
| `division`      | `text`        | e.g. `A`, `B`                         |
| `branch`        | `text`        | e.g. `computer`, `it`, `entc` …       |
| `year`          | `text`        | `fe` / `se` / `te` / `be`             |
| `college`       | `text`        | College name                          |
| `academic_year` | `text`        | e.g. `2024-25`                        |
| `created_at`    | `timestamptz` | Auto-set                              |
| `updated_at`    | `timestamptz` | Auto-updated on save                  |

### `timetables`

| Column       | Type          | Notes                         |
| ------------ | ------------- | ----------------------------- |
| `id`         | `uuid`        | Primary key                   |
| `user_id`    | `uuid`        | Foreign key → `auth.users.id` |
| `lectures`   | `jsonb`       | Array of lecture objects      |
| `updated_at` | `timestamptz` | Auto-updated                  |

### `confusion_logs`

| Column            | Type          | Notes                         |
| ----------------- | ------------- | ----------------------------- |
| `id`              | `uuid`        | Primary key                   |
| `user_id`         | `uuid`        | Foreign key → `auth.users.id` |
| `subject`         | `text`        | Lecture subject name          |
| `confused_topics` | `text[]`      | Array of topic names          |
| `total_topics`    | `int`         | Total topics in the lecture   |
| `logged_at`       | `timestamptz` | When the session ended        |

---

## How it all connects

```
signup.html  →  auth.js  →  supabase.auth.signUp()
                          →  trigger: on_auth_user_created
                          →  profiles row auto-created

login.html   →  auth.js  →  supabase.auth.signInWithPassword()
                          →  sessionStorage updated
                          →  redirect to index.html

profile.html →  profile.js  →  supabase.from("profiles").select()
                             →  fields populated from DB
                             →  save  → supabase.from("profiles").update()
                             →  avatar → supabase.storage.from("avatars").upload()
```

---

## Running locally

Because the JS files use ES modules (`import`), you **must** serve the project via a local server — just opening `index.html` as a file won't work.

**Quick options:**

```bash
# Option A – VS Code Live Server extension (recommended)
# Right-click index.html → "Open with Live Server"

# Option B – Python
python3 -m http.server 5500

# Option C – Node
npx serve .
```

Then open `http://localhost:5500` (or whatever port) in your browser.
