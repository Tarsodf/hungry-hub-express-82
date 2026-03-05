
-- Add day_of_week to menu_items for executivos
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS day_of_week integer;
COMMENT ON COLUMN public.menu_items.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday. NULL for non-daily items.';

-- Create menu_addons table for extras
CREATE TABLE public.menu_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active addons"
ON public.menu_addons FOR SELECT
USING (true);

CREATE POLICY "Admins can manage addons"
ON public.menu_addons FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add order_fee column to orders for the fixed €0.90 fee
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_fee numeric NOT NULL DEFAULT 0.90;
