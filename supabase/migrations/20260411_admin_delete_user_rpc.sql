-- CREATE A DATABASE FUNCTION TO REPLACE THE EDGE FUNCTION FOR DELETING USERS
-- This allows Admins to securely delete users and their profiles directly from the database without needing Edge Functions deployed!

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures this function runs with elevated privileges that can access auth.users
SET search_path = public
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- 1. Ensure the person running this is actually an Admin!
    IF NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    -- 2. Find the user ID that matches the target profile
    SELECT user_id INTO target_user_id
    FROM public.profiles
    WHERE id = target_profile_id;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    -- 3. Prevent the admin from accidentally deleting themselves
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;

    -- 4. Delete everything related to this user 
    DELETE FROM public.students WHERE profile_id = target_profile_id;
    DELETE FROM public.faculty WHERE profile_id = target_profile_id;
    DELETE FROM public.companies WHERE profile_id = target_profile_id;
    DELETE FROM public.documents WHERE owner_id = target_profile_id;
    DELETE FROM public.user_roles WHERE user_id = target_user_id;

    -- 5. Delete their profile
    DELETE FROM public.profiles WHERE id = target_profile_id;

    -- 6. CAREFULLY delete them from the actual Authentication system so they cannot log back in!
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
