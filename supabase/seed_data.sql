-- SAMPLE SEED DATA
-- Run this AFTER database_setup.sql

-- 1. ADDITIONAL DEPARTMENTS
INSERT INTO public.departments (name, code, description) VALUES
    ('Information Science', 'IS', 'Department of Information Science'),
    ('Software Engineering', 'SE', 'Department of Software Engineering'),
    ('Mechanical Engineering', 'ME', 'Department of Mechanical Engineering'),
    ('Electrical Engineering', 'EE', 'Department of Electrical Engineering'),
    ('Marketing', 'MKT', 'Department of Marketing and Communications')
ON CONFLICT (code) DO NOTHING;

-- 2. NOTE ON SAMPLE PROFILES / USERS
-- Since profiles depend on auth.users, it's best to create users through the 
-- Supabase Dashboard or API first, then update their profiles.

/*
-- EXAMPLE: How to manually add a company and an internship
-- (Replace UUIDs with actual user IDs from auth.users)

-- Step A: Set a user as a company
UPDATE public.profiles 
SET role = 'company', onboarding_completed = true 
WHERE email = 'company@example.com';

-- Step B: Insert into companies table
INSERT INTO public.companies (profile_id, company_name, industry, company_size, website, location, verified)
SELECT id, 'Tech Solutions Inc.', 'Software', '50-200', 'https://techsolutions.example', 'Addis Ababa', true
FROM public.profiles WHERE email = 'company@example.com';

-- Step C: Insert an internship
INSERT INTO public.internships (company_id, title, description, location, remote, duration, status, department_id)
SELECT c.id, 'Frontend Developer Intern', 'Exciting React role...', 'Remote', true, '3 months', 'active', d.id
FROM public.companies c, public.departments d
WHERE c.company_name = 'Tech Solutions Inc.' AND d.code = 'CS'
LIMIT 1;
*/

-- 3. SYSTEM SETTINGS (Optional)
-- You can add any system-wide settings or configuration here.
