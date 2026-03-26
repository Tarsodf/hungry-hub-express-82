const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Coordenadas do restaurante [longitude, latitude]
const RESTAURANTE = [-8.289, 41.443];

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

    const apiKey = Deno.env.get("OPENROUTESERVICE_API_KEY");
    if (!apiKey) {
      console.error("OPENROUTESERVICE_API_KEY not configured");
      return jsonResponse({ error: "Serviço de entrega indisponível." }, 500);
    }

    // Build search text
    const searchParts: string[] = [];
    if (address) searchParts.push(address);
    if (postalCode) searchParts.push(postalCode);
    searchParts.push("Portugal");
    const searchText = searchParts.join(", ");

    // Step 1: Geocode the client address (Authorization header)
    const geoUrl = `https://api.openrouteservice.org/geocode/search?text=${encodeURIComponent(searchText)}&boundary.country=PT&size=1`;
    const geoResponse = await fetch(geoUrl, {
      headers: { "Authorization": apiKey },
    });

    if (!geoResponse.ok) {
      const text = await geoResponse.text();
      console.error("Geocoding error:", geoResponse.status, text);
      return jsonResponse({ error: "Erro ao encontrar a morada." }, 500);
    }

    const geoData = await geoResponse.json();
    const features = geoData?.features;

    if (!features || features.length === 0) {
      return jsonResponse({
        error: "Não foi possível encontrar a morada. Verifique o endereço e tente novamente.",
      }, 400);
    }

    const destino = features[0].geometry.coordinates; // [lon, lat]
    const matchedAddress = features[0].properties?.label ?? searchText;

    // Step 2: Calculate driving route (geojson endpoint)
    const routeResponse = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [RESTAURANTE, destino],
      }),
    });

    if (!routeResponse.ok) {
      const text = await routeResponse.text();
      console.error("Route error:", routeResponse.status, text);
      return jsonResponse({ error: "Erro ao calcular a distância." }, 500);
    }

    const routeData = await routeResponse.json();
    const distanceMeters = routeData?.features?.[0]?.properties?.summary?.distance;

    if (typeof distanceMeters !== "number") {
      console.error("No distance in route response:", JSON.stringify(routeData));
      return jsonResponse({ error: "Não foi possível calcular a distância." }, 500);
    }

    const distanceKm = distanceMeters / 1000;
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
