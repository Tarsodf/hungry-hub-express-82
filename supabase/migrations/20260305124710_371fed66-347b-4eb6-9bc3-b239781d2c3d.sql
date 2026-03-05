
-- Update orders INSERT policy to not require email (WhatsApp orders use phone)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  customer_name IS NOT NULL AND customer_name <> '' AND
  customer_phone IS NOT NULL AND customer_phone <> '' AND
  total > 0 AND
  status = 'received' AND
  delivery_mode IN ('delivery', 'pickup')
);
