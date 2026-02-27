# Migrations

SQL files in this folder are automatically run against Supabase when pushed to `main`.

## How it works
- GitHub Actions detects changes to `migrations/**.sql`
- Each file runs **exactly once** — tracked in a `_migrations` table in Supabase
- Files run in alphabetical order, so use numbered prefixes: `001_`, `002_`, etc.

## Already applied
- `001_` — base schema (recipes, recipe_details tables) — run manually
- `002_` — recipe_details for non-Hungry-Hobby recipes — run manually  
- `003_` — new recipes + details (IDs 33-47, 68-75) — run manually
- `004_structured_ingredients_new.sql` — structured ingredients for new recipes

## Adding a new migration
1. Create `migrations/005_your_description.sql`
2. Push to `main`
3. GitHub Actions runs it automatically ✅

## Required GitHub Secrets
In your repo → Settings → Secrets → Actions:
- `SUPABASE_URL` — e.g. `https://abcdefgh.supabase.co`
- `SUPABASE_SERVICE_KEY` — from Supabase → Settings → API → service_role key
