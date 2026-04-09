import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 md:p-5 shadow-lg animate-fade-in">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <p className="font-body text-xs md:text-sm text-muted-foreground flex-1">
          🍪 Utilizamos cookies para melhorar a sua experiência. Ao continuar, concorda com a nossa{" "}
          <Link to="/privacidade" className="text-primary underline underline-offset-2 hover:text-primary/80">
            Política de Privacidade
          </Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={reject} className="text-xs">
            Rejeitar
          </Button>
          <Button size="sm" onClick={accept} className="text-xs">
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
