-- SQL Setup for Authentication & Security
-- Run this in your Supabase SQL Editor

-- 1. Table for Brute Force Protection
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npsn TEXT NOT NULL,
    ip_address TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_successful BOOLEAN DEFAULT FALSE
);

-- Enable RLS on login_attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for login attempts (we'll handle logic in API/Client)
CREATE POLICY "Allow anonymous inserts for login attempts" 
ON login_attempts FOR INSERT 
WITH CHECK (true);

-- 2. Configure RLS for organizations and school_data
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_data ENABLE ROW LEVEL SECURITY;

-- Drop existing public policies if they are too permissive
-- DROP POLICY IF EXISTS "Allow public read for organizations" ON organizations;
-- DROP POLICY IF EXISTS "Allow public read for school_data" ON school_data;

-- Policy: Anyone can read organizations (public info)
CREATE POLICY "Public read organizations" 
ON organizations FOR SELECT 
USING (true);

-- Policy: Anyone can read school_data (public info)
CREATE POLICY "Public read school_data" 
ON school_data FOR SELECT 
USING (true);

-- Policy: Only Operators can update their OWN school data
-- We use the NPSN stored in user_metadata during login
CREATE POLICY "Operators can update own school data" 
ON school_data FOR UPDATE 
USING (
  npsn = (auth.jwt() -> 'user_metadata' ->> 'npsn')
)
WITH CHECK (
  npsn = (auth.jwt() -> 'user_metadata' ->> 'npsn')
);

-- Policy: Only Operators can update their OWN organization name/slug (optional)
CREATE POLICY "Operators can update own organization" 
ON organizations FOR UPDATE 
USING (
  id IN (
    SELECT org_id FROM school_data 
    WHERE npsn = (auth.jwt() -> 'user_metadata' ->> 'npsn')
  )
);

-- 3. Function to check for brute force
CREATE OR REPLACE FUNCTION check_brute_force(target_npsn TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    failed_count INTEGER;
BEGIN
    SELECT count(*) INTO failed_count
    FROM login_attempts
    WHERE npsn = target_npsn
      AND is_successful = FALSE
      AND attempted_at > NOW() - INTERVAL '15 minutes';
      
    RETURN failed_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
