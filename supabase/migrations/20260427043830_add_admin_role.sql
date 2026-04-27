/*
  # Add admin role support

  1. Changes
    - Adds `is_admin` boolean column (default false) to `users` table
    - Creates a function + trigger to auto-set `is_admin = true` for rahulsamuel@gmail.com
      whenever that user row is inserted or updated
  2. Security
    - RLS policy: only the user themselves or admins can read their own row
      (existing policies are untouched; we just add the column)
    - The `is_admin` column cannot be set by the user via the client because
      the INSERT/UPDATE policies use WITH CHECK that does not include is_admin override
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Ensure the known admin email is flagged if the row already exists
UPDATE users SET is_admin = true WHERE email = 'rahulsamuel@gmail.com';

-- Function: auto-flag admin on insert/update
CREATE OR REPLACE FUNCTION public.set_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'rahulsamuel@gmail.com' THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on users table
DROP TRIGGER IF EXISTS trg_set_admin_flag ON public.users;
CREATE TRIGGER trg_set_admin_flag
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_admin_flag();
