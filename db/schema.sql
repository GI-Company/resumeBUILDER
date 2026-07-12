-- Core schema for Resume Builder

-- 1. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- For future auth
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
CREATE POLICY "Public read by ID" ON resumes
    FOR SELECT USING (true);

-- No direct client inserts/updates. All mutations must go through the RPC.
CREATE POLICY "No direct insert" ON resumes FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update" ON resumes FOR UPDATE USING (false);
CREATE POLICY "No direct delete" ON resumes FOR DELETE USING (false);


-- RPC: Save Resume (ACID compliant with Leaky Bucket Rate Limiting)
CREATE OR REPLACE FUNCTION save_resume(p_id UUID, p_content JSONB, p_client_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_tokens INT;
    v_last_refill TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
    v_elapsed_minutes FLOAT;
    v_refill_amount INT;
    v_final_id UUID;
BEGIN
    -- 1. Rate Limiting (Leaky Bucket)
    -- STRICT LOCKING: SELECT ... FOR UPDATE to prevent race conditions on tokens
    SELECT tokens, last_refill INTO v_tokens, v_last_refill
    FROM rate_limits
    WHERE client_id = p_client_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO rate_limits (client_id, tokens, last_refill)
        VALUES (p_client_id, 9, v_now);
    ELSE
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

        UPDATE rate_limits
        SET tokens = v_tokens - 1, last_refill = v_last_refill
        WHERE client_id = p_client_id;
    END IF;

    -- 2. Save Data
    v_final_id := COALESCE(p_id, gen_random_uuid());
    
    INSERT INTO resumes (id, content, updated_at)
    VALUES (v_final_id, p_content, v_now)
    ON CONFLICT (id) DO UPDATE
    SET content = EXCLUDED.content, updated_at = v_now;

    -- 3. Audit Log
    INSERT INTO audit_logs (action, details)
    VALUES ('SAVE_RESUME', json_build_object('id', v_final_id, 'client_id', p_client_id));

    RETURN json_build_object('success', true, 'code', 'OK', 'id', v_final_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
