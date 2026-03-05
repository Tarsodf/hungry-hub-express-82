
-- Fix overly permissive INSERT policies on orders and order_items

-- Drop existing permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Recreate with basic validation constraints
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  customer_name IS NOT NULL AND customer_name <> '' AND
  customer_email IS NOT NULL AND customer_email <> '' AND
  total > 0 AND
  status = 'received' AND
  delivery_mode IN ('delivery', 'pickup')
);

CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  order_id IS NOT NULL AND
  name IS NOT NULL AND name <> '' AND
  price > 0 AND
  quantity > 0
);
