/*
  # Extend pixel_map_snapshots for full download tracking

  ## Changes
  1. New columns on pixel_map_snapshots:
     - `download_type` (text) — 'grid-png' | 'raster-slice' | 'wiring-diagram' |
       'full-raster-map' | 'composite-wiring-diagram' | 'project-file'
     - `filename` (text) — original download filename
     - `ip_address` (text) — visitor IP captured by the API route

  ## Notes
  - Existing rows get NULL for new columns (safe, all nullable)
  - No data is destroyed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pixel_map_snapshots' AND column_name = 'download_type'
  ) THEN
    ALTER TABLE public.pixel_map_snapshots ADD COLUMN download_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pixel_map_snapshots' AND column_name = 'filename'
  ) THEN
    ALTER TABLE public.pixel_map_snapshots ADD COLUMN filename text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pixel_map_snapshots' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE public.pixel_map_snapshots ADD COLUMN ip_address text DEFAULT '';
  END IF;
END $$;
