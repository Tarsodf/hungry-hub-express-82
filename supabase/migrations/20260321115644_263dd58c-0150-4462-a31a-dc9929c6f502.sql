
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_visible boolean NOT NULL DEFAULT true
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible reviews"
ON public.reviews
FOR SELECT
TO public
USING (is_visible = true);

CREATE POLICY "Admins can manage reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- Seed initial reviews
INSERT INTO public.reviews (name, rating, text) VALUES
('Ana Silva', 5, 'Comida brasileira incrível! Os espetinhos são os melhores de Guimarães. Ambiente acolhedor e atendimento excelente.'),
('Carlos Mendes', 5, 'Melhor restaurante brasileiro em Portugal! A feijoada é autêntica e o preço é muito justo. Recomendo!'),
('Maria Santos', 5, 'Adorei o menu executivo, muito completo com bebida, sobremesa e café. Voltarei com certeza!'),
('Pedro Oliveira', 5, 'Os hambúrgueres artesanais são fantásticos! Ingredientes frescos e muito sabor. O melhor de Guimarães.'),
('Joana Costa', 5, 'Experimentei os pastéis e as sobremesas, tudo delicioso! O atendimento é muito simpático e rápido.'),
('Ricardo Ferreira', 5, 'Entrega rápida e comida quentinha. O prato executivo de quinta-feira é incrível. Já sou cliente fiel!'),
('Beatriz Almeida', 5, 'Ambiente muito agradável e comida com sabor autêntico do Brasil. Os espetinhos na brasa são divinos!'),
('Tiago Rodrigues', 5, 'Surpreendeu-me pela qualidade! Porções generosas e preço justo. A picanha estava perfeita.'),
('Fernanda Lima', 5, 'Matou a minha saudade do Brasil! Tudo muito bem feito, desde a entrada até à sobremesa. Nota 10!');
