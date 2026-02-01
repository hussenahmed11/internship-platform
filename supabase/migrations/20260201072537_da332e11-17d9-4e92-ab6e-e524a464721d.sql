-- Create trigger function to sync user_roles when profiles.role changes
CREATE OR REPLACE FUNCTION public.sync_user_roles_on_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete existing role for this user
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
    
    -- Insert the new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role);
    
    RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_sync_user_roles ON public.profiles;
CREATE TRIGGER trigger_sync_user_roles
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_on_profile_change();

-- Sync existing profiles to user_roles (fix any mismatches)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = p.role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Clean up orphaned user_roles entries
DELETE FROM public.user_roles ur
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = ur.user_id AND p.role = ur.role
);