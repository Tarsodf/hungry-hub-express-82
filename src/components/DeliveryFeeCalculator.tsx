import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2, Calculator, Check, CircleAlert } from "lucide-react";

export interface DeliveryZone {
  maxKm: number;
  fee: number | null;
  label: string;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { maxKm: 3, fee: 1.5, label: "Até 3 km" },
  { maxKm: 5, fee: 2.5, label: "3–5 km" },
  { maxKm: 8, fee: 3.5, label: "5–8 km" },
  { maxKm: 12, fee: 5, label: "8–12 km" },
  { maxKm: Infinity, fee: null, label: "12+ km" },
];

interface Props {
  address: string;
  postalCode: string;
  onFeeCalculated: (fee: number, distance: number) => void;
  onConsultRequired: (distance: number) => void;
  currentFee: number | null;
  currentDistance: number | null;
}

const DeliveryFeeCalculator = ({
  address,
  postalCode,
  onFeeCalculated,
  onConsultRequired,
  currentFee,
  currentDistance,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consultDistance, setConsultDistance] = useState<number | null>(null);

  useEffect(() => {
    setError(null);
    setConsultDistance(null);
  }, [address, postalCode]);

  const handleCalculate = async () => {
    if (!address.trim() && !postalCode.trim()) {
      setError("Informe uma morada ou código postal para calcular a entrega.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("calculate-delivery", {
        body: {
          address: address.trim(),
          postalCode: postalCode.trim(),
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || "Erro ao calcular a taxa de entrega.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const distance = Number(data?.distanceKm);
      if (!Number.isFinite(distance)) {
        throw new Error("Não foi possível calcular a distância.");
      }

      if (data?.consultRequired) {
        setConsultDistance(distance);
        onConsultRequired(distance);
        return;
      }

      const fee = Number(data?.fee);
      if (!Number.isFinite(fee)) {
        throw new Error("Não foi possível calcular a taxa de entrega.");
      }

      setConsultDistance(null);
      onFeeCalculated(fee, distance);
    } catch (err) {
      setConsultDistance(null);
      setError(err instanceof Error ? err.message : "Erro ao calcular a taxa de entrega.");
    } finally {
      setLoading(false);
    }
  };

  const hasQuotedResult = currentDistance !== null && currentFee !== null;
  const hasConsultResult = consultDistance !== null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-body text-sm text-muted-foreground">Taxa de entrega por morada ou código postal</span>
      </div>

      {hasQuotedResult ? (
        <div className="rounded-lg bg-primary/10 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="font-body text-sm font-semibold text-foreground">Entrega calculada</span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            📍 Distância por estrada: {currentDistance.toFixed(1)} km
          </p>
          <p className="font-body text-sm font-bold text-primary">Taxa de entrega: €{currentFee.toFixed(2)}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-auto p-0 text-xs text-muted-foreground"
            onClick={handleCalculate}
            disabled={loading}
          >
            <Calculator className="mr-1 h-3 w-3" />
            Recalcular
          </Button>
        </div>
      ) : hasConsultResult ? (
        <div className="rounded-lg bg-secondary p-3 space-y-1">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-foreground" />
            <span className="font-body text-sm font-semibold text-foreground">Consultar estabelecimento</span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            📍 Distância por estrada: {consultDistance.toFixed(1)} km
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Para entregas acima de 12 km, confirme a disponibilidade diretamente com o restaurante.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-auto p-0 text-xs text-muted-foreground"
            onClick={handleCalculate}
            disabled={loading}
          >
            <Calculator className="mr-1 h-3 w-3" />
            Recalcular
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full border-border font-body text-foreground"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular taxa de entrega
            </>
          )}
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <details className="text-xs">
        <summary className="cursor-pointer font-body text-muted-foreground transition-colors hover:text-foreground">
          Ver tabela de taxas
        </summary>
        <div className="mt-2 rounded-lg bg-secondary p-3 space-y-1">
          {DELIVERY_ZONES.map((zone) => (
            <div key={zone.label} className="flex justify-between font-body text-muted-foreground">
              <span>{zone.label}</span>
              <span className="font-semibold">
                {zone.fee === null ? "Consultar estabelecimento" : `€${zone.fee.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default DeliveryFeeCalculator;
