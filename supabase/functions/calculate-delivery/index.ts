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

type NominatimMatch = {
  lat: number;
  lng: number;
  label: string;
  address: Record<string, string | undefined>;
};

const STREET_STOP_WORDS = new Set([
  "a",
  "ao",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "n",
  "no",
  "na",
  "numero",
  "número",
  "rua",
  "avenida",
  "av",
  "travessa",
  "alameda",
  "largo",
  "praça",
  "praca",
]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(r|r\.)\b/g, "rua")
    .replace(/\b(av|av\.)\b/g, "avenida")
    .replace(/\b(alam|alam\.)\b/g, "alameda")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePostalCode(postalCode: string) {
  const digits = postalCode.replace(/\D/g, "");
  return digits.length === 7 ? digits.replace(/(\d{4})(\d{3})/, "$1-$2") : postalCode.trim();
}

function extractPostalCode(value: string) {
  const match = value.match(/\b\d{4}-\d{3}\b/);
  return match ? match[0] : "";
}

function extractStreetFragment(address: string) {
  const firstSegment = address.split(",")[0]?.trim() ?? address.trim();
  const withoutTrailingNumber = firstSegment.replace(/\b\d+[a-zA-Z/-]*\b.*$/, "").trim();
  return withoutTrailingNumber || firstSegment;
}

function extractHouseNumber(address: string) {
  const match = address.match(/\b(\d+[a-zA-Z/-]*)\b/);
  return match?.[1] ?? "";
}

function tokenizeStreet(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STREET_STOP_WORDS.has(token));
}

function getCandidateCity(address: Record<string, string | undefined>) {
  return address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? "";
}

function getCandidateStreet(address: Record<string, string | undefined>, label: string) {
  return [
    address.road,
    address.pedestrian,
    address.footway,
    address.neighbourhood,
    address.suburb,
    label,
  ]
    .filter(Boolean)
    .join(" ");
}

function getStreetOverlap(address: string, candidate: NominatimMatch) {
  const inputTokens = tokenizeStreet(extractStreetFragment(address));
  if (!inputTokens.length) return 0;

  const candidateTokens = new Set(tokenizeStreet(getCandidateStreet(candidate.address, candidate.label)));
  if (!candidateTokens.size) return 0;

  const matchingTokens = inputTokens.filter((token) => candidateTokens.has(token)).length;
  return matchingTokens / inputTokens.length;
}

function scoreCandidate(candidate: NominatimMatch, address: string, postalCode: string) {
  const normalizedPostal = normalizePostalCode(postalCode);
  const postalPrefix = normalizedPostal.slice(0, 4);
  const candidatePostal = normalizePostalCode(candidate.address.postcode ?? extractPostalCode(candidate.label));
  const streetOverlap = getStreetOverlap(address, candidate);
  const normalizedCity = normalizeText(getCandidateCity(candidate.address));
  const houseNumber = normalizeText(extractHouseNumber(address));
  const candidateHouseNumber = normalizeText(candidate.address.house_number ?? "");

  let score = 0;

  if (normalizedPostal) {
    if (candidatePostal === normalizedPostal) score += 220;
    else if (postalPrefix && candidatePostal.startsWith(postalPrefix)) score += 90;
    else score -= 140;
  }

  if (address.trim()) {
    score += streetOverlap * 120;
    if (streetOverlap === 0) score -= 40;
  }

  if (houseNumber && candidateHouseNumber === houseNumber) {
    score += 20;
  }

  if (normalizedCity.includes("guimaraes")) {
    score += 15;
  }

  return {
    score,
    streetOverlap,
    candidatePostal,
    exactPostalMatch: Boolean(normalizedPostal && candidatePostal === normalizedPostal),
  };
}

async function nominatimSearch(params: Record<string, string>, limit = 5): Promise<NominatimMatch[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "pt");
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!res.ok) return [];

  const results = await res.json();
  if (!Array.isArray(results)) return [];

  return results
    .filter((match) => match?.lat && match?.lon)
    .map((match) => ({
      lat: Number(match.lat),
      lng: Number(match.lon),
      label: match.display_name ?? "",
      address: typeof match.address === "object" && match.address ? match.address : {},
    }));
}

async function geocode(address: string, postalCode: string): Promise<{ lat: number; lng: number; label: string }> {
  const normalizedAddress = address.trim();
  const normalizedPostal = normalizePostalCode(postalCode);
  const streetFragment = extractStreetFragment(normalizedAddress);

  const searchStrategies = [
    normalizedAddress && normalizedPostal ? { q: `${normalizedAddress}, ${normalizedPostal}, Portugal` } : null,
    normalizedAddress && normalizedPostal
      ? { street: normalizedAddress, postalcode: normalizedPostal, country: "Portugal" }
      : null,
    normalizedPostal ? { q: `${normalizedPostal}, Portugal` } : null,
    normalizedAddress ? { q: `${normalizedAddress}, Portugal` } : null,
    streetFragment && streetFragment !== normalizedAddress ? { q: `${streetFragment}, Portugal` } : null,
    normalizedAddress ? { q: `${normalizedAddress}, Guimarães, Portugal` } : null,
    streetFragment ? { q: `${streetFragment}, Guimarães, Portugal` } : null,
  ].filter((strategy): strategy is Record<string, string> => Boolean(strategy));

  const dedupedMatches = new Map<string, NominatimMatch>();
  for (const strategy of searchStrategies) {
    const results = await nominatimSearch(strategy, 5);
    for (const result of results) {
      dedupedMatches.set(`${result.lat},${result.lng}`, result);
    }
  }

  const scoredMatches = Array.from(dedupedMatches.values())
    .map((candidate) => ({ candidate, ...scoreCandidate(candidate, normalizedAddress, normalizedPostal) }))
    .sort((a, b) => b.score - a.score);

  const bestMatch = scoredMatches[0];

  if (!bestMatch) {
    throw new Error("Não foi possível localizar a morada. Verifique o endereço e/ou código postal e tente novamente.");
  }

  if (normalizedPostal && !bestMatch.exactPostalMatch) {
    throw new Error("O código postal não corresponde à morada encontrada. Confirme os dados ou use um código postal mais exato.");
  }

  if (normalizedAddress && bestMatch.streetOverlap < 0.5) {
    throw new Error("A morada é ambígua. Adicione o código postal completo ou escreva a rua com mais detalhe.");
  }

  return bestMatch.candidate;
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
