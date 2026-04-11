-- Allow administrators to delete companies
CREATE POLICY "Admins can delete any company" 
ON public.companies 
FOR DELETE 
USING (
  public.has_role('admin')
);

-- Additionally, it might be necessary to grant the same for students if deleting users
CREATE POLICY "Admins can delete any student" 
ON public.students
FOR DELETE 
USING (
  public.has_role('admin')
);
