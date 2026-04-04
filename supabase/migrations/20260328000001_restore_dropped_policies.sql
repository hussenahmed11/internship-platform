-- Migration: Restore dropped RLS policies
-- Date: 2026-03-28
-- Reason: A previous migration used DROP FUNCTION ... CASCADE on has_role, which silently dropped all RLS policies that depended on it.

BEGIN;

-- Restore Departments policies
DROP POLICY IF EXISTS "Only admins can manage departments" ON public.departments;
CREATE POLICY "Only admins can manage departments"
    ON public.departments FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Restore Profiles policies
DROP POLICY IF EXISTS "Admins and coordinators can view all profiles" ON public.profiles;
CREATE POLICY "Admins and coordinators can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

DROP POLICY IF EXISTS "Faculty can view profiles in their department" ON public.profiles;
CREATE POLICY "Faculty can view profiles in their department"
    ON public.profiles FOR SELECT
    USING (
        (public.has_role(auth.uid(), 'advisor') OR public.has_role(auth.uid(), 'coordinator'))
        AND department_id = public.get_user_department(auth.uid())
    );

DROP POLICY IF EXISTS "Only admins can create staff accounts" ON public.profiles;
CREATE POLICY "Only admins can create staff accounts" 
    ON public.profiles FOR INSERT
    WITH CHECK (
        public.has_role(auth.uid(), 'admin') AND 
        (role = 'admin' OR role = 'coordinator' OR role = 'advisor')
    );

-- Restore User Roles policies
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Restore Students policies
DROP POLICY IF EXISTS "Coordinators and admins can view all students" ON public.students;
CREATE POLICY "Coordinators and admins can view all students"
    ON public.students FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- Restore Companies policies
DROP POLICY IF EXISTS "Admins and coordinators can view all companies" ON public.companies;
CREATE POLICY "Admins and coordinators can view all companies"
    ON public.companies FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

DROP POLICY IF EXISTS "Admins and coordinators can update companies" ON public.companies;
CREATE POLICY "Admins and coordinators can update companies" 
    ON public.companies FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));

-- Restore Internships policies
DROP POLICY IF EXISTS "Admins and coordinators can view all internships" ON public.internships;
CREATE POLICY "Admins and coordinators can view all internships"
    ON public.internships FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- Restore Applications policies
DROP POLICY IF EXISTS "Coordinators and admins can manage all applications" ON public.applications;
CREATE POLICY "Coordinators and admins can manage all applications"
    ON public.applications FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- Restore Evaluations policies
DROP POLICY IF EXISTS "Admins and coordinators can view all evaluations" ON public.evaluations;
CREATE POLICY "Admins and coordinators can view all evaluations"
    ON public.evaluations FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- Restore Documents policies
DROP POLICY IF EXISTS "Admins and coordinators can view all documents" ON public.documents;
CREATE POLICY "Admins and coordinators can view all documents"
    ON public.documents FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- Restore Audit Logs policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- (Platform Settings and Notifications omitted due to table existence issues)

-- Restore Storage Objects policies
DROP POLICY IF EXISTS "Users can view own documents or admins all" ON storage.objects;
CREATE POLICY "Users can view own documents or admins all"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.has_role(auth.uid(), 'admin')
            OR public.has_role(auth.uid(), 'coordinator')
        )
    );

COMMIT;
