-- Fix public SELECT policies to only expose active items
DROP POLICY IF EXISTS "Anyone can view active items" ON public.menu_items;
CREATE POLICY "Anyone can view active items" ON public.menu_items
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active addons" ON public.menu_addons;
CREATE POLICY "Anyone can view active addons" ON public.menu_addons
  FOR SELECT USING (is_active = true);