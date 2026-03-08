
-- Create platform_settings table for admin configuration
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can read settings"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.platform_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('general', '{"platform_name": "InternHub", "support_email": "", "maintenance_mode": false}'::jsonb),
  ('security', '{"two_factor_required": false, "session_timeout": true}'::jsonb),
  ('notifications', '{"email_notifications": true, "new_user_alerts": true}'::jsonb);

-- Auto-update updated_at
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
