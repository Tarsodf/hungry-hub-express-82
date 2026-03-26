import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

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
