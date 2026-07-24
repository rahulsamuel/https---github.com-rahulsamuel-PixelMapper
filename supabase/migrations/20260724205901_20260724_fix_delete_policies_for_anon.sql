-- Allow anon (server-side client using anon key) to delete LED products and processors
CREATE POLICY "delete_led_products_anon" ON led_products
  FOR DELETE TO anon USING (true);

CREATE POLICY "delete_processors_anon" ON processor_library
  FOR DELETE TO anon USING (true);
