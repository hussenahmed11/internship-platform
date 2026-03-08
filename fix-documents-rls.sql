-- Fix Documents Table RLS Policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Advisors can view advisee documents" ON documents;
DROP POLICY IF EXISTS "Coordinators can view department documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;

-- Helper function to get user profile ID
CREATE OR REPLACE FUNCTION get_user_profile_id(_user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = _user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(_role TEXT, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = _user_id AND role::TEXT = _role);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Documents RLS Policies

-- 1. Users can view their own documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT
  USING (owner_id = get_user_profile_id(auth.uid()));

-- 2. Users can insert their own documents
CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT
  WITH CHECK (owner_id = get_user_profile_id(auth.uid()));

-- 3. Users can update their own documents
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE
  USING (owner_id = get_user_profile_id(auth.uid()));

-- 4. Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE
  USING (owner_id = get_user_profile_id(auth.uid()));

-- 5. Advisors can view their advisees' documents
CREATE POLICY "Advisors can view advisee documents" ON documents
  FOR SELECT
  USING (
    has_role('advisor', auth.uid()) AND
    owner_id IN (
      SELECT p.id 
      FROM profiles p
      JOIN students s ON s.profile_id = p.id
      JOIN faculty f ON f.id = s.advisor_id
      WHERE f.profile_id = get_user_profile_id(auth.uid())
    )
  );

-- 6. Coordinators can view documents from their department
CREATE POLICY "Coordinators can view department documents" ON documents
  FOR SELECT
  USING (
    has_role('coordinator', auth.uid()) AND
    owner_id IN (
      SELECT id FROM profiles 
      WHERE department_id = (
        SELECT department_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- 7. Admins can view all documents
CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT
  USING (has_role('admin', auth.uid()));

-- 8. Admins can update all documents (for approval)
CREATE POLICY "Admins can update all documents" ON documents
  FOR UPDATE
  USING (has_role('admin', auth.uid()));

-- Verify RLS is enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'documents';
