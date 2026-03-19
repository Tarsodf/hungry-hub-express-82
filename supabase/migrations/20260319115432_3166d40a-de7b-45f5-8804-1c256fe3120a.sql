
DROP POLICY "Anyone can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  (customer_name IS NOT NULL) AND (customer_name <> ''::text)
  AND (customer_phone IS NOT NULL) AND (customer_phone <> ''::text)
  AND (total > (0)::numeric)
  AND (status = 'received'::text)
  AND (delivery_mode = ANY (ARRAY['delivery'::text, 'pickup'::text]))
  AND (stripe_payment_id = ''::text)
);
