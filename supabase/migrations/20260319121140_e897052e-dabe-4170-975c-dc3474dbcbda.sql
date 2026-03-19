-- Remove public INSERT policies on orders and order_items
-- All order creation now goes through the create-order edge function (which uses service role key)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;