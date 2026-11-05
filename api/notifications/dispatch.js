const { createClient } = require("@supabase/supabase-js");
const webpush = require("web-push");
const { timingSafeEqual } = require("node:crypto");

function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(payload);
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function getSupabaseConfig() {
  return {
    url: process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY,
  };
}

module.exports = async function dispatchCashierNotification(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed" });
  }

  const expectedSecret = String(process.env.NOTIFY_WEBHOOK_SECRET || "");
  const authorization = String(req.headers.authorization || "");
  const suppliedSecret = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  if (!expectedSecret || !constantTimeEqual(suppliedSecret, expectedSecret)) {
    return send(res, 401, { error: "Unauthorized" });
  }

  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return null; } })() : req.body;
  const eventType = body?.event_type;
  const eventId = body?.event_id;
  if (!(["order", "waiter_call"].includes(eventType)) || typeof eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    return send(res, 400, { error: "Invalid event" });
  }

  const { url, key } = getSupabaseConfig();
  const vapidPublicKey = String(process.env.VAPID_PUBLIC_KEY || "");
  const vapidPrivateKey = String(process.env.VAPID_PRIVATE_KEY || "");
  const vapidSubject = String(process.env.VAPID_SUBJECT || "");
  if (!url || !key || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return send(res, 503, { error: "Notification service is not configured" });
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: deliveries, error: claimError } = await supabase.rpc("claim_cashier_notification_deliveries", {
      p_secret: expectedSecret,
      p_event_type: eventType,
      p_event_id: eventId,
    });
    if (claimError) {
      // Do not log function details: they may contain database or event information.
      console.error("Notification event claim failed", claimError.code || "unknown");
      return send(res, claimError.code === "28000" ? 401 : 502, { error: "Unable to validate notification event" });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    let delivered = 0;
    let failed = 0;
    let expired = 0;
    for (const delivery of deliveries || []) {
      let status = "sent";
      let httpStatus = 201;
      try {
        const result = await webpush.sendNotification(
          delivery.push_subscription,
          JSON.stringify({
            title: delivery.notification_title,
            body: delivery.notification_body,
            url: delivery.notification_url,
            tag: `servio-${eventType}-${eventId}`,
          }),
          { TTL: 600, urgency: "high" },
        );
        httpStatus = result?.statusCode || 201;
        delivered += 1;
      } catch (pushError) {
        httpStatus = Number(pushError?.statusCode) || 0;
        if (httpStatus === 404 || httpStatus === 410) {
          status = "expired";
          expired += 1;
        } else {
          status = "failed";
          failed += 1;
        }
      }

      const { error: recordError } = await supabase.rpc("record_cashier_notification_delivery", {
        p_secret: expectedSecret,
        p_event_type: eventType,
        p_event_id: eventId,
        p_subscription_id: delivery.subscription_id,
        p_status: status,
        p_http_status: httpStatus,
      });
      if (recordError) {
        failed += 1;
        console.error("Notification delivery status update failed", recordError.code || "unknown");
      }
    }

    return send(res, 200, { accepted: true, delivered, failed, expired });
  } catch (error) {
    console.error("Notification dispatch failed", error?.code || error?.name || "unknown");
    return send(res, 500, { error: "Notification dispatch failed" });
  }
};
