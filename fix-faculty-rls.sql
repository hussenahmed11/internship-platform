-- Fix Faculty Table RLS Policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view faculty" ON faculty;
DROP POLICY IF EXISTS "Faculty can view own data" ON faculty;
DROP POLICY IF EXISTS "Faculty can update own data" ON faculty;
DROP POLICY IF EXISTS "Faculty can insert own data" ON faculty;
DROP POLICY IF EXISTS "Admins can manage faculty" ON faculty;

-- Helper function to get user profile ID (if not exists)
CREATE OR REPLACE FUNCTION get_user_profile_id(_user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = _user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user has a specific role (if not exists)
CREATE OR REPLACE FUNCTION has_role(_role TEXT, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = _user_id AND role::TEXT = _role);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Faculty RLS Policies

-- 1. Anyone can view faculty (for students to see advisors)
CREATE POLICY "Users can view faculty" ON faculty
  FOR SELECT
  USING (true);

-- 2. Advisors and coordinators can insert their own faculty record during onboarding
CREATE POLICY "Faculty can insert own data" ON faculty
  FOR INSERT
  WITH CHECK (
    profile_id = get_user_profile_id(auth.uid()) AND
    (has_role('advisor', auth.uid()) OR has_role('coordinator', auth.uid()))
  );

-- 3. Faculty can update their own data
CREATE POLICY "Faculty can update own data" ON faculty
  FOR UPDATE
  USING (
    profile_id = get_user_profile_id(auth.uid()) AND
    (has_role('advisor', auth.uid()) OR has_role('coordinator', auth.uid()))
  );

-- 4. Admins can manage all faculty
CREATE POLICY "Admins can manage faculty" ON faculty
  FOR ALL
  USING (has_role('admin', auth.uid()));

-- Verify RLS is enabled
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'faculty';
