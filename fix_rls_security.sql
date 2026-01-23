-- Fix RLS Security Issues - Replace user_metadata with auth.uid()
-- Run this in your Supabase SQL Editor to fix all RLS security warnings

-- =====================================================
-- 1. FIX PROFILES TABLE RLS
-- =====================================================

-- Drop old policies using user_metadata
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin Kecamatan can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin Kecamatan can manage all profiles" ON profiles;

-- Create new secure policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admin Kecamatan can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

CREATE POLICY "Admin Kecamatan can manage all profiles" 
ON profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

-- =====================================================
-- 2. FIX SUBMISSIONS TABLE RLS
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Operators can view and manage their own submissions" ON submissions;
DROP POLICY IF EXISTS "Admin Kecamatan can view and manage all submissions" ON submissions;

-- Create new secure policies
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

CREATE POLICY "Admin Kecamatan can view and manage all submissions" 
ON submissions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

-- =====================================================
-- 3. FIX SCHOOL_DATA TABLE RLS
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Public read school_data" ON school_data;
DROP POLICY IF EXISTS "Operators can update own school data" ON school_data;

-- Create new secure policies
CREATE POLICY "Public read school_data" 
ON school_data FOR SELECT 
USING (true);

CREATE POLICY "Operators can update own school data" 
ON school_data FOR UPDATE 
USING (
  npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- 4. FIX ORGANIZATIONS TABLE RLS
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Public read organizations" ON organizations;
DROP POLICY IF EXISTS "Operators can update own organization" ON organizations;

-- Create new secure policies
CREATE POLICY "Public read organizations" 
ON organizations FOR SELECT 
USING (true);

CREATE POLICY "Operators can update own organization" 
ON organizations FOR UPDATE 
USING (
  id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
);

-- =====================================================
-- 5. FIX VERIFICATION_CODES TABLE RLS
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admin Kecamatan can view all codes" ON verification_codes;
DROP POLICY IF EXISTS "Organizations can view their own codes" ON verification_codes;

-- Create new secure policies
CREATE POLICY "Admin Kecamatan can view all codes" 
ON verification_codes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

CREATE POLICY "Organizations can view their own codes" 
ON verification_codes FOR SELECT 
USING (
  org_id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
);

-- =====================================================
-- 6. FIX POSTS TABLE RLS
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Public read posts" ON posts;
DROP POLICY IF EXISTS "Operators can manage own posts" ON posts;
DROP POLICY IF EXISTS "Admin Kecamatan can manage all posts" ON posts;

-- Create new secure policies
CREATE POLICY "Public read posts" 
ON posts FOR SELECT 
USING (true);

CREATE POLICY "Operators can manage own posts" 
ON posts FOR ALL 
USING (
  org_id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Admin Kecamatan can manage all posts" 
ON posts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

-- =====================================================
-- 7. FIX FUNCTION SECURITY (SET search_path)
-- =====================================================

DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS public.check_brute_force(TEXT);
CREATE OR REPLACE FUNCTION public.check_brute_force(target_npsn TEXT)
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

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this query to verify all policies are fixed
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
