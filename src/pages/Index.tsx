import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Flame, Heart, AlertTriangle, Phone } from "lucide-react";
import GoogleReviews from "@/components/GoogleReviews";
const heroImage = "/hero-restaurant.jpg";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const Index = () => {
  const today = new Date().getDay();

  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] overflow-hidden flex items-center">
        <img
          src={heroImage}
          alt="Dom Bistro Grill - Comida brasileira autêntica em Guimarães"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-primary" />
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
                Cozinha Brasileira Autêntica
              </span>
            </div>

            <h1 className="font-display text-5xl font-bold text-foreground md:text-7xl leading-tight animate-fade-in">
              O Sabor do Brasil<br />
              <span className="text-primary">em Guimarães</span>
            </h1>

            <p className="mt-6 font-body text-lg text-muted-foreground max-w-lg leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Pratos executivos diários, espetinhos na brasa, hambúrgueres artesanais e doces típicos.
              Uma viagem gastronômica pelo Nordeste, Sul e Sudeste do Brasil.
            </p>

            <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Link to="/cardapio">
                <Button size="lg" className="bg-primary text-primary-foreground font-body font-semibold px-10 py-6 text-base hover:bg-primary/90">
                  Ver Cardápio Completo
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Guimarães, Portugal</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Entrega Local</div>
              <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Brasa Viva</div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's highlight */}
      <section className="border-y border-border bg-secondary/50 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="font-body text-sm text-muted-foreground">
            🔥 Hoje é: <span className="font-semibold text-primary">{DAY_NAMES[today]}</span> — Os Pratos Executivos mudam diariamente. Confira o cardápio do dia!
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-8 bg-primary" />
                <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
                  Sobre Nós
                </span>
              </div>

              <h2 className="font-display text-4xl font-bold text-foreground leading-tight">
                Brasil em Cada<br /><span className="text-primary">Prato</span>
              </h2>

              <p className="mt-6 font-body text-muted-foreground leading-relaxed">
                O Dom Bistro Grill nasceu da saudade da comida brasileira em terras portuguesas. 
                Localizado no coração de Guimarães, trazemos os sabores 
                autênticos do Brasil: desde o churrasco gaúcho até a feijoada carioca, 
                passando pelos espetinhos nordestinos e doces caseiros.
              </p>

              <p className="mt-4 font-body text-sm text-muted-foreground leading-relaxed">
                Todos os menus executivos incluem bebida, sobremesa e café.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4 flex items-start gap-3">
                  <Flame className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-body font-semibold text-foreground text-sm">Brasa Viva</p>
                    <p className="font-body text-xs text-muted-foreground">Espetinhos e carnes na brasa</p>
                  </div>
                </div>
                <div className="glass rounded-xl p-4 flex items-start gap-3">
                  <Heart className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-body font-semibold text-foreground text-sm">Feito com Amor</p>
                    <p className="font-body text-xs text-muted-foreground">Receitas de família</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img
                  src={heroImage}
                  alt="Sobre o Dom Bistro Grill"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 glass rounded-xl p-4 text-center">
                <p className="font-display text-3xl font-bold text-primary">100%</p>
                <p className="font-body text-xs text-muted-foreground">Brasileiro</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviews />

      {/* Allergy Notice */}
      <div className="border-t border-border bg-secondary/30 py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="font-body text-xs text-muted-foreground">
            Os nossos pratos podem conter alergénios ou ter contacto cruzado. Se tem alguma alergia, <a href="tel:+351935044022" className="text-primary hover:underline font-medium">contacte-nos</a> antes de encomendar.
          </p>
        </div>
      </div>

    </main>
  );
};

export default Index;
