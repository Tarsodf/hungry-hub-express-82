import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESTAURANT_COORDINATES = { lat: 41.441352, lng: -8.293173 };

const DELIVERY_ZONES = [
  { maxKm: 3, fee: 1.5 },
  { maxKm: 5, fee: 2.5 },
  { maxKm: 8, fee: 3.5 },
  { maxKm: 12, fee: 5 },
  { maxKm: Number.POSITIVE_INFINITY, fee: null },
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
  });

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const NOMINATIM_HEADERS = {
  "Accept-Language": "pt-PT,pt;q=0.9",
  "User-Agent": "DomBistroGrill/1.0 (delivery-calculator)",
};

async function nominatimSearch(params: Record<string, string>): Promise<{ lat: number; lng: number; label: string } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "pt");
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;

  const results = await res.json();
  const match = Array.isArray(results) ? results[0] : null;
  if (!match?.lat || !match?.lon) return null;

  return { lat: Number(match.lat), lng: Number(match.lon), label: match.display_name ?? "" };
}

async function geocode(address: string, postalCode: string): Promise<{ lat: number; lng: number; label: string }> {
  const normalizedPostal = postalCode.replace(/(\d{4})(\d{3})/, "$1-$2");

  // Strategy 1: structured search with street + postal code + city
  if (address && normalizedPostal) {
    const result = await nominatimSearch({
      street: address,
      postalcode: normalizedPostal,
      city: "Guimarães",
      country: "Portugal",
    });
    if (result) return result;
  }

  // Strategy 2: structured search with just street + city
  if (address) {
    const result = await nominatimSearch({
      street: address,
      city: "Guimarães",
      country: "Portugal",
    });
    if (result) return result;
  }

  // Strategy 3: free-text search with full query
  {
    const parts = [address, normalizedPostal, "Guimarães, Portugal"].filter(Boolean);
    const result = await nominatimSearch({ q: parts.join(", ") });
    if (result) return result;
  }

  // Strategy 4: free-text with just postal code + city
  if (normalizedPostal) {
    const result = await nominatimSearch({ q: `${normalizedPostal}, Guimarães, Portugal` });
    if (result) return result;
  }

  // Strategy 5: free-text with just address + city (no number)
  if (address) {
    const streetOnly = address.replace(/\d+.*$/, "").trim();
    if (streetOnly && streetOnly !== address) {
      const result = await nominatimSearch({ q: `${streetOnly}, Guimarães, Portugal` });
      if (result) return result;
    }
  }

  throw new Error(
    "Não foi possível localizar a morada. Verifique o endereço e/ou código postal e tente novamente."
  );
}

async function getRouteDistanceKm(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false&alternatives=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao calcular rota [${res.status}]`);

  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route?.distance) throw new Error("Não foi possível calcular a distância.");

  return route.distance / 1000;
}

function getDeliveryQuote(distanceKm: number) {
  const zone = DELIVERY_ZONES.find((z) => distanceKm <= z.maxKm) ?? DELIVERY_ZONES[DELIVERY_ZONES.length - 1];
  return {
    distanceKm,
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
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, 400);
    }

    const coords = await geocode(parsed.data.address, parsed.data.postalCode);
    const distanceKm = await getRouteDistanceKm(RESTAURANT_COORDINATES, coords);
    const quote = getDeliveryQuote(distanceKm);

    return jsonResponse({ ...quote, matchedAddress: coords.label });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("calculate-delivery error", message);
    return jsonResponse({ error: message }, 500);
  }
});
