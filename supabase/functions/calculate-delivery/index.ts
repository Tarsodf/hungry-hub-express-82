import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESTAURANT_COORDINATES = {
  lat: 41.441352,
  lng: -8.293173,
};

const DELIVERY_ZONES = [
  { maxKm: 3, fee: 1.5, label: "Até 3 km" },
  { maxKm: 5, fee: 2.5, label: "3–5 km" },
  { maxKm: 8, fee: 3.5, label: "5–8 km" },
  { maxKm: 12, fee: 5, label: "8–12 km" },
  { maxKm: Number.POSITIVE_INFINITY, fee: null, label: "12+ km" },
] as const;

const requestSchema = z
  .object({
    address: z.string().trim().max(200).optional().default(""),
    postalCode: z.string().trim().max(8).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (!data.address && !data.postalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Informe uma morada ou código postal.",
      });
    }

    if (data.postalCode && !/^\d{4}-?\d{3}$/.test(data.postalCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postalCode"],
        message: "Código postal inválido. Use o formato 4810-647.",
      });
    }
  });

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSearchQuery(address: string, postalCode: string) {
  const normalizedPostalCode = postalCode.replace(/(\d{4})(\d{3})/, "$1-$2");
  return [address, normalizedPostalCode, "Guimarães", "Portugal"]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

async function geocodeAddress(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "pt");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "pt-PT,pt;q=0.9",
      "User-Agent": "Dom Bistro Grill Delivery Calculator/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao localizar morada [${response.status}]`);
  }

  const results = await response.json();
  const match = Array.isArray(results) ? results[0] : null;

  if (!match?.lat || !match?.lon) {
    throw new Error("Não foi possível localizar a morada informada. Tente adicionar mais detalhes ou o código postal.");
  }

  return {
    lat: Number(match.lat),
    lng: Number(match.lon),
    label: typeof match.display_name === "string" ? match.display_name : query,
  };
}

async function getRouteDistanceKm(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`,
  );
  url.searchParams.set("overview", "false");
  url.searchParams.set("alternatives", "false");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Falha ao calcular rota [${response.status}]`);
  }

  const data = await response.json();
  const route = Array.isArray(data?.routes) ? data.routes[0] : null;

  if (!route || typeof route.distance !== "number") {
    throw new Error("Não foi possível calcular a distância até esta morada.");
  }

  return route.distance / 1000;
}

function getDeliveryQuote(distanceKm: number) {
  const zone = DELIVERY_ZONES.find((item) => distanceKm <= item.maxKm) ?? DELIVERY_ZONES[DELIVERY_ZONES.length - 1];

  return {
    distanceKm,
    fee: zone.fee,
    label: zone.label,
    consultRequired: zone.fee === null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, 400);
    }

    const searchQuery = buildSearchQuery(parsed.data.address, parsed.data.postalCode);
    const customerCoordinates = await geocodeAddress(searchQuery);
    const distanceKm = await getRouteDistanceKm(RESTAURANT_COORDINATES, customerCoordinates);
    const quote = getDeliveryQuote(distanceKm);

    return jsonResponse({
      ...quote,
      matchedAddress: customerCoordinates.label,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao calcular a entrega.";
    console.error("calculate-delivery error", message);
    return jsonResponse({ error: message }, 500);
  }
});
