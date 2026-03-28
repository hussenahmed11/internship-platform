-- Fix dashboard user count and enforce profile completion on first login
-- This migration ensures:
-- 1. All auth users are synced to profiles table
-- 2. Dashboard shows accurate user counts
-- 3. First-login users are redirected to profile completion

-- ============================================================================
-- PART 1: Improve User Sync and Dashboard Stats
-- ============================================================================

-- Drop existing functions to recreate them with improvements
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_role_distribution() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_users_to_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_sync_status() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(TEXT, UUID) CASCADE;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, check_role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = has_role.user_id 
    AND user_roles.role = check_role
  );
END;
$$;

-- Function to get comprehensive admin dashboard statistics
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSON;
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access dashboard stats';
  END IF;
  
  -- Build comprehensive stats JSON object
  SELECT json_build_object(
    'totalUsers', (SELECT count(*) FROM public.profiles),
    'students', (SELECT count(*) FROM public.profiles WHERE role = 'student'),
    'companies', (SELECT count(*) FROM public.profiles WHERE role = 'company'),
    'advisors', (SELECT count(*) FROM public.profiles WHERE role = 'advisor'),
    'coordinators', (SELECT count(*) FROM public.profiles WHERE role = 'coordinator'),
    'admins', (SELECT count(*) FROM public.profiles WHERE role = 'admin'),
    'activeCompanies', (SELECT count(*) FROM public.companies WHERE verified = true),
    'activeInternships', (SELECT count(*) FROM public.internships WHERE status = 'active'),
    'incompleteOnboarding', (SELECT count(*) FROM public.profiles WHERE onboarding_completed = false),
    'unverifiedCompanies', (SELECT count(*) FROM public.companies WHERE verified = false),
    'pendingApplications', (SELECT count(*) FROM public.applications WHERE status = 'applied'),
    'authUsersCount', (SELECT count(*) FROM auth.users),
    'syncStatus', json_build_object(
      'inSync', (SELECT count(*) FROM auth.users) = (SELECT count(*) FROM public.profiles),
      'missingProfiles', (
        SELECT count(*)
        FROM auth.users au
        LEFT JOIN public.profiles p ON p.user_id = au.id
        WHERE p.id IS NULL
      )
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Function to get role distribution for charts
CREATE OR REPLACE FUNCTION public.get_role_distribution()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access role distribution';
  END IF;
  
  RETURN (
    SELECT json_agg(
      json_build_object(
        'role', role,
        'count', count
      )
    )
    FROM (
      SELECT role::text, count(*) as count
      FROM public.profiles
      GROUP BY role
      ORDER BY count DESC
    ) as role_counts
  );
END;
$$;

-- Function to get detailed user sync status
CREATE OR REPLACE FUNCTION public.get_user_sync_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_count INTEGER;
  profile_count INTEGER;
  missing_count INTEGER;
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can check sync status';
  END IF;
  
  -- Get counts
  SELECT count(*) INTO auth_count FROM auth.users;
  SELECT count(*) INTO profile_count FROM public.profiles;
  
  SELECT count(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE p.id IS NULL;
  
  RETURN json_build_object(
    'authUsers', auth_count,
    'profiles', profile_count,
    'missingProfiles', missing_count,
    'incompleteOnboarding', (
      SELECT count(*) FROM public.profiles WHERE onboarding_completed = false
    ),
    'byRole', (
      SELECT json_object_agg(role, count)
      FROM (
        SELECT role::text, count(*) as count
        FROM public.profiles
        GROUP BY role
      ) role_counts
    )
  );
END;
$$;

-- Comprehensive sync function that handles all edge cases
CREATE OR REPLACE FUNCTION public.sync_auth_users_to_profiles()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  synced_count INTEGER := 0;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  auth_user RECORD;
  new_profile_id UUID;
  user_role public.app_role;
  is_new_profile BOOLEAN;
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can sync users';
  END IF;
  
  -- Loop through all auth users
  FOR auth_user IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at,
      au.email_confirmed_at
    FROM auth.users au
    ORDER BY au.created_at
  LOOP
    BEGIN
      -- Determine role from metadata or email domain
      IF auth_user.raw_user_meta_data->>'role' IS NOT NULL THEN
        user_role := (auth_user.raw_user_meta_data->>'role')::public.app_role;
      ELSE
        -- Default to student for university emails, company for others
        IF auth_user.email LIKE '%@haramayauniversity.edu.et' THEN
          user_role := 'student';
        ELSE
          user_role := 'company';
        END IF;
      END IF;

      -- Check if profile exists
      SELECT id INTO new_profile_id
      FROM public.profiles
      WHERE user_id = auth_user.id;
      
      is_new_profile := (new_profile_id IS NULL);

      -- Upsert profile
      INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        role,
        onboarding_completed,
        created_at,
        updated_at
      )
      VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(
          auth_user.raw_user_meta_data->>'full_name',
          auth_user.raw_user_meta_data->>'name',
          split_part(auth_user.email, '@', 1)
        ),
        user_role,
        false, -- Always set to false for new profiles to force onboarding
        COALESCE(auth_user.created_at, NOW()),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE
      SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW()
      RETURNING id INTO new_profile_id;
      
      -- Count new vs updated profiles
      IF is_new_profile THEN
        synced_count := synced_count + 1;
      ELSE
        updated_count := updated_count + 1;
      END IF;
      
      -- Ensure user_roles entry exists
      INSERT INTO public.user_roles (user_id, role)
      VALUES (auth_user.id, user_role)
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Ensure role-specific records exist
      IF user_role = 'student' THEN
        INSERT INTO public.students (profile_id, student_id)
        VALUES (
          new_profile_id,
          COALESCE(
            auth_user.raw_user_meta_data->>'student_id',
            'STU-' || substr(auth_user.id::text, 1, 8)
          )
        )
        ON CONFLICT (profile_id) DO NOTHING;
        
      ELSIF user_role = 'company' THEN
        INSERT INTO public.companies (profile_id, company_name, verified)
        VALUES (
          new_profile_id,
          COALESCE(
            auth_user.raw_user_meta_data->>'company_name',
            auth_user.raw_user_meta_data->>'full_name',
            split_part(auth_user.email, '@', 1)
          ),
          false
        )
        ON CONFLICT (profile_id) DO NOTHING;
        
      ELSIF user_role IN ('advisor', 'coordinator') THEN
        INSERT INTO public.faculty (profile_id, title)
        VALUES (
          new_profile_id,
          CASE user_role
            WHEN 'coordinator' THEN 'Department Coordinator'
            WHEN 'advisor' THEN 'Academic Advisor'
            ELSE 'Faculty Member'
          END
        )
        ON CONFLICT (profile_id) DO NOTHING;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Error syncing user %: % %', auth_user.email, SQLERRM, SQLSTATE;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'syncedCount', synced_count,
    'updatedCount', updated_count,
    'errorCount', error_count,
    'totalAuthUsers', (SELECT count(*) FROM auth.users),
    'totalProfiles', (SELECT count(*) FROM public.profiles),
    'message', format('%s new profiles created, %s profiles updated', synced_count, updated_count)
  );
END;
$$;

-- ============================================================================
-- PART 2: Enforce Profile Completion on First Login
-- ============================================================================

-- Function to check if user needs onboarding
CREATE OR REPLACE FUNCTION public.user_needs_onboarding(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  needs_onboarding BOOLEAN;
BEGIN
  SELECT NOT COALESCE(onboarding_completed, false)
  INTO needs_onboarding
  FROM public.profiles
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(needs_onboarding, true);
END;
$$;

-- Function to mark onboarding as complete
CREATE OR REPLACE FUNCTION public.complete_onboarding(user_profile_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user owns this profile
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_profile_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user''s profile';
  END IF;
  
  -- Mark onboarding as complete
  UPDATE public.profiles
  SET 
    onboarding_completed = true,
    updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Onboarding completed successfully'
  );
END;
$$;

-- ============================================================================
-- PART 3: Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_role_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sync_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_auth_users_to_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_needs_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(UUID) TO authenticated;

-- ============================================================================
-- PART 4: Add Comments
-- ============================================================================

COMMENT ON FUNCTION public.has_role(UUID, public.app_role) IS 'Checks if a user has a specific role';
COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS 'Returns comprehensive dashboard statistics for admins. Bypasses RLS for accurate counts.';
COMMENT ON FUNCTION public.get_role_distribution() IS 'Returns role distribution for admin charts. Bypasses RLS for accurate counts.';
COMMENT ON FUNCTION public.get_user_sync_status() IS 'Returns detailed sync status between auth.users and profiles tables';
COMMENT ON FUNCTION public.sync_auth_users_to_profiles() IS 'Syncs all auth.users with profiles table. Creates missing profiles and role-specific records with onboarding_completed=false.';
COMMENT ON FUNCTION public.user_needs_onboarding(UUID) IS 'Checks if a user needs to complete onboarding';
COMMENT ON FUNCTION public.complete_onboarding(UUID) IS 'Marks user onboarding as complete';

-- ============================================================================
-- PART 5: Initial Sync Notice
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE 'Please click "Sync Users" button in admin dashboard to:';
  RAISE NOTICE '1. Sync all auth users to profiles table';
  RAISE NOTICE '2. Update dashboard user counts';
  RAISE NOTICE '3. Ensure all users complete profile on next login';
  RAISE NOTICE '=================================================================';
END $$;
