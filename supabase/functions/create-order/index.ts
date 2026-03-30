import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  customization?: {
    removed?: string[];
    addons?: { name: string; price: number }[];
    meatPoint?: string;
  };
}

interface OrderInput {
  customer_name: string;
  customer_phone: string;
  delivery_mode: "delivery" | "pickup";
  address?: string;
  notes?: string;
  delivery_fee: number;
  payment_method?: string;
  items: OrderItemInput[];
}

function validateInput(body: unknown): { valid: true; data: OrderInput } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Corpo inválido" };
  const b = body as Record<string, unknown>;

  const name = typeof b.customer_name === "string" ? b.customer_name.trim() : "";
  if (!name || name.length > 100) return { valid: false, error: "Nome inválido (1-100 caracteres)" };

  const phone = typeof b.customer_phone === "string" ? b.customer_phone.trim() : "";
  if (!phone || !/^\+?[0-9\s]{7,20}$/.test(phone)) return { valid: false, error: "Telefone inválido" };

  const delivery_mode = b.delivery_mode;
  if (delivery_mode !== "delivery" && delivery_mode !== "pickup") return { valid: false, error: "Modo de entrega inválido" };

  const address = typeof b.address === "string" ? b.address.trim().slice(0, 200) : "";
  if (delivery_mode === "delivery" && !address) return { valid: false, error: "Endereço obrigatório para entrega" };

  const notes = typeof b.notes === "string" ? b.notes.trim().slice(0, 500) : "";
  const rawDeliveryFee = Number(b.delivery_fee ?? 0);

  if (!Number.isFinite(rawDeliveryFee) || rawDeliveryFee < 0 || rawDeliveryFee > 999) {
    return { valid: false, error: "Taxa de entrega inválida" };
  }

  const delivery_fee = delivery_mode === "delivery" ? rawDeliveryFee : 0;

  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 50) {
    return { valid: false, error: "Itens inválidos (1-50)" };
  }

  const items: OrderItemInput[] = [];
  for (const raw of b.items) {
    if (!raw || typeof raw !== "object") return { valid: false, error: "Item inválido" };
    const it = raw as Record<string, unknown>;
    if (typeof it.menu_item_id !== "string") return { valid: false, error: "ID de item inválido" };
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return { valid: false, error: "Quantidade inválida (1-99)" };
    // Validate customization fields
    const cust = (it.customization && typeof it.customization === "object") ? it.customization as Record<string, unknown> : {};
    const removed = Array.isArray(cust.removed) ? cust.removed : [];
    if (removed.length > 20) return { valid: false, error: "Demasiados ingredientes a remover" };
    for (const r of removed) {
      if (typeof r !== "string" || r.length > 100) return { valid: false, error: "Ingrediente inválido" };
    }
    const allowedMeatPoints = ["Mal passado", "Ao ponto", "Bem passado"];
    const meatPoint = typeof cust.meatPoint === "string" ? cust.meatPoint : undefined;
    if (meatPoint && !allowedMeatPoints.includes(meatPoint)) {
      return { valid: false, error: "Ponto de carne inválido" };
    }
    const addons = Array.isArray(cust.addons) ? cust.addons : [];
    if (addons.length > 20) return { valid: false, error: "Demasiados adicionais" };
    for (const a of addons) {
      if (!a || typeof a !== "object" || typeof (a as Record<string,unknown>).name !== "string") {
        return { valid: false, error: "Adicional inválido" };
      }
    }

    items.push({
      menu_item_id: it.menu_item_id,
      quantity: qty,
      customization: {
        removed: removed as string[],
        addons: addons as { name: string; price: number }[],
        meatPoint,
      },
    });
  }

  const paymentMethod = typeof b.payment_method === "string" ? b.payment_method : "cash";

  return {
    valid: true,
    data: { customer_name: name, customer_phone: phone, delivery_mode, address, notes, delivery_fee, payment_method: paymentMethod, items },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: input } = validation;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limiting
    const windowStart = new Date(Date.now() - 60_000).toISOString();

    // Per-IP rate limit: max 3 orders per minute per client
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    const { count: ipCount } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", windowStart)
      .eq("customer_ip", clientIp);

    if ((ipCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Muitos pedidos em pouco tempo. Tente novamente em 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Global rate limit: max 60 orders per minute (realistic peak traffic)
    const { count: globalCount } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", windowStart);

    if ((globalCount ?? 0) >= 60) {
      return new Response(
        JSON.stringify({ error: "Sistema sobrecarregado. Tente novamente em instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch authoritative prices from DB
    const menuItemIds = [...new Set(input.items.map((i) => i.menu_item_id))];
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, price, is_active, category_id")
      .in("id", menuItemIds);

    if (menuError) throw menuError;

    const menuMap = new Map(menuItems?.map((m) => [m.id, m]) || []);

    // Verify all items exist and are active
    for (const item of input.items) {
      const menuItem = menuMap.get(item.menu_item_id);
      if (!menuItem || !menuItem.is_active) {
        return new Response(
          JSON.stringify({ error: `Item não disponível: ${item.menu_item_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Fetch addon prices from DB for validation
    const allAddonNames: string[] = [];
    for (const item of input.items) {
      if (item.customization?.addons) {
        for (const addon of item.customization.addons) {
          allAddonNames.push(addon.name);
        }
      }
    }

    let addonMap = new Map<string, number>();
    if (allAddonNames.length > 0) {
      const { data: addons } = await supabaseAdmin
        .from("menu_addons")
        .select("name, price, is_active")
        .in("name", [...new Set(allAddonNames)])
        .eq("is_active", true);

      addonMap = new Map((addons || []).map((a) => [a.name, a.price]));
    }

    // Calculate total server-side
    const SERVICE_FEE = 0.90;
    let subtotal = 0;

    const orderItemsData: {
      name: string;
      menu_item_id: string;
      price: number;
      quantity: number;
      customization: Record<string, unknown>;
    }[] = [];

    for (const item of input.items) {
      const menuItem = menuMap.get(item.menu_item_id)!;
      let itemPrice = Number(menuItem.price);

      // Validate and recalculate addon prices from DB
      const validatedAddons: { name: string; price: number }[] = [];
      if (item.customization?.addons) {
        for (const addon of item.customization.addons) {
          const dbPrice = addonMap.get(addon.name);
          if (dbPrice === undefined) {
            return new Response(
              JSON.stringify({ error: `Adicional não encontrado: ${addon.name}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          validatedAddons.push({ name: addon.name, price: dbPrice });
          itemPrice += dbPrice;
        }
      }

      subtotal += itemPrice * item.quantity;

      orderItemsData.push({
        name: menuItem.name,
        menu_item_id: item.menu_item_id,
        price: itemPrice,
        quantity: item.quantity,
        customization: {
          removed: item.customization?.removed || [],
          addons: validatedAddons,
          meatPoint: item.customization?.meatPoint || null,
        },
      });
    }

    const total = subtotal + SERVICE_FEE + input.delivery_fee;

    // Create order using service role (bypasses RLS)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: "",
        delivery_mode: input.delivery_mode,
        address: input.address || "",
        notes: input.notes || "",
        total,
        service_fee: SERVICE_FEE,
        delivery_fee: input.delivery_fee,
        status: input.payment_method === "mbway" ? "pending_confirmation" : "received",
        stripe_payment_id: "",
        customer_ip: clientIp,
        payment_method: input.payment_method || "cash",
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsData.map((oi) => ({ ...oi, order_id: order.id })));

    if (itemsError) throw itemsError;

    return new Response(
      JSON.stringify({ order_id: order.id, total }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-order error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno ao criar pedido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
