import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, ArrowLeft } from "lucide-react";

const ALLOWED_ADMIN_EMAIL = "tarso-souza@hotmail.com";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (email.toLowerCase().trim() !== ALLOWED_ADMIN_EMAIL) {
        throw new Error("Acesso negado. Email não autorizado.");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não encontrado");

      const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!roleData) {
        await supabase.auth.signOut();
        throw new Error("Acesso negado. Apenas administradores podem aceder.");
      }

      toast.success("Login efetuado com sucesso!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
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
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Acesso Restrito</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Dom Bistro Grill — Guimarães</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-body text-sm text-muted-foreground">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dombistro.pt" required
                className="mt-1 bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-body text-sm text-muted-foreground">Senha de Acesso</Label>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="mt-1 bg-secondary border-border text-foreground"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-body font-semibold py-5">
              {loading ? "A entrar..." : "Entrar no Sistema"}
            </Button>
          </form>

          <Link to="/admin/forgot-password" className="mt-4 flex items-center justify-center font-body text-sm text-muted-foreground hover:text-primary transition-colors">
            Esqueci a minha senha
          </Link>

          <Link to="/" className="mt-3 flex items-center justify-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Cardápio
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
