/*
# Signal Flow: one device name per category

1. Summary
- Adds a database rule so the same device name cannot be saved twice inside the
  same Signal Flow category (for example, two "SX40" devices under
  "LED Processors" are rejected, while "SX40" may still exist once per category).

2. Changed Tables
- `signal_flow_devices`
  - New unique index `signal_flow_devices_unique_name_per_category`
    on `(lower(btrim(name)), lower(btrim(category)))`.
  - Name comparison ignores letter case and extra spaces, matching how the
    admin interface checks for duplicates.

3. Security
- No policy or grant changes. Row level security and existing policies on
  `signal_flow_devices` are untouched; this only adds an integrity constraint.

4. Notes
- Idempotent: uses `CREATE UNIQUE INDEX IF NOT EXISTS`, safe to re-run.
- Verified before applying: no existing rows share a name within a category,
  so index creation cannot fail on current data.
- No destructive operations; existing data is unchanged.
*/

CREATE UNIQUE INDEX IF NOT EXISTS signal_flow_devices_unique_name_per_category
ON public.signal_flow_devices (lower(btrim(name)), lower(btrim(category)));
