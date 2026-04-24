/*
  # Allow users to insert their own row

  On sign-in we upsert a row into public.users so pixel_map_projects FK is
  satisfied. Without an INSERT policy the upsert would fail under RLS.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can insert own data'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can insert own data"
        ON users FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id)
    $policy$;
  END IF;
END $$;
