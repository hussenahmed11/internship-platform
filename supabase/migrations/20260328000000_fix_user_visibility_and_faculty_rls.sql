-- Migration: Fix user visibility in User Management and faculty onboarding RLS
-- Date: 2026-03-28
-- Issue: Users not appearing in User Management list due to missing user_roles entries
--        Coordinators/Advisors unable to complete onboarding due to faculty table RLS policy

BEGIN;

-- ============================================
-- PART 1: Fix Faculty Table RLS Policy
-- ============================================
-- Problem: The faculty table RLS policy uses USING clause for ALL operations,
-- but INSERT operations need WITH CHECK clause to work properly.

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Faculty can manage their own record" ON public.faculty;

-- Drop policies if they already exist (to avoid errors)
DROP POLICY IF EXISTS "Faculty can insert their own record" ON public.faculty;
DROP POLICY IF EXISTS "Faculty can update their own record" ON public.faculty;
DROP POLICY IF EXISTS "Faculty can delete their own record" ON public.faculty;

-- Create INSERT policy with WITH CHECK
CREATE POLICY "Faculty can insert their own record"
    ON public.faculty 
    FOR INSERT
    WITH CHECK (profile_id = public.get_user_profile_id(auth.uid()));

-- Create UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Faculty can update their own record"
    ON public.faculty 
    FOR UPDATE
    USING (profile_id = public.get_user_profile_id(auth.uid()))
    WITH CHECK (profile_id = public.get_user_profile_id(auth.uid()));

-- Create DELETE policy with USING
CREATE POLICY "Faculty can delete their own record"
    ON public.faculty 
    FOR DELETE
    USING (profile_id = public.get_user_profile_id(auth.uid()));

-- ============================================
-- PART 2: Sync profiles to user_roles
-- ============================================
-- Problem: The has_role() function checks user_roles table, but some users
-- have roles in profiles table but not in user_roles table.
-- This causes RLS policies to fail and users become invisible to admins.

-- Sync all profiles to user_roles (fixes visibility issue)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
WHERE p.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = p.role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- PART 3: Add admin policies for user management
-- ============================================
-- Ensure admins can update and delete profiles for user management

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
    ON public.profiles 
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
    ON public.profiles 
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

COMMIT;

-- Verification queries (run these separately to check the fix)
-- SELECT email, full_name, role, onboarding_completed FROM public.profiles ORDER BY created_at;
-- SELECT p.email, ur.role FROM public.profiles p JOIN public.user_roles ur ON p.user_id = ur.user_id ORDER BY p.email;
