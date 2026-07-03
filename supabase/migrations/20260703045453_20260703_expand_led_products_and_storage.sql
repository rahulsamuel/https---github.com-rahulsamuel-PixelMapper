/*
# Expand LED Products Table + Create Product Images Storage

## Summary
This migration significantly expands the `led_products` table to store the full
technical specifications extracted from manufacturer spec sheets. It also creates
a Supabase Storage bucket for storing product images.

## Changes to `led_products` Table
New columns added (all nullable to preserve backward compatibility):

### Physical Dimensions
- `pixel_pitch_mm` (numeric) — Pixel pitch in millimeters, e.g. 2.6
- `tile_width_mm` (numeric) — Panel physical width in mm
- `tile_height_mm` (numeric) — Panel physical height in mm
- `tile_depth_mm` (numeric) — Panel depth/thickness in mm

### Weight
- `tile_weight_kg` (numeric) — Weight of one panel in kilograms

### Power
- `max_power_w_per_sqm` (numeric) — Maximum power draw per square meter (W/m²)
- `avg_power_w_per_sqm` (numeric) — Average/typical power draw per square meter (W/m²)

### Display Performance
- `max_brightness_nit` (integer) — Peak brightness in nits (cd/m²)
- `refresh_rate_hz` (integer) — Screen refresh rate in Hz
- `grayscale_bit` (integer) — Grayscale depth in bits (e.g. 16)
- `contrast_ratio` (text) — Contrast ratio as string, e.g. "5500:1"
- `color_temperature_k` (integer) — Default color temperature in Kelvin
- `viewing_angle_h` (integer) — Horizontal viewing angle in degrees
- `viewing_angle_v` (integer) — Vertical viewing angle in degrees

### Technical
- `drive_mode` (text) — Drive mode, e.g. "1/16" or "1/8"
- `led_type` (text) — LED technology, e.g. "Black SMD1515", "Flip Chip IMD 4in1"
- `ip_rating` (text) — Ingress protection rating, e.g. "IP40/IP21"
- `certification` (text) — Certifications, e.g. "FCC, ETL, CE, RoHS"

### Application
- `application_indoor` (boolean, default false) — Suitable for indoor use
- `application_outdoor` (boolean, default false) — Suitable for outdoor use
- `application_floor` (boolean, default false) — Suitable for floor use

### Media
- `product_image_url` (text) — URL to product image (in Supabase Storage or external)
- `spec_sheet_url` (text) — URL to original spec sheet source

## Storage
- Creates `product-images` bucket (public) for storing product images
- Adds storage RLS policies: public read, authenticated insert/delete

## Notes
1. All new columns are nullable — existing rows are unaffected
2. `watts_per_tile` already exists and is kept for backward compatibility
3. The storage bucket `product-images` is public so product images can be displayed without auth
*/

-- Expand led_products with full spec fields
ALTER TABLE led_products
  ADD COLUMN IF NOT EXISTS pixel_pitch_mm numeric,
  ADD COLUMN IF NOT EXISTS tile_width_mm numeric,
  ADD COLUMN IF NOT EXISTS tile_height_mm numeric,
  ADD COLUMN IF NOT EXISTS tile_depth_mm numeric,
  ADD COLUMN IF NOT EXISTS tile_weight_kg numeric,
  ADD COLUMN IF NOT EXISTS max_power_w_per_sqm numeric,
  ADD COLUMN IF NOT EXISTS avg_power_w_per_sqm numeric,
  ADD COLUMN IF NOT EXISTS max_brightness_nit integer,
  ADD COLUMN IF NOT EXISTS refresh_rate_hz integer,
  ADD COLUMN IF NOT EXISTS grayscale_bit integer,
  ADD COLUMN IF NOT EXISTS contrast_ratio text,
  ADD COLUMN IF NOT EXISTS color_temperature_k integer,
  ADD COLUMN IF NOT EXISTS viewing_angle_h integer,
  ADD COLUMN IF NOT EXISTS viewing_angle_v integer,
  ADD COLUMN IF NOT EXISTS drive_mode text,
  ADD COLUMN IF NOT EXISTS led_type text,
  ADD COLUMN IF NOT EXISTS ip_rating text,
  ADD COLUMN IF NOT EXISTS certification text,
  ADD COLUMN IF NOT EXISTS application_indoor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS application_outdoor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS application_floor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS product_image_url text,
  ADD COLUMN IF NOT EXISTS spec_sheet_url text;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read
DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
CREATE POLICY "product_images_public_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- Storage policies: authenticated insert
DROP POLICY IF EXISTS "product_images_auth_insert" ON storage.objects;
CREATE POLICY "product_images_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Storage policies: authenticated delete
DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;
CREATE POLICY "product_images_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Index for common filter patterns
CREATE INDEX IF NOT EXISTS idx_led_products_manufacturer ON led_products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_led_products_pixel_pitch ON led_products(pixel_pitch_mm);
