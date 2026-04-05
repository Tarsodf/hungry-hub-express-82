import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Users, Clock, CheckCircle2 } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";

const TIME_SLOTS = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
];

const ReservationPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !date || !time || !partySize) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reservations" as any).insert({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        date: format(date, "yyyy-MM-dd"),
        time,
        party_size: parseInt(partySize),
        notes: notes || "",
      } as any);

      if (error) throw error;

      // Notify admin via edge function
      try {
        await supabase.functions.invoke("notify-reservation", {
          body: {
            name,
            email,
            phone,
            date: format(date, "dd/MM/yyyy"),
            time,
            partySize: parseInt(partySize),
            notes,
          },
        });
      } catch {
        // Email notification failure shouldn't block the reservation
      }

      setSubmitted(true);
    } catch (err: any) {
      toast.error("Erro ao enviar reserva. Tente novamente.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="bg-background min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Reserva Enviada!</h1>
          <p className="text-muted-foreground font-body">
            Recebemos o seu pedido de reserva. Entraremos em contacto em breve para confirmar.
          </p>
          <Button onClick={() => window.location.href = "/"} variant="outline" className="border-border">
            Voltar ao Início
          </Button>
        </div>
      </main>
    );
  }

  const today = startOfDay(new Date());

  return (
    <main className="bg-background min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="flex items-center justify-center gap-2 text-primary font-semibold tracking-[0.2em] uppercase text-sm mb-4">
            <span className="w-8 h-[2px] bg-primary inline-block" />
            Reservas
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Reserve a Sua Mesa
          </h1>
          <p className="text-muted-foreground font-body">
            Preencha o formulário abaixo para solicitar uma reserva no Dom Bistro Grill.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-2xl p-6 md:p-8">
          {/* Personal Info */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" required className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Telefone *</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+351 9XX XXX XXX" required className="bg-secondary border-border text-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email *</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-secondary border-border text-foreground" />
            </div>
          </div>

          {/* Reservation Details */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Detalhes da Reserva
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Número de Pessoas *</Label>
                <Select value={partySize} onValueChange={setPartySize}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "pessoa" : "pessoas"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Horário *</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Data *</Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={pt}
                  disabled={(d) => isBefore(d, today)}
                  className="rounded-xl border border-border bg-secondary"
                />
              </div>
              {date && (
                <p className="text-sm text-primary text-center font-medium">
                  📅 {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alguma preferência especial, alergias, aniversário..."
              className="bg-secondary border-border text-foreground min-h-[80px]"
            />
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body text-lg py-6">
            {submitting ? "Enviando..." : "Solicitar Reserva"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            A reserva fica sujeita a confirmação. Entraremos em contacto para confirmar a disponibilidade.
          </p>
        </form>
      </div>
    </main>
  );
};

export default ReservationPage;
