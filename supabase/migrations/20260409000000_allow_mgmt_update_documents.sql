-- Add UPDATE policy for documents so that Admins and Coordinators can approve/reject them.
-- Previously there was only a SELECT policy for them but no UPDATE policy,
-- which caused updates to silently return 0 rows affected.

DROP POLICY IF EXISTS "Admins and coordinators can update documents" ON public.documents;
CREATE POLICY "Admins and coordinators can update documents" 
    ON public.documents FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));
