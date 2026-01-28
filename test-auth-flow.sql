-- Test script to verify authentication flow
-- Run this in Supabase SQL editor to test the system

-- 1. Check existing users and their roles
SELECT 
    p.email, 
    p.full_name, 
    p.role, 
    p.onboarding_completed,
    ur.role as user_role_table
FROM profiles p 
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC;

-- 2. Check if there are any users with old role names
SELECT COUNT(*) as old_company_roles FROM profiles WHERE role = 'company';
SELECT COUNT(*) as old_admin_roles FROM profiles WHERE role = 'admin';

-- 3. Create a test super admin (replace with actual user ID from auth.users)
-- First create user in Supabase Auth dashboard, then run this:
/*
INSERT INTO public.profiles (user_id, email, full_name, role, onboarding_completed)
VALUES (
    'REPLACE_WITH_ACTUAL_USER_ID', 
    'admin@haramayauniversity.edu.et', 
    'System Administrator', 
    'super_admin', 
    true
) ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    onboarding_completed = true;

INSERT INTO public.user_roles (user_id, role)
VALUES ('REPLACE_WITH_ACTUAL_USER_ID', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- 4. Test the role checking function
-- SELECT public.has_role('REPLACE_WITH_ACTUAL_USER_ID', 'super_admin');

-- 5. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';