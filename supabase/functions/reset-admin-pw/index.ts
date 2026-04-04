import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get admin users
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (!roles || roles.length === 0) {
    return new Response(JSON.stringify({ error: "No admin found" }), { status: 404 });
  }

  const results = [];
  for (const r of roles) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUser(r.user_id, {
      password: "tarsosouza25",
    });
    results.push({ user_id: r.user_id, success: !error, error: error?.message });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
