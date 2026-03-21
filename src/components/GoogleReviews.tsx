import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/Dom+Bistr%C3%B4+Grill/@41.4415398,-8.2936489,17z/data=!4m8!3m7!1s0xd24ef2ebb583af3:0x70691539aa68e941!8m2!3d41.4415358!4d-8.291074!9m1!1b1!16s%2Fg%2F11zj8dhdkm";

const ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

const allReviews = [
  {
    name: "Ana Silva",
    rating: 5,
    text: "Comida brasileira incrível! Os espetinhos são os melhores de Guimarães. Ambiente acolhedor e atendimento excelente.",
    date: "Há 2 semanas",
  },
  {
    name: "Carlos Mendes",
    rating: 5,
    text: "Melhor restaurante brasileiro em Portugal! A feijoada é autêntica e o preço é muito justo. Recomendo!",
    date: "Há 1 mês",
  },
  {
    name: "Maria Santos",
    rating: 5,
    text: "Adorei o menu executivo, muito completo com bebida, sobremesa e café. Voltarei com certeza!",
    date: "Há 3 semanas",
  },
  {
    name: "Pedro Oliveira",
    rating: 5,
    text: "Os hambúrgueres artesanais são fantásticos! Ingredientes frescos e muito sabor. O melhor de Guimarães.",
    date: "Há 1 mês",
  },
  {
    name: "Joana Costa",
    rating: 5,
    text: "Experimentei os pastéis e as sobremesas, tudo delicioso! O atendimento é muito simpático e rápido.",
    date: "Há 2 meses",
  },
  {
    name: "Ricardo Ferreira",
    rating: 5,
    text: "Entrega rápida e comida quentinha. O prato executivo de quinta-feira é incrível. Já sou cliente fiel!",
    date: "Há 3 semanas",
  },
  {
    name: "Beatriz Almeida",
    rating: 5,
    text: "Ambiente muito agradável e comida com sabor autêntico do Brasil. Os espetinhos na brasa são divinos!",
    date: "Há 2 meses",
  },
  {
    name: "Tiago Rodrigues",
    rating: 5,
    text: "Surpreendeu-me pela qualidade! Porções generosas e preço justo. A picanha estava perfeita.",
    date: "Há 1 mês",
  },
  {
    name: "Fernanda Lima",
    rating: 5,
    text: "Matou a minha saudade do Brasil! Tudo muito bem feito, desde a entrada até à sobremesa. Nota 10!",
    date: "Há 3 meses",
  },
];

const REVIEWS_PER_PAGE = 3;

const GoogleReviews = () => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);

  useEffect(() => {
    const interval = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, [totalPages]);

  const visibleReviews = allReviews.slice(
    page * REVIEWS_PER_PAGE,
    page * REVIEWS_PER_PAGE + REVIEWS_PER_PAGE
  );

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-8 bg-primary" />
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Avaliações
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            O Que Dizem os Nossos <span className="text-primary">Clientes</span>
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
            <span className="ml-2 font-body text-sm text-muted-foreground">5.0 no Google</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto transition-opacity duration-500">
          {visibleReviews.map((review, index) => (
            <div
              key={`${page}-${index}`}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-md animate-fade-in"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">
                "{review.text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{review.date}</p>
                </div>
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="h-5 w-5 opacity-60"
                  loading="lazy"
                  width={20}
                  height={20}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
              aria-label={`Ver avaliações ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="lg"
              className="font-body font-semibold gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Star className="h-4 w-4" />
              Deixe a Sua Avaliação no Google
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
