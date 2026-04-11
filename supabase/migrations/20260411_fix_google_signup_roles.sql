-- Trigger and Cleanup for Google Sign Up roles
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

-- Cleanup script
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
