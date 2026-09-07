-- AfriPay durable payment state. Apply this migration to PostgreSQL before
-- enabling DATABASE_URL-backed repositories.
CREATE TABLE IF NOT EXISTS momo_transactions (
  reference_id UUID PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('COLLECTION', 'DISBURSEMENT')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED')),
  amount NUMERIC(30, 12) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  external_id TEXT NOT NULL,
  party_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (transaction_type, external_id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS momo_transactions_status_idx
  ON momo_transactions (status, updated_at);

CREATE INDEX IF NOT EXISTS webhook_events_external_id_idx
  ON webhook_events (external_id);

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  amount NUMERIC(30, 12) NOT NULL CHECK (amount > 0),
  asset TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED')),
  transaction_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY,
  creator TEXT NOT NULL,
  amount NUMERIC(30, 12) CHECK (amount IS NULL OR amount > 0),
  asset TEXT NOT NULL,
  reference TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_intents_sender_idx
  ON payment_intents (sender, created_at DESC);
