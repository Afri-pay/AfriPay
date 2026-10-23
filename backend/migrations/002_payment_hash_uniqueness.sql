-- Preserve existing records. Inspect duplicate hashes before applying.
-- This migration intentionally fails if historical evidence is duplicated.
CREATE UNIQUE INDEX IF NOT EXISTS payment_intents_transaction_hash_unique
  ON payment_intents (transaction_hash) WHERE transaction_hash IS NOT NULL;
