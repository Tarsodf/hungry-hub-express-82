import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Flame, Heart } from "lucide-react";
import GoogleReviews from "@/components/GoogleReviews";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const Index = () => {
  const today = new Date().getDay();
  const todayName = DAY_NAMES[today];

  return (
    <main className="bg-[#1a1a1a] min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="/hero-restaurant.jpg"
            alt="Prato brasileiro grelhado"
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-orange-500 font-semibold tracking-[0.2em] uppercase text-sm mb-6">
              <span className="w-8 h-[2px] bg-orange-500 inline-block" />
              Cozinha Brasileira Autêntica
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-2 leading-tight">
              O Sabor do Brasil
            </h1>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-orange-500 mb-6 leading-tight">
              em Guimarães
            </h1>
            <p className="font-body text-gray-300 text-base md:text-lg mb-8 leading-relaxed max-w-md">
              Pratos executivos diários, espetinhos na brasa, hambúrgueres artesanais e doces típicos. Uma viagem gastronômica pelo Nordeste, Sul e Sudeste do Brasil.
            </p>
            <Link to="/cardapio">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-body text-lg px-10 py-6 rounded-lg">
                Ver Cardápio Completo
              </Button>
            </Link>

            <div className="flex items-center gap-6 mt-10 text-gray-400 text-sm">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                Guimarães, Portugal
              </span>
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-500" />
                Entrega Local
              </span>
              <span className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Brasa Viva
              </span>
            </div>
          </div>
        </div>

        {/* Day banner */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm py-3 text-center">
          <p className="font-body text-sm text-gray-300">
            🔥 Hoje é: <span className="text-orange-500 font-bold">{todayName}</span> — Os Pratos Executivos mudam diariamente. Confira o cardápio do dia!
          </p>
        </div>
      </section>

      {/* Sobre Nós Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="flex items-center gap-2 text-orange-500 font-semibold tracking-[0.2em] uppercase text-sm mb-4">
              <span className="w-8 h-[2px] bg-orange-500 inline-block" />
              Sobre Nós
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              Brasil em Cada
            </h2>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-orange-500 mb-6">
              Prato
            </h2>
            <p className="font-body text-gray-400 leading-relaxed mb-4">
              O Dom Bistro Grill nasceu da saudade da comida brasileira em terras portuguesas. Localizado no coração de Guimarães, trazemos os sabores autênticos do Brasil: desde o churrasco gaúcho até a feijoada carioca, passando pelos espetinhos nordestinos e doces caseiros.
            </p>
            <p className="font-body text-gray-300 mb-8">
              Todos os menus executivos incluem bebida, sobremesa e café.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <Flame className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="font-display font-semibold text-white text-sm">Brasa Viva</p>
                  <p className="font-body text-gray-500 text-xs">Espetinhos e carnes na brasa</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <Heart className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="font-display font-semibold text-white text-sm">Feito com Amor</p>
                  <p className="font-body text-gray-500 text-xs">Receitas de família</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="/hero-restaurant.jpg"
              alt="Prato brasileiro"
              className="w-full rounded-2xl object-cover aspect-[4/5]"
              loading="lazy"
            />
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
              <p className="font-display text-3xl font-bold text-orange-500">100<span className="text-lg">%</span></p>
              <p className="font-body text-gray-300 text-xs">Brasileiro</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <GoogleReviews />

      {/* CTA Section */}
      <section className="text-center px-6 py-20">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
          Pronto para pedir?
        </h2>
        <p className="font-body text-gray-400 mb-8">
          Escolha o seu prato favorito e receba em casa!
        </p>
        <Link to="/cardapio">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-body text-lg px-12 py-6 rounded-lg">
            Fazer Pedido
          </Button>
        </Link>
      </section>
    </main>
  );
};

export default Index;
