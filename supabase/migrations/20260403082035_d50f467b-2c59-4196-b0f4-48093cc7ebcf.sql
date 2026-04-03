
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('address_line1', 'Alam São Damasco - S. Francisco'),
  ('address_line2', 'Centro 35, N/A'),
  ('address_line3', '4810-286 Guimarães, Portugal'),
  ('phone', '+351 930 580 520'),
  ('email', 'bistrogrillr@gmail.com'),
  ('instagram_url', 'https://www.instagram.com/dombistrogrill'),
  ('instagram_handle', '@dombistrogrill'),
  ('hours_weekday_label', 'Segunda a Sexta'),
  ('hours_weekday_time', '11:00 - 22:00'),
  ('hours_saturday_label', 'Sábado'),
  ('hours_saturday_time', '11:00 - 23:00'),
  ('hours_sunday_label', 'Domingo'),
  ('hours_sunday_time', '12:00 - 21:00');
