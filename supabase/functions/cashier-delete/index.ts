// وظيفة خادمية لحذف هوية كاشير مع الاحتفاظ بسجل الكاشير والورديات التاريخية.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "يجب تسجيل الدخول بحساب المدير" }, 401);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "خدمة إدارة الحسابات غير مهيأة" }, 500);

    const authenticatedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await authenticatedClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "جلسة المدير غير صالحة" }, 401);

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: manager, error: managerError } = await serviceClient
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (managerError || manager?.role !== "admin" || !manager.tenant_id) {
      return json({ error: "هذه العملية متاحة لمدير النشاط فقط" }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const cashierId = String(body?.cashier_id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cashierId)) {
      return json({ error: "معرف حساب الكاشير غير صالح" }, 400);
    }

    // الإجراء يقفل سجل الكاشير ويمنع وجود وردية مفتوحة داخل معاملة قاعدة واحدة.
    const { data: disabledRows, error: disableError } = await authenticatedClient.rpc("deactivate_cashier", {
      p_cashier_id: cashierId,
    });
    if (disableError) {
      if (disableError.code === "55000") return json({ error: "يجب إغلاق وردية هذا الكاشير قبل حذف حسابه" }, 409);
      if (disableError.code === "P0002") return json({ error: "حساب الكاشير غير موجود في هذا النشاط" }, 404);
      return json({ error: "تعذر إيقاف حساب الكاشير" }, 500);
    }
    const cashier = disabledRows?.[0];
    if (!cashier) return json({ error: "لم يتم إيقاف الحساب" }, 500);

    if (cashier.auth_user_id) {
      const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(cashier.auth_user_id);
      if (deleteAuthError && !/not found|does not exist/i.test(deleteAuthError.message)) {
        return json({ error: "تم إيقاف الحساب، لكن تعذر حذف جلسة الدخول؛ أعد المحاولة أو تواصل مع الدعم" }, 500);
      }
    }

    const { error: unlinkError } = await serviceClient
      .from("cashiers")
      .update({ auth_user_id: null })
      .eq("id", cashier.id)
      .eq("tenant_id", manager.tenant_id);
    if (unlinkError) return json({ error: "تم إيقاف الدخول، لكن تعذر إنهاء ربط الحساب" }, 500);

    return json({ success: true, cashier_id: cashier.id, full_name: cashier.full_name });
  } catch (error) {
    console.error("تعذر حذف حساب الكاشير:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "حدث خطأ غير متوقع أثناء حذف حساب الكاشير" }, 500);
  }
});
