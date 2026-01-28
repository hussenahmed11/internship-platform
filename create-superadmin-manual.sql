-- Create Super Admin Profile
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from auth.users table

DO $$ 
DECLARE
    admin_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with actual user ID
    admin_email TEXT := 'admin@haramayauniversity.edu.et'; -- Replace with actual email
    admin_name TEXT := 'System Administrator';
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name, role, onboarding_completed)
    VALUES (admin_user_id, admin_email, admin_name, 'super_admin', true)
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin',
        onboarding_completed = true;
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Super Admin profile created successfully for user: %', admin_user_id;
END $$;