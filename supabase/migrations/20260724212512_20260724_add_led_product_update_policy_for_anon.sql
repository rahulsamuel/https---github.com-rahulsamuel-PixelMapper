CREATE POLICY "update_led_products_anon" ON led_products FOR UPDATE
  TO anon USING (true) WITH CHECK (true);