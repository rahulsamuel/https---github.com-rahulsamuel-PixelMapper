/*
# Add average watts per tile to LED products

1. Modified Tables
- `led_products`
  - New column `avg_watts_per_tile` (numeric, nullable): the average power draw of a single LED tile in watts. Existing products start empty and fall back to the per-square-meter average until a value is entered.

2. Security
- No changes to row level security, policies, or grants. The new column inherits the table's existing access rules.

3. Important Notes
- This is an additive change only; no existing data is modified or removed.
- Safe to re-run: the column is added only if it does not already exist.
*/

ALTER TABLE led_products ADD COLUMN IF NOT EXISTS avg_watts_per_tile numeric;
