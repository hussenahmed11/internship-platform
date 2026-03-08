
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System/admin can insert notifications (via service role or triggers)
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage RLS: users can upload their own documents
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Storage RLS: users can view their own documents, admins/coordinators can view all
CREATE POLICY "Users can view own documents or admins all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'coordinator'::app_role)
    )
  );

-- Storage RLS: users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add trigger to create notification when company is created (needs verification)
CREATE OR REPLACE FUNCTION public.notify_admin_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      admin_record.user_id,
      'New Company Registration',
      'A new company "' || NEW.company_name || '" has registered and needs verification.',
      'warning',
      '/companies'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_company();

-- Trigger for new applications
CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  internship_title text;
  company_profile_id uuid;
  company_user_id uuid;
BEGIN
  SELECT i.title, c.profile_id INTO internship_title, company_profile_id
  FROM internships i JOIN companies c ON i.company_id = c.id
  WHERE i.id = NEW.internship_id;

  SELECT p.user_id INTO company_user_id
  FROM profiles p WHERE p.id = company_profile_id;

  IF company_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      company_user_id,
      'New Application Received',
      'A student has applied to "' || internship_title || '".',
      'info',
      '/applications'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_created
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_application();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
