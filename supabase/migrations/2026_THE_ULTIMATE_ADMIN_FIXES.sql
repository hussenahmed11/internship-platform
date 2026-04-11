-- ==============================================================================
-- THE ULTIMATE MASTER ADMIN & SYSTEM FIXES (ALL-IN-ONE)
-- Run this entire script in the Supabase SQL Editor.
-- This contains EVERY fix from our recent conversation.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FIX INFINITE RECURSION HELPER FUNCTIONS (42P17 error)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. REBUILD PROFILES TABLE POLICIES SECURELY
-- ------------------------------------------------------------------------------
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role('admin'));
CREATE POLICY "Admins can delete all profiles" ON public.profiles FOR DELETE USING (public.has_role('admin'));

-- ------------------------------------------------------------------------------
-- 3. GRANT ADMINS "SUPERUSER" ACCESS TO ALL DATA TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'companies', 'students', 'faculty', 'internships', 
        'applications', 'documents', 'evaluations', 
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

-- ------------------------------------------------------------------------------
-- 4. FIX GOOGLE SIGN-UP (PREVENT Defaulting to 'company')
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'student')::public.app_role;

  INSERT INTO public.profiles (id, user_id, email, full_name, avatar_url, role, onboarding_completed)
  VALUES (
    new.id, new.id, new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    assigned_role, false
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, assigned_role);

  IF assigned_role = 'student' THEN
    INSERT INTO public.students (profile_id, student_id)
    VALUES (new.id, 'STU-' || substr(new.id::text, 1, 8));
  ELSIF assigned_role = 'company' THEN
    INSERT INTO public.companies (profile_id, company_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Company'));
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 5. CLEANUP SCRIPT: CONVERT WRONGLY ASSIGNED COMPANIES TO STUDENTS
-- ------------------------------------------------------------------------------
DO $$ 
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
      SELECT p.id as p_id, p.user_id as u_id, c.id as c_id 
      FROM public.profiles p
      JOIN public.companies c ON p.id = c.profile_id
      WHERE p.email LIKE '%@gmail.com' AND c.verified = false
  LOOP
      DELETE FROM public.companies WHERE id = rec.c_id;
      UPDATE public.profiles SET role = 'student', onboarding_completed = false WHERE id = rec.p_id;
      DELETE FROM public.user_roles WHERE user_id = rec.u_id AND role = 'company';
      INSERT INTO public.user_roles (user_id, role) VALUES (rec.u_id, 'student') ON CONFLICT DO NOTHING;
      INSERT INTO public.students (profile_id, student_id) 
      VALUES (rec.p_id, 'STU-' || substr(rec.u_id::text, 1, 8))
      ON CONFLICT (profile_id) DO NOTHING;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 6. RPC FUNCTION: ADMIN DELETE USER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    IF NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    SELECT user_id INTO target_user_id FROM public.profiles WHERE id = target_profile_id;
    IF target_user_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
    IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'Cannot delete your own account'; END IF;

    DELETE FROM public.students WHERE profile_id = target_profile_id;
    DELETE FROM public.faculty WHERE profile_id = target_profile_id;
    DELETE FROM public.companies WHERE profile_id = target_profile_id;
    DELETE FROM public.documents WHERE owner_id = target_profile_id;
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_profile_id;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC FUNCTION: SYNC MISSING USERS 
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_sync_missing_auth_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    synced_count integer := 0;
    u record;
    assigned_role app_role;
BEGIN
    IF NOT public.has_role('admin') THEN RAISE EXCEPTION 'Only admins can sync users'; END IF;

    FOR u IN (SELECT * FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = au.id))
    LOOP
        assigned_role := COALESCE(u.raw_user_meta_data->>'role', 'student')::app_role;
        INSERT INTO public.profiles (id, user_id, email, full_name, avatar_url, role, onboarding_completed)
        VALUES (u.id, u.id, u.email, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'avatar_url', assigned_role, false);
        
        INSERT INTO public.user_roles (user_id, role) VALUES (u.id, assigned_role) ON CONFLICT DO NOTHING;
        
        IF assigned_role = 'student' THEN
            INSERT INTO public.students (profile_id, student_id) VALUES (u.id, 'STU-' || substr(u.id::text, 1, 8)) ON CONFLICT DO NOTHING;
        ELSIF assigned_role = 'company' THEN
            INSERT INTO public.companies (profile_id, company_name) VALUES (u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'Company')) ON CONFLICT DO NOTHING;
        ELSIF assigned_role = 'advisor' OR assigned_role = 'coordinator' THEN
            INSERT INTO public.faculty (profile_id, title) VALUES (u.id, 'Faculty') ON CONFLICT DO NOTHING;
        END IF;
        synced_count := synced_count + 1;
    END LOOP;
    RETURN synced_count;
END;
$$;
