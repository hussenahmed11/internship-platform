-- SUPABASE DATABASE SETUP SCRIPT
-- Consolidated from existing migrations and enhanced with Storage support

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('student', 'company', 'advisor', 'coordinator', 'admin');
CREATE TYPE public.employer_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.application_status AS ENUM ('applied', 'interview', 'waiting', 'accepted', 'rejected');
CREATE TYPE public.internship_status AS ENUM ('draft', 'active', 'closed', 'filled');

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role public.app_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES public.departments(id),
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    student_id TEXT NOT NULL UNIQUE,
    major TEXT,
    gpa DECIMAL(3,2),
    graduation_year INTEGER,
    resume_url TEXT,
    skills TEXT[],
    interests TEXT[],
    bio TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    advisor_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    industry TEXT,
    company_size TEXT,
    website TEXT,
    logo_url TEXT,
    description TEXT,
    location TEXT,
    verified BOOLEAN DEFAULT false,
    status public.employer_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    title TEXT,
    office_location TEXT,
    office_hours TEXT,
    specialization TEXT[],
    max_advisees INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add foreign key for advisor_id in students (if not already handled)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_advisor_id_fkey') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.faculty(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[],
    skills_required TEXT[],
    location TEXT,
    remote BOOLEAN DEFAULT false,
    duration TEXT,
    start_date DATE,
    end_date DATE,
    stipend TEXT,
    positions_available INTEGER DEFAULT 1,
    positions_filled INTEGER DEFAULT 0,
    status public.internship_status DEFAULT 'draft',
    department_id UUID REFERENCES public.departments(id),
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    status public.application_status DEFAULT 'applied',
    cover_letter TEXT,
    resume_url TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    interview_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    coordinator_approved BOOLEAN,
    advisor_approved BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (internship_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    evaluator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    learning_outcomes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    approved BOOLEAN,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. ENABLE RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT department_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 5. TRIGGER FUNCTIONS (FIXED)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 6. APPLY TRIGGERS
DROP TRIGGER IF EXISTS update_departments_updated_at ON public.departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New: Auto-create profile on signup with automatic role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.app_role;
    email_domain TEXT;
BEGIN
    -- Extract domain from email
    email_domain := split_part(NEW.email, '@', 2);
    
    -- Automatic Role Logic
    IF email_domain = 'university.edu' THEN
        assigned_role := 'student';
    ELSE
        assigned_role := 'company';
    END IF;

    -- Create Profile
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
        NEW.raw_user_meta_data->>'avatar_url',
        assigned_role
    );

    -- Create entry in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);

    -- If employer, create company record with pending/verified status
    IF assigned_role = 'company' THEN
        -- Check for domain-based auto-verification
        -- For now, if domain is not a generic public one, we mark as pending
        -- In a real scenario, you might check against a list of known university partners or verified businesses
        INSERT INTO public.companies (profile_id, company_name, website, status, verified)
        VALUES (
            (SELECT id FROM public.profiles WHERE user_id = NEW.id),
            COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
            'https://' || email_domain,
            'pending',
            false
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_faculty_updated_at ON public.faculty;
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_internships_updated_at ON public.internships;
CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. POLICIES
-- (Policies are complex, using a simplified set based on previous migrations)

-- Departments
CREATE POLICY "Departments are viewable by everyone" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Only admins can manage departments" ON public.departments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins and coordinators can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));

-- Students
CREATE POLICY "Students can view and update their own record" ON public.students FOR ALL USING (profile_id = public.get_user_profile_id(auth.uid()));
CREATE POLICY "Admins and coordinators can view all students" ON public.students FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coordinator'));

-- Companies
CREATE POLICY "Companies can manage their own record" ON public.companies FOR ALL USING (profile_id = public.get_user_profile_id(auth.uid()));
CREATE POLICY "Everyone can view verified companies" ON public.companies FOR SELECT USING (verified = true);

-- Internships
CREATE POLICY "Companies can manage their own internships" ON public.internships FOR ALL USING (
    company_id IN (
        SELECT id FROM public.companies 
        WHERE profile_id = public.get_user_profile_id(auth.uid()) 
        AND status = 'verified'
    )
);
CREATE POLICY "Everyone can view active internships" ON public.internships FOR SELECT USING (status = 'active');

-- Applications
CREATE POLICY "Students can manage their own applications" ON public.applications FOR ALL USING (student_id IN (SELECT id FROM public.students WHERE profile_id = public.get_user_profile_id(auth.uid())));
CREATE POLICY "Companies can view/update applications to their internships" ON public.applications FOR ALL USING (internship_id IN (SELECT i.id FROM public.internships i JOIN public.companies c ON i.company_id = c.id WHERE c.profile_id = public.get_user_profile_id(auth.uid())));

-- 8. INITIAL DATA
INSERT INTO public.departments (name, code, description) VALUES
    ('Computer Science', 'CS', 'Department of Computer Science and Engineering'),
    ('Business Administration', 'BA', 'Department of Business Administration'),
    ('Engineering', 'ENG', 'Department of Engineering'),
    ('Data Science', 'DS', 'Department of Data Science and Analytics'),
    ('Design', 'DES', 'Department of Design and Creative Arts')
ON CONFLICT (code) DO NOTHING;

-- 9. STORAGE BUCKETS
-- Note: storage.buckets and storage.objects are in the 'storage' schema
-- This requires the 'storage' extension to be enabled (default in Supabase)

INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Basic)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('resumes', 'company-logos', 'documents'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('resumes', 'company-logos', 'documents') AND auth.role() = 'authenticated');
    END IF;
END $$;
