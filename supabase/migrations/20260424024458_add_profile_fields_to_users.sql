/*
  # Add profile fields to users table

  Adds full_name and company columns to the users table to support
  a richer sign-up form. Both fields are optional.

  1. Changes
    - `users` table: add `full_name` (text, nullable)
    - `users` table: add `company` (text, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company'
  ) THEN
    ALTER TABLE users ADD COLUMN company text;
  END IF;
END $$;
