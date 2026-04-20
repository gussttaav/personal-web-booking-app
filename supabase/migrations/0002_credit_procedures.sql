-- DB-02: Atomic credit procedures to replace Redis Lua scripts.
-- Postgres transactions provide the same atomicity guarantee.

-- Atomically decrements one credit from the earliest-expiring active pack.
-- Returns {ok, remaining} where remaining is total across all active packs.
CREATE OR REPLACE FUNCTION decrement_credit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_pack_id UUID;
  v_total   INT;
BEGIN
  SELECT id INTO v_pack_id
  FROM credit_packs
  WHERE user_id          = p_user_id
    AND credits_remaining > 0
    AND expires_at        > now()
  ORDER BY expires_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_pack_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'remaining', 0);
  END IF;

  UPDATE credit_packs
  SET credits_remaining = credits_remaining - 1
  WHERE id = v_pack_id;

  SELECT COALESCE(SUM(credits_remaining), 0) INTO v_total
  FROM credit_packs
  WHERE user_id   = p_user_id
    AND expires_at > now();

  RETURN jsonb_build_object('ok', true, 'remaining', v_total);
END;
$$ LANGUAGE plpgsql;

-- Atomically restores one credit to the earliest-expiring pack that
-- hasn't yet reached its original pack_size.
-- Returns {ok, credits} where credits is total across all active packs.
CREATE OR REPLACE FUNCTION restore_credit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_pack_id UUID;
  v_total   INT;
BEGIN
  SELECT id INTO v_pack_id
  FROM credit_packs
  WHERE user_id            = p_user_id
    AND credits_remaining  < pack_size
    AND expires_at          > now()
  ORDER BY expires_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_pack_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'credits', 0);
  END IF;

  UPDATE credit_packs
  SET credits_remaining = credits_remaining + 1
  WHERE id = v_pack_id;

  SELECT COALESCE(SUM(credits_remaining), 0) INTO v_total
  FROM credit_packs
  WHERE user_id   = p_user_id
    AND expires_at > now();

  RETURN jsonb_build_object('ok', true, 'credits', v_total);
END;
$$ LANGUAGE plpgsql;
