import { MapPin, Clock, Phone, Mail, Truck, Instagram } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULTS: Record<string, string> = {
  address_line1: "Alam São Damasco - S. Francisco",
  address_line2: "Centro 35, N/A",
  address_line3: "4810-286 Guimarães, Portugal",
  phone: "+351 930 580 520",
  email: "bistrogrillr@gmail.com",
  instagram_url: "https://www.instagram.com/dombistrogrill",
  instagram_handle: "@dombistrogrill",
  hours_weekday_label: "Segunda a Sexta",
  hours_weekday_time: "11:00 - 22:00",
  hours_saturday_label: "Sábado",
  hours_saturday_time: "11:00 - 23:00",
  hours_sunday_label: "Domingo",
  hours_sunday_time: "12:00 - 21:00",
};

const Footer = () => {
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, string> = { ...DEFAULTS };
      (data as { key: string; value: string }[]).forEach((s) => { map[s.key] = s.value; });
      return map;
    },
    staleTime: 60_000,
  });

  const s = settings || DEFAULTS;

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src={logo} alt="Dom Bistro Grill" className="h-10 w-10 rounded-lg object-cover" />
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
              <p>{s.address_line1}</p>
              <p>{s.address_line2}</p>
              <p>{s.address_line3}</p>
              <div className="flex items-center gap-2 pt-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{s.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>{s.email}</span>
              </div>
              <a
                href={s.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Instagram className="h-4 w-4 text-primary" />
                <span>{s.instagram_handle}</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> Horário
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{s.hours_weekday_label}</span>
                <span className="font-medium text-foreground">{s.hours_weekday_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{s.hours_saturday_label}</span>
                <span className="font-medium text-foreground">{s.hours_saturday_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{s.hours_sunday_label}</span>
                <span className="font-medium text-foreground">{s.hours_sunday_time}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground space-y-2">
          <div className="flex justify-center gap-4">
            <a href="/termos" className="hover:text-primary transition-colors underline">Termos & Condições</a>
            <span>•</span>
            <a href="/privacidade" className="hover:text-primary transition-colors underline">Política de Privacidade</a>
          </div>
          <p>© {new Date().getFullYear()} Dom Bistro Grill — Guimarães, Portugal. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
