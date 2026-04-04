import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Get admin user IDs
  const supabaseAdmin = createClient(url, serviceKey);
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (!roles || roles.length === 0) {
    return new Response(JSON.stringify({ error: "No admin found" }), { status: 404 });
  }

  const results = [];
  for (const r of roles) {
    // Use the GoTrue Admin API directly
    const res = await fetch(`${url}/auth/v1/admin/users/${r.user_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ password: "tarsosouza25" }),
    });
    const data = await res.json();
    results.push({ user_id: r.user_id, status: res.status, email: data.email });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
