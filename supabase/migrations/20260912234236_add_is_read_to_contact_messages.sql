/*
# Add is_read column to contact_messages

1. Changes
- Adds `is_read` boolean column (default false) to track whether an admin has opened a message.
2. Security
- No policy changes; the existing admin SELECT policy covers the new column automatically.
*/

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;
