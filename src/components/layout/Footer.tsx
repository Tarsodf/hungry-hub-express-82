import { MapPin, Clock, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-warm-brown-dark text-warm-cream">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-bold text-warm-gold mb-4">Dom Bistro Grill</h3>
            <p className="font-body text-sm leading-relaxed opacity-80">
              Sabores autênticos na brasa, com ingredientes frescos e o tempero que só a tradição traz.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold text-warm-gold mb-4">Contacto</h4>
            <div className="space-y-3 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-warm-gold" />
                <span>Rua do Sabor, 123 - Centro</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-warm-gold" />
                <span>+351 912 345 678</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold text-warm-gold mb-4">Horário</h4>
            <div className="space-y-2 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warm-gold" />
                <span>Seg - Sex: 11h às 23h</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warm-gold" />
                <span>Sáb - Dom: 11h às 00h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-warm-burgundy pt-6 text-center text-xs opacity-60">
          © {new Date().getFullYear()} Dom Bistro Grill. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
