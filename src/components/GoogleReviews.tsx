import { forwardRef, useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_REVIEW_URL = "https://g.page/r/CUHpaKo5FWlwEBM/review";

const ROTATION_INTERVAL = 30 * 1000; // 30 seconds
const REVIEWS_PER_PAGE = 3;

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
};

const formatDate = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Hoje";
  if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Há ${weeks} semana${weeks > 1 ? "s" : ""}`;
  }

  const months = Math.floor(diffDays / 30);
  return `Há ${months} ${months > 1 ? "meses" : "mês"}`;
};

const GoogleReviews = forwardRef<HTMLElement>((_, ref) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (data) setReviews(data);
    };

    fetchReviews();

    const channel = supabase
      .channel("reviews-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => fetchReviews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (totalPages <= 1) return;

    const interval = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [totalPages]);

  useEffect(() => {
    if (page >= totalPages) setPage(0);
  }, [page, totalPages]);

  const visibleReviews = reviews.slice(
    page * REVIEWS_PER_PAGE,
    page * REVIEWS_PER_PAGE + REVIEWS_PER_PAGE
  );

  if (reviews.length === 0) return null;

  return (
    <section ref={ref} className="bg-secondary/30 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-primary" />
            <span className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Avaliações
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            O Que Dizem os Nossos <span className="text-primary">Clientes</span>
          </h2>
          <div className="mt-3 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
            <span className="ml-2 font-body text-sm text-muted-foreground">5.0 no Google</span>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="animate-fade-in rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-1">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 font-body text-sm leading-relaxed text-muted-foreground">
                "{review.text}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </p>
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

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
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
        )}

        <div className="mt-10 text-center">
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-primary font-body font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
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
});

GoogleReviews.displayName = "GoogleReviews";

export default GoogleReviews;
