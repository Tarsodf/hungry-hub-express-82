import { MapPin, Clock, Phone, Mail, Truck, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg">🔥</span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Dom Bistro Grill</h3>
            </div>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              Cozinha brasileira autêntica no coração de Guimarães.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" />
              <span>Entregas em Guimarães e vizinhanças</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Localização
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Alam São Damasco - S. Francisco</p>
              <p>Centro 35, N/A</p>
              <p>4810-286 Guimarães, Portugal</p>
              <div className="flex items-center gap-2 pt-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+351 930 580 520</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>bistrogrillr@gmail.com</span>
              </div>
              <a
                href="https://www.instagram.com/dombistrogrill"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Instagram className="h-4 w-4 text-primary" />
                <span>@dombistrogrill</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> Horário
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Segunda a Sexta</span>
                <span className="font-medium text-foreground">11:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sábado</span>
                <span className="font-medium text-foreground">11:00 - 23:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domingo</span>
                <span className="font-medium text-foreground">12:00 - 21:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Dom Bistro Grill — Guimarães, Portugal. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;