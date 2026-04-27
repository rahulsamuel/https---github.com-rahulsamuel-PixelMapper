/*
  # Add admin read policies for users and snapshots

  Allows admin users to read all rows in the users table and pixel_map_snapshots table.
*/

-- Admins can read all user rows
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u2
      WHERE u2.id = auth.uid()
      AND u2.is_admin = true
    )
  );
