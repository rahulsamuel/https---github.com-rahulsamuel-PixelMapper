/*
# Track when a receipt email was delivered

1. Modified Tables
- `receipts`: new nullable column `email_sent_at` (timestamp with time zone).

2. Purpose
- The payment webhook emails the PDF receipt once payment is confirmed. This column records the successful send so the email is not sent twice when Stripe redelivers the event.

3. Security
- No change to row level security or grants. The column is written only by the server (service role).

4. Notes
- Existing receipts keep a null value, which means "not yet emailed".
- Idempotent: safe to re-run.
*/

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
