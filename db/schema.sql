-- Core schema for Resume Builder
-- 1. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- For future auth
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Audit Logs (Defense-in-depth tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Rate Limits (Leaky Bucket)
CREATE TABLE IF NOT EXISTS rate_limits (
    client_id TEXT PRIMARY KEY,
    tokens INT NOT NULL DEFAULT 10,
    last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Public can select their own resume by ID (assuming UUID is unguessable enough for sharing)
DROP POLICY IF EXISTS "Public read by ID" ON resumes;
CREATE POLICY "Public read by ID" ON resumes
    FOR SELECT USING (true);
    
DROP POLICY IF EXISTS "Users can see their own resumes" ON resumes;
CREATE POLICY "Users can see their own resumes" ON resumes
    FOR SELECT USING (auth.uid() = user_id);

-- No direct client inserts/updates. All mutations must go through the RPC.
DROP POLICY IF EXISTS "No direct insert" ON resumes;
CREATE POLICY "No direct insert" ON resumes FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "No direct update" ON resumes;
CREATE POLICY "No direct update" ON resumes FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No direct delete" ON resumes;
CREATE POLICY "No direct delete" ON resumes FOR DELETE USING (false);

-- RPC: Save Resume (ACID compliant with Leaky Bucket Rate Limiting)
CREATE OR REPLACE FUNCTION save_resume(p_id UUID, p_content JSONB, p_client_id TEXT)
RETURNS JSON AS $BODY$
DECLARE
    v_tokens INT;
    v_last_refill TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
    v_elapsed_minutes FLOAT;
    v_refill_amount INT;
    v_final_id UUID;
    v_user_id UUID := auth.uid();
    v_exists BOOLEAN := FALSE;
    v_existing_owner UUID;
BEGIN
    -- 1. Concurrency-Safe Rate Limiter Initialization
    -- Insert record with 10 tokens if not exists, safely handling initial concurrent requests
    INSERT INTO rate_limits (client_id, tokens, last_refill)
    VALUES (p_client_id, 10, v_now)
    ON CONFLICT (client_id) DO NOTHING;

    -- STRICT LOCKING: SELECT ... FOR UPDATE to prevent race conditions on tokens
    SELECT tokens, last_refill INTO v_tokens, v_last_refill
    FROM rate_limits
    WHERE client_id = p_client_id
    FOR UPDATE;

    -- Refill 10 tokens per minute
    v_elapsed_minutes := EXTRACT(EPOCH FROM (v_now - v_last_refill)) / 60.0;
    v_refill_amount := FLOOR(v_elapsed_minutes * 10);
    IF v_refill_amount > 0 THEN
        v_tokens := LEAST(10, v_tokens + v_refill_amount);
        v_last_refill := v_now;
    END IF;

    IF v_tokens <= 0 THEN
        RETURN json_build_object('success', false, 'code', 'RATE_LIMIT', 'message', 'Too many requests. Please wait.');
    END IF;

    -- Decrement token
    UPDATE rate_limits
    SET tokens = v_tokens - 1, last_refill = v_last_refill
    WHERE client_id = p_client_id;

    -- 2. Security (Ownership Verification / IDOR Protection)
    v_final_id := COALESCE(p_id, gen_random_uuid());
    
    SELECT TRUE, user_id INTO v_exists, v_existing_owner
    FROM resumes
    WHERE id = v_final_id;

    -- If resume already exists and has an owner, verify if the current user matches
    IF v_exists AND v_existing_owner IS NOT NULL THEN
        IF v_user_id IS NULL OR v_existing_owner <> v_user_id THEN
            RETURN json_build_object(
                'success', false,
                'code', 'UNAUTHORIZED',
                'message', 'You do not have permission to modify this resume.'
            );
        END IF;
    END IF;

    -- 3. Save Data (Upsert)
    INSERT INTO resumes (id, user_id, content, updated_at)
    VALUES (v_final_id, v_user_id, p_content, v_now)
    ON CONFLICT (id) DO UPDATE
    SET content = EXCLUDED.content, user_id = COALESCE(resumes.user_id, v_user_id), updated_at = v_now;

    -- 4. Audit Log (Defense-in-depth tracking)
    INSERT INTO audit_logs (action, details)
    VALUES ('SAVE_RESUME', json_build_object('id', v_final_id, 'client_id', p_client_id, 'user_id', v_user_id));

    RETURN json_build_object('success', true, 'code', 'OK', 'id', v_final_id);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;
