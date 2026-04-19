# Supabase

## Local development
1. Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are in `.env.local`
2. Run `supabase start` for a local instance (optional; the remote dev project works too)

## Migrations
New migrations go in `supabase/migrations/` with filename format `NNNN_description.sql`
Apply with `supabase db push`

## RLS
All tables have RLS enabled but no policies — server-side code uses the service role key.
When adding client-side access, define explicit policies per table.