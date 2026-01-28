-- ============================================
-- ADMIN ACCOUNT SETUP INSTRUCTIONS
-- ============================================
-- 
-- STEP 1: Sign up at the /auth page with these credentials:
--   Email: admin@haramayauniversity.edu.et
--   Password: Admin123!@#
--   (Or any credentials you prefer)
--
-- STEP 2: After signing up, run this SQL in Lovable Cloud > Database > Run SQL:

-- Update the user's profile to admin role
UPDATE public.profiles 
SET 
    role = 'admin',
    full_name = 'System Administrator',
    onboarding_completed = true
WHERE email = 'admin@haramayauniversity.edu.et';

-- Add the admin role to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles 
WHERE email = 'admin@haramayauniversity.edu.et'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the admin account was created
SELECT 
    p.id,
    p.email, 
    p.full_name, 
    p.role as profile_role, 
    p.onboarding_completed,
    ur.role as user_roles_table
FROM profiles p 
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'admin@haramayauniversity.edu.et';
