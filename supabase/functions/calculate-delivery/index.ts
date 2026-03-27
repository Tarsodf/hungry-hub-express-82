const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESTAURANTE = "Alam São Damasco - S. Francisco, Centro 35, 4810-286 Guimarães, Portugal";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getDeliveryQuote(distanceKm: number) {
  const roundedDistance = Math.round(distanceKm * 10) / 10;

  if (distanceKm <= 3) {
    return { distanceKm: roundedDistance, fee: 3.5, consultRequired: false };
  }

  if (distanceKm <= 5) {
    return { distanceKm: roundedDistance, fee: roundedDistance, consultRequired: false };
  }

  return { distanceKm: roundedDistance, fee: null, consultRequired: true };
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

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY not configured");
      return jsonResponse({ error: "Serviço de entrega indisponível." }, 500);
    }

    // Build destination text
    const destParts: string[] = [];
    if (address) destParts.push(address);
    if (postalCode) destParts.push(postalCode);
    destParts.push("Portugal");
    const destination = destParts.join(", ");

    // Google Distance Matrix API - driving mode
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(RESTAURANTE)}&destinations=${encodeURIComponent(destination)}&mode=driving&language=pt&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error("Google Distance Matrix error:", response.status, text);
      return jsonResponse({ error: "Erro ao calcular a distância." }, 500);
    }

    const data = await response.json();
    console.log("Distance Matrix response:", JSON.stringify(data));

    if (data.status !== "OK") {
      console.error("Distance Matrix status:", data.status, data.error_message);
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

    const distanceMeters = element.distance.value;
    const distanceKm = distanceMeters / 1000;
    const matchedAddress = data.destination_addresses?.[0] ?? destination;
    const quote = getDeliveryQuote(distanceKm);

    return jsonResponse({
      ...quote,
      matchedAddress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("calculate-delivery error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
