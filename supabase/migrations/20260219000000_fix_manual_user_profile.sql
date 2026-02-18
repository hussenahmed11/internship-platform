-- Fix for manually created users without proper profile setup
-- This migration ensures that all auth users have corresponding profiles

-- Function to sync auth users with profiles
CREATE OR REPLACE FUNCTION public.sync_auth_users_with_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
    auth_user RECORD;
BEGIN
    -- Loop through all auth users
    FOR auth_user IN 
        SELECT 
            au.id,
            au.email,
            au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.profiles p ON p.user_id = au.id
        WHERE p.id IS NULL  -- Only users without profiles
    LOOP
        -- Create missing profile
        INSERT INTO public.profiles (user_id, email, full_name, role)
        VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'full_name', ''),
            COALESCE((auth_user.raw_user_meta_data->>'role')::public.app_role, 'student')
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Created profile for user: %', auth_user.email;
    END LOOP;
END;
$;

-- Execute the sync function to fix existing users
SELECT public.sync_auth_users_with_profiles();

-- Update the handle_new_user trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student')
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        updated_at = now();
    
    RETURN NEW;
END;
$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a helpful comment
COMMENT ON FUNCTION public.sync_auth_users_with_profiles() IS 
'Syncs all auth.users with public.profiles table. Run this after manually creating users in Supabase Auth dashboard.';
