function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(payload);
}

module.exports = function vapidPublicKey(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Method not allowed" });
  }
  const publicKey = String(process.env.VAPID_PUBLIC_KEY || "");
  if (!publicKey) return send(res, 503, { error: "Push notifications are not configured" });
  return send(res, 200, { publicKey });
};
