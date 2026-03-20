import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate("/admin/login");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar a senha");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-body text-sm text-muted-foreground">A verificar o link de recuperação...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="glass rounded-2xl p-8 border-border">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Nova Senha</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Defina a sua nova senha de acesso.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="font-body text-sm text-muted-foreground">Nova Senha</Label>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="mt-1 bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="font-body text-sm text-muted-foreground">Confirmar Senha</Label>
              <Input
                id="confirmPassword" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="mt-1 bg-secondary border-border text-foreground"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-body font-semibold py-5">
              {loading ? "A guardar..." : "Guardar Nova Senha"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
