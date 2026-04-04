-- Add UPDATE and DELETE policies for admins and coordinators on the internships table
-- This allows them to set the status to "active" from "draft"

CREATE POLICY "Admins and coordinators can update internships"
    ON public.internships FOR UPDATE
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

CREATE POLICY "Admins and coordinators can delete internships"
    ON public.internships FOR DELETE
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );
