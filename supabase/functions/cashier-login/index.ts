import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const { slug, username, pin } = await req.json();
    if (!slug || !username || !pin) return new Response(JSON.stringify({ error: "بيانات الدخول ناقصة" }), { status: 400 });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: verified, error: verifyError } = await supabase.rpc("verify_cashier_login", { p_tenant_slug: slug, p_username: username, p_pin: pin });
    const cashier = verified?.[0];
    if (verifyError || !cashier) return new Response(JSON.stringify({ error: "بيانات الكاشير غير صحيحة" }), { status: 401 });
    const email = `${cashier.id}@cashier.tappo.internal`;
    const metadata = { tenant_id: cashier.tenant_id, full_name: cashier.full_name, role: "cashier" };
    let authUserId = cashier.auth_user_id;
    if (!authUserId) {
      const { data, error } = await supabase.auth.admin.createUser({ email, password: pin, email_confirm: true, user_metadata: metadata });
      if (error || !data.user) return new Response(JSON.stringify({ error: "تعذر إنشاء جلسة الكاشير" }), { status: 500 });
      authUserId = data.user.id;
      await supabase.from("cashiers").update({ auth_user_id: authUserId }).eq("id", cashier.id);
    } else {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, { password: pin, user_metadata: metadata });
      if (error) return new Response(JSON.stringify({ error: "تعذر تحديث جلسة الكاشير" }), { status: 500 });
    }
    return new Response(JSON.stringify({ email }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }), { status: 500 });
  }
});
