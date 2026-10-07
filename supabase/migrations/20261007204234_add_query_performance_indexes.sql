/*
# Add performance indexes for common query patterns

1. Purpose
   The LED product, processor, and rack equipment library tables are queried
   with ORDER BY and WHERE filters that currently hit full table scans.
   This migration adds covering indexes for those access paths.

2. New Indexes
   - `idx_led_products_created_at` on `led_products(created_at DESC)` — used by the main product list query `ORDER BY created_at DESC`.
   - `idx_processor_library_is_active` on `processor_library(is_active, manufacturer, model_name)` — covers the `WHERE is_active = true ORDER BY manufacturer, model_name` query.
   - `idx_rack_equipment_library_is_active` on `rack_equipment_library(is_active, type, name)` — covers the `WHERE is_active = true ORDER BY type, name` query.

3. Notes
   - All indexes use `IF NOT EXISTS` so re-running is safe.
   - No columns changed, no data migrated, no policies affected.
*/

CREATE INDEX IF NOT EXISTS idx_led_products_created_at
  ON led_products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processor_library_is_active
  ON processor_library (is_active, manufacturer, model_name);

CREATE INDEX IF NOT EXISTS idx_rack_equipment_library_is_active
  ON rack_equipment_library (is_active, type, name);
