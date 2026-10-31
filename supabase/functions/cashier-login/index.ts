import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://servio-mvp.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
const genericError = "بيانات الدخول غير صحيحة";
const cors = (origin: string | null) => {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://servio-mvp.vercel.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405, headers);

  try {
    const body = await req.json();
    const slug = String(body?.slug || "").trim().toLowerCase();
    const branchSlug = String(body?.branch_slug || "").trim().toLowerCase();
    const username = String(body?.username || "").trim().toLowerCase();
    const pin = String(body?.pin || "");
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown").split(",")[0].trim();
    if (!slug || !branchSlug || !username || !pin) return json({ error: genericError }, 401, headers);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const rate = await supabase.rpc("check_cashier_login_rate_limit", {
      p_ip: ip, p_tenant_slug: slug, p_branch_slug: branchSlug, p_username: username, p_record_failure: false,
    });
    if (rate.error || rate.data?.allowed === false) {
      const retryAfter = Number(rate.data?.retry_after_seconds || 300);
      return json({ error: genericError }, 429, { ...headers, "Retry-After": String(retryAfter) });
    }

    const { data: verified, error: verifyError } = await supabase.rpc("verify_cashier_login", {
      p_tenant_slug: slug, p_branch_slug: branchSlug, p_username: username, p_pin: pin,
    });
    const cashier = verified?.[0];
    if (verifyError || !cashier) {
      await supabase.rpc("check_cashier_login_rate_limit", {
        p_ip: ip, p_tenant_slug: slug, p_branch_slug: branchSlug, p_username: username, p_record_failure: true,
      });
      return json({ error: genericError }, 401, headers);
    }

    const email = `${cashier.id}@cashier.servio.internal`;
    const metadata = { tenant_id: cashier.tenant_id, branch_id: cashier.branch_id, full_name: cashier.full_name, role: "cashier" };
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    let authUserId = cashier.auth_user_id;
    if (!authUserId) {
      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
      if (error || !data.user) return json({ error: genericError }, 500, headers);
      authUserId = data.user.id;
      const { error: linkError } = await supabase.from("cashiers").update({ auth_user_id: authUserId }).eq("id", cashier.id).eq("branch_id", cashier.branch_id);
      if (linkError) {
        await supabase.auth.admin.deleteUser(authUserId);
        return json({ error: genericError }, 500, headers);
      }
    } else {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, { password, user_metadata: metadata });
      if (error) return json({ error: genericError }, 500, headers);
    }
    return json({ email, password }, 200, headers);
  } catch {
    return json({ error: genericError }, 500, headers);
  }
});
