-- Master admin functionality restored
DO $$
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'companies', 'students', 'faculty', 'internships', 
        'applications', 'documents', 'evaluations', 'placements', 
        'user_roles', 'departments', 'audit_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tables_list
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins have full access to %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins can delete any %I" ON public.%I', t, t);
        EXECUTE format('
            CREATE POLICY "Admins have full access to %I" 
            ON public.%I FOR ALL 
            USING (public.has_role(''admin''));
        ', t, t);
    END LOOP;
END $$;
