ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.orders.delivery_fee IS 'Valor cobrado pela entrega para repasse ao entregador.';