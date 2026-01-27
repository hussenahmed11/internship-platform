-- Make hussen@haramaya.edu.et a super admin
-- This migration updates the user role to admin for the specified email

-- Update the profile role to admin
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'hussen@haramaya.edu.et';

-- Insert or update user_roles to include admin role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'
FROM public.profiles 
WHERE email = 'hussen@haramaya.edu.et'
ON CONFLICT (user_id, role) DO NOTHING;

-- Optional: Mark onboarding as completed for admin user
UPDATE public.profiles 
SET onboarding_completed = true
WHERE email = 'hussen@haramaya.edu.et';