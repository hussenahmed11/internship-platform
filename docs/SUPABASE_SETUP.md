# Supabase Database Setup

Complete guide to set up your database schema and security policies.

## Prerequisites

- Supabase project: jubbpyoqcarnylbeslyz
- Access to SQL Editor: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new

---

## Step 1: Create Database Schema

Copy and run this SQL in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE app_role AS ENUM ('student', 'company', 'advisor', 'coordinator', 'admin');
CREATE TYPE application_status AS ENUM ('applied', 'interview', 'waiting', 'accepted', 'rejected');
CREATE TYPE internship_status AS ENUM ('draft', 'active', 'closed', 'filled');

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role app_role DEFAULT 'student',
  department_id UUID REFERENCES departments(id),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  website TEXT,
  logo_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty table
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  title TEXT,
  specialization TEXT[],
  office_location TEXT,
  office_hours TEXT,
  max_advisees INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  major TEXT,
  graduation_year INTEGER,
  gpa NUMERIC(3,2),
  bio TEXT,
  skills TEXT[],
  interests TEXT[],
  resume_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  advisor_id UUID REFERENCES faculty(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internships table
CREATE TABLE internships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  skills_required TEXT[],
  location TEXT,
  remote BOOLEAN DEFAULT false,
  duration TEXT,
  stipend TEXT,
  positions_available INTEGER DEFAULT 1,
  positions_filled INTEGER DEFAULT 0,
  status internship_status DEFAULT 'draft',
  department_id UUID REFERENCES departments(id),
  start_date DATE,
  end_date DATE,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  internship_id UUID REFERENCES internships(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'applied',
  cover_letter TEXT,
  resume_url TEXT,
  notes TEXT,
  advisor_approved BOOLEAN DEFAULT false,
  coordinator_approved BOOLEAN DEFAULT false,
  interview_date TIMESTAMPTZ,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, internship_id)
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  evaluator_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  learning_outcomes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform settings table
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}',
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_students_advisor_id ON students(advisor_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_internship_id ON applications(internship_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_internships_company_id ON internships(company_id);
CREATE INDEX idx_internships_status ON internships(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
```

---

## Step 2: Enable Row Level Security

Run this SQL to enable RLS and create security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS app_role AS $$
  SELECT role FROM profiles WHERE user_id = _user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_profile_id(_user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = _user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = _user_id AND role = _role);
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_department(_user_id UUID)
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE user_id = _user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_company_applicant_student_ids(_user_id UUID)
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(DISTINCT a.student_id)
  FROM applications a
  JOIN internships i ON a.internship_id = i.id
  JOIN companies c ON i.company_id = c.id
  WHERE c.profile_id = get_user_profile_id(_user_id);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (has_role('admin', auth.uid()));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (has_role('admin', auth.uid()));

-- Departments policies
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins and coordinators can manage departments" ON departments FOR ALL 
  USING (has_role('admin', auth.uid()) OR has_role('coordinator', auth.uid()));

-- Companies policies
CREATE POLICY "Anyone can view verified companies" ON companies FOR SELECT 
  USING (verified = true OR profile_id = get_user_profile_id(auth.uid()));
CREATE POLICY "Company users can update own company" ON companies FOR UPDATE 
  USING (profile_id = get_user_profile_id(auth.uid()));
CREATE POLICY "Admins can manage all companies" ON companies FOR ALL 
  USING (has_role('admin', auth.uid()));

-- Students policies
CREATE POLICY "Students can view own data" ON students FOR SELECT 
  USING (profile_id = get_user_profile_id(auth.uid()) OR 
         has_role('advisor', auth.uid()) OR 
         has_role('coordinator', auth.uid()) OR 
         has_role('admin', auth.uid()));
CREATE POLICY "Students can update own data" ON students FOR UPDATE 
  USING (profile_id = get_user_profile_id(auth.uid()));

-- Internships policies
CREATE POLICY "Anyone can view active internships" ON internships FOR SELECT 
  USING (status = 'active' OR 
         has_role('admin', auth.uid()) OR 
         has_role('coordinator', auth.uid()));
CREATE POLICY "Companies can manage own internships" ON internships FOR ALL 
  USING (company_id IN (SELECT id FROM companies WHERE profile_id = get_user_profile_id(auth.uid())));

-- Applications policies
CREATE POLICY "Students can view own applications" ON applications FOR SELECT 
  USING (student_id IN (SELECT id FROM students WHERE profile_id = get_user_profile_id(auth.uid())) OR
         has_role('advisor', auth.uid()) OR 
         has_role('coordinator', auth.uid()) OR 
         has_role('admin', auth.uid()));
CREATE POLICY "Students can create applications" ON applications FOR INSERT 
  WITH CHECK (student_id IN (SELECT id FROM students WHERE profile_id = get_user_profile_id(auth.uid())));
CREATE POLICY "Students can update own applications" ON applications FOR UPDATE 
  USING (student_id IN (SELECT id FROM students WHERE profile_id = get_user_profile_id(auth.uid())));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT 
  USING (sender_id = get_user_profile_id(auth.uid()) OR recipient_id = get_user_profile_id(auth.uid()));
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (sender_id = get_user_profile_id(auth.uid()));

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (has_role('admin', auth.uid()));

-- Platform settings policies
CREATE POLICY "Anyone can view settings" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON platform_settings FOR ALL USING (has_role('admin', auth.uid()));
```

---

## Verification

Check if tables were created:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## Next Steps

After running these SQL scripts:
1. See `CREATE_ADMIN_USER.md` to create your first admin user
2. Run `npm run dev` to start the application
3. Log in with your admin credentials

---

## Troubleshooting

### "relation already exists" error
Tables already exist. You can drop and recreate:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
Then run the setup SQL again.

### Permission errors
Make sure RLS policies are created (Step 2).

### Can't create users
Make sure you have admin access to your Supabase project.
