-- Core schema for Resume Builder
-- 1. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trash', 'archive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to enforce max 3 active resumes
CREATE OR REPLACE FUNCTION check_resume_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND (
        SELECT count(*) 
        FROM resumes 
        WHERE user_id = NEW.user_id 
        AND status = 'active' 
        AND id <> NEW.id
    ) >= 3 THEN
        RAISE EXCEPTION 'User already has 3 active resumes.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_resume_limit ON resumes;
CREATE TRIGGER trg_enforce_resume_limit
BEFORE INSERT OR UPDATE ON resumes
FOR EACH ROW EXECUTE FUNCTION check_resume_limit();

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
CREATE OR REPLACE FUNCTION save_resume(p_id UUID, p_content JSONB, p_client_id TEXT, p_status TEXT DEFAULT 'active')
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
    INSERT INTO rate_limits (client_id, tokens, last_refill)
    VALUES (p_client_id, 10, v_now)
    ON CONFLICT (client_id) DO NOTHING;

    SELECT tokens, last_refill INTO v_tokens, v_last_refill
    FROM rate_limits
    WHERE client_id = p_client_id
    FOR UPDATE;

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

    -- 2. Security (Ownership Verification / IDOR Protection)
    v_final_id := COALESCE(p_id, gen_random_uuid());
    
    SELECT TRUE, user_id INTO v_exists, v_existing_owner
    FROM resumes
    WHERE id = v_final_id;

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
    INSERT INTO resumes (id, user_id, content, status, updated_at)
    VALUES (v_final_id, v_user_id, p_content, p_status, v_now)
    ON CONFLICT (id) DO UPDATE
    SET content = EXCLUDED.content, 
        status = EXCLUDED.status,
        user_id = COALESCE(resumes.user_id, v_user_id), 
        updated_at = v_now;

    -- 4. Audit Log
    INSERT INTO audit_logs (action, details)
    VALUES ('SAVE_RESUME', json_build_object('id', v_final_id, 'client_id', p_client_id, 'user_id', v_user_id, 'status', p_status));

    RETURN json_build_object('success', true, 'code', 'OK', 'id', v_final_id);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Set Resume Status (Trash/Archive)
CREATE OR REPLACE FUNCTION set_resume_status(p_id UUID, p_status TEXT)
RETURNS JSON AS $BODY$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM resumes WHERE id = p_id AND user_id = v_user_id) THEN
        RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized');
    END IF;

    UPDATE resumes SET status = p_status, updated_at = NOW() WHERE id = p_id;
    RETURN json_build_object('success', true, 'code', 'OK');
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Duplicate Resume
CREATE OR REPLACE FUNCTION duplicate_resume(p_id UUID)
RETURNS JSON AS $BODY$
DECLARE
    v_user_id UUID := auth.uid();
    v_new_id UUID := gen_random_uuid();
    v_content JSONB;
BEGIN
    SELECT content INTO v_content FROM resumes WHERE id = p_id AND user_id = v_user_id;
    IF v_content IS NULL THEN
        RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Resume not found or unauthorized');
    END IF;

    INSERT INTO resumes (id, user_id, content, status, updated_at)
    VALUES (v_new_id, v_user_id, v_content, 'active', NOW());
    
    RETURN json_build_object('success', true, 'code', 'OK', 'id', v_new_id);
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;
