import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
  try {
    const { slug, username, pin } = await req.json();
    if (!slug || !username || !pin) return json({ error: "بيانات الدخول ناقصة" }, 400);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: verified, error: verifyError } = await supabase.rpc("verify_cashier_login", { p_tenant_slug: slug, p_username: username, p_pin: pin });
    const cashier = verified?.[0];
    if (verifyError || !cashier) return json({ error: "بيانات الكاشير غير صحيحة" }, 401);

    const email = `${cashier.id}@cashier.tappo.internal`;
    const metadata = { tenant_id: cashier.tenant_id, full_name: cashier.full_name, role: "cashier" };
    // The PIN is only verified here. The Auth password is a random one-time secret (Auth requires 6+ chars, PINs can be 4).
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;

    let authUserId = cashier.auth_user_id;
    if (!authUserId) {
      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
      if (error || !data.user) return json({ error: `تعذر إنشاء جلسة الكاشير: ${error?.message ?? ""}` }, 500);
      authUserId = data.user.id;
      await supabase.from("cashiers").update({ auth_user_id: authUserId }).eq("id", cashier.id);
    } else {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, { password, user_metadata: metadata });
      if (error) return json({ error: `تعذر تحديث جلسة الكاشير: ${error.message}` }, 500);
    }
    return json({ email, password });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }, 500);
  }
});
