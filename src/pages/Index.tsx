import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, UtensilsCrossed } from "lucide-react";
import GoogleReviews from "@/components/GoogleReviews";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const { data: featuredItems } = useQuery({
    queryKey: ["featured-items"],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from("menu_categories")
        .select("id")
        .in("name", ["Pratos Executivos", "Hambúrgueres", "Grelhados"]);
      
      const categoryIds = categories?.map((c) => c.id) || [];
      if (categoryIds.length === 0) return [];

      const { data } = await supabase
        .from("menu_items")
        .select("id, name, image_url, price, description")
        .eq("is_active", true)
        .not("image_url", "is", null)
        .in("category_id", categoryIds)
        .limit(8);
      return data || [];
    },
  });

  return (
    <main className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4">
            🔥 Dom Bistro Grill
          </h1>
          <p className="font-body text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Sabores autênticos, grelhados na perfeição. Peça online e receba no conforto da sua casa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cardapio">
              <Button size="lg" className="bg-primary text-primary-foreground font-body text-lg px-8">
                <UtensilsCrossed className="mr-2 h-5 w-5" />
                Ver Cardápio
              </Button>
            </Link>
            <Link to="/cardapio?categoria=Pratos%20Executivos">
              <Button size="lg" variant="outline" className="font-body text-lg px-8">
                Pratos do Dia
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Dishes Section */}
      {featuredItems && featuredItems.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            🍽️ Nossos Pratos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredItems.map((item: any) => (
              <Link
                key={item.id}
                to="/cardapio"
                className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-display text-sm md:text-base font-semibold text-foreground truncate">
                    {item.name}
                  </h3>
                  <p className="font-body text-sm text-primary font-bold mt-1">
                    €{item.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border">
            <MapPin className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">Localização</h3>
            <p className="font-body text-sm text-muted-foreground">
              Guimarães, Portugal
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border">
            <Clock className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">Horário</h3>
            <p className="font-body text-sm text-muted-foreground">
              Seg–Sex: 11h30–15h00<br />
              Sáb–Dom: 12h00–15h00
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border">
            <Phone className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">Contacto</h3>
            <p className="font-body text-sm text-muted-foreground">
              +351 930 580 520
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <GoogleReviews />

      {/* CTA Section */}
      <section className="text-center px-4 py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
          Pronto para pedir?
        </h2>
        <p className="font-body text-muted-foreground mb-6">
          Escolha o seu prato favorito e receba em casa!
        </p>
        <Link to="/cardapio">
          <Button size="lg" className="bg-primary text-primary-foreground font-body text-lg px-10">
            Fazer Pedido
          </Button>
        </Link>
      </section>
    </main>
  );
};

export default Index;
