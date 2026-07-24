CREATE POLICY "update_processors_anon" ON processor_library FOR UPDATE
  TO anon USING (true) WITH CHECK (true);