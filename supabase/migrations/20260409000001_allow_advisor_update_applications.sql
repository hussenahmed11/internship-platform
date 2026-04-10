-- Add UPDATE policy for applications so that Advisors can approve/reject
-- their advisees' internship applications.
-- Previously there was only a SELECT policy for advisors, so updates
-- were silently ignored by RLS (returned 0 rows affected).

DROP POLICY IF EXISTS "Advisors can update their advisees applications" ON public.applications;
CREATE POLICY "Advisors can update their advisees applications"
    ON public.applications FOR UPDATE
    USING (
        student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.faculty f ON s.advisor_id = f.id
            WHERE f.profile_id = public.get_user_profile_id(auth.uid())
        )
    )
    WITH CHECK (
        student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.faculty f ON s.advisor_id = f.id
            WHERE f.profile_id = public.get_user_profile_id(auth.uid())
        )
    );
