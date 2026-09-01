-- Bootstrap a plain Postgres so Finlio's migrations apply unchanged.
--
-- The documented dev database is the full Supabase stack (docs/local-supabase.md),
-- which needs Docker. Where Docker isn't available, this creates just the pieces
-- our migrations actually depend on:
--
--   * the `anon` / `authenticated` / `service_role` roles the RLS policies grant to
--   * an `auth` schema with `auth.uid()`, which every owner-only policy calls
--
-- The point is that the real migration files run verbatim — including the RLS
-- policies — so what is tested locally is what ships, rather than a
-- special-cased local schema that hides a broken policy until production.
--
-- This is NOT a Supabase substitute: there is no GoTrue, no Studio, no Storage.
-- Auth is exercised against a real Supabase project, not here.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;

-- Supabase derives this from the request JWT. Locally it reads a session GUC,
-- so a test can impersonate a user with:
--   SET LOCAL request.jwt.claim.sub = '<uuid>';
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
