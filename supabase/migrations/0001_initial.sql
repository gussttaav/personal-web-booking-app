-- ═══════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════
-- Currently: implicit — email/name come from Google SSO JWT,
-- not stored anywhere persistent.

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);

-- ═══════════════════════════════════════════════════════════
-- CREDIT PACKS
-- ═══════════════════════════════════════════════════════════
-- Currently: Redis key `credits:{email}` → CreditRecord JSON.
-- One record per student; overwritten on each purchase.
-- Problem: purchase history is lost on overwrite.

CREATE TABLE credit_packs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  pack_size         INT NOT NULL CHECK (pack_size IN (5, 10)),
  credits_remaining INT NOT NULL CHECK (credits_remaining >= 0),
  stripe_payment_id TEXT UNIQUE NOT NULL, -- idempotency
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_packs_user ON credit_packs (user_id);
CREATE INDEX idx_credit_packs_active ON credit_packs (user_id, expires_at)
  WHERE credits_remaining > 0;

-- ═══════════════════════════════════════════════════════════
-- BOOKINGS
-- ═══════════════════════════════════════════════════════════
-- Currently: Redis key `cancel:{token}` → BookingRecord JSON
-- with TTL. Also indexed in sorted set `bookings:{email}`.
-- Booking history is lost when TTL expires.

CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  credit_pack_id  UUID REFERENCES credit_packs(id), -- NULL for paid/free sessions
  session_type    TEXT NOT NULL
                  CHECK (session_type IN ('free15min','session1h','session2h','pack')),
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  calendar_event_id TEXT,
  cancel_token    TEXT UNIQUE,
  join_token      TEXT UNIQUE,  -- separate from cancel token (security fix)
  note            TEXT,
  stripe_payment_id TEXT, -- for single-session bookings
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user ON bookings (user_id);
CREATE INDEX idx_bookings_starts ON bookings (starts_at);
CREATE INDEX idx_bookings_cancel_token ON bookings (cancel_token)
  WHERE cancel_token IS NOT NULL;
CREATE INDEX idx_bookings_join_token ON bookings (join_token)
  WHERE join_token IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- ZOOM SESSIONS
-- ═══════════════════════════════════════════════════════════
-- Currently: Redis key `zoom:session:{eventId}` → ZoomSessionRecord
-- with TTL (durationWithGrace + 24h).

CREATE TABLE zoom_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  session_name    TEXT NOT NULL,
  session_passcode TEXT NOT NULL,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zoom_sessions_booking ON zoom_sessions (booking_id);

-- ═══════════════════════════════════════════════════════════
-- PAYMENTS
-- ═══════════════════════════════════════════════════════════
-- Currently: no payment records stored. Stripe is the only
-- source of truth. This table adds local auditing.

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  stripe_payment_id   TEXT UNIQUE NOT NULL,
  amount_cents        INT NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'eur',
  status              TEXT NOT NULL DEFAULT 'succeeded'
                      CHECK (status IN ('pending','succeeded','refunded','failed')),
  checkout_type       TEXT NOT NULL CHECK (checkout_type IN ('pack','single')),
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user ON payments (user_id);

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOG (append-only)
-- ═══════════════════════════════════════════════════════════
-- Currently: Redis list `audit:{email}` capped at 100 entries.
-- Entries are lost if Redis is flushed.

CREATE TABLE audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON audit_log (user_id);
CREATE INDEX idx_audit_log_action ON audit_log (action);


-- Track data source during migration, drop after flip (Task 4.5)
ALTER TABLE credit_packs ADD COLUMN source TEXT NOT NULL DEFAULT 'supabase';
ALTER TABLE bookings     ADD COLUMN source TEXT NOT NULL DEFAULT 'supabase';
-- 'redis' for rows written from Redis → Supabase backfill,
-- 'supabase' for rows written directly. Dropped after Phase 4.

-- Updated-at triggers (Supabase convention)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER credit_packs_updated_at BEFORE UPDATE ON credit_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at     BEFORE UPDATE ON bookings     FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Enable Row-Level Security (RLS) on all tables. No policies defined yet
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log     ENABLE ROW LEVEL SECURITY;

-- No policies defined — server-side code uses the service role key,
-- which bypasses RLS. When adding client-side access (future), define
-- explicit policies here.