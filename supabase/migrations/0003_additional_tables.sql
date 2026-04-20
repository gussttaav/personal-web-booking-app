-- DB-02: Additional tables and schema extensions needed by the Supabase
-- repository implementations (SupabaseSessionRepository, SupabaseBookingRepository,
-- SupabasePaymentRepository).

-- ═══════════════════════════════════════════════════════════
-- ZOOM SESSIONS — extra columns for ZoomSession reconstruction
-- ═══════════════════════════════════════════════════════════
-- session_id: Zoom Video SDK session identifier (was not stored in 0001)
-- duration_minutes: needed to reconstruct full ZoomSession on findByEventId
ALTER TABLE zoom_sessions ADD COLUMN session_id       TEXT NOT NULL DEFAULT '';
ALTER TABLE zoom_sessions ADD COLUMN duration_minutes INT  NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════
-- SESSION MESSAGES (chat persistence)
-- ═══════════════════════════════════════════════════════════
-- Currently: Redis list `chat:session:{eventId}` with 24-hour TTL.
-- This table provides durable storage; ordered by sequential id.
CREATE TABLE session_messages (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zoom_session_id  UUID NOT NULL REFERENCES zoom_sessions(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_messages_zoom_session ON session_messages (zoom_session_id, id);

ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- SLOT LOCKS (booking concurrency guard)
-- ═══════════════════════════════════════════════════════════
-- Replaces Redis SET NX. Rows are keyed on the normalised start ISO string.
-- Expired rows are cleaned up by acquire_slot_lock before each attempt.
CREATE TABLE slot_locks (
  start_iso  TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);

-- ═══════════════════════════════════════════════════════════
-- WEBHOOK EVENTS (Stripe idempotency)
-- ═══════════════════════════════════════════════════════════
-- Replaces Redis key `webhook:single:{key}` with 7-day TTL.
-- Kept separate from the payments table — idempotency keys exist before
-- a full payment record can be written.
CREATE TABLE webhook_events (
  idempotency_key TEXT PRIMARY KEY,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- FAILED BOOKINGS (dead-letter queue)
-- ═══════════════════════════════════════════════════════════
-- Replaces Redis key `failed:booking:{sessionId}` with 30-day TTL.
-- Kept separate from the payments table — failed bookings may occur before
-- a user row exists (payments.user_id NOT NULL would block the insert).
CREATE TABLE failed_bookings (
  stripe_session_id TEXT PRIMARY KEY,
  email             TEXT        NOT NULL,
  start_iso         TEXT        NOT NULL,
  failed_at         TIMESTAMPTZ NOT NULL,
  error             TEXT        NOT NULL
);

ALTER TABLE slot_locks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_bookings   ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- SLOT LOCK FUNCTIONS
-- ═══════════════════════════════════════════════════════════

-- Atomically acquires a slot lock. Returns TRUE if the lock was acquired,
-- FALSE if another booking already holds it.
-- Advisory locks are NOT used here because they are session-scoped and do
-- not survive Vercel's connection pool recycling.
CREATE OR REPLACE FUNCTION acquire_slot_lock(p_start_iso TEXT, p_duration_minutes INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_inserted INT;
BEGIN
  -- Remove expired lock for this slot (if any) to allow re-acquisition
  DELETE FROM slot_locks
  WHERE start_iso = p_start_iso AND expires_at <= now();

  INSERT INTO slot_locks (start_iso, expires_at)
  VALUES (
    p_start_iso,
    now() + make_interval(secs => p_duration_minutes * 60 + 300)
  )
  ON CONFLICT (start_iso) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_slot_lock(p_start_iso TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM slot_locks WHERE start_iso = p_start_iso;
END;
$$ LANGUAGE plpgsql;
