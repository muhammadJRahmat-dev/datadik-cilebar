-- Create Admin User Script
-- Run this in your Supabase SQL Editor to set up the initial admin account.

BEGIN;

-- 1. Create User in Auth Schema
-- Password is 'admin123' (Supabase bcrypt hash)
-- Generates a UUID for the user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for Admin
    'authenticated',
    'authenticated',
    'admin@cilebar.go.id',
    '$2a$10$2Sj.J.1/1.1/1.1/1.1/1.1/1.1/1.1/1.1/1.1/1.1/1.1/1.1/', -- Placeholder hash, see instructions below
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin Kecamatan"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- IMPORTANT: The password hash above is INVALID. 
-- Supabase uses bcrypt. Since we can't easily generate a valid bcrypt hash in SQL without pgcrypto (which might not be enabled),
-- The BEST way is to sign up via the UI, then run the update below.

-- ALTERNATIVE: If you have already signed up with 'admin@cilebar.go.id', just run this:

-- 2. Create or Update Profile in Public Schema
INSERT INTO public.profiles (id, role, full_name)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@cilebar.go.id'),
    'admin_kecamatan',
    'Super Admin Kecamatan'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin_kecamatan',
    full_name = 'Super Admin Kecamatan';

COMMIT;

-- Instructions:
-- 1. If you haven't created a user yet, go to your App Registration page and Sign Up as 'admin@cilebar.go.id' with your desired password.
-- 2. Then run the "INSERT INTO public.profiles..." part of this script to elevate that user to Admin.
