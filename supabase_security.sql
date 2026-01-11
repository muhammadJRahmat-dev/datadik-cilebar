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

-- Allow anonymous inserts for login attempts
DROP POLICY IF EXISTS "Allow anonymous inserts for login attempts" ON login_attempts;
CREATE POLICY "Allow anonymous inserts for login attempts" 
ON login_attempts FOR INSERT 
WITH CHECK (true);

-- 2. Profiles table for role management
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin_kecamatan', 'operator', 'visitor')),
    full_name TEXT,
    npsn TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin Kecamatan can view all profiles" ON profiles;
CREATE POLICY "Admin Kecamatan can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

DROP POLICY IF EXISTS "Admin Kecamatan can manage all profiles" ON profiles;
CREATE POLICY "Admin Kecamatan can manage all profiles" 
ON profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

-- 3. File Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    description TEXT,
    category TEXT DEFAULT 'umum', -- 'laporan', 'arsip', 'pengajuan'
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Submissions Policies
DROP POLICY IF EXISTS "Operators can view and manage their own submissions" ON submissions;
CREATE POLICY "Operators can view and manage their own submissions" 
ON submissions FOR ALL 
USING (
  org_id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (
      SELECT npsn FROM profiles WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Admin Kecamatan can view and manage all submissions" ON submissions;
CREATE POLICY "Admin Kecamatan can view and manage all submissions" 
ON submissions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

-- 4. Configure RLS for organizations and school_data
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_data ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read organizations (public info)
DROP POLICY IF EXISTS "Public read organizations" ON organizations;
CREATE POLICY "Public read organizations" 
ON organizations FOR SELECT 
USING (true);

-- Policy: Anyone can read school_data (public info)
DROP POLICY IF EXISTS "Public read school_data" ON school_data;
CREATE POLICY "Public read school_data" 
ON school_data FOR SELECT 
USING (true);

-- Policy: Only Operators can update their OWN school data
DROP POLICY IF EXISTS "Operators can update own school data" ON school_data;
CREATE POLICY "Operators can update own school data" 
ON school_data FOR UPDATE 
USING (
  npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
);

-- Policy: Only Operators can update their OWN organization name/slug (optional)
DROP POLICY IF EXISTS "Operators can update own organization" ON organizations;
CREATE POLICY "Operators can update own organization" 
ON organizations FOR UPDATE 
USING (
  id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
);

-- 5. Verification Codes table for OTP
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
    target TEXT NOT NULL, -- the email or whatsapp number
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on verification_codes
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admin Kecamatan and the owner Organization can see their codes
DROP POLICY IF EXISTS "Admin Kecamatan can view all codes" ON verification_codes;
CREATE POLICY "Admin Kecamatan can view all codes" 
ON verification_codes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

DROP POLICY IF EXISTS "Organizations can view their own codes" ON verification_codes;
CREATE POLICY "Organizations can view their own codes" 
ON verification_codes FOR SELECT 
USING (
  org_id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
);
CREATE OR REPLACE FUNCTION check_brute_force(target_npsn TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    failed_count INTEGER;
BEGIN
    SELECT count(*) INTO failed_count
    FROM public.login_attempts
    WHERE npsn = target_npsn
      AND is_successful = FALSE
      AND attempted_at > NOW() - INTERVAL '15 minutes';
      
    RETURN failed_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
