const { createSign } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

const MAX_SIGNED_REQUEST_LENGTH = 250_000;
const ALLOWED_ROLES = new Set(["admin", "cashier"]);

function reply(res, status, message) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(status).send(message);
}

module.exports = async function signQzRequest(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, "Method not allowed");
  }

  const origin = req.headers.origin;
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim().toLowerCase();
  try {
    const parsedOrigin = new URL(origin);
    const localOrigin = ["localhost", "127.0.0.1"].includes(parsedOrigin.hostname);
    if (parsedOrigin.host.toLowerCase() !== host || (parsedOrigin.protocol !== "https:" && !localOrigin)) {
      return reply(res, 403, "Same-origin HTTPS request required");
    }
  } catch {
    return reply(res, 403, "Invalid origin");
  }

  const authorization = String(req.headers.authorization || "");
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return reply(res, 401, "Authenticated staff session required");

  const requestToSign = req.body?.request;
  if (typeof requestToSign !== "string" || !requestToSign.length || requestToSign.length > MAX_SIGNED_REQUEST_LENGTH) {
    return reply(res, 400, "Invalid signing request");
  }

  const privateKey = String(process.env.QZ_SIGNING_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!privateKey || !supabaseUrl || !supabaseKey) {
    return reply(res, 503, "QZ signing is not configured in Vercel");
  }

  try {
    const staffClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${tokenMatch[1]}` } },
    });
    const { data: authData, error: authError } = await staffClient.auth.getUser(tokenMatch[1]);
    if (authError || !authData?.user) return reply(res, 401, "Invalid staff session");

    const { data: profile, error: profileError } = await staffClient.rpc("ensure_profile_for_current_user");
    if (profileError || !ALLOWED_ROLES.has(profile?.role)) return reply(res, 403, "Cashier or manager access required");

    const signer = createSign("RSA-SHA512");
    signer.update(requestToSign, "utf8");
    signer.end();
    return reply(res, 200, signer.sign(privateKey).toString("base64"));
  } catch (error) {
    console.error("QZ signing request failed:", error?.code || error?.name || "unknown");
    return reply(res, 500, "Unable to sign print request");
  }
};
