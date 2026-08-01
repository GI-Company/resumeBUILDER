-- Core schema for Resume Builder
-- 1. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trash', 'archive')),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add the column if the table already existed before this update
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

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

-- Public can select their own resume by ID if it is public
DROP POLICY IF EXISTS "Public read by ID" ON resumes;
CREATE POLICY "Public read by ID" ON resumes
    FOR SELECT USING (is_public = true);
    
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
CREATE OR REPLACE FUNCTION save_resume(p_id UUID, p_content JSONB, p_client_id TEXT, p_status TEXT DEFAULT 'active', p_is_public BOOLEAN DEFAULT false)
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
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'code', 'UNAUTHORIZED',
            'message', 'Authentication required to save resumes.'
        );
    END IF;

    v_final_id := COALESCE(p_id, gen_random_uuid());
    
    SELECT TRUE, user_id INTO v_exists, v_existing_owner
    FROM resumes
    WHERE id = v_final_id;

    IF v_exists THEN
        IF v_existing_owner <> v_user_id THEN
            RETURN json_build_object(
                'success', false,
                'code', 'UNAUTHORIZED',
                'message', 'You do not have permission to modify this resume.'
            );
        END IF;
    END IF;

    -- 3. Save Data (Upsert)
    INSERT INTO resumes (id, user_id, content, status, updated_at, is_public)
    VALUES (v_final_id, v_user_id, p_content, p_status, v_now, p_is_public)
    ON CONFLICT (id) DO UPDATE
    SET content = EXCLUDED.content, 
        status = EXCLUDED.status,
        is_public = EXCLUDED.is_public,
        updated_at = v_now;

    IF p_is_public THEN
        INSERT INTO public_activity_feed (event_type, display_message)
        VALUES ('RESUME_SHARED', 'A user just published a new resume design.')
        ON CONFLICT DO NOTHING;
    END IF;

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

