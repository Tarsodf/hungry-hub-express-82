import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";

const ALLOWED_ADMIN_EMAIL = "tarso-souza@hotmail.com";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (email.toLowerCase().trim() !== ALLOWED_ADMIN_EMAIL) {
        throw new Error("Email não autorizado para recuperação.");
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Email enviado! Verifique a sua caixa de entrada.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="glass rounded-2xl p-8 border-border">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Recuperar Senha</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {sent
                ? "Verifique o seu email para redefinir a senha."
                : "Insira o seu email para receber o link de recuperação."}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="font-body text-sm text-muted-foreground">Email</Label>
                <Input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dombistro.pt" required
                  className="mt-1 bg-secondary border-border text-foreground"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-body font-semibold py-5">
                {loading ? "A enviar..." : "Enviar Link de Recuperação"}
              </Button>
            </form>
          ) : (
            <Button onClick={() => setSent(false)} variant="outline" className="w-full font-body py-5">
              Reenviar Email
            </Button>
          )}

          <Link to="/admin/login" className="mt-6 flex items-center justify-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
