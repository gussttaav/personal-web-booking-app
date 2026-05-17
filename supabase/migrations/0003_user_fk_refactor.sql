-- 0003: Replace email columns with user_id FKs in failed_bookings and subscriptions.
-- Existing rows are test-only data and are intentionally dropped.

-- failed_bookings: replace email with user_id FK
TRUNCATE TABLE failed_bookings;
ALTER TABLE failed_bookings DROP COLUMN email;
ALTER TABLE failed_bookings
  ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT;

-- subscriptions: replace email with user_id FK
TRUNCATE TABLE subscriptions;
ALTER TABLE subscriptions DROP COLUMN email;
ALTER TABLE subscriptions
  ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT;
DROP INDEX IF EXISTS idx_subscriptions_email;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_email_type_key;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_type_key UNIQUE (user_id, type);
CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
