
-- Fix: Allow admins and coordinators to UPDATE companies (for verification)
CREATE POLICY "Admins and coordinators can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role));

-- Fix infinite recursion on students table:
DROP POLICY IF EXISTS "Companies can view students who applied to their internships" ON public.students;

CREATE OR REPLACE FUNCTION public.get_company_applicant_student_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.student_id
  FROM applications a
  JOIN internships i ON a.internship_id = i.id
  JOIN companies c ON i.company_id = c.id
  WHERE c.profile_id = get_user_profile_id(_user_id);
$$;

CREATE POLICY "Companies can view students who applied to their internships"
ON public.students
FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_company_applicant_student_ids(auth.uid())));
