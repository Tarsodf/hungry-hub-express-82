import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Flame, Heart, CalendarDays } from "lucide-react";
import GoogleReviews from "@/components/GoogleReviews";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const Index = () => {
  const today = new Date().getDay();
  const todayName = DAY_NAMES[today];

  return (
    <main className="bg-background min-h-screen text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="/hero-restaurant.jpg"
            alt="Prato brasileiro grelhado"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12 w-full pt-12 pb-16 md:py-0">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-primary font-semibold tracking-[0.15em] md:tracking-[0.2em] uppercase text-xs md:text-sm mb-4 md:mb-6">
              <span className="w-6 md:w-8 h-[2px] bg-primary inline-block" />
              Cozinha Brasileira Autêntica
            </p>
            <h1 className="font-display text-3xl md:text-6xl font-bold text-foreground mb-1 md:mb-2 leading-tight">
              O Sabor do Brasil
            </h1>
            <h1 className="font-display text-3xl md:text-6xl font-bold text-primary mb-4 md:mb-6 leading-tight">
              em Guimarães
            </h1>
            <p className="font-body text-muted-foreground text-sm md:text-lg mb-6 md:mb-8 leading-relaxed max-w-md">
              Pratos executivos diários, espetinhos na brasa, hambúrgueres artesanais e doces típicos.
            </p>
            <Link to="/cardapio">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-body text-base md:text-lg px-8 md:px-10 py-5 md:py-6 rounded-lg w-full md:w-auto">
                Ver Cardápio Completo
              </Button>
            </Link>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6 md:mt-10 text-muted-foreground text-xs md:text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                Guimarães
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                Entrega Local
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                Brasa Viva
              </span>
            </div>
          </div>
        </div>

        {/* Day banner */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm py-2.5 md:py-3 text-center px-4">
          <p className="font-body text-xs md:text-sm text-muted-foreground">
            🔥 Hoje: <span className="text-primary font-bold">{todayName}</span> — Executivos mudam diariamente!
          </p>
        </div>
      </section>

      {/* Sobre Nós Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <p className="flex items-center gap-2 text-primary font-semibold tracking-[0.15em] md:tracking-[0.2em] uppercase text-xs md:text-sm mb-3 md:mb-4">
              <span className="w-6 md:w-8 h-[2px] bg-primary inline-block" />
              Sobre Nós
            </p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
              Brasil em Cada
            </h2>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-primary mb-4 md:mb-6">
              Prato
            </h2>
            <p className="font-body text-muted-foreground text-sm md:text-base leading-relaxed mb-3 md:mb-4">
              O Dom Bistro Grill nasceu da saudade da comida brasileira em terras portuguesas. Trazemos os sabores autênticos do Brasil: desde o churrasco gaúcho até a feijoada carioca.
            </p>
            <p className="font-body text-foreground/80 text-sm mb-6 md:mb-8">
              Todos os menus executivos incluem bebida, sobremesa e café.
            </p>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="flex items-center gap-2.5 md:gap-3 glass rounded-xl p-3 md:p-4">
                <Flame className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                <div>
                  <p className="font-display font-semibold text-foreground text-xs md:text-sm">Brasa Viva</p>
                  <p className="font-body text-muted-foreground text-[10px] md:text-xs">Carnes na brasa</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 md:gap-3 glass rounded-xl p-3 md:p-4">
                <Heart className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                <div>
                  <p className="font-display font-semibold text-foreground text-xs md:text-sm">Feito com Amor</p>
                  <p className="font-body text-muted-foreground text-[10px] md:text-xs">Receitas de família</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="/hero-restaurant.jpg"
              alt="Prato brasileiro"
              className="w-full rounded-2xl object-cover aspect-[4/5] max-h-[50vh] md:max-h-none"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2.5 md:px-5 md:py-3 text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-primary">100<span className="text-base md:text-lg">%</span></p>
              <p className="font-body text-muted-foreground text-[10px] md:text-xs">Brasileiro</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Reservas */}
      <section className="border-t border-white/10 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">
            Quer reservar uma mesa?
          </p>
          <Link to="/reserva" className="font-body text-sm text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors">
            Fazer reserva
          </Link>
        </div>
      </section>

      {/* Reviews Section */}
      <GoogleReviews />

      {/* Informação para Alérgicos */}
      <section className="border-t border-border py-8 md:py-10 px-4 md:px-6 text-center">
        <h3 className="font-display text-sm md:text-base font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
          ⚠️ Informação para Alérgicos
        </h3>
        <p className="font-body text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto">
          Os nossos pratos podem conter alergénios. Se tem alguma alergia,{" "}
          <a href="mailto:bistrogrillr@gmail.com" className="text-primary font-semibold hover:underline">contacte-nos</a> antes de encomendar.
        </p>
      </section>
    </main>
  );
};

export default Index;
