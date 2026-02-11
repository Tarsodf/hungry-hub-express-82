import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Flame, IceCream, GlassWater, ChefHat, Beef } from "lucide-react";
import heroImage from "@/assets/hero-restaurant.jpg";

const categories = [
{ name: "Pratos Executivos", icon: ChefHat, emoji: "🍽️" },
{ name: "Hambúrgueres", icon: Beef, emoji: "🍔" },
{ name: "Espetinhos", icon: Flame, emoji: "🍢" },
{ name: "Sobremesas", icon: IceCream, emoji: "🍰" },
{ name: "Bebidas", icon: GlassWater, emoji: "🥤" },
{ name: "Pastéis", icon: UtensilsCrossed, emoji: "🥟" }];


const Index = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src={heroImage}
          alt="Dom Bistro Grill - Restaurante com ambiente acolhedor e pratos na brasa"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager" />

        <div className="absolute inset-0 bg-gradient-to-t from-warm-brown-dark/90 via-warm-brown-dark/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-5xl font-bold text-warm-cream md:text-7xl animate-fade-in">
            Dom Bistro Grill
          </h1>
          <p className="mt-4 max-w-xl font-body text-lg text-warm-cream/90 md:text-xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Sabores autênticos na brasa, feitos com paixão e os melhores ingredientes
          </p>
          <Link to="/cardapio" className="mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" className="bg-warm-gold text-warm-brown-dark font-body font-bold uppercase tracking-wider hover:bg-warm-gold/90 px-8 py-6 text-base">
              Ver Cardápio
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-background py-16 border-[#f8e2bf]">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            Nosso Cardápio
          </h2>
          <p className="mt-3 text-center font-body text-muted-foreground bg-[#fbe1cb]">
            Explore as nossas categorias e descubra sabores irresistíveis
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) =>
            <Link
              key={cat.name}
              to={`/cardapio?categoria=${encodeURIComponent(cat.name)}`}
              className="group flex flex-col items-center gap-3 rounded-lg bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 border border-border">

                <span className="text-4xl">{cat.emoji}</span>
                <span className="font-body text-sm font-medium text-card-foreground text-center group-hover:text-accent">
                  {cat.name}
                </span>
              </Link>
            )}
          </div>

          <div className="mt-10 text-center border-[#f5e7b7]">
            <Link to="/cardapio">
              <Button variant="outline" size="lg" className="font-body uppercase tracking-wider border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Ver Cardápio Completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-card-foreground">
              Sobre Nós
            </h2>
            <p className="mt-4 font-body leading-relaxed text-muted-foreground">
              No Dom Bistro Grill, cada prato é uma celebração de sabores. Utilizamos ingredientes frescos 
              e técnicas tradicionais de grelha para trazer até si uma experiência gastronómica inesquecível. 
              Venha visitar-nos ou faça o seu pedido online!
            </p>
          </div>
        </div>
      </section>
    </main>);

};

export default Index;