-- Fix the audit_logs table (it was missing user_id because IF NOT EXISTS skips column additions)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Force upgrade your account to Premium Founder so you can test the PDF export
UPDATE entitlements SET tier = 'premium_founder';
