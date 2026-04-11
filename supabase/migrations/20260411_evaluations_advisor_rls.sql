-- ==============================================================================
-- EVALUATIONS TABLE: Allow advisors to create, view, and update evaluations
-- Run this in the Supabase SQL Editor
-- ==============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- 1. Helper Function
-- Verifies if a profile ID belongs to the current authenticated user
CREATE OR REPLACE FUNCTION public.is_own_profile(_profile_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _profile_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clear existing policies
DROP POLICY IF EXISTS "Advisors can view own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Advisors can create evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Advisors can update own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Students can view evaluations for their applications" ON public.evaluations;

-- 3. Robust Advisor Policies
CREATE POLICY "Advisors can view own evaluations"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (public.is_own_profile(evaluator_id) OR public.has_role('admin'));

CREATE POLICY "Advisors can create evaluations"
  ON public.evaluations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_own_profile(evaluator_id));

CREATE POLICY "Advisors can update own evaluations"
  ON public.evaluations FOR UPDATE
  TO authenticated
  USING (public.is_own_profile(evaluator_id));

-- 4. Student Visibility Policy
CREATE POLICY "Students can view evaluations for their applications"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.students s ON s.id = a.student_id
      WHERE a.id = evaluations.application_id
        AND s.profile_id = auth.uid()
    )
  );
