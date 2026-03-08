-- Ensure automatic profile creation runs on every new authenticated user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Backfill any users that were created while the trigger was missing
INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.raw_user_meta_data->>'avatar_url',
  COALESCE(
    CASE
      WHEN (u.raw_user_meta_data->>'role') IN ('student', 'company', 'advisor', 'coordinator', 'admin')
        THEN (u.raw_user_meta_data->>'role')::public.app_role
      ELSE NULL
    END,
    'student'::public.app_role
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
  AND u.email IS NOT NULL;

-- Ensure user_roles is in sync for all profiles
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure each student profile has a student row
INSERT INTO public.students (profile_id, student_id)
SELECT p.id, 'STU-' || substr(p.user_id::text, 1, 8)
FROM public.profiles p
LEFT JOIN public.students s ON s.profile_id = p.id
WHERE p.role = 'student'
  AND s.profile_id IS NULL;