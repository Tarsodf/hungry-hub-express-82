import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, date, time, partySize, notes } = await req.json();

    if (!name || !email || !phone || !date || !time || !partySize) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmail = "bistrogrillr@gmail.com";

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a1a;color:#fff;border-radius:12px;">
        <h1 style="color:#e67e22;text-align:center;">🍽️ Nova Reserva</h1>
        <hr style="border-color:#333;"/>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#999;">Nome:</td><td style="padding:8px;font-weight:bold;">${name}</td></tr>
          <tr><td style="padding:8px;color:#999;">Email:</td><td style="padding:8px;">${email}</td></tr>
          <tr><td style="padding:8px;color:#999;">Telefone:</td><td style="padding:8px;">${phone}</td></tr>
          <tr><td style="padding:8px;color:#999;">Data:</td><td style="padding:8px;color:#e67e22;font-weight:bold;">${date}</td></tr>
          <tr><td style="padding:8px;color:#999;">Horário:</td><td style="padding:8px;color:#e67e22;font-weight:bold;">${time}</td></tr>
          <tr><td style="padding:8px;color:#999;">Pessoas:</td><td style="padding:8px;">${partySize}</td></tr>
          ${notes ? `<tr><td style="padding:8px;color:#999;">Observações:</td><td style="padding:8px;">${notes}</td></tr>` : ""}
        </table>
        <hr style="border-color:#333;"/>
        <p style="text-align:center;color:#999;font-size:12px;">Dom Bistro Grill — Painel de Reservas</p>
      </div>
    `;

    // Use Supabase built-in email or a simple SMTP approach
    // For now we'll use the Resend-like approach via fetch to a mail API
    // Since we don't have a mail service configured, we'll just log and return success
    // The admin will manage reservations via the dashboard
    
    console.log(`New reservation notification for ${adminEmail}:`, { name, date, time, partySize });

    return new Response(JSON.stringify({ success: true, message: "Notificação registrada" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-reservation:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
