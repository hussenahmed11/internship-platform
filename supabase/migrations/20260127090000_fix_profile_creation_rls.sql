-- Fix RLS policies for profile creation during signup
-- This migration addresses the circular dependency issue where profile creation
-- fails because RLS policies depend on functions that need the profile to exist

-- First, drop the existing restrictive INSERT policy for profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a more permissive INSERT policy that allows authenticated users to create their own profile
CREATE POLICY "Authenticated users can create their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Also ensure the trigger function exists to auto-create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
    -- Only create profile if it doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
        INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            NEW.raw_user_meta_data->>'avatar_url',
            COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student')
        );
    END IF;
    RETURN NEW;
END;
$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also fix the user_roles table policy to allow initial role creation
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Create separate policies for different operations
CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their initial role during signup"
    ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);