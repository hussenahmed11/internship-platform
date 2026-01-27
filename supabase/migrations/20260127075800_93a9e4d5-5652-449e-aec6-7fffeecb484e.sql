-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'company', 'advisor', 'coordinator', 'admin');

-- Create application_status enum
CREATE TYPE public.application_status AS ENUM ('applied', 'interview', 'waiting', 'accepted', 'rejected');

-- Create internship_status enum
CREATE TYPE public.internship_status AS ENUM ('draft', 'active', 'closed', 'filled');

-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
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

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create students table
CREATE TABLE public.students (
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

-- Create companies table
CREATE TABLE public.companies (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create faculty table (advisors and coordinators)
CREATE TABLE public.faculty (
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

-- Add foreign key for advisor_id in students
ALTER TABLE public.students 
ADD CONSTRAINT students_advisor_id_fkey 
FOREIGN KEY (advisor_id) REFERENCES public.faculty(id);

-- Create internships table
CREATE TABLE public.internships (
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

-- Create applications table
CREATE TABLE public.applications (
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

-- Create evaluations table
CREATE TABLE public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    evaluator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    learning_outcomes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create documents table
CREATE TABLE public.documents (
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

-- Create audit_logs table
CREATE TABLE public.audit_logs (
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

-- Enable RLS on all tables
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

-- Security definer function to check user roles
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

-- Function to get user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get user's role from profile
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get user's department
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT department_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for departments
CREATE POLICY "Departments are viewable by everyone"
    ON public.departments FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage departments"
    ON public.departments FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and coordinators can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

CREATE POLICY "Faculty can view profiles in their department"
    ON public.profiles FOR SELECT
    USING (
        (public.has_role(auth.uid(), 'advisor') OR public.has_role(auth.uid(), 'coordinator'))
        AND department_id = public.get_user_department(auth.uid())
    );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
CREATE POLICY "Students can view and update their own record"
    ON public.students FOR ALL
    USING (profile_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "Advisors can view their advisees"
    ON public.students FOR SELECT
    USING (
        advisor_id IN (
            SELECT f.id FROM public.faculty f 
            WHERE f.profile_id = public.get_user_profile_id(auth.uid())
        )
    );

CREATE POLICY "Coordinators and admins can view all students"
    ON public.students FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

CREATE POLICY "Companies can view students who applied to their internships"
    ON public.students FOR SELECT
    USING (
        id IN (
            SELECT a.student_id 
            FROM public.applications a
            JOIN public.internships i ON a.internship_id = i.id
            JOIN public.companies c ON i.company_id = c.id
            WHERE c.profile_id = public.get_user_profile_id(auth.uid())
        )
    );

-- RLS Policies for companies
CREATE POLICY "Companies can manage their own record"
    ON public.companies FOR ALL
    USING (profile_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "Everyone can view verified companies"
    ON public.companies FOR SELECT
    USING (verified = true);

CREATE POLICY "Admins and coordinators can view all companies"
    ON public.companies FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- RLS Policies for faculty
CREATE POLICY "Faculty can manage their own record"
    ON public.faculty FOR ALL
    USING (profile_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "Everyone can view faculty"
    ON public.faculty FOR SELECT
    USING (true);

-- RLS Policies for internships
CREATE POLICY "Companies can manage their own internships"
    ON public.internships FOR ALL
    USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE profile_id = public.get_user_profile_id(auth.uid())
        )
    );

CREATE POLICY "Everyone can view active internships"
    ON public.internships FOR SELECT
    USING (status = 'active');

CREATE POLICY "Admins and coordinators can view all internships"
    ON public.internships FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- RLS Policies for applications
CREATE POLICY "Students can manage their own applications"
    ON public.applications FOR ALL
    USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE profile_id = public.get_user_profile_id(auth.uid())
        )
    );

CREATE POLICY "Companies can view applications to their internships"
    ON public.applications FOR SELECT
    USING (
        internship_id IN (
            SELECT i.id FROM public.internships i
            JOIN public.companies c ON i.company_id = c.id
            WHERE c.profile_id = public.get_user_profile_id(auth.uid())
        )
    );

CREATE POLICY "Companies can update applications to their internships"
    ON public.applications FOR UPDATE
    USING (
        internship_id IN (
            SELECT i.id FROM public.internships i
            JOIN public.companies c ON i.company_id = c.id
            WHERE c.profile_id = public.get_user_profile_id(auth.uid())
        )
    );

CREATE POLICY "Advisors can view their advisees' applications"
    ON public.applications FOR SELECT
    USING (
        student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.faculty f ON s.advisor_id = f.id
            WHERE f.profile_id = public.get_user_profile_id(auth.uid())
        )
    );

CREATE POLICY "Coordinators and admins can manage all applications"
    ON public.applications FOR ALL
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- RLS Policies for evaluations
CREATE POLICY "Evaluators can manage their own evaluations"
    ON public.evaluations FOR ALL
    USING (evaluator_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "Admins and coordinators can view all evaluations"
    ON public.evaluations FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received"
    ON public.messages FOR SELECT
    USING (
        sender_id = public.get_user_profile_id(auth.uid()) OR 
        recipient_id = public.get_user_profile_id(auth.uid())
    );

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (sender_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "Users can update messages they received"
    ON public.messages FOR UPDATE
    USING (recipient_id = public.get_user_profile_id(auth.uid()));

-- RLS Policies for documents
CREATE POLICY "Users can manage their own documents"
    ON public.documents FOR ALL
    USING (owner_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "Admins and coordinators can view all documents"
    ON public.documents FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'coordinator')
    );

-- RLS Policies for audit_logs (admin only)
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faculty_updated_at
    BEFORE UPDATE ON public.faculty
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internships_updated_at
    BEFORE UPDATE ON public.internships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default departments
INSERT INTO public.departments (name, code, description) VALUES
    ('Computer Science', 'CS', 'Department of Computer Science and Engineering'),
    ('Business Administration', 'BA', 'Department of Business Administration'),
    ('Engineering', 'ENG', 'Department of Engineering'),
    ('Data Science', 'DS', 'Department of Data Science and Analytics'),
    ('Design', 'DES', 'Department of Design and Creative Arts');