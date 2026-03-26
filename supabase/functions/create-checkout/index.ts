import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  name: string;
  unit_price: number;
  customization?: {
    removed?: string[];
    addons?: { name: string; price: number }[];
    meatPoint?: string;
  };
}

interface CheckoutInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_mode: "delivery" | "pickup";
  address?: string;
  notes?: string;
  items: OrderItemInput[];
  service_fee: number;
  delivery_fee: number;
  order_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CheckoutInput = await req.json();

    if (!body.items?.length || !body.order_id) {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Build line items from order items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of body.items) {
      const addonsTotal = item.customization?.addons?.reduce((s, a) => s + a.price, 0) || 0;
      const unitPrice = Math.round((item.unit_price + addonsTotal) * 100); // cents

      let description = "";
      if (item.customization?.removed?.length) {
        description += `Sem: ${item.customization.removed.join(", ")}. `;
      }
      if (item.customization?.addons?.length) {
        description += `Adicionais: ${item.customization.addons.map(a => a.name).join(", ")}. `;
      }
      if (item.customization?.meatPoint) {
        description += `Ponto: ${item.customization.meatPoint}. `;
      }

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
            ...(description ? { description: description.trim() } : {}),
          },
          unit_amount: unitPrice,
        },
        quantity: item.quantity,
      });
    }

    // Add service fee
    if (body.service_fee > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Taxa de Serviço" },
          unit_amount: Math.round(body.service_fee * 100),
        },
        quantity: 1,
      });
    }

    // Add delivery fee
    if (body.delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Taxa de Entrega" },
          unit_amount: Math.round(body.delivery_fee * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://dom-bistro-grill.lovable.app";

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pagamento-sucesso?order_id=${body.order_id}`,
      cancel_url: `${origin}/carrinho?payment=cancelled`,
      customer_email: body.customer_email || undefined,
      metadata: {
        order_id: body.order_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
      },
      payment_method_types: ["card"],
    });

    // Update order with stripe session id
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin
      .from("orders")
      .update({ stripe_payment_id: session.id, status: "pending_payment" })
      .eq("id", body.order_id);

    return new Response(JSON.stringify({ url: session.url }), {
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
