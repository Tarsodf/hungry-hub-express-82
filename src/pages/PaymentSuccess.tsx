import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "failed">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;
    let attempts = 0;

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { session_id: sessionId },
        });

        if (cancelled) return;

        if (error || data?.error) {
          setStatus("failed");
          return;
        }

        if (data?.order_id) {
          setOrderId(data.order_id);
        }

        if (data?.status === "paid") {
          setStatus("paid");
          return;
        }

        if (data?.status === "pending" || data?.status === "processing") {
          setStatus("pending");
          if (attempts < 12) {
            attempts += 1;
            timeoutId = window.setTimeout(verify, 5000);
          }
          return;
        }

        if (data?.status === "expired" || data?.status === "failed") {
          setStatus("failed");
          return;
        }

        setStatus("pending");
      } catch {
        setStatus("failed");
      }
    };

    verify();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
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

  if (status === "pending") {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <Loader2 className="mb-4 mx-auto h-16 w-16 text-primary animate-spin" />
          <h1 className="font-display text-2xl font-bold text-foreground">Pagamento em validação</h1>
          <p className="mt-2 font-body text-muted-foreground">
            O pedido só será confirmado após validação da instituição bancária.
          </p>
          {orderId && (
            <p className="mt-2 font-body text-xs text-muted-foreground">
              Referência: {orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <Button className="bg-primary text-primary-foreground font-body" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar novamente
            </Button>
            <Link to="/cardapio" className="inline-block">
              <Button variant="outline" className="font-body">Voltar ao Cardápio</Button>
            </Link>
          </div>
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
