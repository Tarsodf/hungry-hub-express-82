const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESTAURANT_ADDRESS = "Alam São Damasco - S. Francisco, Centro 35, 4810-286 Guimarães, Portugal";

const DELIVERY_ZONES = [
  { maxKm: 3, fee: 2 },
  { maxKm: 5, fee: 3 },
  { maxKm: 8, fee: 4 },
  { maxKm: Infinity, fee: null },
] as const;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getDeliveryQuote(distanceKm: number) {
  const zone = DELIVERY_ZONES.find((z) => distanceKm <= z.maxKm) ?? DELIVERY_ZONES[DELIVERY_ZONES.length - 1];
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    fee: zone.fee,
    consultRequired: zone.fee === null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const address = (body?.address ?? "").trim();
    const postalCode = (body?.postalCode ?? "").trim();

    if (!address && !postalCode) {
      return jsonResponse({ error: "Informe uma morada ou código postal." }, 400);
    }

    // Build destination string combining address and postal code
    const destinationParts: string[] = [];
    if (address) destinationParts.push(address);
    if (postalCode) destinationParts.push(postalCode);
    destinationParts.push("Portugal");
    const destination = destinationParts.join(", ");

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY not configured");
      return jsonResponse({ error: "Serviço de entrega indisponível." }, 500);
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(RESTAURANT_ADDRESS)}&destinations=${encodeURIComponent(destination)}&mode=driving&language=pt-PT&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error("Google API error:", response.status, text);
      return jsonResponse({ error: "Erro ao calcular a distância." }, 500);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google API status:", data.status, data.error_message);
      return jsonResponse({ error: "Erro ao calcular a distância." }, 500);
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      const elementStatus = element?.status ?? "UNKNOWN";
      console.error("Element status:", elementStatus);
      return jsonResponse({
        error: "Não foi possível encontrar a morada. Verifique o endereço e tente novamente.",
      }, 400);
    }

    const distanceMeters = element.distance?.value;
    if (typeof distanceMeters !== "number") {
      return jsonResponse({ error: "Não foi possível calcular a distância." }, 500);
    }

    const distanceKm = distanceMeters / 1000;
    const quote = getDeliveryQuote(distanceKm);

    return jsonResponse({
      ...quote,
      matchedAddress: data.destination_addresses?.[0] ?? destination,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("calculate-delivery error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
