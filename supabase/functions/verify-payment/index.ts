import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id || typeof session_id !== "string") {
      return new Response(JSON.stringify({ error: "session_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    const orderId = session.metadata?.order_id;
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado na sessão" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const paymentIntent = typeof session.payment_intent === "object" && session.payment_intent !== null
      ? session.payment_intent
      : null;
    const paymentIntentStatus = typeof paymentIntent?.status === "string" ? paymentIntent.status : null;

    if (session.payment_status === "paid") {
      // Payment confirmed — update order to received (confirmed)
      await supabaseAdmin
        .from("orders")
        .update({
          status: "received",
          stripe_payment_id: session.payment_intent as string || session.id,
        })
        .eq("id", orderId)
        .eq("status", "pending_payment"); // Only update if still pending

      return new Response(JSON.stringify({
        status: "paid",
        order_id: orderId,
        customer_name: session.metadata?.customer_name || "",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const derivedStatus =
      session.status === "expired"
        ? "expired"
        : paymentIntentStatus === "processing"
          ? "processing"
          : paymentIntentStatus === "canceled"
            ? "failed"
            : "pending";

    if (derivedStatus === "processing" || derivedStatus === "pending") {
      return new Response(JSON.stringify({
        status: derivedStatus,
        order_id: orderId,
        payment_status: session.payment_status,
        payment_intent_status: paymentIntentStatus,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      status: derivedStatus,
      order_id: orderId,
      payment_status: session.payment_status,
      payment_intent_status: paymentIntentStatus,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
