-- Add distribution multiplier: how many 1G sub-ports each output port expands to via a distribution unit (e.g. Brompton XD box = 10)
ALTER TABLE processor_library
  ADD COLUMN distribution_per_port int NOT NULL DEFAULT 1,
  ADD COLUMN distribution_unit_name text;

-- SX40: each 10G port feeds one XD box → 10 × 1G ports
UPDATE processor_library
SET
  distribution_per_port = 10,
  distribution_unit_name = 'Tessera XD'
WHERE manufacturer = 'Brompton Technology' AND model_name = 'Tessera SX40';
