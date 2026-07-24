CREATE TABLE processor_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer text NOT NULL,
  model_name text NOT NULL,
  -- Pixel capacity
  total_pixel_capacity bigint NOT NULL DEFAULT 0,
  output_port_count int NOT NULL DEFAULT 1,
  pixels_per_port bigint NOT NULL DEFAULT 0,
  base_refresh_rate_hz int NOT NULL DEFAULT 60,
  -- Input specs
  max_input_resolution_w int,
  max_input_resolution_h int,
  input_types text,
  -- Physical
  rack_units int NOT NULL DEFAULT 2,
  weight_kg numeric(6,2),
  power_watts numeric(8,1),
  power_input text,
  depth_mm numeric(7,1),
  width_mm numeric(7,1),
  height_mm numeric(7,1),
  -- Extras
  notes text,
  spec_sheet_url text,
  product_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE processor_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_processors" ON processor_library FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_processors" ON processor_library FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_processors" ON processor_library FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_processors" ON processor_library FOR DELETE
  TO authenticated USING (true);

-- Seed Brompton Tessera SX40
INSERT INTO processor_library (
  manufacturer, model_name,
  total_pixel_capacity, output_port_count, pixels_per_port, base_refresh_rate_hz,
  max_input_resolution_w, max_input_resolution_h,
  input_types, rack_units, weight_kg, power_watts, power_input,
  depth_mm, width_mm, height_mm, notes
) VALUES (
  'Brompton Technology', 'Tessera SX40',
  9000000, 4, 2250000, 60,
  4096, 2160,
  'HDMI 2.0, 12G-SDI', 2, 10.0, 200, '100–240V AC, 50/60 Hz',
  430, 483, 88,
  '4 × 10G output ports. Pixel capacity reduces proportionally above 60 Hz.'
);

-- Seed Novastar MCTRL4K
INSERT INTO processor_library (
  manufacturer, model_name,
  total_pixel_capacity, output_port_count, pixels_per_port, base_refresh_rate_hz,
  max_input_resolution_w, max_input_resolution_h,
  input_types, rack_units, weight_kg, power_watts, power_input,
  depth_mm, width_mm, height_mm, notes
) VALUES (
  'NovaStar', 'MCTRL4K',
  8294400, 16, 518400, 60,
  3840, 2160,
  'DP 1.2, HDMI 2.0, Dual-link DVI', 2, 4.6, 30, '100–240V AC, 50/60 Hz',
  386, 482.6, 89,
  '16 × Gigabit Ethernet + 4 × optical fibre outputs.'
);
