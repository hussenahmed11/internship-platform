-- Enforce strict role-based signup restrictions
-- Only @haramayauniversity.edu.et can self-signup as students
-- All staff/admin roles must be created by Super Admin

-- Update the role enum to include employee instead of company
ALTER TYPE public.app_role RENAME VALUE 'company' TO 'employee';

-- Update handle_new_user function with strict restrictions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
    assigned_role public.app_role;
    email_domain TEXT;
BEGIN
    -- Extract domain from email
    email_domain := split_part(NEW.email, '@', 2);
    
    -- STRICT Role Logic: Only @haramayauniversity.edu.et can self-signup
    IF email_domain = 'haramayauniversity.edu.et' THEN
        assigned_role := 'student';
    ELSE
        -- Block all non-university email signups
        RAISE EXCEPTION 'Self-registration is only allowed for @haramayauniversity.edu.et email addresses. Staff and admin accounts must be created by a Super Admin.';
    END IF;

    -- Create Profile
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
        NEW.raw_user_meta_data->>'avatar_url',
        assigned_role
    );

    -- Create entry in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);

    -- If student, create student record
    IF assigned_role = 'student' THEN
        INSERT INTO public.students (profile_id, student_id)
        VALUES (
            (SELECT id FROM public.profiles WHERE user_id = NEW.id),
            -- Generate student ID from email prefix
            split_part(NEW.email, '@', 1)
        );
    END IF;

    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to prevent role changes after creation
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $
BEGIN
    -- Prevent role changes unless done by super admin
    IF OLD.role != NEW.role THEN
        -- Check if the current user is a super admin
        IF NOT public.has_role(auth.uid(), 'super_admin') THEN
            RAISE EXCEPTION 'Role changes are not allowed. Only Super Admins can modify user roles.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to prevent role changes
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_change();

-- Function for Super Admin to create staff accounts
CREATE OR REPLACE FUNCTION public.create_staff_account(
    p_email TEXT,
    p_full_name TEXT,
    p_role public.app_role,
    p_department_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    new_user_id UUID;
    new_profile_id UUID;
BEGIN
    -- Only super admins can create staff accounts
    IF NOT public.has_role(auth.uid(), 'super_admin') THEN
        RAISE EXCEPTION 'Only Super Admins can create staff accounts.';
    END IF;
    
    -- Validate role (cannot create another admin through this function)
    IF p_role NOT IN ('employee', 'advisor', 'coordinator') THEN
        RAISE EXCEPTION 'Invalid role. Can only create employee, advisor, or coordinator accounts.';
    END IF;
    
    -- Generate a temporary password (should be changed on first login)
    -- In production, you'd want to send an invitation email instead
    
    -- Create the auth user (this will trigger handle_new_user, but we'll override it)
    -- For now, we'll create the profile manually to bypass the restriction
    
    -- Generate UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Create profile directly (bypassing the trigger restriction)
    INSERT INTO public.profiles (user_id, email, full_name, role, department_id, onboarding_completed)
    VALUES (new_user_id, p_email, p_full_name, p_role, p_department_id, false)
    RETURNING id INTO new_profile_id;
    
    -- Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, p_role);
    
    -- Create role-specific records
    IF p_role = 'advisor' THEN
        INSERT INTO public.faculty (profile_id, title)
        VALUES (new_profile_id, 'Faculty Advisor');
    ELSIF p_role = 'employee' THEN
        INSERT INTO public.companies (profile_id, company_name, status, verified)
        VALUES (new_profile_id, 'Company Representative', 'verified', true);
    END IF;
    
    RETURN new_profile_id;
END;
$;

-- Update existing company references to employee and admin to super_admin
UPDATE public.profiles SET role = 'employee' WHERE role = 'company';
UPDATE public.user_roles SET role = 'employee' WHERE role = 'company';
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';

-- Add RLS policy for staff account creation
CREATE POLICY "Only admins can create staff accounts" ON public.profiles 
FOR INSERT WITH CHECK (
    -- Allow if it's a student with university email OR if done by super admin
    (role = 'student' AND split_part(email, '@', 2) = 'haramayauniversity.edu.et') OR
    public.has_role(auth.uid(), 'super_admin')
);