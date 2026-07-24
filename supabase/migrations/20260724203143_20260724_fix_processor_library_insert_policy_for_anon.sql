-- Allow anon (server-side client using anon key) to insert processors
CREATE POLICY "insert_processors_anon" ON processor_library
  FOR INSERT TO anon WITH CHECK (true);
