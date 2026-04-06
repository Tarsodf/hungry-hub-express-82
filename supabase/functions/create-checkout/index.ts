import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AddonInput {
  name: string;
  price: number;
}

interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  customization?: {
    removed?: string[];
    addons?: AddonInput[];
    meatPoint?: string;
  };
}

interface CheckoutInput {
  customer_name: string;
  customer_phone: string;
  delivery_mode: "delivery" | "pickup";
  address?: string;
  notes?: string;
  delivery_fee: number;
  items: OrderItemInput[];
  payment_method?: "card" | "mbway" | "multibanco";
}

const getStripePaymentMethods = (paymentMethod: CheckoutInput["payment_method"]): Array<"card" | "mb_way" | "multibanco"> => {
  switch (paymentMethod) {
    case "mbway":
      return ["mb_way"];
    case "multibanco":
      return ["multibanco"];
    default:
      return ["card"];
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CheckoutInput = await req.json();

    // Validate input
    const name = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
    if (!name || name.length > 100) {
      return new Response(JSON.stringify({ error: "Nome inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : "";
    if (!phone || !/^\+?[0-9\s]{7,20}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.delivery_mode !== "delivery" && body.delivery_mode !== "pickup") {
      return new Response(JSON.stringify({ error: "Modo de entrega inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
      return new Response(JSON.stringify({ error: "Itens inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawDeliveryFee = Number(body.delivery_fee ?? 0);
    if (!Number.isFinite(rawDeliveryFee) || rawDeliveryFee < 0 || rawDeliveryFee > 999) {
      return new Response(JSON.stringify({ error: "Taxa de entrega inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const deliveryFee = body.delivery_mode === "delivery" ? rawDeliveryFee : 0;
    const paymentMethod = body.payment_method || "card";
    if (!["card", "mbway", "multibanco"].includes(paymentMethod)) {
      return new Response(JSON.stringify({ error: "Método de pagamento inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Rate limiting
    const windowStart = new Date(Date.now() - 60_000).toISOString();
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";

    const { count: ipCount } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", windowStart)
      .eq("customer_ip", clientIp);

    if ((ipCount ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Muitos pedidos em pouco tempo. Tente novamente em 1 minuto." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch authoritative prices from DB
    const menuItemIds = [...new Set(body.items.map((i) => i.menu_item_id))];
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, price, is_active, category_id")
      .in("id", menuItemIds);

    if (menuError) throw menuError;
    const menuMap = new Map(menuItems?.map((m) => [m.id, m]) || []);

    for (const item of body.items) {
      const menuItem = menuMap.get(item.menu_item_id);
      if (!menuItem || !menuItem.is_active) {
        return new Response(JSON.stringify({ error: `Item não disponível` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch addon prices
    const allAddonNames: string[] = [];
    for (const item of body.items) {
      if (item.customization?.addons) {
        for (const addon of item.customization.addons) {
          if (addon.name.startsWith("Bebida: ") || addon.name.startsWith("Sobremesa: ")) {
            if (addon.price === 0) continue;
          }
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
    const SERVICE_FEE = 0.9;
    let subtotal = 0;

    const orderItemsData: {
      name: string;
      menu_item_id: string;
      price: number;
      quantity: number;
      customization: Record<string, unknown>;
    }[] = [];

    const stripeLineItems: Array<{
      price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number };
      quantity: number;
    }> = [];

    for (const item of body.items) {
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return new Response(JSON.stringify({ error: "Quantidade inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const menuItem = menuMap.get(item.menu_item_id)!;
      let itemPrice = Number(menuItem.price);

      const validatedAddons: AddonInput[] = [];
      if (item.customization?.addons) {
        for (const addon of item.customization.addons) {
          if ((addon.name.startsWith("Bebida: ") || addon.name.startsWith("Sobremesa: ")) && addon.price === 0) {
            validatedAddons.push({ name: addon.name, price: 0 });
            continue;
          }
          if (addon.name.startsWith("Bebida: ") || addon.name.startsWith("Sobremesa: ")) {
            const realName = addon.name.replace(/^(Bebida|Sobremesa): /, "");
            const { data: drinkDessert } = await supabaseAdmin
              .from("menu_items")
              .select("price")
              .eq("name", realName)
              .eq("is_active", true)
              .single();
            if (drinkDessert) {
              validatedAddons.push({ name: addon.name, price: Number(drinkDessert.price) });
              itemPrice += Number(drinkDessert.price);
              continue;
            }
          }
          const dbPrice = addonMap.get(addon.name);
          if (dbPrice === undefined) {
            return new Response(JSON.stringify({ error: `Adicional não encontrado: ${addon.name}` }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          validatedAddons.push({ name: addon.name, price: dbPrice });
          itemPrice += dbPrice;
        }
      }

      subtotal += itemPrice * qty;

      orderItemsData.push({
        name: menuItem.name,
        menu_item_id: item.menu_item_id,
        price: itemPrice,
        quantity: qty,
        customization: {
          removed: item.customization?.removed || [],
          addons: validatedAddons,
          meatPoint: item.customization?.meatPoint || null,
        },
      });

      let description = "";
      if (item.customization?.removed?.length) {
        description += `Sem: ${item.customization.removed.join(", ")}. `;
      }
      if (validatedAddons.length > 0) {
        description += `Adicionais: ${validatedAddons.map((a) => a.name).join(", ")}. `;
      }
      if (item.customization?.meatPoint) {
        description += `Ponto: ${item.customization.meatPoint}. `;
      }

      stripeLineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: menuItem.name,
            ...(description ? { description: description.trim() } : {}),
          },
          unit_amount: Math.round(itemPrice * 100),
        },
        quantity: qty,
      });
    }

    const total = subtotal + SERVICE_FEE + deliveryFee;

    stripeLineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Taxa de Serviço" },
        unit_amount: Math.round(SERVICE_FEE * 100),
      },
      quantity: 1,
    });

    if (deliveryFee > 0) {
      stripeLineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Taxa de Entrega" },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: name,
        customer_phone: phone,
        customer_email: "",
        delivery_mode: body.delivery_mode,
        address: body.delivery_mode === "delivery" ? (body.address || "").trim().slice(0, 200) : "",
        notes: (body.notes || "").trim().slice(0, 500),
        total,
        service_fee: SERVICE_FEE,
        delivery_fee: deliveryFee,
        status: "pending_payment",
        stripe_payment_id: "",
        customer_ip: clientIp,
        payment_method: paymentMethod,
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsData.map((oi) => ({ ...oi, order_id: order.id })));

    if (itemsError) throw itemsError;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://dom-bistro-grill.lovable.app";

    const session = await stripe.checkout.sessions.create({
      line_items: stripeLineItems,
      mode: "payment",
      success_url: `${origin}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrinho?payment=cancelled`,
      metadata: {
        order_id: order.id,
        customer_name: name,
        customer_phone: phone,
      },
      payment_method_types: getStripePaymentMethods(paymentMethod),
    });

    await supabaseAdmin.from("orders").update({ stripe_payment_id: session.id }).eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url, order_id: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