-- 4. Guest AI Rate Limits
CREATE TABLE IF NOT EXISTS guest_ai_limits (
    ip_address TEXT PRIMARY KEY,
    count INT NOT NULL DEFAULT 0,
    first_request_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE guest_ai_limits ENABLE ROW LEVEL SECURITY;

-- RPC: Check and Increment Guest AI Rate Limit (5 requests / 24 hours)
CREATE OR REPLACE FUNCTION check_guest_ai_limit(p_ip TEXT)
RETURNS JSON AS $BODY$
DECLARE
    v_limit_window INTERVAL := '24 hours';
    v_record RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    INSERT INTO guest_ai_limits (ip_address, count, first_request_time)
    VALUES (p_ip, 1, v_now)
    ON CONFLICT (ip_address) DO UPDATE
    SET 
        count = CASE 
            WHEN (NOW() - guest_ai_limits.first_request_time) >= INTERVAL '24 hours' THEN 1
            ELSE guest_ai_limits.count + 1
        END,
        first_request_time = CASE 
            WHEN (NOW() - guest_ai_limits.first_request_time) >= INTERVAL '24 hours' THEN NOW()
            ELSE guest_ai_limits.first_request_time
        END
    RETURNING count, first_request_time INTO v_record;

    IF v_record.count > 5 THEN
        RETURN json_build_object(
            'allowed', false, 
            'count', v_record.count, 
            'remaining', 0, 
            'resetTime', v_record.first_request_time + v_limit_window
        );
    END IF;

    RETURN json_build_object(
        'allowed', true, 
        'count', v_record.count, 
        'remaining', 5 - v_record.count, 
        'resetTime', v_record.first_request_time + v_limit_window
    );
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Public Activity Feed (For Landing Page Live Social Proof)
CREATE TABLE IF NOT EXISTS public_activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    display_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and public read access
ALTER TABLE public_activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view activity feed" ON public_activity_feed;
CREATE POLICY "Public can view activity feed" ON public_activity_feed
    FOR SELECT USING (true);

-- No direct client inserts/updates. Must use a backend API route.
DROP POLICY IF EXISTS "No direct insert on public_activity_feed" ON public_activity_feed;
CREATE POLICY "No direct insert on public_activity_feed" ON public_activity_feed FOR INSERT WITH CHECK (false);

-- Enable Realtime for the public activity feed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'public_activity_feed'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public_activity_feed;
  END IF;
END
$$;

-- =================================================================
-- 6. Authenticated User AI Rate Limits (100 requests / 24 hours)
--    Mirrors the guest_ai_limits table but keyed by user ID.
--    Called by check_user_ai_limit RPC from rateLimit.ts.
-- =================================================================
CREATE TABLE IF NOT EXISTS user_ai_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    count INT NOT NULL DEFAULT 0,
    first_request_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS — users can only see their own row
ALTER TABLE user_ai_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai limit" ON user_ai_limits;
CREATE POLICY "Users can view own ai limit" ON user_ai_limits
    FOR SELECT USING (auth.uid() = user_id);

-- RPC: Check and Increment Authenticated User AI Rate Limit (100 requests / 24 hours)
CREATE OR REPLACE FUNCTION check_user_ai_limit(p_user_id UUID)
RETURNS JSON AS $BODY$
DECLARE
    v_limit INT := 10; -- Default free limit
    v_tier VARCHAR(50);
    v_limit_window INTERVAL := '24 hours';
    v_record RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Fetch the user's tier
    SELECT tier INTO v_tier FROM public.entitlements WHERE user_id = p_user_id;
    
    -- Set limit based on tier
    IF v_tier = 'premium_founder' THEN
        v_limit := 100;
    ELSIF v_tier = 'founder' THEN
        v_limit := 75;
    ELSIF v_tier = 'premium' THEN
        v_limit := 75;
    ELSIF v_tier = 'free' THEN
        v_limit := 15;
    ELSE
        v_limit := 5;
    END IF;

    INSERT INTO public.user_ai_limits (user_id, count, first_request_time)
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
            'resetTime', v_record.first_request_time + v_limit_window
        );
    END IF;

    RETURN json_build_object(
        'allowed', true, 
        'count', v_record.count, 
        'remaining', v_limit - v_record.count, 
        'resetTime', v_record.first_request_time + v_limit_window
    );
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Entitlements for Founders
CREATE TABLE IF NOT EXISTS entitlements (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    subscription_status TEXT DEFAULT 'inactive',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own entitlements" ON entitlements;
CREATE POLICY "Users can read own entitlements" ON entitlements FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user_entitlement()
RETURNS TRIGGER AS $$
DECLARE
    v_founder_count INT;
BEGIN
    SELECT count(*) INTO v_founder_count FROM public.entitlements WHERE tier = 'founder';
    
    IF v_founder_count < 50 THEN
        INSERT INTO public.entitlements (user_id, tier) VALUES (NEW.id, 'founder');
    ELSE
        INSERT INTO public.entitlements (user_id, tier) VALUES (NEW.id, 'free');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user_entitlement();
-- 1. Create the Table
CREATE TABLE IF NOT EXISTS custom_design_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    design JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enforce the limit of 10 presets per user
CREATE OR REPLACE FUNCTION check_preset_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT count(*) 
        FROM custom_design_presets 
        WHERE user_id = NEW.user_id 
    ) >= 10 THEN
        RAISE EXCEPTION 'User has reached the limit of 10 custom templates.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_preset_limit ON custom_design_presets;
CREATE TRIGGER trg_enforce_preset_limit
BEFORE INSERT ON custom_design_presets
FOR EACH ROW EXECUTE FUNCTION check_preset_limit();

-- 3. Enable RLS
ALTER TABLE custom_design_presets ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Users can fully manage their own presets)
DROP POLICY IF EXISTS "Users can read their own presets" ON custom_design_presets;
CREATE POLICY "Users can read their own presets" ON custom_design_presets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own presets" ON custom_design_presets;
CREATE POLICY "Users can insert their own presets" ON custom_design_presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own presets" ON custom_design_presets;
CREATE POLICY "Users can update their own presets" ON custom_design_presets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own presets" ON custom_design_presets;
CREATE POLICY "Users can delete their own presets" ON custom_design_presets
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_preset_updated_at ON custom_design_presets;
CREATE TRIGGER trg_set_preset_updated_at
BEFORE UPDATE ON custom_design_presets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Phase 2: Job Tracker (Kanban Board)
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected')),
    url TEXT,
    salary_range TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own jobs" ON job_applications;
CREATE POLICY "Users can read own jobs" ON job_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own jobs" ON job_applications;
CREATE POLICY "Users can insert own jobs" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own jobs" ON job_applications;
CREATE POLICY "Users can update own jobs" ON job_applications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own jobs" ON job_applications;
CREATE POLICY "Users can delete own jobs" ON job_applications FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_job_updated_at ON job_applications;
CREATE TRIGGER trg_set_job_updated_at
BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION set_job_updated_at();

