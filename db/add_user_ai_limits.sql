-- ============================================================
--  db/add_user_ai_limits.sql
--  Run this in your Supabase SQL Editor to enable per-user
--  AI rate limiting (100 requests per 24 hours for auth users).
-- ============================================================

-- Table to track authenticated user AI usage
CREATE TABLE IF NOT EXISTS user_ai_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    count INT NOT NULL DEFAULT 0,
    first_request_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (all mutations go through SECURITY DEFINER RPC)
ALTER TABLE user_ai_limits ENABLE ROW LEVEL SECURITY;

-- No direct client access
DROP POLICY IF EXISTS "No direct access" ON user_ai_limits;
CREATE POLICY "No direct access" ON user_ai_limits USING (false);

-- RPC: Check and Increment Authenticated User AI Rate Limit (100 req / 24 hours)
CREATE OR REPLACE FUNCTION check_user_ai_limit(p_user_id UUID)
RETURNS JSON AS $BODY$
DECLARE
    v_limit INT := 100;
    v_window INTERVAL := '24 hours';
    v_record RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    INSERT INTO user_ai_limits (user_id, count, first_request_time)
    VALUES (p_user_id, 1, v_now)
    ON CONFLICT (user_id) DO UPDATE
    SET
        count = CASE
            WHEN (NOW() - user_ai_limits.first_request_time) >= INTERVAL '24 hours' THEN 1
            ELSE user_ai_limits.count + 1
        END,
        first_request_time = CASE
            WHEN (NOW() - user_ai_limits.first_request_time) >= INTERVAL '24 hours' THEN NOW()
            ELSE user_ai_limits.first_request_time
        END
    RETURNING count, first_request_time INTO v_record;

    IF v_record.count > v_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'count', v_record.count,
            'remaining', 0,
            'resetTime', v_record.first_request_time + v_window
        );
    END IF;

    RETURN json_build_object(
        'allowed', true,
        'count', v_record.count,
        'remaining', v_limit - v_record.count,
        'resetTime', v_record.first_request_time + v_window
    );
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;
