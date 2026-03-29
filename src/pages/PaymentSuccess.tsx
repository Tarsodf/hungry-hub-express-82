import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "paid" | "failed">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { session_id: sessionId },
        });

        if (error || data?.error) {
          setStatus("failed");
          return;
        }

        if (data?.status === "paid") {
          setStatus("paid");
          setOrderId(data.order_id);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };

    verify();
  }, [sessionId]);

  if (status === "loading") {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <Loader2 className="mb-4 mx-auto h-16 w-16 text-primary animate-spin" />
          <h1 className="font-display text-2xl font-bold text-foreground">A verificar pagamento...</h1>
          <p className="mt-2 font-body text-muted-foreground">
            Aguarde enquanto confirmamos o seu pagamento.
          </p>
        </div>
      </main>
    );
  }

  if (status === "failed") {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <XCircle className="mb-4 mx-auto h-16 w-16 text-destructive" />
          <h1 className="font-display text-2xl font-bold text-foreground">Pagamento não confirmado</h1>
          <p className="mt-2 font-body text-muted-foreground">
            Não foi possível confirmar o pagamento. Se foi cobrado, entre em contacto connosco.
          </p>
          <Link to="/carrinho" className="mt-6 inline-block">
            <Button className="bg-primary text-primary-foreground font-body">Voltar ao Carrinho</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
      <div className="glass rounded-2xl p-12 text-center max-w-md">
        <CheckCircle className="mb-4 mx-auto h-16 w-16 text-green-500" />
        <h1 className="font-display text-2xl font-bold text-foreground">Pagamento Confirmado!</h1>
        <p className="mt-2 font-body text-muted-foreground">
          O seu pedido foi recebido e o pagamento foi processado com sucesso.
        </p>
        {orderId && (
          <p className="mt-2 font-body text-xs text-muted-foreground">
            Referência: {orderId.slice(0, 8).toUpperCase()}
          </p>
        )}
        <p className="mt-4 font-body text-sm text-muted-foreground">
          Receberá uma confirmação pelo WhatsApp em breve.
        </p>
        <Link to="/cardapio" className="mt-6 inline-block">
          <Button className="bg-primary text-primary-foreground font-body">Voltar ao Cardápio</Button>
        </Link>
      </div>
    </main>
  );
};

export default PaymentSuccess;
