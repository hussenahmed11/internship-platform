
-- Recreate handle_new_user function to auto-create profile, user_roles, and students record for Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
  _role public.app_role;
BEGIN
    -- Determine role from metadata, default to 'student' (Google OAuth users)
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');

    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        _role
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = now()
    RETURNING id INTO _profile_id;

    -- Sync user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- If student role, auto-create students record
    IF _role = 'student' THEN
        INSERT INTO public.students (profile_id, student_id)
        VALUES (_profile_id, 'STU-' || substr(NEW.id::text, 1, 8))
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
