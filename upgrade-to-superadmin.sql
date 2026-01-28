-- Upgrade existing user to Super Admin
-- Replace 'user@example.com' with the actual email of the user you want to upgrade

UPDATE public.profiles 
SET role = 'super_admin', onboarding_completed = true 
WHERE email = 'user@example.com';

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'super_admin' 
FROM public.profiles 
WHERE email = 'user@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the change
SELECT p.email, p.full_name, p.role, ur.role as user_role_table
FROM profiles p 
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'user@example.com';