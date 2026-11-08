/*
# Give account email addresses a single canonical form

1. Changes
  - Normalises existing `public.users.email` values to lower case where no conflicting row exists.
  - Adds a trigger that lower-cases and trims `email` on insert and update, so the stored value is
    always canonical regardless of what the client sends.
  - Adds a unique index on `lower(email)` when the data permits it, so two accounts can no longer
    differ only by letter case and an email lookup cannot land on the wrong profile.

2. Important notes
  1. If duplicate addresses already exist, the index is skipped and a notice is raised rather than
     failing the migration or deleting data.
  2. No rows are deleted and no columns are dropped.
*/

CREATE OR REPLACE FUNCTION public.normalize_user_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS normalize_user_email_trigger ON public.users;
CREATE TRIGGER normalize_user_email_trigger
BEFORE INSERT OR UPDATE OF email ON public.users
FOR EACH ROW EXECUTE FUNCTION public.normalize_user_email();

UPDATE public.users u
SET email = lower(btrim(u.email))
WHERE u.email <> lower(btrim(u.email))
  AND NOT EXISTS (
    SELECT 1 FROM public.users o
    WHERE o.id <> u.id AND lower(btrim(o.email)) = lower(btrim(u.email))
  );

DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON public.users (lower(email));
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Duplicate email addresses exist; case-insensitive unique index not created.';
  END;
END $$;
