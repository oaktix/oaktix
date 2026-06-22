-- Add reminder tracking columns to the transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_12h_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index to speed up the cron query (only pending rows)
CREATE INDEX IF NOT EXISTS idx_transactions_pending_created
  ON transactions (created_at DESC)
  WHERE status = 'pending';
