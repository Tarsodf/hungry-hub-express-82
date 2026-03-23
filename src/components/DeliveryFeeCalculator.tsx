import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, Check } from "lucide-react";

// Restaurant coordinates: Alam São Damasco - S. Francisco, 4810-286 Guimarães
const RESTAURANT_LAT = 41.4425;
const RESTAURANT_LNG = -8.2918;

export interface DeliveryZone {
  maxKm: number;
  fee: number;
  label: string;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { maxKm: 3, fee: 1.50, label: "Até 3 km" },
  { maxKm: 5, fee: 2.50, label: "3–5 km" },
  { maxKm: 8, fee: 3.50, label: "5–8 km" },
  { maxKm: 12, fee: 5.00, label: "8–12 km" },
  { maxKm: Infinity, fee: -1, label: "12+ km" },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getDeliveryFee(distanceKm: number): number {
  const zone = DELIVERY_ZONES.find((z) => distanceKm <= z.maxKm);
  return zone?.fee ?? -1;
}

export function isConsultZone(distanceKm: number): boolean {
  return getDeliveryFee(distanceKm) < 0;
}

export function getZoneLabel(distanceKm: number): string {
  const zone = DELIVERY_ZONES.find((z) => distanceKm <= z.maxKm);
  return zone?.label ?? DELIVERY_ZONES[DELIVERY_ZONES.length - 1].label;
}

interface Props {
  onFeeCalculated: (fee: number, distance: number) => void;
  currentFee: number | null;
  currentDistance: number | null;
}

const DeliveryFeeCalculator = ({ onFeeCalculated, currentFee, currentDistance }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = haversineDistance(
          RESTAURANT_LAT,
          RESTAURANT_LNG,
          position.coords.latitude,
          position.coords.longitude
        );
        const fee = getDeliveryFee(dist);
        if (fee < 0) {
          setError("Distância acima de 12 km. Por favor, consulte o estabelecimento para combinar a entrega.");
          setLoading(false);
          return;
        }
        onFeeCalculated(fee, dist);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Permissão de localização negada. Ative nas configurações do navegador.");
        } else {
          setError("Não foi possível obter a localização. Tente novamente.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-body text-sm text-muted-foreground">Taxa de entrega por localização</span>
      </div>

      {currentDistance !== null && currentFee !== null ? (
        <div className="bg-primary/10 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="font-body text-sm font-semibold text-foreground">
              Localização detectada
            </span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            📍 Distância: {currentDistance.toFixed(1)} km ({getZoneLabel(currentDistance)})
          </p>
          <p className="font-body text-sm font-bold text-primary">
            Taxa de entrega: €{currentFee.toFixed(2)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground mt-1 h-auto p-0"
            onClick={handleLocate}
            disabled={loading}
          >
            <Navigation className="h-3 w-3 mr-1" />
            Recalcular
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full border-border text-foreground font-body"
          onClick={handleLocate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Localizando...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Usar minha localização
            </>
          )}
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Zone reference table */}
      <details className="text-xs">
        <summary className="font-body text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          Ver tabela de taxas
        </summary>
        <div className="mt-2 bg-secondary rounded-lg p-3 space-y-1">
          {DELIVERY_ZONES.map((z) => (
            <div key={z.label} className="flex justify-between font-body text-muted-foreground">
              <span>{z.label}</span>
              <span className="font-semibold">{z.fee < 0 ? "Consultar" : `€${z.fee.toFixed(2)}`}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default DeliveryFeeCalculator;
